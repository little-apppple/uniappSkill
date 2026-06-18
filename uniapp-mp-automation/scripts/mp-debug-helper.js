#!/usr/bin/env node
/**
 * mp-debug-helper.js — REPL-style helper for WeChat DevTools automation.
 *
 * This script is the pure-Bash replacement for `weixin-devtools-mcp`. It runs as
 * a background HTTP server; AI agents (or CI scripts) send JSON commands via
 * `curl` and receive JSON responses. State (connection, page reference,
 * console/network buffers) persists across calls.
 *
 * Usage (from the AI's Bash tool):
 *
 *   # Lifecycle
 *   node scripts/mp-debug-helper.js start [projectPath]
 *   node scripts/mp-debug-helper.js stop
 *   node scripts/mp-debug-helper.js status
 *
 *   # Send an operation (auto-spawns daemon if not running)
 *   node scripts/mp-debug-helper.js connect projectPath=/abs/path
 *   node scripts/mp-debug-helper.js query_selector selector=".foo"
 *   node scripts/mp-debug-helper.js click uid=el-3
 *   node scripts/mp-debug-helper.js assert_text uid=el-3 textContains="首页"
 *   node scripts/mp-debug-helper.js screenshot path=/tmp/home.png
 *
 *   # Daemon-only mode (called internally by `start`)
 *   node scripts/mp-debug-helper.js --daemon
 *
 * Protocol (HTTP):
 *   POST /cmd   body: {"op": "<name>", "args": {...}}
 *   GET  /health -> {ok: true, status: "healthy"}
 *
 * Response shape: {"ok": true|false, "data": ..., "error": ...}
 *
 * Requires: miniprogram-automator (`npm i -D miniprogram-automator`)
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const PORT = parseInt(process.env.MP_DEBUG_PORT || '9876', 10);
const HOST = process.env.MP_DEBUG_HOST || '127.0.0.1';
const PID_FILE = path.join(os.tmpdir(), 'mp-debug-helper.pid');
const LOG_FILE = path.join(os.tmpdir(), 'mp-debug-helper.log');

// Lazy: resolve default build path lazily so daemon can start before any build exists.
let _defaultBuildPath = null;
function defaultBuildPath() {
  if (_defaultBuildPath) return _defaultBuildPath;
  try {
    const { resolveBuildPath } = require('./mp-paths');
    _defaultBuildPath = resolveBuildPath({ requireBuild: false });
  } catch (_) {
    _defaultBuildPath = null;
  }
  return _defaultBuildPath;
}

const subcommand = process.argv[2];

if (subcommand === 'start') {
  startDaemon();
} else if (subcommand === 'stop') {
  stopDaemon();
} else if (subcommand === 'status') {
  statusDaemon();
} else if (subcommand === 'detect-cli') {
  // Quick CLI detection helper: prints the resolved path and source.
  // Always sync, never prompts — useful for "where does it think DevTools is?".
  (() => {
    try {
      const { probeDevtoolsCli, readCache } = require('./mp-devtools-cli');
      const probe = probeDevtoolsCli();
      const cached = readCache();
      const out = { ok: true, probe, cached };
      console.log(JSON.stringify(out, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
      process.exit(1);
    }
  })();
} else if (subcommand === '--daemon' || !subcommand) {
  runServer();
} else {
  sendCommand(subcommand, process.argv.slice(3));
}

// ---------------------------------------------------------------------------
// Daemon lifecycle
// ---------------------------------------------------------------------------

function writePidFileAtomic(pid) {
  // Atomic write via 'wx' (O_CREAT | O_EXCL). If the file already exists, the
  // open fails — that's our race guard for two concurrent `start` calls.
  // On EEXIST, checks whether the PID inside is alive: if dead, cleans up the
  // stale file and retries once (crash recovery). If alive, returns false.
  let fd;
  try {
    fd = fs.openSync(PID_FILE, 'wx');
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    try {
      const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
      process.kill(oldPid, 0);
      return false; // old process still alive — concurrent start won
    } catch (_) {
      // Stale PID — clean up and retry once
      try { fs.unlinkSync(PID_FILE); } catch (_) {}
      try { fd = fs.openSync(PID_FILE, 'wx'); }
      catch (e2) {
        if (e2.code === 'EEXIST') return false;
        throw e2;
      }
    }
  }
  try {
    fs.writeSync(fd, String(pid));
    fs.closeSync(fd);
    return true;
  } catch (e) {
    try { fs.closeSync(fd); } catch (_) {}
    throw e;
  }
}

function startDaemon() {
  if (isRunning()) {
    print({ ok: true, status: 'already_running', pid: readPid(), port: PORT });
    return;
  }

  const out = fs.openSync(LOG_FILE, 'a');
  const err = fs.openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [__filename, '--daemon'], {
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true,
  });
  child.unref();
  // Close parent-side fds — child inherits its own copies through spawn's dup.
  fs.closeSync(out);
  fs.closeSync(err);
  if (!writePidFileAtomic(child.pid)) {
    // Another concurrent start won the race. Reap our orphan child.
    try {
      if (process.platform === 'win32') execSync(`taskkill /F /PID ${child.pid}`, { stdio: 'ignore' });
      else process.kill(child.pid, 'SIGTERM');
    } catch (_) {}
    print({ ok: true, status: 'already_running', pid: readPid(), port: PORT });
    return;
  }

  waitForServer(40, (ready) => {
    if (ready) {
      print({ ok: true, status: 'started', pid: child.pid, port: PORT });
    } else {
      print({ ok: false, error: 'server_did_not_start_in_time', log: LOG_FILE });
    }
  });
}

function stopDaemon() {
  if (!isRunning()) {
    print({ ok: true, status: 'not_running' });
    return;
  }
  const pid = readPid();
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
  } catch (_) { /* ignore */ }
  try { fs.unlinkSync(PID_FILE); } catch (_) {}
  print({ ok: true, status: 'stopped', pid });
}

function statusDaemon() {
  if (isRunning()) {
    print({ ok: true, status: 'running', pid: readPid(), port: PORT });
  } else {
    print({ ok: true, status: 'not_running' });
  }
}

function isRunning() {
  if (!fs.existsSync(PID_FILE)) return false;
  const pid = readPid();
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) {
    return false;
  }
}

function readPid() {
  return parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
}

function waitForServer(retries, cb) {
  const attempt = (n) => {
    const req = http.get({ host: HOST, port: PORT, path: '/health' }, (res) => {
      res.resume();
      if (res.statusCode === 200) cb(true);
      else if (n > 0) setTimeout(() => attempt(n - 1), 200);
      else cb(false);
    });
    req.on('error', () => {
      if (n > 0) setTimeout(() => attempt(n - 1), 200);
      else cb(false);
    });
    req.setTimeout(500, () => req.destroy());
  };
  attempt(retries);
}

function print(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// ---------------------------------------------------------------------------
// HTTP client (CLI → daemon)
// ---------------------------------------------------------------------------

function sendCommand(op, args) {
  const ensureDaemon = (maxRetries, cb) => {
    // Probe the HTTP /health endpoint instead of just checking PID file.
    // waitForServer returns true only when the listener has actually bound.
    const probe = (n) => {
      const req = http.get({ host: HOST, port: PORT, path: '/health' }, (res) => {
        res.resume();
        if (res.statusCode === 200) cb();
        else if (n > 0) setTimeout(() => probe(n - 1), 200);
        else { print({ ok: false, error: 'daemon_health_check_failed' }); process.exit(1); }
      });
      req.on('error', () => {
        if (n > 0) setTimeout(() => probe(n - 1), 200);
        else { print({ ok: false, error: 'daemon_health_check_failed' }); process.exit(1); }
      });
      req.setTimeout(500, () => req.destroy());
    };
    if (isRunning()) {
      // Daemon's PID exists; verify the server actually accepts connections.
      probe(maxRetries);
      return;
    }
    console.error('[mp-debug-helper] daemon not running, starting...');
    startDaemon();
    const tick = (n) => {
      if (!isRunning()) {
        if (n <= 0) { print({ ok: false, error: 'auto_start_failed' }); process.exit(1); }
        return setTimeout(() => tick(n - 1), 250);
      }
      // PID exists; verify server is up.
      probe(maxRetries);
    };
    setTimeout(() => tick(40), 250);
  };

  ensureDaemon(40, () => {
    const payload = JSON.stringify({ op, args: parseArgs(args) });
    const req = http.request({
      host: HOST, port: PORT, method: 'POST', path: '/cmd',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { print(JSON.parse(body)); }
          catch (_) { print({ ok: false, error: 'helper_returned_non_json', raw: body.slice(0, 500) }); }
        } else {
          // Daemon returns 400 only for malformed requests (invalid JSON, unknown op).
          // Try to extract the structured error from its JSON body.
          try { const parsed = JSON.parse(body); print({ ok: false, error: parsed.error || `helper_http_${res.statusCode}`, raw: body.slice(0, 500) }); }
          catch (_) { print({ ok: false, error: `helper_http_${res.statusCode}`, raw: body.slice(0, 500) }); }
        }
      });
    });
    req.on('error', (e) => {
      print({ ok: false, error: `connection_failed: ${e.message}` });
    });
    req.setTimeout(60000, () => {
      req.destroy();
      print({ ok: false, error: 'helper_timeout_60s' });
      process.exit(1);
    });
    req.write(payload);
    req.end();
  });
}

function parseArgs(args) {
  // Accept either key=value pairs or --key value pairs
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        result[key] = true;
      } else {
        result[key] = stripQuotes(value);
        i++;
      }
    } else {
      const eq = a.indexOf('=');
      if (eq > 0) {
        result[a.slice(0, eq)] = stripQuotes(a.slice(eq + 1));
      }
    }
  }
  return result;
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ---------------------------------------------------------------------------
// HTTP server (daemon)
// ---------------------------------------------------------------------------

let miniProgram = null;
let currentPage = null;
let currentProjectPath = () => null;
const elementCache = new Map();
let uidCounter = 0;
const consoleMessages = [];
const networkRequests = [];
const requestDetails = new Map();
let networkMonitoring = true;
const connectionLog = [];
// Session counter: bumped on connect/disconnect so listeners attached to an
// old (closed) miniProgram become no-ops instead of pushing stale events into
// the new session's buffers. Fixes C2 (listener leak) and bounds C16 fallout.
let sessionId = 0;
let activeSessionId = 0;

function runServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, status: 'healthy', pid: process.pid }));
      return;
    }
    if (req.method === 'POST' && req.url === '/cmd') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        let cmd;
        try { cmd = JSON.parse(body); }
        catch (_) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid_json' }));
          return;
        }
        const { op, args = {}, id } = cmd;
        const handler = ops[op];
        if (!handler) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, id, error: `unknown_op: ${op}` }));
          return;
        }
        try {
          const data = await handler(args);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, id, data }));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, id, error: e.message || String(e) }));
        }
      });
      return;
    }
    if (req.method === 'POST' && req.url === '/shutdown') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      setTimeout(() => process.exit(0), 50);
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(PORT, HOST, () => {
    connectionLog.push({ at: Date.now(), event: 'server_listening', port: PORT });
  });

  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uidFor(element) {
  const uid = `el-${++uidCounter}`;
  elementCache.set(uid, element);
  return uid;
}

async function requireConnected() {
  if (!miniProgram) throw new Error('not_connected: run connect first');
  return miniProgram;
}

function detectCliPathSync() {
  // Synchronous probe used by check_environment. Never prompts; only reports
  // what would be returned by the first non-interactive source.
  if (process.env.WECHAT_DEVTOOLS_CLI) return process.env.WECHAT_DEVTOOLS_CLI;
  const { readCache, platformCandidates, readRegistryCliPath } = require('./mp-devtools-cli');
  const cached = readCache();
  if (cached) return cached;
  const reg = readRegistryCliPath();
  if (reg) return reg;
  for (const c of platformCandidates()) if (fs.existsSync(c)) return c;
  return null;
}

function attachEventListeners(mp) {
  const mySession = ++sessionId;
  const isCurrent = () => mySession === activeSessionId;
  mp.on('console', (msg) => {
    if (!isCurrent()) return;
    consoleMessages.push({
      id: consoleMessages.length + 1,
      type: msg.type || 'log',
      args: msg.args || [],
      time: Date.now(),
    });
    if (consoleMessages.length > 1000) consoleMessages.splice(0, 500);
  });
  mp.on('request', (req) => {
    if (!isCurrent()) return;
    const id = networkRequests.length + 1;
    const entry = {
      id,
      url: req.url,
      method: req.method,
      headers: req.header || req.headers || {},
      time: Date.now(),
    };
    requestDetails.set(id, { request: req });
    networkRequests.push(entry);
  });
  mp.on('response', (res) => {
    if (!isCurrent()) return;
    // Match response to request by URL — walk back to find the first entry
    // with this URL that has not yet been matched. Handles concurrent
    // requests where responses arrive in completion order rather than send
    // order. (Fix for C1: was always using networkRequests[length-1].)
    const url = res.url;
    if (url) {
      for (let i = networkRequests.length - 1; i >= 0; i--) {
        const entry = networkRequests[i];
        if (entry.url === url && entry.status === undefined) {
          entry.status = res.status;
          entry.statusCode = res.status;
          const details = requestDetails.get(entry.id);
          if (details) details.response = res;
          return;
        }
      }
    }
    // Fallback: no URL match — attach to last unmatched entry
    for (let i = networkRequests.length - 1; i >= 0; i--) {
      if (networkRequests[i].status === undefined) {
        networkRequests[i].status = res.status;
        networkRequests[i].statusCode = res.status;
        const details = requestDetails.get(networkRequests[i].id);
        if (details) details.response = res;
        return;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Operations (31 total, mapping 1:1 to weixin-devtools-mcp tools)
// ---------------------------------------------------------------------------

const ops = {

  // ----- Connection (4) -----

  async connect({ projectPath, strategy = 'auto', verbose = false, cliPath: cliPathArg } = {}) {
    if (miniProgram) {
      return { connected: true, mode: 'already_connected', projectPath: currentProjectPath() };
    }
    const { resolveBuildPath } = require('./mp-paths');
    let resolved;
    try {
      resolved = resolveBuildPath({ explicit: projectPath });
    } catch (e) {
      throw new Error(`${e.message} (also tried MP_PROJECT_PATH env var and CWD auto-detect)`);
    }
    const projectAbs = resolved;
    const automator = loadAutomator();
    if (!automator) {
      throw new Error('miniprogram_automator_not_installed: run `npm i -D miniprogram-automator`');
    }
    // Resolve DevTools CLI path. `strategy=connect` doesn't need it, so we
    // skip detection on that path; `auto` and `launch` need it and may need
    // to fall back to a launch if connect fails.
    const needsCli = strategy !== 'connect';
    let cliPath = null;
    let cliSource = null;
    if (needsCli) {
      const { detectDevtoolsCliPath } = require('./mp-devtools-cli');
      try {
        const result = await detectDevtoolsCliPath({
          explicit: cliPathArg || null,
          // The daemon is detached; stdin is not a TTY. Disable the prompt
          // here so connect fails fast with a clear, actionable error.
          interactive: false,
        });
        cliPath = result.path;
        cliSource = result.source;
      } catch (e) {
        throw new Error(
          `${e.message}\n` +
          `Hint: pass --cli <path> to the connect op, or set WECHAT_DEVTOOLS_CLI env var.`
        );
      }
    }
    connectionLog.push({ at: Date.now(), event: 'connect_attempt', strategy, projectAbs, cliPath, cliSource });

    let mode;
    // Strategy semantics:
    //   'auto'    — try to attach to an already-running DevTools; fall back to launching a new one
    //   'connect' — attach only; fail if no DevTools is open
    //   'launch'  — always launch a new DevTools window
    if (strategy === 'auto') {
      try {
        miniProgram = await automator.connect({ projectPath: projectAbs });
        mode = 'connect';
      } catch (e) {
        if (verbose) connectionLog.push({ at: Date.now(), event: 'connect_failed_falling_back_to_launch', error: e.message });
        miniProgram = await automator.launch({ projectPath: projectAbs, cliPath });
        mode = 'launch_fallback';
      }
    } else if (strategy === 'connect') {
      try {
        miniProgram = await automator.connect({ projectPath: projectAbs });
        mode = 'connect';
      } catch (e) {
        throw new Error(`connect_failed: ${e.message}. DevTools may not be running. Use strategy='auto' to fall back to launch.`);
      }
    } else {
      miniProgram = await automator.launch({ projectPath: projectAbs, cliPath });
      mode = 'launch';
    }

    activeSessionId = sessionId + 1; // promote the about-to-attach listeners
    currentProjectPath = () => projectAbs;
    attachEventListeners(miniProgram);
    connectionLog.push({ at: Date.now(), event: 'connected', projectPath: projectAbs, mode, cliPath, cliSource });
    return { connected: true, mode, projectPath: projectAbs, cliPath, cliSource, pid: process.pid };
  },

  async reconnect() {
    if (miniProgram) {
      try { if (typeof miniProgram.removeAllListeners === 'function') miniProgram.removeAllListeners(); } catch (_) {}
      try { await miniProgram.close(); } catch (_) {}
      miniProgram = null;
      currentPage = null;
      elementCache.clear();
    }
    activeSessionId = 0; // invalidate stale listeners from the closed instance
    return await ops.connect({ strategy: 'auto' });
  },

  async disconnect() {
    activeSessionId = 0; // invalidate any pending listeners before close
    if (miniProgram) {
      try { if (typeof miniProgram.removeAllListeners === 'function') miniProgram.removeAllListeners(); } catch (_) {}
      try { await miniProgram.close(); } catch (_) {}
      miniProgram = null;
      currentPage = null;
      elementCache.clear();
    }
    currentProjectPath = () => null;
    return { disconnected: true };
  },

  connection_status() {
    return {
      connected: !!miniProgram,
      projectPath: currentProjectPath(),
      currentPagePath: currentPage ? currentPage.path || null : null,
      cachedElements: elementCache.size,
      consoleBuffered: consoleMessages.length,
      networkBuffered: networkRequests.length,
      networkMonitoring,
      port: PORT,
      pid: process.pid,
    };
  },

  // ----- Page (3) -----

  async current_page() {
    const mp = await requireConnected();
    const page = await mp.currentPage();
    currentPage = page;
    return {
      path: page.path || '',
      query: page.options || page.query || {},
      uid: uidFor(page),
    };
  },

  async page_snapshot() {
    const mp = await requireConnected();
    const page = currentPage || (await mp.currentPage());
    currentPage = page;
    const a11y = await page.accessibility().catch(() => null);
    return {
      path: page.path || '',
      accessibility: a11y,
      uid: uidFor(page),
    };
  },

  async query_selector({ selector }) {
    if (!selector) throw new Error('selector_required');
    const mp = await requireConnected();
    const page = currentPage || (await mp.currentPage());
    currentPage = page;
    const el = await page.$(selector);
    if (!el) throw new Error(`not_found: ${selector}`);
    const uid = uidFor(el);
    const info = await describeElement(el);
    return { uid, selector, ...info };
  },

  // ----- Interaction (4) -----

  async click({ uid }) {
    const el = elementCache.get(uid);
    if (!el) throw new Error(`unknown_uid: ${uid} (re-run query_selector)`);
    await el.tap();
    return { clicked: true, uid };
  },

  async input_text({ uid, text }) {
    const el = elementCache.get(uid);
    if (!el) throw new Error(`unknown_uid: ${uid}`);
    await el.input(text);
    return { input: true, uid, length: String(text).length };
  },

  async get_value({ uid }) {
    const el = elementCache.get(uid);
    if (!el) throw new Error(`unknown_uid: ${uid}`);
    const value = (await el.value()) ?? (await el.property('value')) ?? null;
    return { uid, value };
  },

  async set_form_control({ uid, value }) {
    const el = elementCache.get(uid);
    if (!el) throw new Error(`unknown_uid: ${uid}`);
    await el.callMethod('setValue', value).catch(async () => {
      await el.input(String(value));
    });
    return { set: true, uid, value };
  },

  // ----- Assertion (4 — incl. wait_for) -----

  async assert_text({ uid, text, textContains, equals = false } = {}) {
    if (!uid) throw new Error('uid_required');
    const el = elementCache.get(uid);
    if (!el) throw new Error(`unknown_uid: ${uid}`);
    const actual = (await el.text()) || '';
    const expected = text ?? textContains;
    if (textContains !== undefined) {
      const ok = String(actual).includes(String(textContains));
      if (!ok) throw new Error(`assert_text_failed: expected to contain "${textContains}", got "${actual}"`);
      return { passed: true, mode: 'contains', expected: textContains, actual };
    }
    if (text !== undefined) {
      const ok = equals ? String(actual) === String(text) : String(actual).includes(String(text));
      if (!ok) throw new Error(`assert_text_failed: expected "${text}", got "${actual}"`);
      return { passed: true, mode: equals ? 'equals' : 'contains', expected: text, actual };
    }
    throw new Error('text_or_textContains_required');
  },

  async assert_attribute({ uid, attribute, value } = {}) {
    if (!uid || !attribute) throw new Error('uid_and_attribute_required');
    const el = elementCache.get(uid);
    if (!el) throw new Error(`unknown_uid: ${uid}`);
    const actual = await el.attribute(attribute);
    if (String(actual) !== String(value)) {
      throw new Error(`assert_attribute_failed: ${attribute} expected "${value}", got "${actual}"`);
    }
    return { passed: true, attribute, expected: value, actual };
  },

  async assert_state({ uid, condition } = {}) {
    // Element-state conditions require a uid.
    if (['visible', 'enabled', 'selected'].includes(condition)) {
      if (!uid) throw new Error(`uid_required_for_condition: ${condition}`);
      const el = elementCache.get(uid);
      if (!el) throw new Error(`unknown_uid: ${uid}`);
      let actual;
      try {
        if (condition === 'visible') actual = !!(await el.isVisible?.());
        else if (condition === 'enabled') actual = !!(await el.isEnabled?.());
        else if (condition === 'selected') actual = !!(await el.isSelected?.());
      } catch (_) { actual = null; }
      // Fallback: probe via attribute
      if (actual == null) {
        try {
          if (condition === 'visible') actual = (await el.attribute('hidden')) == null;
          else if (condition === 'enabled') actual = (await el.attribute('disabled')) == null;
          else if (condition === 'selected') actual = !!(await el.attribute('selected'));
        } catch (_) { actual = null; }
      }
      if (!actual) throw new Error(`assert_state_failed: ${condition} is false on ${uid}`);
      return { passed: true, condition, uid, actual };
    }
    // System conditions
    if (condition === 'no_console_errors') {
      const errs = consoleMessages.filter((m) => m.type === 'error');
      if (errs.length > 0) throw new Error(`assert_state_failed: ${errs.length} console errors`);
      return { passed: true, condition, consoleErrors: 0 };
    }
    if (condition === 'connected') {
      if (!miniProgram) throw new Error('assert_state_failed: not connected');
      return { passed: true, condition };
    }
    throw new Error(`unsupported_condition: ${condition}`);
  },

  async wait_for({ selector, timeout = 5000, interval = 200 } = {}) {
    if (!selector) throw new Error('selector_required');
    const mp = await requireConnected();
    const deadline = Date.now() + Number(timeout);
    while (Date.now() < deadline) {
      const page = currentPage || (await mp.currentPage());
      currentPage = page;
      const el = await page.$(selector).catch(() => null);
      if (el) {
        const uid = uidFor(el);
        return { found: true, selector, uid, elapsed_ms: Date.now() - (deadline - Number(timeout)) };
      }
      await sleep(Number(interval));
    }
    throw new Error(`wait_for_timeout: ${selector} not found within ${timeout}ms`);
  },

  // ----- Navigation (4) -----

  async navigate_to({ url } = {}) {
    if (!url) throw new Error('url_required');
    const mp = await requireConnected();
    await mp.navigateTo(url);
    await sleep(300);
    currentPage = await mp.currentPage();
    return { navigated: true, url, path: currentPage?.path || '' };
  },

  async navigate_back({ delta = 1 } = {}) {
    const mp = await requireConnected();
    await mp.navigateBack({ delta: Number(delta) });
    await sleep(300);
    currentPage = await mp.currentPage();
    return { back: true, delta, path: currentPage?.path || '' };
  },

  async switch_tab({ url } = {}) {
    if (!url) throw new Error('url_required');
    const mp = await requireConnected();
    await mp.switchTab(url);
    await sleep(300);
    currentPage = await mp.currentPage();
    return { switched: true, url, path: currentPage?.path || '' };
  },

  async relaunch({ url } = {}) {
    if (!url) throw new Error('url_required');
    const mp = await requireConnected();
    await mp.reLaunch(url);
    await sleep(500);
    currentPage = await mp.currentPage();
    return { relaunched: true, url, path: currentPage?.path || '' };
  },

  // ----- Script (1) -----

  async evaluate_script({ script } = {}) {
    if (!script) throw new Error('script_required');
    const mp = await requireConnected();
    const page = currentPage || (await mp.currentPage());
    currentPage = page;
    const result = await page.evaluate(script);
    return { result };
  },

  // ----- Console (2) -----

  async list_console_messages({ type, sinceId } = {}) {
    let msgs = consoleMessages;
    if (type) msgs = msgs.filter((m) => m.type === type);
    if (sinceId !== undefined) msgs = msgs.filter((m) => m.id > Number(sinceId));
    return { count: msgs.length, messages: msgs };
  },

  async get_console_message({ msgid } = {}) {
    const msg = consoleMessages.find((m) => m.id === Number(msgid));
    if (!msg) throw new Error(`console_message_not_found: ${msgid}`);
    return msg;
  },

  // ----- Network (4) -----

  async list_network_requests({ urlPattern, successOnly = false, sinceId } = {}) {
    let reqs = networkRequests;
    if (urlPattern) {
      let re;
      try {
        re = new RegExp(urlPattern);
      } catch (e) {
        // Fallback: treat the pattern as a literal substring (escape meta chars).
        const escaped = urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        re = new RegExp(escaped);
      }
      reqs = reqs.filter((r) => re.test(r.url));
    }
    if (successOnly) reqs = reqs.filter((r) => r.statusCode >= 200 && r.statusCode < 400);
    if (sinceId !== undefined) reqs = reqs.filter((r) => r.id > Number(sinceId));
    return { count: reqs.length, requests: reqs };
  },

  async get_network_request({ reqid } = {}) {
    const entry = networkRequests.find((r) => r.id === Number(reqid));
    if (!entry) throw new Error(`network_request_not_found: ${reqid}`);
    const details = requestDetails.get(entry.id) || {};
    return {
      ...entry,
      request: serializeReq(details.request),
      response: serializeReq(details.response),
    };
  },

  async stop_network_monitoring() {
    networkMonitoring = false;
    return { stopped: true };
  },

  async clear_network_requests() {
    networkRequests.length = 0;
    requestDetails.clear();
    return { cleared: true };
  },

  // ----- Debug (5) -----

  async screenshot({ path: outPath } = {}) {
    if (!outPath) throw new Error('path_required');
    const mp = await requireConnected();
    const page = currentPage || (await mp.currentPage());
    currentPage = page;
    const abs = path.resolve(outPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    await page.screenshot({ path: abs });
    return { saved: abs };
  },

  async diagnose_connection() {
    const checks = {
      daemon_running: true,
      automator_loaded: !!loadAutomator.ok,
      miniProgram_connected: !!miniProgram,
      currentPage_available: !!currentPage,
      element_cache_size: elementCache.size,
      console_buffer_size: consoleMessages.length,
      network_buffer_size: networkRequests.length,
      network_monitoring: networkMonitoring,
      port: PORT,
    };
    const issues = [];
    if (!miniProgram) issues.push('not_connected');
    if (consoleMessages.some((m) => m.type === 'error')) issues.push('has_console_errors');
    return { checks, issues, healthy: issues.length === 0 };
  },

  async check_environment() {
    const { probeDevtoolsCli } = require('./mp-devtools-cli');
    const probe = probeDevtoolsCli();
    const cliPath = detectCliPathSync();
    const cliExists = !!cliPath;
    const automator = loadAutomator();
    let automatorVersion = null;
    try {
      automatorVersion = require('miniprogram-automator/package.json').version;
    } catch (_) {}
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      automator_installed: !!automator,
      automator_version: automatorVersion,
      devtools_cli: probe,
      devtools_cli_resolved: cliPath,
      devtools_cli_exists: cliExists,
      service_port: PORT,
      pid_file: PID_FILE,
    };
  },

  async debug_page_elements({ selector = 'page' } = {}) {
    const mp = await requireConnected();
    const page = currentPage || (await mp.currentPage());
    currentPage = page;
    const root = selector === 'page' ? page : await page.$(selector);
    if (!root) throw new Error(`not_found: ${selector}`);
    const tree = await describeTree(root, 0, 4);
    return { root: selector, tree };
  },

  async debug_connection_flow({ limit = 50 } = {}) {
    return {
      events: connectionLog.slice(-Number(limit)),
      total: connectionLog.length,
    };
  },
};

// ---------------------------------------------------------------------------
// Element description / traversal helpers
// ---------------------------------------------------------------------------

async function describeElement(el) {
  const tagName = await el.tagName?.().catch(() => null) || el.tag || 'unknown';
  const text = await el.text().catch(() => '');
  const attributes = {};
  const commonAttrs = ['class', 'id', 'src', 'href', 'data-id', 'bindtap', 'style'];
  for (const attr of commonAttrs) {
    try {
      const v = await el.attribute(attr);
      if (v != null) attributes[attr] = v;
    } catch (_) {}
  }
  return { tagName, text: text || '', attributes };
}

async function describeTree(el, depth, maxDepth) {
  const info = await describeElement(el);
  const node = { ...info, depth, children: [] };
  if (depth >= maxDepth) return node;
  try {
    const kids = await el.children?.() || el.children || [];
    if (Array.isArray(kids)) {
      for (const child of kids.slice(0, 50)) {
        node.children.push(await describeTree(child, depth + 1, maxDepth));
      }
    }
  } catch (_) {}
  return node;
}

function serializeReq(r) {
  if (!r) return null;
  try {
    return {
      url: r.url,
      method: r.method,
      status: r.status,
      header: r.header || r.headers || {},
      body: r.body ?? r.data,
    };
  } catch (_) { return null; }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Lazy-load miniprogram-automator so daemon can start without it installed
let _automator = null;
let _automatorTried = false;
function loadAutomator() {
  if (_automatorTried) return _automator;
  _automatorTried = true;
  try { _automator = require('miniprogram-automator'); loadAutomator.ok = true; }
  catch (e) { _automator = null; loadAutomator.ok = false; }
  return _automator;
}

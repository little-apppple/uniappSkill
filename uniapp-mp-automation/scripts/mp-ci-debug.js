#!/usr/bin/env node
/**
 * mp-ci-debug.js — CI/CD entry point for WeChat mini-program debug scenarios.
 *
 * Reads a scenario config, executes each step against the running
 * mp-debug-helper daemon (spawning it if needed), and emits a JSON report.
 *
 * Designed for environments without an AI agent (e.g. GitHub Actions).
 *
 * Usage:
 *   node scripts/mp-ci-debug.js [--config <path>] [--keep-daemon]
 *
 * Default config path: ./mp-debug-scenarios.json
 *
 * Scenario config shape:
 * {
 *   "projectPath": "./dist/build/mp-weixin",
 *   "screenshotsDir": "./mp-debug-screenshots",
 *   "scenarios": [
 *     {
 *       "name": "homepage-renders",
 *       "steps": [
 *         { "op": "relaunch",   "args": { "url": "/pages/index/index" } },
 *         { "op": "wait_for",    "args": { "selector": ".page-content", "timeout": 5000 } },
 *         { "op": "query_selector", "args": { "selector": ".nav-bar-title" }, "save_as": "title" },
 *         { "op": "assert_text", "args": { "uid": "$title", "textContains": "首页" } },
 *         { "op": "screenshot",  "args": { "path": "homepage.png" } }
 *       ]
 *     }
 *   ]
 * }
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { resolveBuildPath } = require('./mp-paths');

const HELPER = path.join(__dirname, 'mp-debug-helper.js');

function parseArgs(argv) {
  const out = { config: null, keepDaemon: false, project: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--config') out.config = argv[++i];
    else if (argv[i] === '--keep-daemon') out.keepDaemon = true;
    else if (argv[i] === '--project') out.project = argv[++i];
  }
  return out;
}

function callHelper(op, args) {
  const argv = [HELPER, op];
  for (const [k, v] of Object.entries(args || {})) {
    if (v === true) argv.push(`--${k}`);
    else if (v === false || v == null) { /* skip */ }
    else { argv.push(`--${k}`, String(v)); }
  }
  // Per-step timeout (90s) — the helper's internal HTTP timeout is 60s, so
  // 90s leaves a margin for daemon overhead. Prevents an unresponsive
  // helper from hanging mp-ci-debug indefinitely.
  const STEP_TIMEOUT_MS = 90_000;
  const result = spawnSync(process.execPath, argv, {
    encoding: 'utf-8',
    timeout: STEP_TIMEOUT_MS,
    killSignal: 'SIGTERM',
  });
  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new Error(`helper_step_timeout: ${op} did not return within ${STEP_TIMEOUT_MS}ms`);
    }
    throw result.error;
  }
  if (result.signal) {
    throw new Error(`helper_terminated_by_signal: ${result.signal} (op=${op})`);
  }
  let parsed;
  try { parsed = JSON.parse(result.stdout); }
  catch (_) { throw new Error(`helper_invalid_output: ${(result.stdout || '').slice(0, 500)}`); }
  if (!parsed.ok) throw new Error(parsed.error || 'helper_returned_not_ok');
  return parsed.data;
}

function startHelperDaemon(projectPath) {
  const DAEMON_TIMEOUT_MS = 30_000;
  const result = spawnSync(process.execPath, [HELPER, 'start', projectPath], {
    encoding: 'utf-8',
    timeout: DAEMON_TIMEOUT_MS,
  });
  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') throw new Error('daemon_start_timeout');
    throw new Error(`daemon_start_failed: ${result.stderr || result.error.message}`);
  }
  if (result.signal) throw new Error(`daemon_terminated_by_signal: ${result.signal}`);
  if (result.status !== 0) throw new Error(`daemon_start_failed: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  if (!parsed.ok) throw new Error(parsed.error || 'daemon_start_returned_not_ok');
  return parsed;
}

function stopHelperDaemon() {
  spawnSync(process.execPath, [HELPER, 'stop'], { encoding: 'utf-8', stdio: 'ignore' });
}

function resolveRefs(value, stepResults) {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('$')) return value;
  const key = value.slice(1);
  if (!(key in stepResults)) throw new Error(`unresolved_ref: ${value}`);
  return stepResults[key];
}

function resolveArgsDeep(args, stepResults) {
  if (args == null) return args;
  if (typeof args === 'string') return resolveRefs(args, stepResults);
  if (Array.isArray(args)) return args.map((v) => resolveArgsDeep(v, stepResults));
  if (typeof args === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(args)) out[k] = resolveArgsDeep(v, stepResults);
    return out;
  }
  return args;
}

async function runStep(step, stepResults, screenshotsDir) {
  const op = step.op;
  let args = step.args || {};
  // Special handling: screenshot path is relative to screenshotsDir if not absolute
  if (op === 'screenshot' && args.path && !path.isAbsolute(args.path) && screenshotsDir) {
    args = { ...args, path: path.join(screenshotsDir, args.path) };
  }
  args = resolveArgsDeep(args, stepResults);
  const data = await callHelper(op, args);
  // Capture UID-bearing results for save_as
  if (step.save_as && data && typeof data === 'object' && 'uid' in data) {
    stepResults[step.save_as] = data.uid;
  } else if (step.save_as && (data == null || typeof data !== 'object')) {
    // Only store scalar values (string, number, boolean, null) as refs.
    // Complex objects without a uid field are silently excluded — trying to
    // use them as $ref would resolve to '[object Object]' and fail at the op level.
    stepResults[step.save_as] = data;
  }
  return data;
}

async function runScenario(scenario, ctx) {
  const stepResults = {};
  const stepReports = [];
  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    const label = step.label || `step-${i + 1}`;
    try {
      const data = await runStep(step, stepResults, ctx.screenshotsDir);
      stepReports.push({ step: i + 1, label, op: step.op, ok: true, data });
    } catch (e) {
      stepReports.push({ step: i + 1, label, op: step.op, ok: false, error: e.message });
      throw new Error(`scenario_failed: "${scenario.name}" at ${label}: ${e.message}`);
    }
  }
  return { name: scenario.name, steps: stepReports };
}

async function main() {
  const args = parseArgs(process.argv);
  const configPath = path.resolve(args.config || './mp-debug-scenarios.json');
  if (!fs.existsSync(configPath)) {
    fail(`config_not_found: ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Priority for project path: CLI --project > config.projectPath > auto-detect
  let projectPath;
  try {
    projectPath = resolveBuildPath({ explicit: args.project || config.projectPath });
  } catch (e) { fail(e.message); }

  const screenshotsDir = config.screenshotsDir ? path.resolve(config.screenshotsDir) : null;
  if (screenshotsDir) fs.mkdirSync(screenshotsDir, { recursive: true });

  const ctx = { projectPath, screenshotsDir };

  // Start daemon
  startHelperDaemon(projectPath);

  // Ensure connect
  try {
    await Promise.resolve(callHelper('connect', { projectPath }));
  } catch (e) {
    if (!args.keepDaemon) stopHelperDaemon();
    fail(`connect_failed: ${e.message}`);
  }

  // Run scenarios
  const reports = [];
  let passed = 0;
  let failed = 0;
  for (const scenario of config.scenarios || []) {
    try {
      const r = await runScenario(scenario, ctx);
      reports.push({ ...r, ok: true });
      passed++;
    } catch (e) {
      reports.push({ name: scenario.name, ok: false, error: e.message });
      failed++;
    }
  }

  // Final: collect any console errors as a safety check
  let consoleErrors = [];
  try {
    const list = await Promise.resolve(callHelper('list_console_messages', { type: 'error' }));
    consoleErrors = list.messages || [];
  } catch (_) {}

  if (!args.keepDaemon) stopHelperDaemon();

  const summary = {
    ok: failed === 0 && consoleErrors.length === 0,
    passed_scenarios: passed,
    failed_scenarios: failed,
    console_errors: consoleErrors.length,
    console_error_samples: consoleErrors.slice(0, 5),
    scenarios: reports,
    config: configPath,
    project: projectPath,
    screenshots_dir: screenshotsDir,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
}

function fail(msg) { console.log(JSON.stringify({ ok: false, error: msg }, null, 2)); process.exit(1); }

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e.message, stack: e.stack }, null, 2));
  process.exit(1);
});

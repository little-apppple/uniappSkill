#!/usr/bin/env node
/**
 * mp-devtools-cli.js — WeChat DevTools CLI path resolver.
 *
 * Used by mp-launch.js and mp-debug-helper.js to find the absolute path of
 * the WeChat DevTools command-line entry (cli.bat on Windows, cli on macOS).
 *
 * Resolution order (first match wins):
 *   1. WECHAT_DEVTOOLS_CLI env var (validated to exist; on miss, throws)
 *   2. Cached path at ~/.uniapp-mp-automation/devtools-cli.json (re-validated)
 *   3. Windows Registry (InstallLocation under HKLM\...\Tencent\微信web开发者工具)
 *   4. Common install paths per platform
 *   5. Interactive prompt (TTY only) — user types the path
 *
 * The cache is updated whenever a working path is found, so subsequent runs
 * skip the scan. Stale entries (file removed) are silently skipped.
 *
 * Public surface:
 *   detectDevtoolsCliPath({ interactive, noCache, explicit })
 *     -> { path, source }                 // source ∈ {env, explicit, cache, registry, common_path, user_input}
 *   detectDevtoolsCliPath({ ..., throwOnMiss: true })  // throws on miss
 *   probeDevtoolsCli()                   // never prompts, never throws, returns full detection report
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

const CACHE_DIR = path.join(os.homedir(), '.uniapp-mp-automation');
const CACHE_FILE = path.join(CACHE_DIR, 'devtools-cli.json');

function isFile(p) {
  try { return fs.statSync(p).isFile(); }
  catch (_) { return false; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); }
  catch (_) { return false; }
}

function isExecutable(p) {
  // On Windows .bat/.cmd is run via cmd.exe — existence is the test.
  // On POSIX the file must have any execute bit.
  if (process.platform === 'win32') return isFile(p);
  try {
    const st = fs.statSync(p);
    return st.isFile() && (st.mode & 0o111) !== 0;
  } catch (_) { return false; }
}

function windowsCandidates() {
  const pf = process.env.ProgramFiles || 'C:/Program Files';
  const pfx86 = process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)';
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local');
  return [
    // Stable channel (most common)
    path.join(pfx86, 'Tencent/微信web开发者工具/cli.bat'),
    path.join(pf, 'Tencent/微信web开发者工具/cli.bat'),
    path.join(localAppData, 'Programs/微信web开发者工具/cli.bat'),
    // Newer "微信开发者工具" folder name (no "web" — used by recent releases)
    path.join(pfx86, 'Tencent/微信开发者工具/cli.bat'),
    path.join(pf, 'Tencent/微信开发者工具/cli.bat'),
  ];
}

function macCandidates() {
  return [
    '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    path.join(os.homedir(), 'Applications/wechatwebdevtools.app/Contents/MacOS/cli'),
  ];
}

function linuxCandidates() {
  return [
    '/opt/wechat-devtools/cli',
    path.join(os.homedir(), '.local/share/wechat-devtools/cli'),
  ];
}

function platformCandidates() {
  if (process.platform === 'win32') return windowsCandidates();
  if (process.platform === 'darwin') return macCandidates();
  return linuxCandidates();
}

function readRegistryCliPath() {
  if (process.platform !== 'win32') return null;
  const keys = [
    'HKLM\\SOFTWARE\\WOW6432Node\\Tencent\\微信web开发者工具',
    'HKLM\\SOFTWARE\\Tencent\\微信web开发者工具',
    'HKLM\\SOFTWARE\\WOW6432Node\\Tencent\\微信开发者工具',
    'HKLM\\SOFTWARE\\Tencent\\微信开发者工具',
    'HKCU\\SOFTWARE\\Tencent\\微信web开发者工具',
    'HKCU\\SOFTWARE\\Tencent\\微信开发者工具',
  ];
  for (const key of keys) {
    let out;
    try {
      out = execSync(`reg query "${key}" /v InstallLocation`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      });
    } catch (_) { continue; }
    const text = out.toString();
    // Output line:    InstallLocation    REG_SZ    C:\Program Files (x86)\Tencent\微信web开发者工具
    const m = text.match(/InstallLocation\s+REG_SZ\s+(.+?)\r?\n/);
    if (!m) continue;
    const install = m[1].trim();
    const cli = path.join(install, 'cli.bat');
    if (isFile(cli)) return cli;
  }
  return null;
}

function readCache() {
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    if (data && typeof data.cliPath === 'string' && isExecutable(data.cliPath)) {
      return data.cliPath;
    }
  } catch (_) {}
  return null;
}

function writeCache(cliPath) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ cliPath, savedAt: new Date().toISOString() }, null, 2)
    );
    return true;
  } catch (_) { return false; }
}

function isInteractive() {
  return Boolean(process.stdin && process.stdin.isTTY) &&
         Boolean(process.stdout && process.stdout.isTTY);
}

function promptUser() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const q =
      '未自动检测到微信开发者工具安装路径。\n' +
      '请输入 cli 的完整路径' +
      (process.platform === 'win32' ? '（含 cli.bat，例 C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat）' : '（含 cli）') +
      '\n> ';
    rl.question(q, (answer) => {
      rl.close();
      resolve(String(answer || '').trim());
    });
    rl.on('SIGINT', () => { rl.close(); reject(new Error('user_cancelled_prompt')); });
  });
}

/**
 * Detect (and optionally prompt for) the WeChat DevTools CLI path.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.interactive]  Default: auto (true if stdin/stdout are TTYs)
 * @param {boolean} [opts.noCache]      Skip the cache read step
 * @param {boolean} [opts.noCacheWrite] Skip writing to the cache
 * @param {string}  [opts.explicit]     Explicit path — skips all detection, validates
 * @param {boolean} [opts.throwOnMiss=true]  When false, returns null instead of throwing
 * @returns {Promise<{path: string, source: string} | null>}
 */
async function detectDevtoolsCliPath(opts = {}) {
  const {
    interactive = isInteractive(),
    noCache = false,
    noCacheWrite = false,
    explicit = null,
    throwOnMiss = true,
  } = opts;

  const cache = (p) => { if (!noCacheWrite) writeCache(p); };
  const notFound = (msg) => {
    if (throwOnMiss) throw new Error(msg);
    return null;
  };

  // 1. Explicit
  if (explicit) {
    const p = path.resolve(explicit);
    if (!isExecutable(p)) {
      throw new Error(`explicit_cli_path_not_found: ${p}`);
    }
    cache(p);
    return { path: p, source: 'explicit' };
  }

  // 2. Env var
  if (process.env.WECHAT_DEVTOOLS_CLI) {
    const p = process.env.WECHAT_DEVTOOLS_CLI;
    if (!isExecutable(p)) {
      throw new Error(
        `env_cli_path_not_found: WECHAT_DEVTOOLS_CLI=${p} — path does not exist or is not executable.`
      );
    }
    cache(p);
    return { path: p, source: 'env' };
  }

  // 3. Cache
  if (!noCache) {
    const c = readCache();
    if (c) return { path: c, source: 'cache' };
  }

  // 4. Windows Registry
  const reg = readRegistryCliPath();
  if (reg) {
    cache(reg);
    return { path: reg, source: 'registry' };
  }

  // 5. Common paths
  for (const c of platformCandidates()) {
    if (isExecutable(c)) {
      cache(c);
      return { path: c, source: 'common_path' };
    }
  }

  // 6. Interactive prompt
  if (interactive) {
    let answer;
    try { answer = await promptUser(); }
    catch (e) {
      if (e.message === 'user_cancelled_prompt') {
        return notFound('devtools_cli_not_found: user_cancelled_prompt');
      }
      throw e;
    }
    if (answer) {
      if (!isExecutable(answer)) {
        throw new Error(`user_provided_path_not_found: ${answer}`);
      }
      cache(answer);
      return { path: answer, source: 'user_input' };
    }
  }

  return notFound(
    'devtools_cli_not_found: 未检测到微信开发者工具安装路径。\n' +
    '解决方法（任选其一）：\n' +
    '  1. 设置环境变量 WECHAT_DEVTOOLS_CLI=<cli 完整路径>\n' +
    '  2. 在交互式终端中重新运行，按提示输入路径\n' +
    '  3. 通过 --cli <path> 显式指定\n' +
    '  4. 安装微信开发者工具到默认位置（会自动检测）'
  );
}

/**
 * Probe all detection sources without prompting and without throwing.
 * Used by the `--probe` CLI subcommand and by check_environment diagnostics.
 */
function probeDevtoolsCli() {
  const env = process.env.WECHAT_DEVTOOLS_CLI || null;
  const envValid = env ? isExecutable(env) : false;
  const cached = readCache();
  const cachedPath = cached || null;
  const registry = readRegistryCliPath();
  const candidates = platformCandidates().map((c) => ({ path: c, exists: isExecutable(c) }));
  const found = candidates.find((c) => c.exists);
  return {
    env: envValid ? env : (env ? { set: env, valid: false } : null),
    cache: cachedPath,
    registry,
    common_paths: candidates,
    common_match: found ? found.path : null,
    interactive_available: isInteractive(),
    cache_file: CACHE_FILE,
  };
}

module.exports = {
  detectDevtoolsCliPath,
  probeDevtoolsCli,
  readCache,
  writeCache,
  readRegistryCliPath,
  platformCandidates,
  isInteractive,
  CACHE_DIR,
  CACHE_FILE,
};

// Standalone CLI:
//   node scripts/mp-devtools-cli.js            -> detect (prompts if TTY)
//   node scripts/mp-devtools-cli.js --probe    -> report all sources, no prompt, no throw
//   node scripts/mp-devtools-cli.js --clear    -> remove cache file
if (require.main === module) {
  const argv = process.argv.slice(2);
  const print = (obj) => console.log(JSON.stringify(obj, null, 2));

  (async () => {
    try {
      if (argv.includes('--probe')) {
        print({ ok: true, ...probeDevtoolsCli() });
        return;
      }
      if (argv.includes('--clear')) {
        try { fs.unlinkSync(CACHE_FILE); print({ ok: true, cleared: CACHE_FILE }); }
        catch (e) { print({ ok: true, cleared: false, reason: e.code }); }
        return;
      }
      const explicitIdx = argv.indexOf('--cli');
      const explicit = explicitIdx >= 0 ? argv[explicitIdx + 1] : null;
      const noCache = argv.includes('--no-cache');
      const interactiveFlag = argv.includes('--no-interactive') ? false : undefined;
      const result = await detectDevtoolsCliPath({
        explicit,
        noCache,
        interactive: interactiveFlag,
      });
      print({ ok: true, ...result });
    } catch (e) {
      print({ ok: false, error: e.message });
      process.exit(1);
    }
  })();
}

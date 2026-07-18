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

/**
 * Detect the installed WeChat DevTools version by running `<cli> -v`.
 *
 * Returns null if the CLI can't be found or the version can't be parsed.
 * WeChat DevTools has two version numbering schemes:
 *
 *   Classic Stable: 1.06.2309250  (major=1, minor=6, build=2309250)
 *   Nightly Electron: 2.02.2607032  (major=2, minor=2, build=2607032)
 *
 * Official Skills (miniprogram-dev-skill via `wechatide` CLI) requires
 * **Nightly Electron Build 2.02.2607032 or above** per official docs.
 * See: https://developers.weixin.qq.com/miniprogram/dev/devtools/Skills.html
 *
 * @param {Object} [opts]
 * @param {string} [opts.cliPath]  Explicit CLI path, bypasses detection
 * @returns {Promise<Object|null>} { version, major, minor, build, officialSkillsSupported, raw, cliPath }
 */
async function detectDevtoolsVersion(opts = {}) {
  let cliPath;
  if (opts.cliPath) {
    cliPath = opts.cliPath;
  } else {
    try {
      const result = await detectDevtoolsCliPath({ interactive: false, throwOnMiss: true });
      cliPath = result.path;
    } catch (_) {
      return null; // Cant find DevTools at all
    }
  }

  try {
    // On Windows, .bat/.cmd needs shell=true (execSync default).
    // The `-v` flag outputs the version and exits.
    const output = execSync(`"${cliPath}" -v`, {
      encoding: 'utf-8',
      timeout: 10000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const raw = (output || '').trim();
    // Match version patterns:
    //   "WeChat DevTools 1.06.2309250"
    //   "微信开发者工具 2.02.2607032"
    //   "版本 1.06.2309250""
    const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;

    const version = match[0];
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const build = parseInt(match[3], 10);

    // Official Skills (miniprogram-dev-skill via wechatide CLI) requires
    // Nightly Electron Build 2.02.2607032 or above per:
    // https://developers.weixin.qq.com/miniprogram/dev/devtools/Skills.html
    const officialSkillsSupported =
      major > 2 ||
      (major === 2 && (minor > 2 || (minor === 2 && build >= 2607032)));

    return {
      version,
      major,
      minor,
      build,
      officialSkillsSupported,
      raw,
      cliPath,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Recommend which debugging approach to use based on DevTools version and
 * available tooling (official Skills vs miniprogram-automator).
 *
 * Decision logic:
 *   1. DevTools >= 2.02.2607032 (Nightly Electron Build) AND wechatide CLI available → official_skills
 *   2. miniprogram-automator installed → automator
 *   3. Neither → none (with guidance)
 *
 * @param {Object} [opts]
 * @param {string} [opts.cliPath]  Explicit CLI path, bypasses detection
 * @returns {Promise<{approach: string, reason: string, versionInfo: Object|null,
 *                     wechatideAvailable: boolean, wechatideLocalAvailable: boolean,
 *                     wechatideLocalPath: string|null, automatorAvailable: boolean}>}
 */
async function recommendApproach(opts = {}) {
  const versionInfo = await detectDevtoolsVersion(opts);

  // Check if wechatide is globally available in PATH
  let wechatideAvailable = false;
  try {
    execSync('wechatide --help', {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true,
      stdio: 'ignore',
    });
    wechatideAvailable = true;
  } catch (_) {
    // Some versions respond to `-h` or `--version` instead of `--help`
    for (const flag of ['-h', '--version']) {
      try {
        execSync(`wechatide ${flag}`, {
          encoding: 'utf-8',
          timeout: 3000,
          windowsHide: true,
          stdio: 'ignore',
        });
        wechatideAvailable = true;
        break;
      } catch (_2) {}
    }
  }

  // Check if wechatide is available alongside the DevTools CLI
  // (same directory as cli.bat, shipped with DevTools since 1.06.23)
  let wechatideLocalAvailable = false;
  let wechatideLocalPath = null;
  if (versionInfo && versionInfo.cliPath) {
    const cliDir = path.dirname(versionInfo.cliPath);
    const candidates = [
      path.join(cliDir, 'wechatide'),
      path.join(cliDir, 'wechatide.bat'),
      path.join(cliDir, 'wechatide.cmd'),
    ];
    for (const c of candidates) {
      if (isFile(c)) {
        wechatideLocalAvailable = true;
        wechatideLocalPath = c;
        break;
      }
    }
  }

  // Check if miniprogram-automator is installable
  const automatorAvailable = (() => {
    try { require('miniprogram-automator'); return true; }
    catch (_) { return false; }
  })();

  // Decision: prefer official Skills when wechatide is globally available in PATH.
  // Local-only wechatide (alongside the DevTools CLI binary) is reported for info
  // but does NOT trigger official_skills — user-facing examples use bare `wechatide`
  // and requiring full-path invocation would be unergonomic.
  if (versionInfo && versionInfo.officialSkillsSupported && wechatideAvailable) {
    return {
      approach: 'official_skills',
      reason: `DevTools ${versionInfo.version} supports official Skills (>= 2.02.2607032) and wechatide CLI is globally available`,
      versionInfo,
      wechatideAvailable,
      wechatideLocalAvailable,
      wechatideLocalPath,
      automatorAvailable,
    };
  }

  if (automatorAvailable) {
    return {
      approach: 'automator',
      reason: versionInfo
        ? versionInfo.officialSkillsSupported
          ? `DevTools ${versionInfo.version} supports official Skills but wechatide CLI not found; falling back to automator (npm i -D miniprogram-automator)`
          : `DevTools ${versionInfo.version} predates official Skills (need Nightly Electron Build >= 2.02.2607032); using automator via miniprogram-automator`
        : 'DevTools version not detected; falling back to automator (miniprogram-automator)',
      versionInfo,
      wechatideAvailable,
      wechatideLocalAvailable,
      wechatideLocalPath,
      automatorAvailable,
    };
  }

  return {
    approach: 'none',
    reason: versionInfo
      ? `DevTools ${versionInfo.version} detected but neither wechatide CLI nor miniprogram-automator is available.\nInstall: npm i -D miniprogram-automator, or update DevTools to get official Skills.`
      : 'DevTools not detected and miniprogram-automator not installed.\nRun node scripts/mp-devtools-cli.js to configure DevTools CLI path, then npm i -D miniprogram-automator.',
    versionInfo,
    wechatideAvailable,
    wechatideLocalAvailable,
    wechatideLocalPath,
    automatorAvailable,
  };
}

module.exports = {
  detectDevtoolsCliPath,
  detectDevtoolsVersion,
  probeDevtoolsCli,
  readCache,
  readRegistryCliPath,
  recommendApproach,
  writeCache,
  platformCandidates,
  isInteractive,
  CACHE_DIR,
  CACHE_FILE,
};

// Standalone CLI:
//   node scripts/mp-devtools-cli.js                    -> detect (prompts if TTY)
//   node scripts/mp-devtools-cli.js --probe            -> report all sources, no prompt, no throw
//   node scripts/mp-devtools-cli.js --clear            -> remove cache file
//   node scripts/mp-devtools-cli.js --detect-version   -> detect version + recommend approach
//   node scripts/mp-devtools-cli.js --recommend         -> recommend approach (combined)
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
      if (argv.includes('--detect-version') || argv.includes('--recommend')) {
        const cliIdx = argv.indexOf('--cli');
        const cliPath = cliIdx >= 0 ? argv[cliIdx + 1] : undefined;
        const versionInfo = await detectDevtoolsVersion({ cliPath });
        if (argv.includes('--recommend')) {
          const rec = await recommendApproach({ cliPath });
          print({ ok: true, ...rec });
        } else {
          print({ ok: true, versionInfo });
        }
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

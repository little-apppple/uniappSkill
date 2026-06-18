#!/usr/bin/env node
/**
 * mp-launch.js — Launch WeChat DevTools with the built mp-weixin project.
 *
 * Usage:
 *   node scripts/mp-launch.js [--no-open] [--project <path>] [--cli <path>]
 *
 * Defaults to ./dist/build/mp-weixin. Idempotent: if DevTools already has the
 * project open, switches to that tab.
 *
 * --cli overrides the WeChat DevTools CLI path. If omitted, the path is auto-
 * detected from WECHAT_DEVTOOLS_CLI env / cache / registry / common paths.
 * If still not found and the script is running in a TTY, the user is prompted
 * to type the path (and the answer is cached for next time).
 */

'use strict';

const { spawn } = require('child_process');
const { resolveBuildPath } = require('./mp-paths');
const { detectDevtoolsCliPath, probeDevtoolsCli } = require('./mp-devtools-cli');

function parseArgs(argv) {
  const out = { noOpen: false, project: null, cli: null, noInteractive: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-open') out.noOpen = true;
    else if (a === '--no-interactive') out.noInteractive = true;
    else if (a === '--project') out.project = argv[++i];
    else if (a === '--cli') out.cli = argv[++i];
  }
  return out;
}

async function main() {
  const { noOpen, project, cli, noInteractive } = parseArgs(process.argv);
  let projectPath;
  try {
    projectPath = resolveBuildPath({ explicit: project });
  } catch (e) {
    fail(e.message);
  }

  let cliResult;
  try {
    cliResult = await detectDevtoolsCliPath({
      explicit: cli,
      interactive: noInteractive ? false : undefined,
    });
  } catch (e) {
    fail(`${e.message}\n\nDiagnostics:\n${JSON.stringify(probeDevtoolsCli(), null, 2)}`);
  }

  const cliPath = cliResult.path;
  const args = ['open', '--project', projectPath];
  if (noOpen) args.push('--no-open');

  // Spawn detached so this script returns immediately while DevTools stays running.
  // On Windows .bat/.cmd requires cmd.exe /c — pass cliPath through rather than
  // using shell:true, which would re-tokenize Unicode paths like `微信web开发者工具`.
  const isBat = process.platform === 'win32' && /\.(bat|cmd)$/i.test(cliPath);
  const child = spawn(isBat ? 'cmd.exe' : cliPath, isBat ? ['/c', cliPath, ...args] : args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  ok({ action: 'launch', cli: cliPath, cli_source: cliResult.source, project: projectPath, detached_pid: child.pid });
}

function ok(obj) { console.log(JSON.stringify({ ok: true, ...obj }, null, 2)); }
function fail(msg) { console.log(JSON.stringify({ ok: false, error: msg }, null, 2)); process.exit(1); }

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e.message, stack: e.stack }, null, 2));
  process.exit(1);
});

#!/usr/bin/env node
/**
 * mp-verify-appid.js — Confirm appid is configured and propagated to build output.
 *
 * Reads:
 *   - src/manifest.json          (source)
 *   - dist/build/mp-weixin/project.config.json   (build output)
 *
 * Exit code 1 if anything is wrong.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { resolveManifestPath, resolveBuildPath, resolveBuiltConfigPath } = require('./mp-paths');

function parseArgs(argv) {
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--manifest') return { manifest: argv[++i] };
    if (argv[i] === '--build') return { build: argv[++i] };
  }
  return {};
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch (e) { throw new Error(`cannot_read ${p}: ${e.message}`); }
}

function main() {
  const args = parseArgs(process.argv);

  let manifestPath;
  try { manifestPath = resolveManifestPath({ explicit: args.manifest }); }
  catch (e) { fail(e.message); }

  const manifest = readJson(manifestPath);
  const sourceAppid = manifest['mp-weixin']?.appid;

  if (!sourceAppid || sourceAppid === '__UNI__XXXXXXX') {
    fail(`appid_unconfigured in ${manifestPath} (got "${sourceAppid}"). Configure mp-weixin.appid or use the DevTools test-number feature.`);
  }

  let buildPath = null;
  try { buildPath = resolveBuildPath({ explicit: args.build, requireBuild: false }); }
  catch (e) { /* swallowed — we want to skip the build check below */ }

  const builtConfigPath = buildPath ? resolveBuiltConfigPath(buildPath) : null;
  if (!builtConfigPath) {
    warn(`build_output_missing: no built mp-weixin found yet. Run \`npm run build:mp-weixin\` to verify propagation.`);
    return ok({ manifest: manifestPath, source: sourceAppid, build_check: 'skipped' });
  }
  const built = readJson(builtConfigPath);
  if (built.appid !== sourceAppid) {
    fail(`appid_mismatch: manifest has "${sourceAppid}" but build has "${built.appid}"`);
  }

  ok({
    manifest: manifestPath,
    build: builtConfigPath,
    source: sourceAppid,
    built_appid: built.appid,
    projectname: built.projectname,
    compileType: built.compileType,
  });
}

function ok(obj) { console.log(JSON.stringify({ ok: true, ...obj }, null, 2)); }
function warn(msg) { console.log(JSON.stringify({ ok: true, warning: msg }, null, 2)); }
function fail(msg) { console.log(JSON.stringify({ ok: false, error: msg }, null, 2)); process.exit(1); }

main();

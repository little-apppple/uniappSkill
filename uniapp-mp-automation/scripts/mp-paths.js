#!/usr/bin/env node
/**
 * mp-paths.js — Auto-detect uni-app build output and manifest paths.
 *
 * Resolution order (first match wins):
 *   1. Explicit argument passed to resolve()
 *   2. MP_PROJECT_PATH environment variable
 *   3. CWD walking up looking for manifest.json (uni-app project root)
 *   4. Conventional build output directories under that root
 *
 * Conventional candidates (checked in order):
 *   unpackage/dist/build/mp-weixin   (HBuilderX 3.x+ / vue-cli vite newer)
 *   unpackage/dist/dev/mp-weixin     (HBuilderX 3.x+ dev mode)
 *   dist/build/mp-weixin             (uni-app vue-cli older / vite default)
 *   dist/dev/mp-weixin               (uni-app dev mode)
 *   ./                               (current dir if it already has app.json — native MP project)
 *
 * Exits via thrown Error on miss so the caller gets a uniform "not found" path.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BUILD_CANDIDATES = [
  'unpackage/dist/build/mp-weixin',
  'unpackage/dist/dev/mp-weixin',
  'dist/build/mp-weixin',
  'dist/dev/mp-weixin',
];

const MANIFEST_CANDIDATES = [
  'src/manifest.json',
  'manifest.json',
];

function exists(p) {
  try { return fs.statSync(p).isDirectory() || fs.statSync(p).isFile(); }
  catch (_) { return false; }
}

function detectProjectRoot(startDir = process.cwd()) {
  const root = path.resolve(startDir);
  // Pass 1: walk up looking for the vue-cli pattern (`src/manifest.json` at
  // project root). This MUST come first so that when CWD is inside `src/` of
  // a vue-cli project we don't latch onto the source manifest.json as the
  // root marker.
  let vueCli = walkUp(root, (dir) => exists(path.join(dir, 'src/manifest.json')));
  if (vueCli) return vueCli;
  // Pass 2: walk up looking for an HBuilderX-style `manifest.json` at the
  // project root (no nested `src/manifest.json`). In vue-cli setups where the
  // source manifest lives under `src/`, this would mis-identify; that's why
  // pass 1 runs first.
  let hbx = walkUp(root, (dir) => exists(path.join(dir, 'manifest.json')));
  if (hbx) return hbx;
  // Pass 3: native mini-program project (app.json + project.config.json at root)
  let native = walkUp(root, (dir) =>
    exists(path.join(dir, 'app.json')) && exists(path.join(dir, 'project.config.json')));
  if (native) return native;
  return root;
}

function walkUp(startDir, predicate) {
  let cur = path.resolve(startDir);
  while (true) {
    if (predicate(cur)) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function detectBuildOutput(projectRoot) {
  for (const candidate of BUILD_CANDIDATES) {
    const abs = path.join(projectRoot, candidate);
    if (exists(path.join(abs, 'app.json'))) return abs;
  }
  // Native MP project: cwd is already the build
  if (exists(path.join(projectRoot, 'app.json'))) return projectRoot;
  return null;
}

function listCheckedPaths(projectRoot) {
  return BUILD_CANDIDATES.map((c) => path.join(projectRoot, c));
}

/**
 * Resolve the mp-weixin build output path.
 *
 * @param {Object} opts
 * @param {string} [opts.explicit]  CLI-passed path; wins if it exists
 * @param {boolean} [opts.requireBuild=true]  throw on miss; otherwise return null
 * @param {string} [opts.startDir]  override CWD for detection
 * @returns {string|null}
 */
function resolveBuildPath({ explicit = null, requireBuild = true, startDir } = {}) {
  if (explicit) {
    const p = path.resolve(explicit);
    if (!exists(p)) throw new Error(`explicit_path_not_found: ${p}`);
    return p;
  }
  if (process.env.MP_PROJECT_PATH) {
    const p = path.resolve(process.env.MP_PROJECT_PATH);
    if (exists(path.join(p, 'app.json'))) return p;
  }
  const root = detectProjectRoot(startDir);
  const build = detectBuildOutput(root);
  if (build) return build;
  if (!requireBuild) return null;
  throw new Error(
    `build_output_not_found. Searched:\n  - ${listCheckedPaths(root).join('\n  - ')}\n` +
    `Run \`npm run build:mp-weixin\` (or your platform's build command) first, ` +
    `or set MP_PROJECT_PATH env var to override.`
  );
}

/**
 * Resolve the uni-app manifest.json path.
 *
 * @param {Object} opts
 * @param {string} [opts.explicit]
 * @param {string} [opts.startDir]
 * @returns {string}
 */
function resolveManifestPath({ explicit = null, startDir } = {}) {
  if (explicit) {
    const p = path.resolve(explicit);
    if (!exists(p)) throw new Error(`manifest_not_found: ${p}`);
    return p;
  }
  const root = detectProjectRoot(startDir);
  for (const candidate of MANIFEST_CANDIDATES) {
    const p = path.join(root, candidate);
    if (exists(p)) return p;
  }
  throw new Error(
    `manifest_not_found under ${root}. Looked for: ${MANIFEST_CANDIDATES.join(', ')}. ` +
    `Are you inside a uni-app project root?`
  );
}

/**
 * Resolve project.config.json (post-build) and check it aligns with manifest appid.
 */
function resolveBuiltConfigPath(buildPath) {
  if (!buildPath) return null;
  const p = path.join(buildPath, 'project.config.json');
  return exists(p) ? p : null;
}

module.exports = {
  resolveBuildPath,
  resolveManifestPath,
  resolveBuiltConfigPath,
  detectProjectRoot,
  detectBuildOutput,
  BUILD_CANDIDATES,
  MANIFEST_CANDIDATES,
};

// Allow running standalone for debugging: `node mp-paths.js`
if (require.main === module) {
  try {
    const build = resolveBuildPath();
    const manifest = resolveManifestPath();
    console.log(JSON.stringify({
      ok: true,
      buildPath: build,
      manifestPath: manifest,
      builtConfigPath: resolveBuiltConfigPath(build),
      projectRoot: detectProjectRoot(),
    }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
    process.exit(1);
  }
}

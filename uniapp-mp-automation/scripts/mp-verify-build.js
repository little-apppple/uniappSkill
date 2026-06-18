#!/usr/bin/env node
/**
 * mp-verify-build.js — Confirm the built mp-weixin output has all required files.
 *
 * Checks:
 *   - dist/build/mp-weixin/app.json
 *   - dist/build/mp-weixin/project.config.json
 *   - dist/build/mp-weixin/app.js
 *   - dist/build/mp-weixin/app.wxss
 *   - subPackages directories if declared in app.json
 *
 * Exit code 1 if any required file is missing.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { resolveBuildPath } = require('./mp-paths');

const REQUIRED = ['app.json', 'project.config.json', 'app.js', 'app.wxss'];

function main() {
  let BUILD_DIR;
  try { BUILD_DIR = resolveBuildPath(); }
  catch (e) { fail(e.message); }

  const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(BUILD_DIR, f)));
  if (missing.length > 0) {
    fail(`missing_required_files: ${missing.join(', ')}`);
  }

  const appJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'app.json'), 'utf-8'));
  const pages = appJson.pages || [];
  const subPackages = appJson.subPackages || [];
  const missingSubPackages = [];

  for (const sp of subPackages) {
    const spRoot = sp.root;
    if (!spRoot) continue;
    const spPath = path.join(BUILD_DIR, spRoot);
    if (!fs.existsSync(spPath)) missingSubPackages.push(spRoot);
  }

  // Sample check: first 3 pages exist as directories with .vue/.wxml
  const missingPages = [];
  for (const p of pages.slice(0, 3)) {
    const base = path.join(BUILD_DIR, p);
    if (!fs.existsSync(`${base}.wxml`) && !fs.existsSync(`${base}.js`)) {
      missingPages.push(p);
    }
  }

  const result = {
    pages: pages.length,
    subPackages: subPackages.length,
    missing_subpackages: missingSubPackages,
    missing_pages_sample: missingPages,
    size_kb: totalSize(BUILD_DIR),
  };

  if (missingSubPackages.length > 0 || missingPages.length > 0) {
    console.log(JSON.stringify({ ok: false, ...result }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

function totalSize(dir) {
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let stat;
    try { stat = fs.statSync(cur); } catch (_) { continue; }
    if (stat.isFile()) { total += stat.size; continue; }
    if (stat.isDirectory()) {
      try { stack.push(...fs.readdirSync(cur).map((c) => path.join(cur, c))); } catch (_) {}
    }
  }
  return Math.round(total / 1024);
}

function fail(msg) { console.log(JSON.stringify({ ok: false, error: msg }, null, 2)); process.exit(1); }

main();

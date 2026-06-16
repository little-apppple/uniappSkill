#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Test runner for the uniapp-scaffolder suite.
//
// `npm test` invokes this script as `node --test tests/runner.mjs`,
// which puts node:test into a "test context" for the current process
// (visible via `process.env.NODE_TEST_CONTEXT`). If we then spawn
// another `node --test ...` from this process, node:test's recursion
// guard fires and silently skips the nested run, so the actual test
// files never execute.
//
// The fix: detect that we're already inside a `node --test` run, and
// instead of spawning a nested runner, import the test files in-place
// so their top-level `test(...)` calls register with the OUTER
// node:test runner (this one) and run normally. When invoked
// directly as `node tests/runner.mjs` (no `--test` flag), there's no
// outer runner — node:test auto-starts when the first `test()` call
// is made, the same way it would if you'd run the test file directly.
//
// Either way, we never spawn a nested `node --test`, so the recursion
// guard never fires.

const underNodeTest = Boolean(process.env.NODE_TEST_CONTEXT)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = __dirname

async function walk(dir, selfBasename) {
  const out = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(p, selfBasename))
    else if (entry.isFile() && p.endsWith('.test.mjs') && entry.name !== selfBasename) out.push(p)
  }
  return out
}

const selfBasename = path.basename(fileURLToPath(import.meta.url))
const files = (await walk(ROOT, selfBasename)).sort()

if (files.length === 0) {
  console.log('runner.mjs: no *.test.mjs files under tests/')
  process.exit(0)
}

if (underNodeTest) {
  console.log(`runner.mjs: running ${files.length} test file(s) inside node --test`)
} else {
  console.log(`runner.mjs: importing ${files.length} test file(s) in-process`)
}

for (const f of files) {
  await import(pathToFileURL(f).href)
}

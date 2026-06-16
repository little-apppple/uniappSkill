#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = __dirname

async function walk(dir) {
  const out = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(p))
    else if (entry.isFile() && p.endsWith('.test.mjs')) out.push(p)
  }
  return out
}

const files = (await walk(ROOT)).sort()
if (files.length === 0) {
  console.log('runner.mjs: no *.test.mjs files under tests/')
  process.exit(0)
}
console.log(`runner.mjs: invoking node --test on ${files.length} file(s)`)
const child = spawn(process.execPath, ['--test', ...files], { stdio: 'inherit' })
child.on('exit', code => process.exit(code ?? 1))

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { resolveSafeOut, isSensitivePath } from '../scripts/lib/path-guard.mjs'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffolder-test-'))

test('resolveSafeOut: returns absolute path for relative input', () => {
  const out = resolveSafeOut('./my-app', { cwd: tmp, force: false })
  assert.equal(path.isAbsolute(out), true)
  assert.equal(out.endsWith(path.join('my-app')), true)
})

test('resolveSafeOut: rejects existing non-empty directory without --force', () => {
  const dir = path.join(tmp, 'occupied')
  fs.mkdirSync(dir)
  fs.writeFileSync(path.join(dir, 'sentinel.txt'), 'x')
  assert.throws(
    () => resolveSafeOut(dir, { cwd: tmp, force: false }),
    /already exists and is not empty/
  )
})

test('resolveSafeOut: allows existing non-empty directory with --force', () => {
  const dir = path.join(tmp, 'force-ok')
  fs.mkdirSync(dir)
  fs.writeFileSync(path.join(dir, 'sentinel.txt'), 'x')
  const out = resolveSafeOut(dir, { cwd: tmp, force: true })
  assert.equal(out, path.resolve(dir))
})

test('resolveSafeOut: allows a non-existent absolute path', () => {
  const out = resolveSafeOut(path.join(tmp, 'does-not-exist-yet'), { cwd: tmp, force: false })
  assert.equal(path.isAbsolute(out), true)
})

test('isSensitivePath: detects home ssh and system dirs', () => {
  assert.equal(isSensitivePath(path.join(os.homedir(), '.ssh', 'config')), true)
  if (process.platform === 'win32') {
    assert.equal(isSensitivePath('C:\\Windows\\System32\\foo'), true)
  } else {
    assert.equal(isSensitivePath('/etc/passwd'), true)
  }
})

test('isSensitivePath: returns false for normal project paths', () => {
  assert.equal(isSensitivePath(path.join(tmp, 'my-app')), false)
})

test('isSensitivePath: case-insensitive on Windows', { skip: process.platform !== 'win32' }, () => {
  assert.equal(isSensitivePath('c:\\windows\\system32\\foo'), true)
  assert.equal(isSensitivePath('C:\\WINDOWS'), true)
})

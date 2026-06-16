import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLogger } from '../scripts/lib/logger.mjs'

function captureStreams() {
  const out = []
  const err = []
  const origOut = process.stdout.write.bind(process.stdout)
  const origErr = process.stderr.write.bind(process.stderr)
  process.stdout.write = (chunk) => { out.push(String(chunk)); return true }
  process.stderr.write = (chunk) => { err.push(String(chunk)); return true }
  return {
    restore() {
      process.stdout.write = origOut
      process.stderr.write = origErr
    },
    stdout: () => out.join(''),
    stderr: () => err.join(''),
  }
}

test('createLogger({json:false}): info() writes human line to stdout', () => {
  const log = createLogger({ json: false })
  const cap = captureStreams()
  try {
    log.info('hello world')
    assert.match(cap.stdout(), /hello world/)
  } finally { cap.restore() }
})

test('createLogger({json:false}): warn() writes to stderr with WARN prefix', () => {
  const log = createLogger({ json: false })
  const cap = captureStreams()
  try {
    log.warn('careful %d', 42)
    assert.match(cap.stderr(), /WARN: careful 42/)
  } finally { cap.restore() }
})

test('createLogger({json:true}): info() emits a JSON line on stdout', () => {
  const log = createLogger({ json: true })
  const cap = captureStreams()
  try {
    log.info('two', { k: 'v' })
    const line = cap.stdout().trim()
    const parsed = JSON.parse(line)
    assert.equal(parsed.level, 'info')
    assert.equal(parsed.msg, 'two')
    assert.deepEqual(parsed.data, { k: 'v' })
  } finally { cap.restore() }
})

test('createLogger({json:true}): warn() emits a JSON line on stderr', () => {
  const log = createLogger({ json: true })
  const cap = captureStreams()
  try {
    log.warn('careful')
    const line = cap.stderr().trim()
    const parsed = JSON.parse(line)
    assert.equal(parsed.level, 'warn')
  } finally { cap.restore() }
})

test('createLogger({json:true}): progress() is suppressed', () => {
  const log = createLogger({ json: true })
  const cap = captureStreams()
  try {
    log.progress('fetching')
    assert.equal(cap.stdout(), '')
    assert.equal(cap.stderr(), '')
  } finally { cap.restore() }
})

test('createLogger({json:false}): info() substitutes %s without quoting strings', () => {
  const log = createLogger({ json: false })
  const cap = captureStreams()
  try {
    log.info('fetched %s', 'uni-preset-vue-vite')
    assert.match(cap.stdout(), /fetched uni-preset-vue-vite/)
    assert.doesNotMatch(cap.stdout(), /"/)
  } finally { cap.restore() }
})

test('createLogger({json:false}): warn() substitutes %d for numbers', () => {
  const log = createLogger({ json: false })
  const cap = captureStreams()
  try {
    log.warn('%d entries', 7)
    assert.match(cap.stderr(), /WARN: 7 entries/)
  } finally { cap.restore() }
})

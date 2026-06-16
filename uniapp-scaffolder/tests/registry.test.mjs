import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRegistry, validateRegistry } from '../scripts/lib/registry.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(__dirname, 'fixtures')
const validPath = path.join(fixtures, 'valid-registry.yaml')
const badPath = path.join(fixtures, 'bad-registry.yaml')

test('loadRegistry: reads and parses a valid YAML file', () => {
  const reg = loadRegistry(validPath)
  assert.equal(reg.version, 1)
  assert.equal(reg.templates.length, 1)
  assert.equal(reg.templates[0].id, 'sample-1')
})

test('loadRegistry: throws on missing file', () => {
  assert.throws(() => loadRegistry(path.join(fixtures, 'missing.yaml')), /ENOENT/)
})

test('validateRegistry: accepts the valid fixture', () => {
  const reg = loadRegistry(validPath)
  assert.doesNotThrow(() => validateRegistry(reg))
})

test('validateRegistry: rejects non-int marketplace_id', () => {
  const reg = { version: 1, templates: [{ id: 'bad', title: 'Bad', source: 'hbx_market', marketplace_id: 'not-an-int', maintainer: 'dcloud' }] }
  assert.throws(() => validateRegistry(reg), /marketplace_id must be a positive integer/)
})

test('validateRegistry: rejects unknown source value', () => {
  const reg = { version: 1, templates: [{ id: 'x', title: 'x', source: 'bitbucket', maintainer: 'dcloud' }] }
  assert.throws(() => validateRegistry(reg), /source must be one of/)
})

test('validateRegistry: rejects duplicate ids', () => {
  const reg = {
    version: 1,
    templates: [
      { id: 'dup', title: 'A', source: 'github', repo: 'a/b', maintainer: 'dcloud' },
      { id: 'dup', title: 'B', source: 'github', repo: 'c/d', maintainer: 'dcloud' },
    ],
  }
  assert.throws(() => validateRegistry(reg), /duplicate template id: dup/)
})

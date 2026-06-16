import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fetchViaDegit } from '../../scripts/sources/degit.mjs'

const fixtures = path.resolve('tests/fixtures')
const src = 'file://' + path.join(fixtures, 'sample-template').replace(/\\/g, '/')

test('fetchViaDegit: copies a local file:// template to --out', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-degit-'))
  const out = path.join(tmp, 'out')
  await fetchViaDegit({ repo: src, ref: null, out, log: { info(){}, warn(){}, error(){}, progress(){} } })
  assert.equal(fs.existsSync(path.join(out, 'package.json')), true)
  assert.equal(fs.existsSync(path.join(out, 'README.md')), true)
})

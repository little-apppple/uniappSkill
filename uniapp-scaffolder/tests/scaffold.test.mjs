import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const cli = path.resolve('scripts/scaffold.mjs')

test('scaffold.mjs --help exits 0 and lists subcommands', () => {
  const res = spawnSync('node', [cli, '--help'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  assert.match(res.stdout, /list/)
  assert.match(res.stdout, /fetch/)
  assert.match(res.stdout, /search/)
  assert.match(res.stdout, /validate/)
})

test('scaffold.mjs list --json lists official templates', () => {
  const res = spawnSync('node', [cli, 'list', '--json'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  const ids = res.stdout.trim().split('\n').map(l => JSON.parse(l).id)
  assert.ok(ids.includes('uni-preset-vue-vite'))
  assert.ok(ids.includes('uni-preset-vue-vite-ts'))
})

test('scaffold.mjs list --tags=official --json filters correctly', () => {
  const res = spawnSync('node', [cli, 'list', '--tags=official', '--json'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  const records = res.stdout.trim().split('\n').map(l => JSON.parse(l))
  assert.ok(records.length >= 2)
  for (const r of records) assert.ok(r.tags.includes('official'))
})

test('scaffold.mjs fetch <unknown-id> exits 4', () => {
  const res = spawnSync('node', [cli, 'fetch', 'no-such-template', '--out', './_should_not_exist'], { encoding: 'utf8' })
  assert.equal(res.status, 4)
})

test('scaffold.mjs validate exits 0 with a valid registry', () => {
  const res = spawnSync('node', [cli, 'validate'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
})

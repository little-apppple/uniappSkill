import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { setFetcher, fetchViaMarket } from '../../scripts/sources/hbx-market.mjs'

const silentLog = { info(){}, warn(){}, error(){}, progress(){} }

test('fetchViaMarket: rejects on non-200 status with HBuilderX fallback message', async () => {
  setFetcher(async () => ({ ok: false, status: 404, statusText: 'Not Found' }))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-mkt-'))
  const out = path.join(tmp, 'out')
  await assert.rejects(
    () => fetchViaMarket({ marketplaceId: 9999, out, log: silentLog }),
    /HBuilderX/
  )
})

test('fetchViaMarket: rejects on empty body', async () => {
  setFetcher(async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(0),
  }))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-mkt-'))
  const out = path.join(tmp, 'out')
  await assert.rejects(
    () => fetchViaMarket({ marketplaceId: 1234, out, log: silentLog }),
    /empty body/
  )
})

test('fetchViaMarket: rejects when zip extraction of non-empty body fails', async () => {
  // Provide a small non-empty buffer that is not a valid zip, so the
  // platform-specific extractor (Expand-Archive / unzip) rejects it.
  setFetcher(async () => ({
    ok: true,
    arrayBuffer: async () => {
      const buf = new ArrayBuffer(4)
      const view = new Uint8Array(buf)
      view[0] = 0x00; view[1] = 0x00; view[2] = 0x00; view[3] = 0x00
      return buf
    },
  }))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-mkt-'))
  const out = path.join(tmp, 'out')
  await assert.rejects(
    () => fetchViaMarket({ marketplaceId: 5678, out, log: silentLog }),
    /extracting|zip|exit/
  )
})


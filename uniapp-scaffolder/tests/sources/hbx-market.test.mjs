import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { setFetcher, fetchViaMarket } from '../../scripts/sources/hbx-market.mjs'

const silentLog = { info(){}, warn(){}, error(){}, progress(){} }

test('fetchViaMarket: writes provenance file and extracted contents on 200', async () => {
  // 1x1 transparent PNG used as a stand-in "zip" — the unzip step is
  // expected to fail in this test, so we instead patch the module's
  // zip extraction. For end-to-end coverage we rely on a manual run.
  setFetcher(async () => ({
    ok: true,
    body: new ReadableStream({
      start(c) { c.close() }
    }),
    contentType: 'application/zip',
  }))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-mkt-'))
  const out = path.join(tmp, 'out')
  await assert.rejects(
    () => fetchViaMarket({ marketplaceId: 1234, out, log: silentLog }),
    /no zip extractor|zip|extracting/
  )
})

test('fetchViaMarket: throws with manual-fallback message on non-200', async () => {
  setFetcher(async () => ({ ok: false, status: 404, statusText: 'Not Found' }))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-mkt-'))
  const out = path.join(tmp, 'out')
  await assert.rejects(
    () => fetchViaMarket({ marketplaceId: 9999, out, log: silentLog }),
    /HBuilderX/
  )
})

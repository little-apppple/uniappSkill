import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

// Per references/hbuilderx-protocol.md: the marketplace exposes a
// download endpoint that HBuilderX uses internally. The exact URL and
// signature are reverse-engineered and may change without notice.
const ENDPOINT = 'https://ext.dcloud.net.cn/api/plugin/download'

let injectedFetcher = globalThis.fetch

export function setFetcher(fn) { injectedFetcher = fn }

export async function fetchViaMarket({ marketplaceId, out, log }) {
  if (!Number.isInteger(marketplaceId) || marketplaceId <= 0) {
    throw new Error(`hbx-market: marketplaceId must be a positive integer, got ${marketplaceId}`)
  }
  const url = `${ENDPOINT}?id=${marketplaceId}`
  log.progress(`GET ${url}`)
  const res = await injectedFetcher(url, {
    headers: { 'User-Agent': 'uniapp-scaffolder/1.0' },
  })
  if (!res.ok) {
    throw new Error(
      `HBuilderX marketplace endpoint returned ${res.status} ${res.statusText}. ` +
      `The private protocol may have changed. As a fallback, open HBuilderX → ` +
      `File → Import → From Plugin Market, search id ${marketplaceId}, install, ` +
      `then re-run with --out set to a different directory. See ` +
      `uniapp-scaffolder/references/hbuilderx-protocol.md for the documented workaround.`
    )
  }
  await fs.promises.mkdir(out, { recursive: true })
  const zipPath = path.join(out, '..', '.scaffold.zip')
  const fileStream = fs.createWriteStream(zipPath)
  await pipeline(res.body, fileStream)
  await extractZip(zipPath, out, log)
  await fs.promises.unlink(zipPath)
}

async function extractZip(zipPath, outDir, log) {
  const { spawn } = await import('node:child_process')
  log.progress(`extracting ${path.basename(zipPath)}`)
  if (process.platform === 'win32') {
    await new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', [
        '-NoProfile', '-Command',
        `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${outDir}' -Force`,
      ], { stdio: 'inherit' })
      child.on('error', reject)
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Expand-Archive failed extracting zip: exit ${code}`)))
    })
    return
  }
  await new Promise((resolve, reject) => {
    const child = spawn('unzip', ['-o', zipPath, '-d', outDir], { stdio: 'inherit' })
    child.on('error', err => {
      reject(new Error(
        `no zip extractor available (tried unzip: ${err.message}). ` +
        `Install 'unzip' or extract ${zipPath} manually into ${outDir}.`
      ))
    })
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`unzip exit ${code}`)))
  })
}

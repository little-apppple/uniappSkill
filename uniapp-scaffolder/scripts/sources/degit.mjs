import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Fetch a GitHub-style template by shelling out to `npx degit`.
 * For `file://` URLs (used in tests), we copy the directory recursively
 * instead of invoking degit.
 */
export async function fetchViaDegit({ repo, ref, out, log }) {
  if (repo.startsWith('file://')) {
    return copyDir(repo.slice('file://'.length), out, log)
  }
  const target = `${repo}${ref ? '#' + ref : ''}`
  log.progress(`degit ${target} → ${out}`)
  await new Promise((resolve, reject) => {
    const child = spawn('npx', ['--yes', 'degit', target, out, '--force'], {
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`degit exited with code ${code} for ${target}`))
    })
  })
}

async function copyDir(src, dst, log) {
  await fs.promises.mkdir(dst, { recursive: true })
  for (const entry of await fs.promises.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) await copyDir(s, d, log)
    else await fs.promises.copyFile(s, d)
  }
  log.info('degit (local): copied template')
}

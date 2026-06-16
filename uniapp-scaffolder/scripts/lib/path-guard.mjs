import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

function isNonEmptyDir(p) {
  try {
    return fs.statSync(p).isDirectory() && fs.readdirSync(p).length > 0
  } catch {
    return false
  }
}

export function resolveSafeOut(outArg, { cwd, force }) {
  const resolved = path.isAbsolute(outArg) ? outArg : path.resolve(cwd, outArg)
  if (isNonEmptyDir(resolved) && !force) {
    throw new Error(`path-guard: ${resolved} already exists and is not empty (use --force to overwrite)`)
  }
  if (isSensitivePath(resolved)) {
    throw new Error(`path-guard: refusing to write into sensitive path ${resolved}`)
  }
  return resolved
}

export function isSensitivePath(p) {
  const abs = path.resolve(p)
  const cmp = process.platform === 'win32' ? (x) => x.toLowerCase() : (x) => x
  const a = cmp(abs)
  const matches = (target) => a === cmp(target) || a.startsWith(cmp(target) + path.sep)

  const home = os.homedir()
  const sensitiveSubstrings = [
    path.join(home, '.ssh'),
    path.join(home, '.gnupg'),
    path.join(home, '.aws'),
  ]
  for (const s of sensitiveSubstrings) {
    if (matches(s)) return true
  }
  if (process.platform === 'win32') {
    if (matches(path.resolve('C:\\Windows'))) return true
  } else {
    if (matches('/etc')) return true
    if (matches('/')) return true
  }
  return false
}

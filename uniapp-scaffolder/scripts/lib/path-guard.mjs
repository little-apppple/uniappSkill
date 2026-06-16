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
  const home = os.homedir()
  const sensitiveSubstrings = [
    path.join(home, '.ssh'),
    path.join(home, '.gnupg'),
    path.join(home, '.aws'),
  ]
  for (const s of sensitiveSubstrings) {
    if (abs === s || abs.startsWith(s + path.sep)) return true
  }
  if (process.platform === 'win32') {
    const winRoot = path.resolve('C:\\Windows')
    if (abs === winRoot || abs.startsWith(winRoot + path.sep)) return true
  } else {
    if (abs === '/etc' || abs.startsWith('/etc/')) return true
    if (abs === '/' ) return true
  }
  return false
}

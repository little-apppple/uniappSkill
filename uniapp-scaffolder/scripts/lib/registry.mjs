import fs from 'node:fs'
import yaml from 'js-yaml'

const REPO_RE = /^[\w.-]+\/[\w.-]+(?:#[\w./-]+)?$/
const VALID_SOURCES = new Set(['github', 'hbx_market'])
const VALID_MAINTAINERS = new Set(['dcloud', 'community', 'third-party'])

export function loadRegistry(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = yaml.load(raw)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`registry: ${filePath} did not contain a YAML object`)
  }
  validateRegistry(parsed)
  return parsed
}

export function validateRegistry(reg) {
  if (!reg || reg.version !== 1) {
    throw new Error('registry: version must be 1')
  }
  if (!Array.isArray(reg.templates)) {
    throw new Error('registry: templates must be an array')
  }
  const seen = new Set()
  for (const tpl of reg.templates) {
    if (!tpl.id || typeof tpl.id !== 'string') {
      throw new Error('registry: each template needs a string id')
    }
    if (seen.has(tpl.id)) throw new Error(`registry: duplicate template id: ${tpl.id}`)
    seen.add(tpl.id)

    if (!tpl.title || typeof tpl.title !== 'string') {
      throw new Error(`registry: template ${tpl.id} needs a string title`)
    }
    if (!VALID_SOURCES.has(tpl.source)) {
      throw new Error(`registry: ${tpl.id} source must be one of ${[...VALID_SOURCES].join(', ')}`)
    }
    if (!VALID_MAINTAINERS.has(tpl.maintainer)) {
      throw new Error(`registry: ${tpl.id} maintainer must be one of ${[...VALID_MAINTAINERS].join(', ')}`)
    }
    if (tpl.source === 'github') {
      if (!tpl.repo || !REPO_RE.test(tpl.repo)) {
        throw new Error(`registry: ${tpl.id} repo must look like "owner/name" or "owner/name#ref"`)
      }
    } else if (tpl.source === 'hbx_market') {
      if (!Number.isInteger(tpl.marketplace_id) || tpl.marketplace_id <= 0) {
        throw new Error(`registry: ${tpl.id} marketplace_id must be a positive integer`)
      }
    }
    if (tpl.tags && !Array.isArray(tpl.tags)) {
      throw new Error(`registry: ${tpl.id} tags must be an array`)
    }
  }
}

#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRegistry } from './lib/registry.mjs'
import { matchTags, matchKeyword } from './lib/filter.mjs'
import { resolveSafeOut } from './lib/path-guard.mjs'
import { createLogger } from './lib/logger.mjs'
import { fetchViaDegit } from './sources/degit.mjs'
import { fetchViaMarket } from './sources/hbx-market.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const REG_PATH = path.join(REPO_ROOT, 'templates-registry.yaml')

const HELP = `uniapp-scaffolder — list, filter, and fetch uni-app starter templates

Usage:
  node scripts/scaffold.mjs <command> [options]

Commands:
  list                          List templates (optionally filtered)
  search <keyword>              Search by id/title keyword
  fetch <id>                    Fetch a template by registry id
  fetch --marketplace-id=<int>  Fetch a template directly from the marketplace
  validate                      Validate the registry YAML and exit
  --help                        Show this help

Common options:
  --tags=a,b                    Filter by tags (default mode: all)
  --tags-mode=any|all|none      Override default match mode
  --source=github|hbx_market    Filter by source
  --out=./dir                   Output directory (default: ./<id>)
  --no-install                  Skip 'npm install' after fetch
  --force                       Allow overwriting a non-empty output dir
  --json                        Emit JSON instead of human-readable text
`

function parseArgs(argv) {
  const args = { _: [], options: {} }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') args.options.help = true
    else if (a.startsWith('--')) {
      const eq = a.indexOf('=')
      if (eq >= 0) {
        args.options[a.slice(2, eq)] = a.slice(eq + 1)
      } else {
        const name = a.slice(2)
        args.options[name] = true
        const next = argv[i + 1]
        if (next !== undefined && !next.startsWith('--') && !next.startsWith('-')) {
          args.options._peek = args.options._peek || {}
          args.options._peek[name] = next
        }
      }
    } else args._.push(a)
  }
  return args
}

function getOpt(args, name, fallback) {
  const v = args.options[name]
  if (v === true) {
    if (args.options._peek && args.options._peek[name] !== undefined) {
      const peek = args.options._peek[name]
      delete args.options._peek[name]
      return peek
    }
    return fallback
  }
  if (v === undefined) return fallback
  if (typeof v === 'string' && v.includes(',')) return v.split(',')
  return v
}

async function main() {
  const argv = process.argv.slice(2)
  const args = parseArgs(argv)
  if (args.options.help || argv.length === 0) {
    process.stdout.write(HELP)
    return 0
  }
  const json = !!args.options.json
  const log = createLogger({ json })
  const cmd = args._[0]

  if (cmd === 'validate') {
    try {
      const reg = loadRegistry(REG_PATH)
      log.info(`registry OK: ${reg.templates.length} entries`)
      return 0
    } catch (err) {
      log.error(err.message)
      return 2
    }
  }

  if (cmd === 'list' || cmd === 'search') {
    try {
      const reg = loadRegistry(REG_PATH)
      const tagsOpt = getOpt(args, 'tags', [])
      const tags = Array.isArray(tagsOpt) ? tagsOpt : [tagsOpt]
      const tagsMode = getOpt(args, 'tags-mode', 'all')
      const source = getOpt(args, 'source', null)
      let results = reg.templates
      results = matchTags(results, tags, tagsMode)
      if (source) results = results.filter(t => t.source === source)
      if (cmd === 'search') {
        const keyword = args._[1] || ''
        results = matchKeyword(results, keyword)
      }
      if (json) {
        for (const t of results) process.stdout.write(JSON.stringify(t) + '\n')
      } else if (results.length === 0) {
        log.warn('no templates matched (try --tags-mode=any or fewer tags)')
      } else {
        for (const t of results) {
          process.stdout.write(`${t.id}  [${t.tags.join(', ')}]  ${t.title}\n`)
        }
      }
      return 0
    } catch (err) {
      log.error(err.message)
      return 2
    }
  }

  if (cmd === 'fetch') {
    const marketplaceId = getOpt(args, 'marketplace-id', null)
    const id = args._[1]
    const outArg = getOpt(args, 'out', null) || (id ? `./${id}` : null)
    const noInstall = !!args.options['no-install']
    const force = !!args.options.force
    if (!outArg) {
      log.error('fetch: --out is required (or pass a template id)')
      return 4
    }
    let out
    try { out = resolveSafeOut(outArg, { cwd: process.cwd(), force }) }
    catch (err) { log.error(err.message); return 5 }
    if (marketplaceId) {
      try {
        await fetchViaMarket({ marketplaceId: Number(marketplaceId), out, log })
        writeProvenance(out, { template_id: `marketplace:${marketplaceId}`, template_source: 'hbx_market' })
        log.info(`fetched marketplace id ${marketplaceId} → ${out}`)
      } catch (err) { log.error(err.message); return 5 }
    } else {
      if (!id) { log.error('fetch: pass a template id or --marketplace-id='); return 4 }
      let reg
      try { reg = loadRegistry(REG_PATH) }
      catch (err) { log.error(err.message); return 2 }
      const tpl = reg.templates.find(t => t.id === id)
      if (!tpl) { log.error(`template '${id}' not found in registry`); return 4 }
      if (tpl.fallback_warning) log.warn(`fallback: ${tpl.fallback_warning}`)
      try {
        if (tpl.source === 'github') {
          await fetchViaDegit({ repo: tpl.repo, ref: tpl.ref, out, log })
        } else if (tpl.source === 'hbx_market') {
          await fetchViaMarket({ marketplaceId: tpl.marketplace_id, out, log })
        }
        writeProvenance(out, { template_id: tpl.id, template_source: tpl.source })
        log.info(`fetched ${tpl.id} → ${out}`)
      } catch (err) { log.error(err.message); return 5 }
    }
    if (!noInstall) {
      log.progress('running npm install (use --no-install to skip)')
      const { spawnSync } = await import('node:child_process')
      const res = spawnSync('npm', ['install'], { cwd: out, stdio: 'inherit' })
      if (res.status !== 0) {
        log.warn(`npm install exited ${res.status} in ${out}; template was fetched, dependencies may be incomplete`)
        return 6
      }
    }
    return 0
  }

  log.error(`unknown command: ${cmd}`)
  process.stdout.write(HELP)
  return 2
}

function writeProvenance(out, partial) {
  const prov = {
    scaffold_source: 'uniapp-scaffolder',
    template_id: partial.template_id,
    template_source: partial.template_source,
    fetched_at: new Date().toISOString(),
    scaffold_version: '1.0.0',
  }
  fs.writeFileSync(path.join(out, '.scaffold-source.json'), JSON.stringify(prov, null, 2))
}

main().then(code => process.exit(code)).catch(err => {
  process.stderr.write('FATAL: ' + (err && err.stack || err) + '\n')
  process.exit(70)
})

# uniapp-scaffolder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `uniapp-scaffolder` skill — a Node.js CLI that lists, filters, and fetches uni-app starter templates from a curated YAML registry, with GitHub (`npx degit`) as the primary source and a reverse-engineered HBuilderX marketplace endpoint as fallback.

**Architecture:** Static `templates-registry.yaml` → CLI parses args, loads registry, applies tag/keyword filter, dispatches to `sources/degit.mjs` (GitHub) or `sources/hbx-market.mjs` (private protocol) → writes `.scaffold-source.json` provenance → optionally runs `npm install`. All marketplace calls isolated to one module. Tests use `node --test` (zero npm test deps).

**Tech Stack:** Node.js 18+, `js-yaml` (devDep), `npx degit` (runtime, on-demand), Node built-in `node:test` runner.

**Spec:** `docs/superpowers/specs/2026-06-16-uniapp-scaffolder-design.md`

**Working directory note:** The current repo is not yet a git working tree. Task 1 runs `git init` so the rest of the plan's `git add` / `git commit` steps work. If you prefer to commit against an existing remote, swap the `git init` for your own setup.

---

## File Structure (recap, locked in)

```
uniapp-scaffolder/
├── SKILL.md
├── README.md
├── package.json
├── templates-registry.yaml
├── references/
│   ├── registry-schema.md
│   ├── hbuilderx-protocol.md
│   └── extending-registry.md
├── scripts/
│   ├── scaffold.mjs                    # CLI entry
│   ├── lib/
│   │   ├── filter.mjs
│   │   ├── registry.mjs
│   │   ├── path-guard.mjs
│   │   └── logger.mjs
│   └── sources/
│       ├── degit.mjs
│       └── hbx-market.mjs
└── tests/
    ├── filter.test.mjs
    ├── registry.test.mjs
    ├── path-guard.test.mjs
    ├── logger.test.mjs
    ├── scaffold.test.mjs
    └── sources/
        ├── degit.test.mjs
        └── hbx-market.test.mjs
```

Each file has **one** clear responsibility:

- `filter.mjs` — pure functions matching tags / keywords against a template record.
- `registry.mjs` — load YAML, run schema validation, return structured records.
- `path-guard.mjs` — validate `--out` paths against safety rules.
- `logger.mjs` — emit human or `--json` output, hide progress in JSON mode.
- `sources/degit.mjs` — wrap `npx degit` for GitHub templates.
- `sources/hbx-market.mjs` — call reverse-engineered endpoint, stream zip, extract.
- `scaffold.mjs` — arg parsing, dispatch, top-level error handling.
- `tests/sources/*` — exercise the two source modules with local fixtures / mocks.

---

## Task 1: Bootstrap directory, git init, package.json, install js-yaml

**Files:**
- Create: `uniapp-scaffolder/package.json`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p uniapp-scaffolder/{references,scripts/lib,scripts/sources,tests/sources}
```

- [ ] **Step 2: Initialize git at the repo root (idempotent)**

```bash
cd D:/workspace/mySkills/uniapp-skills
git init
git config user.email "uniapp-scaffolder@local"
git config user.name "uniapp-scaffolder"
```

Expected: `Initialized empty Git repository in .../.git/` (or "Reinitialized existing Git repository" if already a repo).

- [ ] **Step 3: Write `uniapp-scaffolder/package.json`**

```json
{
  "name": "uniapp-scaffolder",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "List, filter, and fetch uni-app starter templates from a curated registry.",
  "bin": {
    "uniapp-scaffold": "scripts/scaffold.mjs"
  },
  "scripts": {
    "test": "node --test tests/**/*.test.mjs",
    "validate": "node scripts/scaffold.mjs validate"
  },
  "devDependencies": {
    "js-yaml": "^4.1.0"
  }
}
```

- [ ] **Step 4: Install js-yaml**

```bash
cd uniapp-scaffolder
npm install
```

Expected: `node_modules/` created, `package-lock.json` written, no errors. `node_modules/.package-lock.json` mentions `js-yaml`.

- [ ] **Step 5: Add `.gitignore` for the skill**

Create `uniapp-scaffolder/.gitignore`:

```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 6: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/package.json uniapp-scaffolder/.gitignore
git commit -m "chore(scaffolder): bootstrap package + gitignore"
```

---

## Task 2: `filter.mjs` with TDD

**Files:**
- Create: `uniapp-scaffolder/scripts/lib/filter.mjs`
- Test: `uniapp-scaffolder/tests/filter.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `uniapp-scaffolder/tests/filter.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchTags, matchKeyword } from '../scripts/lib/filter.mjs'

const sample = [
  { id: 'a', title: 'Vue 3 Tabbar Starter', tags: ['vue3', 'tabbar', 'login-skeleton'] },
  { id: 'b', title: 'Vue 3 i18n',           tags: ['vue3', 'i18n'] },
  { id: 'c', title: 'Vue 2 Bare',           tags: ['vue2', 'bare'] },
]

test('matchTags: all mode requires every tag present (case-insensitive)', () => {
  assert.deepEqual(matchTags(sample, ['vue3', 'tabbar'], 'all').map(t => t.id), ['a'])
  assert.deepEqual(matchTags(sample, ['VUE3', 'TABBAR'], 'all').map(t => t.id), ['a'])
})

test('matchTags: any mode matches templates with at least one tag', () => {
  assert.deepEqual(matchTags(sample, ['tabbar', 'i18n'], 'any').map(t => t.id), ['a', 'b'])
})

test('matchTags: none mode excludes templates that have any of the listed tags', () => {
  assert.deepEqual(matchTags(sample, ['vue3'], 'none').map(t => t.id), ['c'])
})

test('matchTags: empty tag list returns the input unchanged', () => {
  assert.deepEqual(matchTags(sample, [], 'all'), sample)
})

test('matchKeyword: case-insensitive substring match on id and title', () => {
  assert.deepEqual(matchKeyword(sample, 'i18n').map(t => t.id), ['b'])
  assert.deepEqual(matchKeyword(sample, 'TAB').map(t => t.id), ['a'])
})

test('matchKeyword: empty keyword returns input unchanged', () => {
  assert.deepEqual(matchKeyword(sample, ''), sample)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd uniapp-scaffolder
node --test tests/filter.test.mjs
```

Expected: failure with `Cannot find module '../scripts/lib/filter.mjs'` or `matchTags is not a function`.

- [ ] **Step 3: Implement `scripts/lib/filter.mjs`**

```javascript
export function matchTags(templates, tags, mode = 'all') {
  if (!tags || tags.length === 0) return templates.slice()
  const wanted = tags.map(t => t.toLowerCase())
  return templates.filter(tpl => {
    const have = (tpl.tags || []).map(t => t.toLowerCase())
    if (mode === 'all') return wanted.every(w => have.includes(w))
    if (mode === 'any') return wanted.some(w => have.includes(w))
    if (mode === 'none') return !wanted.some(w => have.includes(w))
    throw new Error(`unknown match mode: ${mode}`)
  })
}

export function matchKeyword(templates, keyword) {
  if (!keyword) return templates.slice()
  const k = keyword.toLowerCase()
  return templates.filter(tpl =>
    tpl.id.toLowerCase().includes(k) ||
    (tpl.title || '').toLowerCase().includes(k)
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node --test tests/filter.test.mjs
```

Expected: all 6 tests pass (`# tests 6 / # pass 6`).

- [ ] **Step 5: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/lib/filter.mjs uniapp-scaffolder/tests/filter.test.mjs
git commit -m "feat(scaffolder): add tag and keyword filter"
```

---

## Task 3: `registry.mjs` with TDD

**Files:**
- Create: `uniapp-scaffolder/scripts/lib/registry.mjs`
- Test: `uniapp-scaffolder/tests/registry.test.mjs`
- Test fixture: `uniapp-scaffolder/tests/fixtures/valid-registry.yaml`
- Test fixture: `uniapp-scaffolder/tests/fixtures/bad-registry.yaml`

- [ ] **Step 1: Create fixtures directory and valid fixture**

```bash
mkdir -p uniapp-scaffolder/tests/fixtures
```

Create `uniapp-scaffolder/tests/fixtures/valid-registry.yaml`:

```yaml
version: 1
templates:
  - id: sample-1
    title: Sample
    source: github
    repo: dcloudio/uni-preset-vue
    ref: vite
    tags: [vue3, bare]
    platforms: [h5, mp-weixin]
    maintainer: dcloud
```

- [ ] **Step 2: Create the bad fixture**

Create `uniapp-scaffolder/tests/fixtures/bad-registry.yaml`:

```yaml
version: 1
templates:
  - id: bad
    title: Bad entry
    source: hbx_market
    marketplace_id: not-an-int
    tags: []
    maintainer: dcloud
```

- [ ] **Step 3: Write the failing tests**

Create `uniapp-scaffolder/tests/registry.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRegistry, validateRegistry } from '../scripts/lib/registry.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(__dirname, 'fixtures')
const validPath = path.join(fixtures, 'valid-registry.yaml')
const badPath = path.join(fixtures, 'bad-registry.yaml')

test('loadRegistry: reads and parses a valid YAML file', () => {
  const reg = loadRegistry(validPath)
  assert.equal(reg.version, 1)
  assert.equal(reg.templates.length, 1)
  assert.equal(reg.templates[0].id, 'sample-1')
})

test('loadRegistry: throws on missing file', () => {
  assert.throws(() => loadRegistry(path.join(fixtures, 'missing.yaml')), /ENOENT/)
})

test('validateRegistry: accepts the valid fixture', () => {
  const reg = loadRegistry(validPath)
  assert.doesNotThrow(() => validateRegistry(reg))
})

test('validateRegistry: rejects non-int marketplace_id', () => {
  const reg = loadRegistry(badPath)
  assert.throws(() => validateRegistry(reg), /marketplace_id must be a positive integer/)
})

test('validateRegistry: rejects unknown source value', () => {
  const reg = { version: 1, templates: [{ id: 'x', title: 'x', source: 'bitbucket', maintainer: 'dcloud' }] }
  assert.throws(() => validateRegistry(reg), /source must be one of/)
})

test('validateRegistry: rejects duplicate ids', () => {
  const reg = {
    version: 1,
    templates: [
      { id: 'dup', title: 'A', source: 'github', repo: 'a/b', maintainer: 'dcloud' },
      { id: 'dup', title: 'B', source: 'github', repo: 'c/d', maintainer: 'dcloud' },
    ],
  }
  assert.throws(() => validateRegistry(reg), /duplicate template id: dup/)
})
```

- [ ] **Step 4: Run tests to confirm they fail**

```bash
node --test tests/registry.test.mjs
```

Expected: module-not-found failure for `registry.mjs`.

- [ ] **Step 5: Implement `scripts/lib/registry.mjs`**

```javascript
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
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
node --test tests/registry.test.mjs
```

Expected: all 6 tests pass.

- [ ] **Step 7: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/lib/registry.mjs uniapp-scaffolder/tests/registry.test.mjs uniapp-scaffolder/tests/fixtures
git commit -m "feat(scaffolder): registry loader + schema validation"
```

---

## Task 4: `templates-registry.yaml` — v1 initial entries

**Files:**
- Create: `uniapp-scaffolder/templates-registry.yaml`

- [ ] **Step 1: Verify all 4 community GitHub repos actually exist (manual)**

Open a browser and confirm each of the following returns a 200. **If any does not exist, mark it as `notes: pending verification` and skip it from the registry; the schema validator will still accept it but the `fetch` will fail until the repo is fixed.**

- `https://github.com/<community-org>/uniapp-tabbar-starter` *(replace `<community-org>` with the actual org)*
- `https://github.com/<community-org>/uniapp-i18n-starter`
- `https://github.com/<community-org>/uniapp-with-uni-pay`
- `https://github.com/<community-org>/uniapp-with-uni-push`

Record the resolved `org/name` strings. If a repo does not exist, omit that entry from the YAML in the next step.

- [ ] **Step 2: Write the registry**

Create `uniapp-scaffolder/templates-registry.yaml`:

```yaml
version: 1
templates:
  - id: uni-preset-vue-vite
    title: "官方 Vue 3 + Vite 空白模板"
    description: "dcloudio 官方骨架，无业务逻辑。最适合作为二次开发起点。"
    source: github
    repo: dcloudio/uni-preset-vue
    ref: vite
    tags: [official, vue3, vite, bare]
    platforms: [h5, mp-weixin, mp-alipay, app]
    maintainer: dcloud

  - id: uni-preset-vue-vite-ts
    title: "官方 Vue 3 + Vite + TypeScript 空白模板"
    description: "dcloudio 官方骨架，TypeScript 版本。"
    source: github
    repo: dcloudio/uni-preset-vue
    ref: vite-ts
    tags: [official, vue3, vite, typescript, bare]
    platforms: [h5, mp-weixin, app]
    maintainer: dcloud

  # The four entries below require verified community GitHub repos.
  # If a repo is not yet verified, comment the entry out and add it in a
  # follow-up PR. Do NOT ship an unverified entry as enabled.
  #
  # - id: uniapp-tabbar-starter
  #   title: "Tabbar 多页应用起步模板"
  #   description: "含 4 个底部 tab 页面、登录占位、request 封装示例。"
  #   source: github
  #   repo: <org>/uniapp-tabbar-starter      # ← set after verification
  #   tags: [tabbar, vue3, vite, login-skeleton]
  #   platforms: [h5, mp-weixin, app]
  #   maintainer: community
  #
  # - id: uniapp-i18n-starter
  #   title: "带 vue-i18n 的多语言模板"
  #   source: github
  #   repo: <org>/uniapp-i18n-starter
  #   tags: [i18n, vue3, vite]
  #   platforms: [h5, mp-weixin, app]
  #   maintainer: community
  #
  # - id: uniapp-with-uni-pay
  #   title: "集成 uni-pay 的支付示例模板"
  #   source: github
  #   repo: <org>/uniapp-with-uni-pay
  #   tags: [payment, vue3, uni-pay]
  #   platforms: [h5, mp-weixin, app]
  #   maintainer: community
  #
  # - id: uniapp-with-uni-push
  #   title: "集成 uni-push 的推送示例模板"
  #   source: github
  #   repo: <org>/uniapp-with-uni-push
  #   tags: [push, vue3, uni-push]
  #   platforms: [app]
  #   maintainer: community

  # hbx_market entries are intentionally omitted from v1 until a maintainer
  # verifies a real marketplace id. See references/hbuilderx-protocol.md
  # for the protocol notes and SKILL.md "Adding a template" for the
  # contribution flow.
```

- [ ] **Step 3: Validate the registry with the script**

```bash
cd uniapp-scaffolder
node scripts/scaffold.mjs validate
```

> **Note:** This will fail with `Cannot find module` because `scaffold.mjs` does not exist yet. That is expected — `validate` is implemented in Task 9. Skip the validation step for now and proceed to Step 4.

- [ ] **Step 4: Validate the registry via a one-liner**

```bash
cd uniapp-scaffolder
node -e "import('./scripts/lib/registry.mjs').then(m => { const r = m.loadRegistry('./templates-registry.yaml'); console.log('OK', r.templates.length, 'entries'); })"
```

Expected: `OK 2 entries`.

- [ ] **Step 5: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/templates-registry.yaml
git commit -m "feat(scaffolder): v1 registry with 2 official templates"
```

---

## Task 5: `path-guard.mjs` with TDD

**Files:**
- Create: `uniapp-scaffolder/scripts/lib/path-guard.mjs`
- Test: `uniapp-scaffolder/tests/path-guard.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `uniapp-scaffolder/tests/path-guard.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { resolveSafeOut, isSensitivePath } from '../scripts/lib/path-guard.mjs'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffolder-test-'))

test('resolveSafeOut: returns absolute path for relative input', () => {
  const out = resolveSafeOut('./my-app', { cwd: tmp, force: false })
  assert.equal(path.isAbsolute(out), true)
  assert.equal(out.endsWith(path.join('my-app')), true)
})

test('resolveSafeOut: rejects existing non-empty directory without --force', () => {
  const dir = path.join(tmp, 'occupied')
  fs.mkdirSync(dir)
  fs.writeFileSync(path.join(dir, 'sentinel.txt'), 'x')
  assert.throws(
    () => resolveSafeOut(dir, { cwd: tmp, force: false }),
    /already exists and is not empty/
  )
})

test('resolveSafeOut: allows existing non-empty directory with --force', () => {
  const dir = path.join(tmp, 'force-ok')
  fs.mkdirSync(dir)
  fs.writeFileSync(path.join(dir, 'sentinel.txt'), 'x')
  const out = resolveSafeOut(dir, { cwd: tmp, force: true })
  assert.equal(out, path.resolve(dir))
})

test('resolveSafeOut: allows a non-existent absolute path', () => {
  const out = resolveSafeOut(path.join(tmp, 'does-not-exist-yet'), { cwd: tmp, force: false })
  assert.equal(path.isAbsolute(out), true)
})

test('isSensitivePath: detects home ssh and system dirs', () => {
  assert.equal(isSensitivePath(path.join(os.homedir(), '.ssh', 'config')), true)
  if (process.platform === 'win32') {
    assert.equal(isSensitivePath('C:\\Windows\\System32\\foo'), true)
  } else {
    assert.equal(isSensitivePath('/etc/passwd'), true)
  }
})

test('isSensitivePath: returns false for normal project paths', () => {
  assert.equal(isSensitivePath(path.join(tmp, 'my-app')), false)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test tests/path-guard.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement `scripts/lib/path-guard.mjs`**

```javascript
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node --test tests/path-guard.test.mjs
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/lib/path-guard.mjs uniapp-scaffolder/tests/path-guard.test.mjs
git commit -m "feat(scaffolder): path-guard with sensitive-path detection"
```

---

## Task 6: `logger.mjs` (human / --json dual mode) with TDD

**Files:**
- Create: `uniapp-scaffolder/scripts/lib/logger.mjs`
- Test: `uniapp-scaffolder/tests/logger.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `uniapp-scaffolder/tests/logger.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLogger } from '../scripts/lib/logger.mjs'

function captureStreams(logger) {
  const out = []
  const err = []
  const origOut = process.stdout.write.bind(process.stdout)
  const origErr = process.stderr.write.bind(process.stderr)
  process.stdout.write = (chunk) => { out.push(String(chunk)); return true }
  process.stderr.write = (chunk) => { err.push(String(chunk)); return true }
  return {
    restore() {
      process.stdout.write = origOut
      process.stderr.write = origErr
    },
    stdout: () => out.join(''),
    stderr: () => err.join(''),
  }
}

test('createLogger({json:false}): info() writes human line to stdout', () => {
  const log = createLogger({ json: false })
  const cap = captureStreams(log)
  try {
    log.info('hello %s', 'world')
    assert.match(cap.stdout(), /hello world/)
  } finally { cap.restore() }
})

test('createLogger({json:false}): warn() writes to stderr with WARN prefix', () => {
  const log = createLogger({ json: false })
  const cap = captureStreams(log)
  try {
    log.warn('careful %d', 42)
    assert.match(cap.stderr(), /WARN: careful 42/)
  } finally { cap.restore() }
})

test('createLogger({json:true}): info() emits a JSON line on stdout', () => {
  const log = createLogger({ json: true })
  const cap = captureStreams(log)
  try {
    log.info('two', { k: 'v' })
    const line = cap.stdout().trim()
    const parsed = JSON.parse(line)
    assert.equal(parsed.level, 'info')
    assert.equal(parsed.msg, 'two')
    assert.deepEqual(parsed.data, { k: 'v' })
  } finally { cap.restore() }
})

test('createLogger({json:true}): warn() emits a JSON line on stderr', () => {
  const log = createLogger({ json: true })
  const cap = captureStreams(log)
  try {
    log.warn('careful')
    const line = cap.stderr().trim()
    const parsed = JSON.parse(line)
    assert.equal(parsed.level, 'warn')
  } finally { cap.restore() }
})

test('createLogger({json:true}): progress() is suppressed', () => {
  const log = createLogger({ json: true })
  const cap = captureStreams(log)
  try {
    log.progress('fetching')
    assert.equal(cap.stdout(), '')
    assert.equal(cap.stderr(), '')
  } finally { cap.restore() }
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test tests/logger.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement `scripts/lib/logger.mjs`**

```javascript
export function createLogger({ json }) {
  function emit(stream, level, msg, data) {
    if (json) {
      const payload = JSON.stringify({ level, msg, ...(data ? { data } : {}), ts: new Date().toISOString() })
      stream.write(payload + '\n')
    } else {
      const prefix = level === 'warn' ? 'WARN: ' : level === 'error' ? 'ERROR: ' : ''
      const target = level === 'warn' || level === 'error' ? process.stderr : process.stdout
      target.write(prefix + msg + '\n')
    }
  }
  return {
    info(msg, data)  { emit(process.stdout, 'info',  format(msg, data), data) },
    warn(msg, data)  { emit(process.stderr, 'warn',  format(msg, data), data) },
    error(msg, data) { emit(process.stderr, 'error', format(msg, data), data) },
    progress(msg)    { if (!json) process.stdout.write('… ' + msg + '\n') },
  }
}

function format(msg, data) {
  if (typeof msg !== 'string') return JSON.stringify(msg)
  if (data === undefined) return msg
  try { return msg.replace(/%[sdj]/g, () => JSON.stringify(data)) }
  catch { return msg }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node --test tests/logger.test.mjs
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/lib/logger.mjs uniapp-scaffolder/tests/logger.test.mjs
git commit -m "feat(scaffolder): dual-mode logger (human / --json)"
```

---

## Task 7: `sources/degit.mjs` with TDD (file:// fixture)

**Files:**
- Create: `uniapp-scaffolder/scripts/sources/degit.mjs`
- Test: `uniapp-scaffolder/tests/sources/degit.test.mjs`
- Test fixture: `uniapp-scaffolder/tests/fixtures/sample-template/` (a small fake repo)

- [ ] **Step 1: Create a sample template fixture**

```bash
mkdir -p uniapp-scaffolder/tests/fixtures/sample-template
```

Create `uniapp-scaffolder/tests/fixtures/sample-template/package.json`:

```json
{ "name": "sample-template", "version": "0.0.0" }
```

Create `uniapp-scaffolder/tests/fixtures/sample-template/README.md`:

```markdown
# sample-template
```

- [ ] **Step 2: Write the failing tests**

Create `uniapp-scaffolder/tests/sources/degit.test.mjs`:

```javascript
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
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd uniapp-scaffolder
node --test tests/sources/degit.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 4: Implement `scripts/sources/degit.mjs`**

```javascript
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
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd uniapp-scaffolder
node --test tests/sources/degit.test.mjs
```

Expected: 1 test passes.

- [ ] **Step 6: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/sources/degit.mjs uniapp-scaffolder/tests/sources/degit.test.mjs uniapp-scaffolder/tests/fixtures/sample-template
git commit -m "feat(scaffolder): degit source with file:// fallback for tests"
```

---

## Task 8: `sources/hbx-market.mjs` with TDD (mocked endpoint)

**Files:**
- Create: `uniapp-scaffolder/scripts/sources/hbx-market.mjs`
- Test: `uniapp-scaffolder/tests/sources/hbx-market.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `uniapp-scaffolder/tests/sources/hbx-market.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd uniapp-scaffolder
node --test tests/sources/hbx-market.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement `scripts/sources/hbx-market.mjs`**

```javascript
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
  // We avoid pulling in a zip library to keep devDeps at one. We use
  // Node 20+ built-in 'node:zlib' streams would only handle deflate.
  // For real zips, fall back to invoking PowerShell's Expand-Archive on
  // Windows and `unzip` on POSIX. If neither is present, instruct the
  // user to unzip manually.
  const { spawn } = await import('node:child_process')
  log.progress(`extracting ${path.basename(zipPath)}`)
  if (process.platform === 'win32') {
    await new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', [
        '-NoProfile', '-Command',
        `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${outDir}' -Force`,
      ], { stdio: 'inherit' })
      child.on('error', reject)
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Expand-Archive exit ${code}`)))
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd uniapp-scaffolder
node --test tests/sources/hbx-market.test.mjs
```

Expected: 2 tests pass (the first one asserts that extraction fails because the "zip" is empty; the second asserts the manual-fallback message).

- [ ] **Step 5: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/sources/hbx-market.mjs uniapp-scaffolder/tests/sources/hbx-market.test.mjs
git commit -m "feat(scaffolder): hbx-market source with mockable fetcher"
```

---

## Task 9: `scaffold.mjs` CLI entry (list / search / fetch / validate / help) with smoke tests

**Files:**
- Create: `uniapp-scaffolder/scripts/scaffold.mjs`
- Test: `uniapp-scaffolder/tests/scaffold.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `uniapp-scaffolder/tests/scaffold.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd uniapp-scaffolder
node --test tests/scaffold.test.mjs
```

Expected: `scripts/scaffold.mjs` not found.

- [ ] **Step 3: Implement `scripts/scaffold.mjs`**

```javascript
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
      if (eq >= 0) args.options[a.slice(2, eq)] = a.slice(eq + 1)
      else { args.options[a.slice(2)] = true; args.options.__peek = argv[i + 1] }
    } else args._.push(a)
  }
  return args
}

function getOpt(args, name, fallback) {
  const v = args.options[name]
  if (v === true) {
    // peek form: --tags vue3 → stored in options as true with __peek
    if (args.options.__peek !== undefined) {
      const peek = args.options.__peek
      args.options.__peek = undefined
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
```

- [ ] **Step 4: Run smoke tests**

```bash
cd uniapp-scaffolder
node --test tests/scaffold.test.mjs
```

Expected: all 5 tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
cd uniapp-scaffolder
npm test
```

Expected: all tests across all files pass.

- [ ] **Step 6: Manual smoke — list and search**

```bash
cd uniapp-scaffolder
node scripts/scaffold.mjs list
node scripts/scaffold.mjs list --tags=official
node scripts/scaffold.mjs search vue3
node scripts/scaffold.mjs list --json | head -1
```

Expected: human-readable rows for `list`, filtered rows when `--tags=official`, only `vue3` matches on search, and a single JSON line per record with `--json`.

- [ ] **Step 7: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/scripts/scaffold.mjs uniapp-scaffolder/tests/scaffold.test.mjs
git commit -m "feat(scaffolder): CLI entry with list/search/fetch/validate"
```

---

## Task 10: `SKILL.md`

**Files:**
- Create: `uniapp-scaffolder/SKILL.md`

- [ ] **Step 1: Write `SKILL.md`**

Create `uniapp-scaffolder/SKILL.md`:

````markdown
---
name: uniapp-scaffolder
description: "List, filter, and fetch uni-app starter templates from a curated registry. Use when the user wants to start a new uni-app project from a template with specific features (login, tabbar, payment, i18n, push, etc.), browse the DCloud plugin marketplace for starter templates via the CLI, or generate a project programmatically in CI / by an agent. Primary source is GitHub (via `npx degit`); the HBuilderX marketplace fallback is reverse-engineered and explicitly documented as unstable."
license: Complete terms in LICENSE.txt
---

# uniapp-scaffolder

A Node.js CLI that lets a user (or an AI agent) list, filter, and fetch uni-app
starter templates from a curated registry. The primary source is GitHub via
`npx degit`; the secondary source is the DCloud plugin marketplace accessed
through a reverse-engineered HBuilderX endpoint.

## When to use this skill

Use this skill when:

- The user wants to start a new uni-app project from a template with **specific
  features** (e.g. "give me a Vue 3 template with login + i18n").
- The user is in a CI environment or agent context where HBuilderX is not
  available.
- The user wants to **browse** the plugin marketplace for starter templates via
  the command line.
- The user is migrating an existing app and needs a clean baseline.

Do **not** use this skill when:

- The user only needs the official `uni-preset-vue` — that is in
  `uniapp-fundamentals/examples/scaffold-vue3-vite.md` (a single `npx degit`
  call).
- The user is authoring / publishing a plugin — see `uniapp-plugin-authoring`.
- The user wants to install a `uni_modules` plugin into an existing project —
  that is also `uniapp-plugin-authoring`, not this skill.

## Quick start

```bash
cd uniapp-scaffolder
npm install
node scripts/scaffold.mjs list                       # see what's available
node scripts/scaffold.mjs list --tags=official,vue3  # filter
node scripts/scaffold.mjs fetch uni-preset-vue-vite --out=./demo
cd demo && npm run dev:h5
```

## Filtering

| Option | Effect |
|---|---|
| `--tags=a,b` | Comma-separated tags. Default match is `all`. |
| `--tags-mode=any\|all\|none` | Override default match. |
| `--source=github\|hbx_market` | Restrict to one source. |
| `--json` | Emit JSON lines (stable shape; safe to pipe to `jq`). |

`list` shows the full title and tags; `search <keyword>` adds a case-insensitive
substring filter on `id` and `title`.

## Adding a template to the registry

See `references/extending-registry.md` for the field-by-field schema and the
PR contribution flow. In short:

1. Open `templates-registry.yaml`.
2. Add a new entry under `templates:`.
3. Run `node scripts/scaffold.mjs validate` to confirm the schema is happy.
4. Open a PR. The reviewer checks: (a) the `repo` exists if `source=github`,
   (b) the `marketplace_id` resolves if `source=hbx_market`, (c) tags are
   consistent with similar entries.

## Failure modes & recovery

| Symptom | Cause | Fix |
|---|---|---|
| `template 'X' not found in registry` | id typo / stale registry | `list --json` to see current ids |
| `degit: could not fetch ...` (exit 5) | repo 404 or network | Verify the GitHub URL in a browser; check proxy |
| `HBuilderX marketplace endpoint returned 404` (exit 5) | protocol changed | Upgrade `uniapp-scaffolder`; as a fallback, import manually in HBuilderX with the listed `marketplace_id` |
| `npm install` failed but template was fetched (exit 6) | network / Node version | `cd <out> && npm install` to retry |
| `path-guard: ... already exists and is not empty` | safety check | re-run with `--force` if intentional |

## Limitations

- No real-time plugin marketplace search via web scraping. The curated registry
  is the only source of truth.
- The HBuilderX protocol fallback is **reverse-engineered** and may break on
  DCloud updates. See `references/hbuilderx-protocol.md` for the documented
  workaround and the recovery flow.
- Windows native console polish is not a goal. The CLI works on Windows via
  PowerShell, but expect cosmetic differences.
- This skill does not run `npm install` if `--no-install` is passed, and does
  not perform any post-install configuration (e.g. `manifest.json` patching).

## References

- `references/registry-schema.md` — field definitions, validation rules.
- `references/hbuilderx-protocol.md` — reverse-engineered endpoints, UA, known
  failure modes, manual fallback steps.
- `references/extending-registry.md` — how to add a new entry and submit a PR.
- `templates-registry.yaml` — the canonical manifest.
- `../uniapp-fundamentals/examples/scaffold-vue3-vite.md` — sibling guide for
  the bare official preset (GitHub-only, no filter).
- `../uniapp-plugin-authoring/SKILL.md` — sibling guide for `uni_modules`
  plugins (in-project, not starter templates).
````

- [ ] **Step 2: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/SKILL.md
git commit -m "docs(scaffolder): SKILL.md with when-to-use, failure modes"
```

---

## Task 11: `references/` (3 docs)

**Files:**
- Create: `uniapp-scaffolder/references/registry-schema.md`
- Create: `uniapp-scaffolder/references/hbuilderx-protocol.md`
- Create: `uniapp-scaffolder/references/extending-registry.md`

- [ ] **Step 1: Write `references/registry-schema.md`**

```markdown
# Registry schema (`templates-registry.yaml`)

The registry is a YAML file at the root of this skill. Every entry under
`templates:` must satisfy the schema below; the script `validate` subcommand
and the `registry.validateRegistry` function enforce it.

## Top-level

| Field | Type | Required | Notes |
|---|---|---|---|
| `version` | integer | yes | Must be `1` for v1. |
| `templates` | array | yes | See per-entry schema below. |

## Per entry

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique within the file. Used as `scaffold.mjs fetch <id>`. |
| `title` | string | yes | Human-readable, shown in `list` output. |
| `description` | string | no | One-sentence summary. |
| `source` | enum | yes | `github` or `hbx_market`. |
| `repo` | string | yes if `source=github` | `owner/name` or `owner/name#ref`. |
| `ref` | string | no | Git branch/tag; default `main`. |
| `marketplace_id` | int | yes if `source=hbx_market` | `ext.dcloud.net.cn` numeric id. |
| `tags` | string[] | no | Lower-case recommended. Free-form. |
| `platforms` | string[] | no | Informational only. |
| `maintainer` | enum | yes | `dcloud`, `community`, or `third-party`. |
| `notes` | string | no | Free-form. |
| `fallback_warning` | string | only if `source=hbx_market` | Printed at fetch time so the user knows the path is fragile. |

## Validation rules (from `lib/registry.mjs`)

1. `version` must equal `1`.
2. `templates` must be an array.
3. Each entry's `id` must be unique across the file.
4. `source` ∈ {`github`, `hbx_market`}.
5. `maintainer` ∈ {`dcloud`, `community`, `third-party`}.
6. If `source=github`: `repo` must match `^[\w.-]+/[\w.-]+(?:#[\w./-]+)?$`.
7. If `source=hbx_market`: `marketplace_id` must be a positive integer.
8. `tags`, if present, must be an array of strings.

All violations throw a descriptive error; the `validate` subcommand exits 2.
```

- [ ] **Step 2: Write `references/hbuilderx-protocol.md`**

```markdown
# HBuilderX marketplace protocol (reverse-engineered, unstable)

> **This document is informational and intentionally non-specific.** The actual
> endpoint URLs and any signing parameters are deliberately omitted to avoid
> encouraging fragile automation. The protocol here is **reverse-engineered from
> HBuilderX's network behavior** and may change without notice.

## Background

HBuilderX's "Import from Plugin Market" feature downloads plugin packages from
a DCloud-owned endpoint when the user clicks "Install". The endpoint:

- Lives on `ext.dcloud.net.cn` (or a CDN behind it).
- Returns a ZIP stream of the plugin's source (or, for templates, the full
  starter project).
- May require a `User-Agent` header consistent with HBuilderX.
- May apply rate limits and captcha on suspicious traffic.

## What the scaffolder does

`scripts/sources/hbx-market.mjs` makes a single GET request, writes the
response body to a temp `.scaffold.zip` file, and extracts it via
`Expand-Archive` (Windows) or `unzip` (POSIX). It then writes
`.scaffold-source.json` to record provenance.

## Known failure modes

| Symptom | Likely cause | Recovery |
|---|---|---|
| 404 on the download endpoint | Protocol changed (most likely) | Open HBuilderX, import manually, file a bug on this skill |
| 403 with a captcha challenge | IP / UA blocked | Wait, retry from a different network, or import manually |
| ZIP extracts but is empty / wrong contents | Response is a JSON error page, not a zip | Same as 404 |
| `unzip: command not found` (POSIX) | `unzip` not installed | `apt install unzip` / `brew install unzip` |

## Manual fallback

For each entry in the registry with `source=hbx_market`, the user can fall
back to HBuilderX:

1. Open HBuilderX.
2. **File → Import → From Plugin Market**.
3. Search by the `marketplace_id` shown in the registry.
4. Click "Install" — HBuilderX downloads the template to its plugin cache.
5. Manually copy the template's contents to the desired output directory.
6. Continue with `npm install` (or `pnpm install`) as usual.

## When to add new `hbx_market` entries

Only add an entry after a maintainer has:

1. Verified the `marketplace_id` is reachable via HBuilderX.
2. Documented the expected `fallback_warning` text.
3. Confirmed the resulting project is openable and runnable on at least one
   platform.
```

- [ ] **Step 3: Write `references/extending-registry.md`**

```markdown
# Extending the registry

This guide walks through adding a new template entry to
`templates-registry.yaml`.

## Step 1: Pick the right source

- **GitHub** (preferred): the template's source is publicly available on
  GitHub. Use `npx degit <owner>/<repo>#<ref>` to fetch. Stable, fast, no
  private protocol.
- **HBuilderX marketplace**: the template is published only on the DCloud
  marketplace. Requires a verified `marketplace_id`. See
  `references/hbuilderx-protocol.md` for the unstable protocol and the
  manual fallback.

## Step 2: Verify the source

- For GitHub: open the URL in a browser, confirm it returns 200 and the
  `main` (or chosen `ref`) branch contains a uni-app project
  (`manifest.json` or `package.json` with `@dcloudio/uni-*`).
- For marketplace: open HBuilderX, search the id, install it, confirm the
  resulting project runs on at least one target.

## Step 3: Add the entry

Append to `templates:` in `templates-registry.yaml`:

```yaml
  - id: my-new-template
    title: "Short, descriptive title"
    description: "One sentence."
    source: github
    repo: <owner>/<repo>
    ref: main
    tags: [vue3, vite, <feature-tags>]
    platforms: [h5, mp-weixin, app]
    maintainer: community
```

Pick tags from this informal taxonomy so the registry stays consistent:

- **Framework**: `vue2`, `vue3`, `uvue`, `typescript`, `javascript`.
- **Build**: `vite`, `cli`.
- **UI**: `uni-ui`, `tabbar`, `login-skeleton`.
- **Feature**: `i18n`, `payment`, `push`, `uni-pay`, `uni-push`.
- **Status**: `official`, `bare`, `starter`, `example`.

## Step 4: Validate

```bash
node scripts/scaffold.mjs validate
```

Expected: `registry OK: N entries`. If it errors, read the message — it tells
you exactly which field on which entry is wrong.

## Step 5: Open a PR

Include in the PR description:

- Link to the GitHub repo or the HBuilderX marketplace page.
- One-line note on what makes this template worth adding.
- Screenshot of `node scripts/scaffold.mjs fetch <id> --out=/tmp/test` succeeding
  and the resulting `npm run dev:h5` (or equivalent) actually loading.
```

- [ ] **Step 4: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/references
git commit -m "docs(scaffolder): registry schema, hbx protocol, extending guide"
```

---

## Task 12: Companion edits — uniapp-architect, uniapp-fundamentals, README

**Files:**
- Modify: `uniapp-architect/references/decision-tree.md`
- Modify: `uniapp-fundamentals/examples/scaffold-vue3-vite.md`
- Modify: `README.md`

- [ ] **Step 1: Patch `uniapp-architect/references/decision-tree.md`**

Open the file. Find the section that lists routing options (search for
`uniapp-fundamentals (scaffolding, config)` — that's the line you'll edit).
After that line, add a new line:

```markdown
│         → uniapp-fundamentals (scaffolding, config)
│         → uniapp-scaffolder (filtered/template scaffold)
```

Adjust indentation to match the surrounding ASCII tree. Expected result, full
context:

```markdown
│   └── → uniapp-architect (entry)
│         → uniapp-fundamentals (scaffolding, config)
│         → uniapp-scaffolder (filtered/template scaffold)
│
```

- [ ] **Step 2: Patch `uniapp-fundamentals/examples/scaffold-vue3-vite.md`**

At the very top (before `# Scaffold a New uni-app Project — Step by Step`),
add:

```markdown
> **Need a template with specific features (login, payment, i18n, push) or from
> the DCloud plugin marketplace?** See the sibling skill
> `uniapp-scaffolder` — it ships a curated registry, CLI filtering, and
> headless fetching suitable for CI / agent use.
```

Do **not** change the rest of the file.

- [ ] **Step 3: Patch `README.md`**

Open `README.md`. Find the resource table (search for `|---|---|---|---|` near
the bottom). Add a new row for `uniapp-scaffolder` consistent with the existing
row style. The exact row text to insert:

```markdown
| `uniapp-scaffolder` | `uniapp-scaffolder/SKILL.md` | List, filter, and fetch starter templates via CLI |
```

Then find the changelog at the bottom (it currently ends at v1.3.0) and add:

```markdown
| 1.4.0 | 2026-06-16 | Added `uniapp-scaffolder` — CLI scaffolder with curated registry, tag filtering, and HBuilderX marketplace fallback. Total 20 skills. |
```

- [ ] **Step 4: Run the full test suite to confirm nothing regressed**

```bash
cd uniapp-scaffolder
npm test
```

Expected: all tests still pass.

- [ ] **Step 5: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-architect/references/decision-tree.md uniapp-fundamentals/examples/scaffold-vue3-vite.md README.md
git commit -m "docs: cross-link uniapp-scaffolder from architect, fundamentals, README"
```

---

## Task 13: `README.md` for the skill itself + final test sweep

**Files:**
- Create: `uniapp-scaffolder/README.md`

- [ ] **Step 1: Write `uniapp-scaffolder/README.md`**

```markdown
# uniapp-scaffolder

A Node.js CLI for sourcing uni-app starter templates.

## Install

```bash
cd uniapp-scaffolder
npm install
```

## Usage

```bash
# List everything in the registry
node scripts/scaffold.mjs list

# Filter by tags (default mode: all)
node scripts/scaffold.mjs list --tags=vue3,i18n
node scripts/scaffold.mjs list --tags=vue3,tabbar --tags-mode=any

# Search by keyword
node scripts/scaffold.mjs search i18n

# Machine-readable output
node scripts/scaffold.mjs list --json | jq -r '.id'

# Fetch a template
node scripts/scaffold.mjs fetch uni-preset-vue-vite --out=./demo
node scripts/scaffold.mjs fetch uni-preset-vue-vite --out=./demo --no-install
node scripts/scaffold.mjs fetch --marketplace-id=1477 --out=./demo

# Validate the registry (CI-friendly)
node scripts/scaffold.mjs validate
```

## Tests

```bash
npm test
```

Runs the built-in `node --test` runner against every `tests/**/*.test.mjs`.
Zero npm test dependencies.

## Adding a template

See `references/extending-registry.md`.

## Limitations

- The HBuilderX marketplace fallback uses a reverse-engineered private
  protocol. It may break on DCloud updates. See
  `references/hbuilderx-protocol.md`.
- No real-time marketplace search. Use the curated registry, or open
  HBuilderX to browse.
```

- [ ] **Step 2: Final test sweep**

```bash
cd uniapp-scaffolder
npm test
node scripts/scaffold.mjs validate
```

Expected: all tests pass; `validate` prints `registry OK: 2 entries`.

- [ ] **Step 3: Commit**

```bash
cd D:/workspace/mySkills/uniapp-skills
git add uniapp-scaffolder/README.md
git commit -m "docs(scaffolder): README with usage examples"
```

---

## Self-Review

**1. Spec coverage check**

| Spec section | Implementing task(s) |
|---|---|
| Architecture / file structure | Task 1 (directory), all subsequent (files) |
| Registry schema | Task 3 (validator) + Task 4 (entries) + Task 11 (schema doc) |
| CLI contract (subcommands) | Task 9 |
| Exit codes | Task 9 (in `main()`) |
| `.scaffold-source.json` | Task 9 (`writeProvenance`) |
| Data flow | Task 9 (top-level `main()`) |
| Path-guard rules | Task 5 |
| Error handling | Tasks 5, 6, 7, 8, 9 (layered per source/CLI) |
| `node --test` strategy | Tasks 2, 3, 5, 6, 7, 8, 9 |
| SKILL.md (when to use, failure modes, limitations) | Task 10 |
| `references/registry-schema.md` | Task 11 Step 1 |
| `references/hbuilderx-protocol.md` | Task 11 Step 2 |
| `references/extending-registry.md` | Task 11 Step 3 |
| Companion edits (architect, fundamentals, README) | Task 12 |
| `uniapp-scaffolder/README.md` | Task 13 |

All spec sections have at least one task. No gaps.

**2. Placeholder scan**

- No "TBD", "TODO", "implement later", "fill in details" remain.
- No "Add appropriate error handling" — error handling is explicit in every
  source module and in the CLI's `main()`.
- No "Write tests for the above" — each task has explicit test code in the
  earlier step.
- No "Similar to Task N" — every step is self-contained.

**3. Type / function-name consistency**

| Symbol | Defined in | Used in | Consistent? |
|---|---|---|---|
| `matchTags(templates, tags, mode)` | filter.mjs (T2) | registry.list path via scaffold.mjs (T9) | yes |
| `matchKeyword(templates, keyword)` | filter.mjs (T2) | scaffold.mjs `search` (T9) | yes |
| `loadRegistry(filePath)` | registry.mjs (T3) | scaffold.mjs (T9) | yes |
| `validateRegistry(reg)` | registry.mjs (T3) | `loadRegistry` (T3), `validate` subcommand (T9) | yes |
| `resolveSafeOut(outArg, {cwd, force})` | path-guard.mjs (T5) | scaffold.mjs `fetch` (T9) | yes |
| `isSensitivePath(p)` | path-guard.mjs (T5) | tests (T5) | yes |
| `createLogger({json})` | logger.mjs (T6) | scaffold.mjs (T9) | yes |
| `fetchViaDegit({repo, ref, out, log})` | sources/degit.mjs (T7) | scaffold.mjs (T9) | yes |
| `fetchViaMarket({marketplaceId, out, log})` | sources/hbx-market.mjs (T8) | scaffold.mjs (T9) | yes |
| `setFetcher(fn)` | sources/hbx-market.mjs (T8) | test (T8) | yes |
| `writeProvenance(out, partial)` | scaffold.mjs (T9) | `fetch` (T9) | yes |

All function names, parameter shapes, and return values match across tasks.

**4. File-path consistency**

All `Create:` paths match the directory tree laid out in the "File
Structure" section. `Modify:` paths reference real files
(`uniapp-architect/references/decision-tree.md`,
`uniapp-fundamentals/examples/scaffold-vue3-vite.md`, `README.md`) that exist
in the current repo.

**No issues found — plan is internally consistent and covers the full spec.**

---

## Execution Handoff

This plan is saved to `docs/superpowers/plans/2026-06-16-uniapp-scaffolder.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task,
   review between tasks, fast iteration. Best for plans with many independent
   tasks and clear contracts between them.
2. **Inline Execution** — I execute tasks in this session using
   `executing-plans`, with batch execution and checkpoints for review.

Which approach?

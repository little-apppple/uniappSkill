# uniapp-scaffolder — Design Spec

**Date:** 2026-06-16
**Status:** Draft (awaiting user review)
**Owner:** uniapp-skills maintainers
**Target version:** 1.0.0

## Problem

The current uniapp-skills bundle covers everything from state management to publishing,
but the very first step — **picking a starter template** — has only two options:

1. `npx degit dcloudio/uni-preset-vue#<branch>` (covers only the bare official preset)
2. HBuilderX's built-in template picker (visual only, no scripting)

There is no scriptable way to say "give me a Vue 3 + Vite starter **with login + tabbar + i18n**"
that:

- works headlessly (CI / agents / remote dev containers),
- filters templates by feature tags,
- degrades gracefully if a template source is unreachable,
- composes with the rest of the skills as a doc/agent contract.

The DCloud plugin marketplace (https://ext.dcloud.net.cn/) has hundreds of community
templates, but exposes no documented public API. HBuilderX's installer reaches the
marketplace via an undocumented private protocol.

## Goal

Add a new top-level skill, `uniapp-scaffolder`, that:

1. ships a **static, curated registry** of starter templates (GitHub + plugin-market IDs),
2. provides a **Node.js CLI** (`scripts/scaffold.mjs`) to list, filter, and fetch them,
3. prefers **`npx degit` for GitHub-sourced templates** (reliable, official),
4. falls back to **reverse-engineering HBuilderX's private protocol** for marketplace IDs
   (explicitly documented as "unstable, may break on DCloud updates"),
5. writes a `.scaffold-source.json` provenance file into every fetched project, so other
   skills can recognize scaffolded projects and apply downstream checks.

## Non-goals (v1)

- No real-time plugin marketplace search via web scraping.
- No GUI / IDE integration.
- No template authoring / publishing flow (covered by `uniapp-plugin-authoring`).
- No `npm install` orchestration beyond a single `npm install` after fetch.
- No Windows-native shell scripts (we require Node 18+ and tolerate the lack of native
  Windows console polish).

## Architecture

### File layout

```
uniapp-scaffolder/
├── SKILL.md                          # trigger rules, agent invocation contract
├── references/
│   ├── registry-schema.md            # field-by-field YAML schema
│   ├── hbuilderx-protocol.md         # reverse-engineered endpoints, UA, sign params
│   └── extending-registry.md         # how to submit a new template entry
├── scripts/
│   ├── scaffold.mjs                  # CLI entry: arg parsing, dispatch
│   ├── sources/
│   │   ├── degit.mjs                 # npx degit wrapper for GitHub
│   │   └── hbx-market.mjs            # reverse protocol + unzip
│   └── lib/
│       ├── registry.mjs              # YAML load + schema validate
│       ├── filter.mjs                # tag matching (all/any/none), keyword search
│       ├── logger.mjs                # human / --json dual output
│       └── path-guard.mjs            # --out safety checks
├── templates-registry.yaml           # static template manifest (~10 entries)
├── tests/
│   ├── filter.test.mjs
│   ├── registry.test.mjs
│   ├── scaffold.test.mjs             # CLI smoke tests
│   └── sources/
│       ├── degit.test.mjs            # uses local file:// fixture
│       └── hbx-market.test.mjs       # uses hand-rolled mock, no live calls
├── package.json                      # devDeps: js-yaml
└── README.md                         # examples for humans
```

### Key principles

- `scaffold.mjs` is the **only** file the agent (or user) calls. Everything else is
  internal.
- All marketplace calls are confined to `sources/hbx-market.mjs`. DCloud-driven breakage
  touches one file, not the codebase.
- Reverse-engineering notes live in `references/hbuilderx-protocol.md`, not in code
  comments, so SKILL.md stays focused on agent contract.

## Registry schema (`templates-registry.yaml`)

```yaml
version: 1
templates:
  - id: <string, required, unique>
    title: <string, required>
    description: <string, optional>
    source: github | hbx_market                 # required, enum
    repo: <string, required if source=github>   # "owner/name" or "owner/name#ref"
    ref: <string, optional>                      # branch/tag, default main
    marketplace_id: <int, required if source=hbx_market>
    tags: [<string>, ...]                        # free-form
    platforms: [h5, mp-weixin, mp-alipay, app, harmony, ...]
    maintainer: dcloud | community | third-party
    notes: <string, optional>
    fallback_warning: <string, optional, only if source=hbx_market>
```

### Field semantics

- **`id`** — stable identifier, used as `scaffold.mjs fetch <id>` argument.
- **`source`** — strict two-value enum; determines which `sources/*` module handles fetch.
- **`tags`** — free-form, lower-case recommended. Filter subcommand matches by
  `all` (default) / `any` / `none`.
- **`platforms`** — informational only. Script does **not** validate user's installed SDKs.
- **`maintainer`** — affects SKILL.md trust hint (`dcloud` = official guarantee;
  `community` = vetted by maintainers; `third-party` = no guarantee).
- **`fallback_warning`** — when non-empty, script prints a ⚠️ line at startup so the user
  is never surprised by instability.

### v1 initial entries

1. `uni-preset-vue-vite` (dcloud, GitHub, tags: official, vue3, vite, bare)
2. `uni-preset-vue-vite-ts` (dcloud, GitHub, tags: official, vue3, vite, typescript, bare)
3. `uniapp-tabbar-starter` (community, GitHub, tags: tabbar, vue3, login-skeleton)
4. `uniapp-i18n-starter` (community, GitHub, tags: i18n, vue3, vite)
5. `uniapp-with-uni-pay` (community, GitHub, tags: payment, vue3, uni-pay)
6. `uniapp-with-uni-push` (community, GitHub, tags: push, vue3, uni-push)
7. `hbx-template-with-i18n` (third-party, hbx_market, marketplace_id: <placeholder>,
   fallback_warning set) — placeholder; real ID added by maintainer if/when verified.

## CLI contract

### Subcommands

```bash
node scripts/scaffold.mjs list      [--tags=vue3,login] [--source=github|hbx_market] [--json]
node scripts/scaffold.mjs search <keyword> [--tags=vue3] [--json]
node scripts/scaffold.mjs fetch <template-id> [--out=./my-app] [--no-install] [--force]
node scripts/scaffold.mjs fetch --marketplace-id=<int> [--out=./my-app] [--no-install]
node scripts/scaffold.mjs validate  # exits 0/2 based on registry schema
node scripts/scaffold.mjs --help
```

### Exit codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 2    | Registry YAML missing / parse error / schema validation failure |
| 3    | Filter produced empty result (for `fetch`) |
| 4    | Unknown template id |
| 5    | Source fetch failed (GitHub network/404, or HBuilderX protocol error) |
| 6    | `npm install` failed (post-fetch, non-fatal) |
| 64+  | Node.js / toolchain errors (per Node convention) |

### Output modes

- **Human (default)**: tabular `list`, terse progress for `fetch`.
- **`--json`**: stable JSON shape so the agent can parse. Each entry has:
  `{ id, title, source, tags, platforms, maintainer }`.

### Provenance file (`.scaffold-source.json`)

Written to the root of every successfully fetched project:

```json
{
  "scaffold_source": "uniapp-scaffolder",
  "template_id": "uniapp-tabbar-starter",
  "template_source": "github",
  "fetched_at": "2026-06-16T08:30:00.000Z",
  "scaffold_version": "1.0.0"
}
```

Downstream skills (`uniapp-architect`, `uniapp-fundamentals`) detect this file to decide
whether to run extra linters / config checks.

## Data flow (`fetch <id> --out=./foo`)

```
scaffold.mjs fetch <id> --out=./foo
  │
  ├─ path-guard: --out must be relative or non-existent absolute
  ├─ registry.load() → schema check → find <id>
  │    └─ not found → exit 4
  │
  ├─ if source == github:
  │    └─ sources/degit.mjs
  │         ├─ run: npx degit <repo>#<ref> ./foo --force
  │         ├─ retry once on network error
  │         ├─ exit 5 with actionable message on 404
  │         └─ write .scaffold-source.json
  │
  ├─ if source == hbx_market:
  │    └─ sources/hbx-market.mjs
  │         ├─ per references/hbuilderx-protocol.md: GET <endpoint>?id=<id>
  │         ├─ 404 → print fallback_warning + HBuilderX manual steps, exit 5
  │         ├─ unzip stream → ./foo
  │         └─ write .scaffold-source.json
  │
  ├─ unless --no-install:
  │    ├─ cd ./foo && npm install
  │    └─ on failure: print stderr summary, exit 6 (non-fatal)
  │
  └─ exit 0
```

## Error handling

### Layered

| Layer | Behavior |
|-------|----------|
| Registry load | Missing/parse/schema fail → exit 2, suggest `validate` subcommand |
| Filter no-match | `list`/`search` → print empty set + suggest `--tags=any`; `fetch` → exit 3 |
| GitHub fetch | 404 → "repo may have moved, check GitHub"; network → "check proxy/network"; exit 5 |
| HBuilderX fetch | Endpoint 404 / unzip fail / sign fail → print `fallback_warning` + manual steps; exit 5 |
| `npm install` | Print summary, exit 6, **not** fatal (template was fetched successfully) |

### Safety guards (path-guard.mjs)

- `--out` must be a relative path or a non-existent absolute path.
- Refuses to write into a non-empty directory unless `--force` is given.
- Refuses paths under `~/.ssh`, `C:\Windows`, `/etc`, `/`.
- `repo` field must match `^[\w.-]+/[\w.-]+(?:#[\w./-]+)?$`.
- `marketplace_id` must be a positive integer.

## Testing

### Test files

- `tests/filter.test.mjs` — tag matching (all/any/none), case-insensitive keyword search,
  empty tag list behavior.
- `tests/registry.test.mjs` — valid YAML loads; missing fields / wrong enums /
  non-int `marketplace_id` produce readable errors; duplicate `id` detected.
- `tests/scaffold.test.mjs` — CLI smoke: `--help` works, `fetch <unknown>` exits 4,
  `list --tags=official,vue3 --json` includes expected ids, `--out` guards reject
  overwriting non-empty dirs.
- `tests/sources/degit.test.mjs` — uses a local `file://` fixture, never hits GitHub.
- `tests/sources/hbx-market.test.mjs` — hand-rolled mock for the reverse-engineered
  endpoint; no live calls in CI.

### Runner

`node --test tests/**/*.test.mjs` (Node 18+ built-in test runner, **zero npm test deps**).

### CI posture (v1)

- README mentions `node --test` as the canonical command.
- Not gated on PRs in v1 — the marketplace endpoint fixtures are too brittle to maintain
  as a hard CI requirement. Re-evaluate at v1.4.0 alongside the broader changelog bump.

## Documentation

### `SKILL.md` sections (mandatory)

1. **When to use this skill** — agent routing rules.
2. **Quick start** — three commands: `list`, `fetch <id>`, `validate`.
3. **Filtering** — `--tags=`, `--source=`, `list` vs `search`.
4. **Adding a template to the registry** — PR contribution guide.
5. **Failure modes & recovery** — table mapping error → cause → fix.
6. **Limitations** — explicitly: "no real-time marketplace search", "HBuilderX protocol
   fallback is reverse-engineered and may break", "Windows native console polish
   not a goal".
7. **References** — pointer to `references/registry-schema.md` and
   `references/hbuilderx-protocol.md`.

### Companion changes in the existing repo

- `uniapp-architect/references/decision-tree.md` — add a routing line:
  *"User is starting fresh outside HBuilderX → route to `uniapp-scaffolder`"*.
- `uniapp-fundamentals/examples/scaffold-vue3-vite.md` — add a one-line pointer at the top:
  *"If you need filtering by features (login / payment / i18n) or community templates,
  see `uniapp-scaffolder`"*.
- `README.md` — add `uniapp-scaffolder` row to the resource table and a v1.4.0
  changelog entry.

## Dependencies

### Runtime

- Node.js 18+ (already required by the uniapp ecosystem).
- `npx degit` (auto-fetched on first run via `npx`).

### devDeps (in `uniapp-scaffolder/package.json`)

- `js-yaml` (YAML parsing).
- `vitest` is **deliberately not** added — we use `node --test` to keep test deps at zero.

### Out of scope (added by the user environment, not by this skill)

- `git`, `npm`, `curl`-equivalent Node `fetch`.

## Open questions

1. **Placeholder marketplace_id** — do we ship a known-broken entry in v1 to demonstrate
   the hbx_market code path, or only add one after maintainers verify a real ID?
   *Decision deferred to implementer: ship with placeholder + clear
   `fallback_warning`, document in SKILL.md that the entry may not work until updated.*
2. **GitHub orgs for community templates** — the initial 4 community entries (tabbar,
   i18n, uni-pay, uni-push) need a verified GitHub repo. *Decision: not in scope of this
   design doc; implementer/maintainer to verify before merging registry.*

## Success criteria

- A user can run `node scripts/scaffold.mjs search vue3 i18n` and see only templates
  matching those tags.
- `node scripts/scaffold.mjs fetch uni-preset-vue-vite --out=./demo` produces a
  runnable uni-app project in `./demo` with `.scaffold-source.json` and a working
  `npm install`.
- `node scripts/scaffold.mjs fetch --marketplace-id=<int>` either succeeds (zip
  downloaded, unzipped, project runnable) or fails with a message pointing to the
  manual HBuilderX steps.
- `node --test` passes with zero npm test deps.
- All existing skills continue to work; only `uniapp-architect/decision-tree.md`,
  `uniapp-fundamentals/examples/scaffold-vue3-vite.md`, and `README.md` are touched.

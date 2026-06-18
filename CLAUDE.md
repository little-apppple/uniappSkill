# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **collection of 20 Claude skills** for uni-app development — not a uni-app project. The skills are consumed by AI agents (Claude Code, Cursor, mavis, etc.) as on-demand documentation. Each skill is a self-contained folder with `SKILL.md` at its root; two of them (`uniapp-scaffolder`, `uniapp-mp-automation`) also ship runnable Node.js scripts.

Start with `README.md` for the full skill catalog and install instructions, and `uniapp-architect/SKILL.md` for the routing decision tree. This file covers the structural conventions and the few executable pieces.

## Layout

```
uniapp-skills/
├── README.md / README.zh.md          # install, catalog, design principles
├── uniapp-architect/                 # entry point — load FIRST, routes to the others
├── uniapp-{fundamentals,routing-and-tabbar,state-and-data,network-layer,
│           ui-patterns,platform-config,performance,debugging-and-publishing,
│           testing,i18n,cloud,payments,uni-push,theming,migration,
│           plugin-authoring,ui-libraries}/   # 18 topic sub-skills
├── uniapp-mp-automation/             # SKILL.md + scripts/ (WeChat DevTools helper)
├── uniapp-scaffolder/                # the only full Node.js CLI in the repo
└── docs/superpowers/                 # design specs / implementation plans (scaffolder)
```

Per-skill contents: `SKILL.md` is the body. `references/` and `examples/` are *planned for future extraction* — most skills don't have them yet. Inline annotations in each `SKILL.md` mark `*planned*` paths the agent/reader should not expect to find on disk.

## Skill conventions (read these before editing any SKILL.md)

- Every `SKILL.md` opens with YAML frontmatter: `name`, `description`, `license: Complete terms in LICENSE.txt`. The `description` field is the routing key for agents — write it for discoverability, not completeness.
- Every skill leads with **"When to use"** and **"When NOT to use"** sections. The "When NOT" entries route to sibling skills. Keep these tight and current; they're the load-on-demand signal.
- Skills cross-reference each other for shared concerns but don't depend on each other (any one is independently useful).
- `uniapp-project` is a **separate, pre-existing skill** (not in this repo) — it's the per-component / per-API catalog. This collection is the workflow / pattern layer above it. Don't duplicate component/API reference content into these skills.

## Executable code

Two skills ship code; the other 18 are pure markdown.

### `uniapp-scaffolder/` (the only full Node.js package)

- `package.json`: `"type": "module"`, ESM only, Node's built-in `node:test` (zero test deps).
- **Install once**: `cd uniapp-scaffolder && npm install` (pulls `js-yaml`).
- **Test**: `npm test` (runs `node --test tests/runner.mjs`). `tests/runner.mjs` has a recursion guard — it imports test files in-place if already under `node --test`, otherwise spawns normally. Don't bypass it.
- **CLI**: `node scripts/scaffold.mjs {list|search|fetch|validate} ...` (also exposed as the `uniapp-scaffold` bin).
- **Validate registry**: `node scripts/scaffold.mjs validate` (used in CI).
- Source layout: `scripts/scaffold.mjs` (entry), `scripts/lib/` (filter, logger, path-guard, registry), `scripts/sources/` (`degit.js`, `hbx-market.js` — pluggable template fetchers).
- **Path safety**: `scripts/lib/path-guard.mjs` blocks writes to sensitive paths; respect it. New write code should route through it.
- **JSON output**: `--json` emits a stable line-oriented shape intended for `jq` / agent consumption. Don't add human-only text to JSON mode.

### `uniapp-mp-automation/scripts/` (WeChat DevTools helper, no install)

- Seven files, no `package.json`, no `node_modules`. Pure Node 16+ stdlib + `miniprogram-automator` (installed by the **user's** uni-app project, not by this skill).
- **Syntax check**: `node --check scripts/<file>.js` — there is no test suite.
- **Smoke test detection**: `node scripts/mp-devtools-cli.js --probe` to inspect CLI resolution state; `--clear` to drop the cache at `~/.uniapp-mp-automation/devtools-cli.json`.
- **Daemon lifecycle**: `mp-debug-helper.js {start|stop|status}` runs an HTTP daemon on port 9876 (override with `MP_DEBUG_PORT`). The 31 ops are 1:1 with `weixin-devtools-mcp` — see `SKILL.md` for the full table.
- **State that crosses calls**: `uid` from `query_selector`, console/network buffers, connection log, session id. All live in the daemon process; each new `start` invalidates them.
- **Path auto-detection**: `mp-paths.js` (build output) and `mp-devtools-cli.js` (DevTools CLI install) both use CWD-walk + env-var + cache + registry + interactive-prompt tier. Don't reintroduce a third hardcoded-path helper; extend those.

## Where to look

| Task | Where |
|---|---|
| Add a new sub-skill | Copy an existing `uniapp-*/SKILL.md` template, follow the frontmatter + When-to-use convention, add a row to `README.md` (and `README.zh.md` if Chinese) |
| Change skill routing | Update `uniapp-architect/SKILL.md`'s "When to use / When NOT to use" + the sub-skill table in `README.md` |
| Add a scaffolder template | Edit `uniapp-scaffolder/templates-registry.yaml`, then `node scripts/scaffold.mjs validate`. Schema in `uniapp-scaffolder/references/extending-registry.md` |
| Change scaffolder CLI output shape | `scripts/lib/logger.mjs` (dual human/--json), `scripts/scaffold.mjs` (commands). JSON shape is a stability contract — review carefully |
| Change WeChat helper | `uniapp-mp-automation/scripts/`. Re-run `node --check` on every modified file. Update the ops table in `SKILL.md` if you add/remove ops |
| Bump version | Both `README.md` (versioning table) and the affected `SKILL.md` frontmatter. Convention: bump patch for content fixes, minor for new sub-skill or major for new category |

## Other notes

- Shell is bash on Windows (`win32`); use Unix syntax in scripts (e.g. `/dev/null`, forward slashes). The platform-specific paths in the mp-automation scripts are correct as-is.
- Line endings: existing `SKILL.md` files use LF but Git warns they'll be converted to CRLF on next touch. Don't re-save them on Windows without intent.
- `nul` at the repo root is a stray Windows-reserved-name file from an earlier test — leave it alone, `.gitignore` doesn't track it but it's harmless.

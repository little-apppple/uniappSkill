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

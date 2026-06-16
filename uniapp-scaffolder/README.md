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

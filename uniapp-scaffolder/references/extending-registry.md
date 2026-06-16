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

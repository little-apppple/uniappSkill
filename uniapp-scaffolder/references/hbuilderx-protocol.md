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

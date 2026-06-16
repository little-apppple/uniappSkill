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

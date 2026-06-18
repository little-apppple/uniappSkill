# Uni-app Skills — Complete Set

> **Note: this skill set is still under active development and is not yet
> stable.** Content, structure, and cross-references may change between
> versions. Contributions and iteration feedback are welcome.

A complete, layered set of skills for **uni-app** development, covering everything from
project scaffolding to publishing, including testing, i18n, and uniCloud backend.
Use this as the entry point; route to the right sub-skill for the task at hand.

## What's in this set

| Skill | What it covers | When to load |
|---|---|---|
| [`uniapp-architect`](./uniapp-architect/SKILL.md) | Entry point — decision routing, framework version matrix, tooling choice | New project, cross-cutting decision, architecture review |
| [`uniapp-fundamentals`](./uniapp-fundamentals/SKILL.md) | Project structure, `pages.json` / `manifest.json`, `App.vue` / `main.js`, Vue 2 vs 3 vs uvue, lifecycle, `easycom`, `uni.scss`, `uni_modules` | Project setup, config questions, lifecycle hooks |
| [`uniapp-routing-and-tabbar`](./uniapp-routing-and-tabbar/SKILL.md) | Page navigation, `tabBar` config, custom nav bar, page params, 10-level stack limit, deep links | Page jump, tab bar, custom nav, share cards |
| [`uniapp-state-and-data`](./uniapp-state-and-data/SKILL.md) | Pinia setup, store patterns, `uni.storage`, persistence, login flow | Cross-page state, persistence, user session, cart |
| [`uniapp-network-layer`](./uniapp-network-layer/SKILL.md) | `uni.request` wrapper, interceptors, 401 handling, upload/download, retry | API calls, file upload, request cancellation |
| [`uniapp-ui-patterns`](./uniapp-ui-patterns/SKILL.md) | List pages, forms, skeletons, empty/error states, custom nav, popups | UI screens, list/form pages, global toasts |
| [`uniapp-platform-config`](./uniapp-platform-config/SKILL.md) | `manifest.json` per platform, WeChat MP setup, iOS signing, Android permissions, conditional compilation | Multi-platform setup, "works on H5 but not MP" bugs |
| [`uniapp-performance`](./uniapp-performance/SKILL.md) | Startup, long lists, image opt, subpackages, `nvue` / `uvue` choice | Slow app, janky list, big bundle |
| [`uniapp-debugging-and-publishing`](./uniapp-debugging-and-publishing/SKILL.md) | vConsole, WeChat DevTools, common errors, build commands, MP upload, App Store / Play, wgt hot update, CI/CD | Bug fixing, shipping, CI/CD setup |
| [`uniapp-testing`](./uniapp-testing/SKILL.md) | Vitest unit + component, Playwright on H5, miniprogram-automator on MP, real-device App QA, CI matrix | Add tests, mock `uni.*`, automate MP UI, E2E on H5, wire tests into CI |
| [`uniapp-mp-automation`](./uniapp-mp-automation/SKILL.md) | 微信小程序自动化构建+调试工作流 — npm build、appid 确认、DevTools 启动、MCP 自动化调试、页面交互断言、网络监控、截图、CI 集成 | 构建后自动化调试、DevTools 自动化操作、MCP 调试脚本、CI 集成 |
| [`uniapp-i18n`](./uniapp-i18n/SKILL.md) | Built-in locale API, vue-i18n integration, lazy loading, RTL, server coordination | Multi-language, language switcher, locale formatting, RTL |
| [`uniapp-cloud`](./uniapp-cloud/SKILL.md) | uniCloud functions, cloud database (JQL), cloud storage, uni-id auth, uni-cloud-router, schema permissions, deployment | Serverless backend, auth, file storage, calling cloud functions from client |
| [`uniapp-payments`](./uniapp-payments/SKILL.md) | WeChat Pay (MP/H5/App), Alipay, Apple Pay, Google Pay, uni-pay plugin, refunds | Charge users, integrate any payment provider, handle refunds |
| [`uniapp-uni-push`](./uniapp-uni-push/SKILL.md) | uni-push offline push, WeChat MP 订阅消息, push token management, segmentation | Send push notifications, opt-in WeChat subscription messages, offline push |
| [`uniapp-theming`](./uniapp-theming/SKILL.md) | Light/dark/auto theme switching, color tokens, system theme detection, UI library integration, brand override | Add dark mode, support brand colors, design a token system |
| [`uniapp-migration`](./uniapp-migration/SKILL.md) | Taro → uni-app, native WeChat MP → uni-app, Vue 2 → Vue 3, Vue 3 → uni-app x | Port a Taro / native MP project, upgrade Vue 2 to Vue 3 |
| [`uniapp-plugin-authoring`](./uniapp-plugin-authoring/SKILL.md) | uni_modules plugin structure, package.json, easycom.json, multi-platform support, UTS native plugins, publish to DCloud market | Package reusable code as a plugin, write a UTS native plugin, publish to the marketplace |
| [`uniapp-ui-libraries`](./uniapp-ui-libraries/SKILL.md) | Comparison and integration for uView Plus / FirstUI / ThorUI / Wot Design Uni / uv-ui / vk-uview-ui / Tuniao / ColorUI / GraceUI | Pick a UI library, install and configure it, customize the theme, migrate between libraries |
| [`uniapp-scaffolder`](./uniapp-scaffolder/SKILL.md) | List, filter, and fetch starter templates via CLI | Agent / CI: scaffolding from filtered registry, headless template fetch |

> Plus the pre-existing **`uniapp-project`** skill — a reference catalog of all uni-app
> built-in components, uni-ui components, and APIs. Use it for per-component / per-API
> lookup. The skills above are the **workflow / pattern** layer that sits on top.
>
> **Dependency: `uniapp-project` is a separate skill that is NOT part of this
> collection — it must be installed independently.** It lives next to this set at
> `%USERPROFILE%\.claude\skills\uniapp-project\` (Windows) or
> `~/.claude/skills/uniapp-project/` (macOS/Linux). If you don't have it,
> see [Install `uniapp-project`](#install-uniapp-project-required-dependency) below,
> or fall back to the [official uni-app documentation](https://uniapp.dcloud.net.cn/)
> for component/API reference.

## How to install

> **Path convention used below:**
> - Windows: `%USERPROFILE%\.claude\skills\` (e.g. `C:\Users\Administrator\.claude\skills\`)
> - macOS / Linux: `$HOME/.claude/skills/`
>
> Substitute your own user directory — `Administrator` in the Windows example is
> specific to one developer's machine; use the path matching your OS and user.

### Option A: Copy to a Claude skills directory

Each skill is a self-contained folder with `SKILL.md` at its root. Copy the folders
into any of the following:

- **Global skills** (available to all projects): `%USERPROFILE%\.claude\skills\` (Windows) or `~/.claude/skills/` (macOS/Linux)
- **Project skills** (per-project): `<project>/.claude/skills/`
- **Mavis skills**: `%USERPROFILE%\.mavis\skills\` (Windows) or `~/.mavis/skills/` (macOS/Linux)

#### Windows (cmd / PowerShell)

```bash
# Example: copy all skills to global Claude skills directory
for /d %s in (d:\workspace\mySkills\uniapp-skills\uniapp-*) do xcopy /E /I "%s" "%USERPROFILE%\.claude\skills\%~nxs"
# Or copy individual skills:
xcopy /E /I uniapp-skills\uniapp-architect "%USERPROFILE%\.claude\skills\uniapp-architect"
xcopy /E /I uniapp-skills\uniapp-fundamentals "%USERPROFILE%\.claude\skills\uniapp-fundamentals"
xcopy /E /I uniapp-skills\uniapp-routing-and-tabbar "%USERPROFILE%\.claude\skills\uniapp-routing-and-tabbar"
xcopy /E /I uniapp-skills\uniapp-state-and-data "%USERPROFILE%\.claude\skills\uniapp-state-and-data"
xcopy /E /I uniapp-skills\uniapp-network-layer "%USERPROFILE%\.claude\skills\uniapp-network-layer"
xcopy /E /I uniapp-skills\uniapp-ui-patterns "%USERPROFILE%\.claude\skills\uniapp-ui-patterns"
xcopy /E /I uniapp-skills\uniapp-platform-config "%USERPROFILE%\.claude\skills\uniapp-platform-config"
xcopy /E /I uniapp-skills\uniapp-performance "%USERPROFILE%\.claude\skills\uniapp-performance"
xcopy /E /I uniapp-skills\uniapp-debugging-and-publishing "%USERPROFILE%\.claude\skills\uniapp-debugging-and-publishing"
xcopy /E /I uniapp-skills\uniapp-testing "%USERPROFILE%\.claude\skills\uniapp-testing"
xcopy /E /I uniapp-skills\uniapp-mp-automation "%USERPROFILE%\.claude\skills\uniapp-mp-automation"
```

#### macOS / Linux (bash / zsh)

```bash
# Example: copy all skills to global Claude skills directory
for d in /path/to/uniapp-skills/uniapp-*; do
  cp -r "$d" "$HOME/.claude/skills/$(basename "$d")"
done
# Or copy individual skills:
cp -r uniapp-skills/uniapp-architect        "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-fundamentals     "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-routing-and-tabbar "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-state-and-data   "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-network-layer    "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-ui-patterns      "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-platform-config  "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-performance      "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-debugging-and-publishing "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-testing          "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-mp-automation    "$HOME/.claude/skills/"
```

Restart Claude / your client to pick them up.

### Option B: Use as a project-local skill set

Copy the entire `uniapp-skills/` folder into your project's `.claude/skills/`. The
agent will see them when working on that project.

```bash
# In your uni-app project (macOS/Linux/WSL)
mkdir -p .claude/skills
cp -r uniapp-skills/* .claude/skills/
```

```powershell
# In your uni-app project (Windows PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills
Copy-Item -Recurse uniapp-skills\* .claude/skills\
```

### Option C: Wire into `mavis`

```bash
# Register all skills at once
mavis skill add <skill-folder-path>
```

Or copy into the `mavis` agent's skills directory:
`%USERPROFILE%\.mavis\agents\mavis\skills\` (Windows) or
`~/.mavis/agents/mavis/skills/` (macOS/Linux).

## Install `uniapp-project` (required dependency)

The 20 skills above work **without** `uniapp-project` — every sub-skill is
self-contained. But for "how do I use component X or API Y" lookups (the bulk of
routine uni-app development), you'll also want the `uniapp-project` skill
installed next to this set.

`uniapp-project` is **not shipped in this repo** — it's a separate skill with its
own release cadence (it mirrors the official uni-app docs). Install it via one of:

### Option A: Copy from an existing Claude install

If you have it on another machine or it was previously installed on this one:

```bash
# Windows
xcopy /E /I "C:\path\to\uniapp-project" "%USERPROFILE%\.claude\skills\uniapp-project"
# macOS / Linux
cp -r /path/to/uniapp-project "$HOME/.claude/skills/"
```

### Option B: Clone from the upstream repo

`uniapp-project` is published as part of the [teachingai/full-stack-skills](https://github.com/teachingai/full-stack-skills)
collection. Browse on [skills.sh](https://www.skills.sh/teachingai/full-stack-skills/uniapp-project)
or install via `npx`:

```bash
# Recommended (installs to ~/.claude/skills/uniapp-project):
npx skills add https://github.com/teachingai/full-stack-skills --skill uniapp-project
```

Or clone directly (when you can't run `npx`):

```bash
# Windows
cd %USERPROFILE%\.claude\skills
git clone https://github.com/teachingai/full-stack-skills.git _tmp
robocopy _tmp\skills\uniapp-project uniapp-project /E
rmdir /s /q _tmp
```

```bash
# macOS / Linux
cd "$HOME/.claude/skills"
git clone --depth 1 --filter=blob:none --sparse https://github.com/teachingai/full-stack-skills.git _tmp
cd _tmp
git sparse-checkout set skills/uniapp-project
cp -r skills/uniapp-project ..
cd .. && rm -rf _tmp
```

### Option C: Install via your package manager / mavis

```bash
# If your agent supports package install for skills
mavis skill install uniapp-project
```

### Verify it works

After installing, both `uniapp-architect` and `uniapp-project` should appear in
your Claude client's skill list. The architect's `## When to use` section will
route you to `uniapp-project` whenever you ask about a specific component or API.

### If you skip this dependency

Without `uniapp-project`, the 20 skills in this set still cover all **workflow,
pattern, and pitfalls** content — that's the intended division of labor:

- **This set** (workflow / pattern): "How do I build a list page with
  pull-to-refresh?", "What's the right way to handle WeChat MP login?", "What
  are the WXSS limitations?"
- **`uniapp-project`** (reference): "What props does `<scroll-view>` accept?",
  "What's the signature of `uni.scanCode`?", "Which platforms support
  `<live-pusher>`?"

If you skip `uniapp-project`, fall back to the
[official uni-app documentation](https://uniapp.dcloud.net.cn/) for the
reference-side questions.

## Other optional skill dependencies

Beyond `uniapp-project`, two other skill categories are referenced by this set.
Neither is required to use the 20 uni-app skills, but each unlocks a specific
workflow:

### `tdd` / `test-driven-development` — for TDD-style test authoring

Referenced from:
- `uniapp-architect` recipe "I want to add tests to my uni-app"
- `uniapp-testing` `## When NOT to use` (for "Should I write tests first?")

`uniapp-testing` covers **uni-app-specific** testing concerns: mocking `uni.*`,
cross-platform behavior, MP automation. The `tdd` / `test-driven-development`
skills cover **generic test-first process**: red-green-refactor, test naming,
when to mock vs not. Load `tdd` alongside `uniapp-testing` when writing new
test files from scratch.

Both `tdd` and `test-driven-development` ship in the
[obra/superpowers](https://github.com/obra/superpowers) collection. Browse the
catalog at [skills.sh/obra/superpowers](https://www.skills.sh/obra/superpowers).

Install via `npx`:

```bash
# Recommended (installs all superpowers skills to ~/.claude/skills/):
npx skills add obra/superpowers

# Or install only tdd + test-driven-development (saves context):
npx skills add https://github.com/obra/superpowers --skill tdd
npx skills add https://github.com/obra/superpowers --skill test-driven-development
```

After install, the skills land at `%USERPROFILE%\.claude\skills\tdd\` and
`%USERPROFILE%\.claude\skills\test-driven-development\` (Windows) or
`~/.claude/skills/tdd/` and `~/.claude/skills/test-driven-development/`
(macOS/Linux).

### `superpowers:*` process skills — for code review / planning workflows

The `uniapp-architect` skill's `## Code review mode` section (added in v1.4.2)
is designed to be triggered when an agent runs a code-review pass against a
uni-app project. To get the full automated experience:

- Install the [obra/superpowers](https://github.com/obra/superpowers) framework —
  browse the full skill list at [skills.sh/obra/superpowers](https://www.skills.sh/obra/superpowers).
  It provides `superpowers:code-review`, `superpowers:requesting-code-review`,
  `superpowers:using-superpowers`, `superpowers:brainstorming`, and related
  process skills.
- When a `/code-review` (or `simplify`) runs against a uni-app codebase, the
  agent should load `uniapp-architect` automatically and follow the Code review
  mode checklist.

Install via `npx`:

```bash
# Install the entire superpowers collection:
npx skills add obra/superpowers

# Or install only the review-related skills:
npx skills add https://github.com/obra/superpowers --skill code-review
npx skills add https://github.com/obra/superpowers --skill requesting-code-review
npx skills add https://github.com/obra/superpowers --skill receiving-code-review
npx skills add https://github.com/obra/superpowers --skill using-superpowers
```

Without superpowers installed, the `uniapp-architect` skill still works — you
just won't get the auto-triggered review workflow. The 10-step checklist in
`## Code review mode` can be read manually for human-driven code reviews.

### Superpowers skill coordination (informational)

A few other superpowers skills are referenced from internal plan docs
(`docs/superpowers/plans/*.md`) for the scaffolder implementation:

- `superpowers:subagent-driven-development` / `superpowers:executing-plans` —
  for working through the scaffolder implementation plan task-by-task
- `superpowers:writing-plans` — for creating future plan docs

These are **only relevant if you're reading the plan docs under `docs/superpowers/`**
for implementation work. They're not needed for using the 20 uni-app skills in
production. Install all of them in one shot:

```bash
npx skills add obra/superpowers
```

## How to use

### For developers (reading these manually)

Start with **`uniapp-architect`**. It gives the decision tree for "which sub-skill
should I read for this question?". Then drill into the relevant sub-skill.

For "how do I use component X or API Y" questions, jump straight to the existing
`uniapp-project` skill (the per-component / per-API catalog).

### For AI agents (using these as skills)

When the user asks a uni-app question, the agent should:

1. Read `uniapp-architect/SKILL.md` first to orient.
2. Load only the sub-skill(s) that match the current question.
3. Cross-reference other sub-skills only when the current layer's decision points to
   them.

Don't load all 9 skills at once — it burns context. Load on demand.

## Recommended reading order for a new uni-app developer

1. `uniapp-architect/SKILL.md` — overall map
2. `uniapp-fundamentals/SKILL.md` + `examples/scaffold-vue3-vite.md` — set up your project
3. `uniapp-platform-config/SKILL.md` — configure your target platform(s)
4. `uniapp-routing-and-tabbar/SKILL.md` — page navigation patterns
5. `uniapp-state-and-data/SKILL.md` — Pinia + persistence
6. `uniapp-network-layer/SKILL.md` — request layer + auth
7. `uniapp-ui-patterns/SKILL.md` — list / form / popup patterns
8. `uniapp-performance/SKILL.md` — only when you hit a perf issue
9. `uniapp-debugging-and-publishing/SKILL.md` — when shipping

## Design principles

These skills were designed with three principles:

1. **No overlap with `uniapp-project`** — that skill (a separate skill, installed
   independently) is the per-component / per-API reference. These 18 skills are the
   workflow / pattern layer. Together they cover "how to use uni-app" completely.

2. **Each sub-skill is independently useful** — you can load any one without loading
   the others. They reference each other for cross-cutting concerns, but don't depend
   on each other.

3. **Decision-driven, not reference-driven** — every skill leads with "when to use" and
   "when NOT to use", so the agent (or a developer) can route quickly without scanning
   the whole file.

## File layout

```
uniapp-skills/
├── README.md                                    # this file
├── uniapp-architect/                            # entry point
│   ├── SKILL.md
│   └── references/
│       ├── decision-tree.md
│       └── platform-matrix.md
├── uniapp-fundamentals/
│   ├── SKILL.md
│   ├── references/
│   │   ├── vue2-vs-vue3-vs-uvue.md
│   │   ├── pages-json.md
│   │   ├── manifest-json.md
│   │   ├── lifecycle.md
│   │   └── easycom-uni-scss-uni-modules.md
│   └── examples/
│       ├── scaffold-vue3-vite.md
│       └── scaffold-uvue.md
├── uniapp-routing-and-tabbar/
│   ├── SKILL.md
│   ├── references/
│   │   ├── page-jump-api.md
│   │   ├── custom-nav-bar.md
│   │   ├── tabbar-patterns.md
│   │   └── deep-link-and-share.md
│   └── examples/
│       └── login-redirect.md
├── uniapp-state-and-data/         SKILL.md
├── uniapp-network-layer/          SKILL.md
├── uniapp-ui-patterns/             SKILL.md
├── uniapp-platform-config/        SKILL.md
├── uniapp-performance/            SKILL.md
├── uniapp-debugging-and-publishing/  SKILL.md
├── uniapp-testing/                SKILL.md  (v1.1)
├── uniapp-mp-automation/          SKILL.md  (v1.4)
├── uniapp-i18n/                   SKILL.md  (v1.1)
├── uniapp-cloud/                  SKILL.md  (v1.1)
├── uniapp-payments/               SKILL.md  (v1.2)
├── uniapp-uni-push/               SKILL.md  (v1.2)
├── uniapp-theming/                SKILL.md  (v1.2)
├── uniapp-migration/              SKILL.md  (v1.2)
├── uniapp-plugin-authoring/       SKILL.md  (v1.2)
└── uniapp-ui-libraries/            SKILL.md  (v1.2)
```

## Source

These skills are derived from the official uni-app documentation
(https://uniapp.dcloud.net.cn/), the uni-app x / UTS docs (https://doc.dcloud.net.cn/uni-app-x/),
and the DCloud plugin market (https://ext.dcloud.net.cn/). They were synthesized for use
as AI agent skills, with an emphasis on:

- Cross-platform differences (not just "how it works on H5")
- Real-world patterns (login, cart, list pagination) over reference docs
- Pitfalls and how to debug them
- Modern Vue 3 / Pinia / Vite as the default, with Vue 2 and uni-app x notes where
  relevant

## License

Each `SKILL.md` carries a `license: Complete terms in LICENSE.txt` header. Add a
`LICENSE.txt` if you need explicit terms; otherwise these are MIT-licensed and free
to use, modify, and redistribute.

## Versioning

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-06-15 | Initial release — 9 skills, covering scaffolding through publishing. All content inline in SKILL.md. |
| 1.1.0 | 2026-06-15 | Added `uniapp-testing`, `uniapp-i18n`, `uniapp-cloud` — total 12 skills. |
| 1.2.0 | 2026-06-15 | Added 6 skills: `uniapp-payments`, `uniapp-uni-push`, `uniapp-theming`, `uniapp-migration`, `uniapp-plugin-authoring`, `uniapp-ui-libraries` — total 18 skills. Most common uni-app workflows are now covered end-to-end. |
| 1.3.0 | 2026-06-15 | Added `uniapp-mp-automation` — automated build→launch→debug workflow via weixin-devtools-mcp MCP server. Total 19 skills. |
| 1.4.0 | 2026-06-17 | Added `uniapp-scaffolder` — CLI scaffolder with curated registry, tag filtering, and HBuilderX marketplace fallback. Total 20 skills. |
| 1.4.1 | 2026-06-18 | Enhanced `uniapp-mp-automation` — new `mp-devtools-cli.js` for WeChat DevTools CLI auto-detect (env / cache / registry / common paths / TTY prompt), `mp-launch.js` + `mp-debug-helper.js` wired in; documented 3 Windows pitfalls (`automator.launch()` .bat spawn fails → use `mp-launch.js` + `cli.bat auto` + `automator.connect({ wsEndpoint })`; `cli.bat open` alone does not open the debug websocket; no-GUI-session environments can only run build/verify, not 31 ops). |

## Future work

The full list of **known coverage gaps** is in
[`uniapp-architect/SKILL.md`](./uniapp-architect/SKILL.md) — see the "Known coverage
gaps (v1.0 → v1.2)" section. Items still on the roadmap for v1.3:

- `references/analytics.md` — Sensors, umeng, baidu-tongji, sensors-data, MP analytics
- `references/app-version-update.md` — "force update on first launch" UX pattern
- `references/error-reporting.md` — Sentry / Fundebug deep integration
- `references/uni-ai.md` — DCloud's AI SDK (deferred until uni-ai GA)

Plus per-skill references planned to be split out from inline content (see each
SKILL.md's "References / Examples" section for the planned list).

**Shipped in v1.1**:
- ✅ `uniapp-testing` — Vitest + Playwright (H5) + `miniprogram-automator` (MP)
- ✅ `uniapp-i18n` — multi-language, vue-i18n integration
- ✅ `uniapp-cloud` — uniCloud functions, uni-id auth, cloud DB, cloud storage

**Shipped in v1.2**:
- ✅ `uniapp-payments` — WeChat Pay / Alipay / Apple Pay / Google Pay / uni-pay plugin
- ✅ `uniapp-uni-push` — uni-push offline push + WeChat 订阅消息
- ✅ `uniapp-theming` — dark mode, color tokens, brand override
- ✅ `uniapp-migration` — Taro / native MP / Vue 2 → uni-app, Vue 3 → uvue
- ✅ `uniapp-plugin-authoring` — uni_modules plugin development + UTS native plugins
- ✅ `uniapp-ui-libraries` — comparison + integration for uView / FirstUI / ThorUI / Wot / uv-ui / etc.

**Shipped in v1.3**:
- ✅ `uniapp-mp-automation` — automated build→launch→debug workflow via weixin-devtools-mcp MCP server
- ✅ `uniapp-scaffolder` — CLI scaffolder with curated registry, tag filtering, and HBuilderX marketplace fallback

## Reference file state

In v1.0, **all content is inline in each `SKILL.md`** for self-containedness. The
`references/` and `examples/` paths listed in some SKILL.md files are *planned for
v1.1* — the SKILL.md works as-is and the agent / reader should not expect those files
to exist yet. Each SKILL.md marks planned files with a `*planned*` annotation inline.
In v1.4, all content remains inline; `uniapp-mp-automation` ships runtime scripts in
`scripts/` but no extracted `references/` yet.

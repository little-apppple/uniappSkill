# Uni-app Skills — Complete Set

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

> Plus the pre-existing **`uniapp-project`**** skill (already in your Claude skills
> directory) — a reference catalog of all uni-app built-in components, uni-ui components,
> and APIs. Use it for per-component / per-API lookup. The skills above are the
> **workflow / pattern** layer that sits on top.
>
> **Note:** `uniapp-project` is a separate skill that is NOT part of this collection — it
> must be installed independently. If you don't have it, use the
> [official uni-app documentation](https://uniapp.dcloud.net.cn/) as a fallback for
> component/API reference.

## How to install

### Option A: Copy to a Claude skills directory

Each skill is a self-contained folder with `SKILL.md` at its root. Copy the folders
into any of the following:

- **Global skills** (available to all projects): `C:\Users\Administrator\.claude\skills\`
- **Project skills** (per-project): `<project>/.claude/skills/`
- **Mavis skills**: `C:\Users\Administrator\.mavis\skills\`

```bash
# Example: copy all skills to global Claude skills directory
for /d %s in (d:\workspace\mySkills\uniapp-skills\uniapp-*) do xcopy /E /I "%s" "C:\Users\Administrator\.claude\skills\%~nxs"
# Or copy individual skills:
xcopy /E /I uniapp-skills\uniapp-architect "C:\Users\Administrator\.claude\skills\uniapp-architect"
xcopy /E /I uniapp-skills\uniapp-fundamentals "C:\Users\Administrator\.claude\skills\uniapp-fundamentals"
xcopy /E /I uniapp-skills\uniapp-routing-and-tabbar "C:\Users\Administrator\.claude\skills\uniapp-routing-and-tabbar"
xcopy /E /I uniapp-skills\uniapp-state-and-data "C:\Users\Administrator\.claude\skills\uniapp-state-and-data"
xcopy /E /I uniapp-skills\uniapp-network-layer "C:\Users\Administrator\.claude\skills\uniapp-network-layer"
xcopy /E /I uniapp-skills\uniapp-ui-patterns "C:\Users\Administrator\.claude\skills\uniapp-ui-patterns"
xcopy /E /I uniapp-skills\uniapp-platform-config "C:\Users\Administrator\.claude\skills\uniapp-platform-config"
xcopy /E /I uniapp-skills\uniapp-performance "C:\Users\Administrator\.claude\skills\uniapp-performance"
xcopy /E /I uniapp-skills\uniapp-debugging-and-publishing "C:\Users\Administrator\.claude\skills\uniapp-debugging-and-publishing"
xcopy /E /I uniapp-skills\uniapp-testing "C:\Users\Administrator\.claude\skills\uniapp-testing"
xcopy /E /I uniapp-skills\uniapp-mp-automation "C:\Users\Administrator\.claude\skills\uniapp-mp-automation"
```

Restart Claude / your client to pick them up.

### Option B: Use as a project-local skill set

Copy the entire `uniapp-skills/` folder into your project's `.claude/skills/`. The
agent will see them when working on that project.

```bash
# In your uni-app project
mkdir -p .claude/skills
cp -r uniapp-skills/* .claude/skills/
```

### Option C: Wire into `mavis`

```bash
# Register all skills at once
mavis skill add <skill-folder-path>
```

Or copy into the `mavis` agent's skills directory:
`C:\Users\Administrator\.mavis\agents\mavis\skills\`

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

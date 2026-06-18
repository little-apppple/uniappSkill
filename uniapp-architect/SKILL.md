---
name: uniapp-architect
description: "Entry-point orchestrator for uni-app development skills. Use this skill FIRST when the user starts a uni-app task, asks which template/framework to pick, or describes a cross-cutting feature. Loads the right sub-skills based on the task (project setup, routing, state, network, UI patterns, platform config, performance, debugging/publishing, testing, i18n, cloud backend, payments, push, theming, migration, plugin authoring, UI library selection) and gives a decision tree for Vue2 vs Vue3 vs uni-app x (uvue) and HBuilderX vs CLI. Do NOT use this skill for pure component/API lookup — go straight to `uniapp-project` (the existing component+API catalog)."
license: Complete terms in LICENSE.txt
---

## What this skill does

This is the **meta-skill** for uni-app development. It does not answer uni-app questions
directly — it routes the user (or the agent) to the right specialized sub-skill, and gives
a small set of cross-cutting decisions that the other skills depend on:

1. **Framework choice** — Vue2 (legacy) vs Vue3 vs uni-app x (uvue + UTS)
2. **Tooling choice** — HBuilderX (visual IDE) vs CLI (`vue-cli` / `vite` + `dcloudio/uni-preset-vue`)
3. **Sub-skill routing** — which of the 17 sibling skills to load for a given task

If you (the agent) already know which sub-skill applies, jump straight to it. Load this
skill only when the user's intent is ambiguous, when they ask for an overall architecture
review, or when they ask "where do I start".

## When to use this skill

- The user just said "I want to build a uni-app" or "we're starting a new uni-app project"
- The user asks which framework version, template, or IDE to use
- The user describes a feature that spans multiple sub-domains (e.g. "build a logged-in
  shopping cart with persistence and offline support" — touches routing, state, network,
  storage, UI patterns)
- The user asks for an architecture/code review of a uni-app project
- The user is migrating Vue2 → Vue3 or Vue3 → uni-app x

## When NOT to use this skill

- "How do I use `<image>` / `<button>` / `uni.request` / `uni.showToast`?" → use `uniapp-project` (existing component/API catalog)
- "What does `rpx` mean?" → quick answer, no skill needed
- "Give me a uView UI snippet" → use `uniapp-ui-patterns` (or the `uniapp-project` examples for `uni-ui`)
- Web/H5 React/Vue not related to uni-app → use a different skill entirely

## Sub-skills in this set

| Skill | When to load |
|---|---|
| `uniapp-fundamentals` | New project, project structure questions, `pages.json` / `manifest.json` / `App.vue` / `main.js` / `main.ts` config, Vue2 vs Vue3 vs uvue choice, lifecycle hooks, `easycom`, `uni.scss`, `uni_modules` |
| `uniapp-routing-and-tabbar` | Page jump / `navigateTo` / `redirectTo` / `reLaunch` / `switchTab` / `navigator` component, `tabBar` config, custom navigation bar, page params, page stack limits, deep link |
| `uniapp-state-and-data` | Pinia (or legacy Vuex) setup, `uni.setStorage` strategy, persistence across launches, user session, global state across pages |
| `uniapp-network-layer` | `uni.request` wrapper, interceptors (auth token, error toast, retry), `uni.uploadFile` / `uni.downloadFile`, timeout, concurrency, file upload to OSS/cos |
| `uniapp-ui-patterns` | List pages, pull-to-refresh, infinite scroll, form pages (input/picker/uploader), skeleton screens, empty/error states, popup/dialog/toast patterns, custom nav bar implementation |
| `uniapp-platform-config` | `manifest.json` per-platform keys, WeChat MP appid/permission, App iOS/Android signing & module config, H5 router/base, ByteDance/Alipay/Baidu/QQ MP differences, conditional compilation (`#ifdef`) |
| `uniapp-performance` | Startup optimization, first-screen loading, long list (`recycle-view` / `uni-list` / virtual list), image lazy-load, `subPackages` / `preloadRule`, when to use `nvue` / `uvue` / plain `vue` |
| `uniapp-debugging-and-publishing` | H5 debug, mini-program debug, real-device debug, vConsole, common error codes, `miniprogram-ci` upload, App cloud/local build, H5 deploy, hot update (wgt/wgtu), GitHub Actions / GitLab CI for uni-app |
| `uniapp-testing` | Vitest unit + component, Playwright on H5, miniprogram-automator on MP, real-device App QA, CI matrix |
| `uniapp-mp-automation` | 小程序构建→启动→调试自动化，npm build，appid 确认，DevTools 启动，31 项操作（连接/页面/交互/断言/导航/脚本/控制台/网络/调试）通过本地 helper daemon（`mp-debug-helper.js`，Bash + curl 调用），无需 MCP 客户端，CI/CD 集成 |
| `uniapp-i18n` | Built-in locale API, vue-i18n integration, lazy loading, RTL, server coordination |
| `uniapp-cloud` | uniCloud functions, cloud database (JQL), cloud storage, uni-id auth, uni-cloud-router, schema permissions, deployment |
| `uniapp-payments` | WeChat Pay (MP/H5/App), Alipay, Apple Pay, Google Pay, uni-pay plugin, refunds |
| `uniapp-uni-push` | uni-push offline push, WeChat MP 订阅消息, push token management, segmentation |
| `uniapp-theming` | Light/dark/auto theme switching, color tokens, system theme detection, UI library integration, brand override |
| `uniapp-migration` | Taro → uni-app, native WeChat MP → uni-app, Vue 2 → Vue 3, Vue 3 → uni-app x |
| `uniapp-plugin-authoring` | uni_modules plugin structure, package.json, easycom.json, multi-platform support, UTS native plugins, publish to DCloud market |
| `uniapp-ui-libraries` | Comparison and integration for uView Plus / FirstUI / ThorUI / Wot Design Uni / uv-ui / vk-uview-ui / Tuniao / ColorUI / GraceUI |

> The pre-existing `uniapp-project` skill (component + API catalog with examples/references)
> stays the **reference** for "how do I use component X or API Y". The 19 skills above are
> the **workflow / pattern** layer that sits on top.

## References in this skill

- `references/decision-tree.md` — explicit flow chart for the agent (or a developer
  reading this for the first time) on which sub-skill to load
- `references/platform-matrix.md` — per-platform capability matrix (which `uni.*` API
  works where, and where you need `#ifdef` branches)

## Known coverage gaps (v1.0 → v1.2)

This set is **complete for the most common uni-app workflows** (scaffold → build → ship
to MP + H5 + App + Harmony, with auth, payments, push, theming, tests, i18n, and
plugin authoring). Items below are still deferred to a future version.

| Scenario | Where to look today | Plan for v1.3+ |
|---|---|---|
| **Testing** (Vitest, Playwright on H5, `miniprogram-automator` for MP) | ✅ Shipped in v1.1: `uniapp-testing` skill | — |
| **i18n / multi-language** | ✅ Shipped in v1.1: `uniapp-i18n` skill | — |
| **uniCloud + uni-id** | ✅ Shipped in v1.1: `uniapp-cloud` skill | — |
| **uni-push** (push notifications) | ✅ Shipped in v1.2: `uniapp-uni-push` skill | — |
| **Payments** (WeChat Pay / Alipay / Apple Pay / Google Pay) | ✅ Shipped in v1.2: `uniapp-payments` skill | — |
| **Dark mode / theming** | ✅ Shipped in v1.2: `uniapp-theming` skill | — |
| **Taro / native MP → uni-app migration** | ✅ Shipped in v1.2: `uniapp-migration` skill | — |
| **uni_modules plugin authoring** | ✅ Shipped in v1.2: `uniapp-plugin-authoring` skill | — |
| **Third-party UI library ecosystem** (uView / FirstUI / ThorUI / Wot / etc.) | ✅ Shipped in v1.2: `uniapp-ui-libraries` skill | — |
| **App version update UX** | `wgt` hot-update covered in `uniapp-debugging-and-publishing`; "force update on first launch" UX is not | Add a `references/app-version-update.md` to `uniapp-debugging-and-publishing` |
| **Analytics / tracking** | Not covered | Add a `references/analytics.md` (Sensors, umeng, baidu-tongji, sensors-data, plus WeChat MP analytics) |
| **TypeScript advanced patterns** | Scattered across skills | New `uniapp-typescript` reference covering type-safe routing, type-safe Pinia, `defineProps` patterns, `@dcloudio/types` deep dive |
| **Error reporting** (Sentry) | Mentioned in `uniapp-debugging-and-publishing` | Add a `references/error-reporting.md` to `uniapp-debugging-and-publishing` |
| **uni-ai** (DCloud AI SDK) | Not covered | Defer until uni-ai GA |

**Working assumption for v1.2**: for any of the above "future" scenarios, the agent
should say "I don't have a dedicated skill for this yet" rather than improvising. The
architect skill exists precisely to make this transparent.

## Reference files: shipped vs inline

Many SKILL.md files list `references/<name>.md` and `examples/<name>.vue` paths. In
v1.2, **all content is inline in the SKILL.md** — the paths are aspirational for a
future version where we'll split out standalone files for easier copy-paste. The "When
to use this skill" and full content are not gated on those splits; the SKILL.md is
self-contained.


## Cross-cutting decision: framework version

Pick **before** scaffolding the project. This decision propagates to routing, state
management, and platform config.

| If you need… | Pick | Why |
|---|---|---|
| Maximum stability, broadest plugin support, fastest path for legacy projects | **Vue 2** | Most `uni-ui`, `uView 1.x`, and third-party plugins still target Vue 2. HBuilderX stable channel. |
| Modern DX, `<script setup>`, Pinia, better TS, mainstream for new projects in 2024–2025 | **Vue 3** | Default in `dcloudio/uni-preset-vue#vite`. HBuilderX alpha channel for non-H5 platforms. |
| Native performance, write-once native UIs, plan to ship to HarmonyOS, single-language (UTS) for app & Vue layer | **uni-app x (uvue + UTS)** | Replaces `nvue`. UTS compiles to Kotlin / Swift / ArkTS. Still maturing — some plugins and IDE features are alpha. |

**Default recommendation for new projects in 2025**: **Vue 3 + Vite + Pinia** unless the
user has a hard reason to use Vue 2 (existing code, required plugin) or uni-app x (Harmony
target, or app-only with extreme performance needs).

> See `uniapp-fundamentals/references/vue2-vs-vue3-vs-uvue.md` for the full comparison
> (component API mapping, lifecycle name changes, plugin support matrix).

## Cross-cutting decision: tooling

| If the user is… | Pick | Notes |
|---|---|---|
| Coming from native WeChat MP dev, prefers visual IDE, wants the least yak-shaving for App build (cloud build for apk/ipa) | **HBuilderX** | Built-in uni-app template picker, run-to-phone in one click, cloud build for App. Locked to the HBuilderX-bundled compiler. |
| Coming from web/Node background, wants `git` diffs in a normal editor, needs CI/CD with `npm run build:*`, wants to use VS Code | **CLI** (`@dcloudio/uni-preset-vue#vite` + `vite`/`vue-cli`) | Full control, but App build for APK/IPA still requires HBuilderX or a manual native shell project. |

> The two are **not exclusive** — many teams scaffold with the CLI and open the project in
> HBuilderX only when they need to run on a device or build an App.

## Routing logic for the agent

When a user request comes in, apply this in order:

1. **Is it a pure component/API lookup?** → `uniapp-project` (existing skill). Stop here.
2. **Is the user starting fresh or making an architecture decision?** → `uniapp-architect` (this skill), then `uniapp-fundamentals`.
3. **Is the user touching one specific layer?** Go to that skill directly:
   - Project structure / config files / `pages.json` / `manifest.json` / lifecycle → `uniapp-fundamentals`
   - Page navigation / tabBar / deep link → `uniapp-routing-and-tabbar`
   - Pinia / storage / global data → `uniapp-state-and-data`
   - `uni.request` / `uni.uploadFile` / interceptors / API layer → `uniapp-network-layer`
   - List / form / pull-refresh / popup / skeleton / empty state → `uniapp-ui-patterns`
   - Multi-platform deployment / WeChat appid / iOS signing / conditional compile → `uniapp-platform-config`
   - Slow / lag / big bundle / many items / first paint → `uniapp-performance`
   - Bug / crash / upload / publish / CI → `uniapp-debugging-and-publishing`
   - Unit tests / mocking `uni.*` / E2E on H5 / MP automation / CI for tests → `uniapp-testing`
   - MP 构建后自动化调试 / DevTools 自动化 / MCP 调试脚本 → `uniapp-mp-automation`
   - Multi-language / language switcher / RTL / locale formatting → `uniapp-i18n`
   - uniCloud functions / cloud DB / cloud storage / uni-id auth / deployment → `uniapp-cloud`
   - WeChat Pay / Alipay / Apple Pay / Google Pay / refunds → `uniapp-payments`
   - Push notifications (offline push / WeChat 订阅消息) → `uniapp-uni-push`
   - Dark mode / theme switching / brand colors → `uniapp-theming`
   - Migrate Taro / native MP / Vue 2 to uni-app, or Vue 3 to uvue → `uniapp-migration`
   - Package reusable code as a uni_modules plugin / UTS native plugin → `uniapp-plugin-authoring`
   - Pick / install / configure a third-party UI library (uView / FirstUI / ThorUI / Wot / etc.) → `uniapp-ui-libraries`
4. **Spans multiple layers?** Load the orchestrator (`uniapp-architect`) first, then load each
   relevant sub-skill in sequence, in the order above. Don't load all 19 at once — load on demand.
5. **Code review / refactor of an existing project?** Start with `uniapp-architect` to get
   the high-level lay of the land, then drill into the specific layer being reviewed.

## Quick "where do I start" recipes

**"I want to build a WeChat MP from scratch"**
→ `uniapp-architect` (this skill) → `uniapp-fundamentals` → `uniapp-platform-config` (WeChat MP) → `uniapp-routing-and-tabbar` → `uniapp-ui-patterns`

**"I have an existing Vue 2 uni-app, help me migrate to Vue 3"**
→ `uniapp-architect` → `uniapp-fundamentals/references/vue2-vs-vue3-vs-uvue.md` → `uniapp-state-and-data` (Vuex → Pinia)

**"The list page janks when there are 1000+ items"**
→ `uniapp-performance` (long-list section inline) → optionally `uniapp-platform-config`
(`#ifdef` for `nvue` switch — inline in SKILL.md)

**"How do I deploy my uni-app to App Store / Google Play / domestic Android stores"**
→ `uniapp-platform-config` (iOS/Android signing — inline) → `uniapp-debugging-and-publishing`
(publish flow — inline)

**"I want to use uView UI / ThorUI / FirstUI"**
→ `uniapp-ui-libraries` for the comparison + install + configure. Component-level
reference comes from each library's docs.

**"I want to add tests to my uni-app"**
→ `uniapp-testing` (Vitest + Playwright on H5 + `miniprogram-automator` for MP). For TDD
process / generic test patterns, also load the `tdd` skill from your set.

**"I need multi-language support (zh-CN, en, ja, etc.)"**
→ `uniapp-i18n` — pick built-in API for small apps, `vue-i18n` for production. Persist
the chosen locale via `uniapp-state-and-data` (Settings store).

**"I want a serverless backend / auth / file storage without setting up a server"**
→ `uniapp-cloud` — uniCloud functions + JQL database + cloud storage + uni-id auth. If
you already have a traditional backend, skip this and use `uniapp-network-layer` instead.

**"I need to accept payments (WeChat Pay / Alipay / Apple Pay / Google Pay)"**
→ `uniapp-payments` — for most apps, start with the `uni-pay` plugin (covers all four
providers); drop to direct SDK only if you have a specific need.

**"I need push notifications (offline push + WeChat 订阅消息)"**
→ `uniapp-uni-push` — `uni-push` covers App offline push (iOS APNs + Android FCM/OEM);
WeChat MP uses 订阅消息 (separate flow, one-shot per template).

**"I need dark mode / brand-color override"**
→ `uniapp-theming` — defines a token system, integrates with your UI library's theme
variables. Persist the user's choice via `uniapp-state-and-data` (Settings store).

**"I have a Taro + React / native WeChat MP / Vue 2 uni-app — can I move to uni-app?"**
→ `uniapp-migration` — full Taro / native MP / Vue 2 → Vue 3 mapping. For most
projects, "rewrite + port" is faster than mechanical conversion.

**"I want to package my reusable component as a uni_modules plugin and publish it"**
→ `uniapp-plugin-authoring` — directory structure, `package.json`, `easycom.json`, UTS
native plugins, publishing to the DCloud plugin market.

## Resources

- Official docs: https://uniapp.dcloud.net.cn/
- Component catalog: `uniapp-project` skill (需单独安装) — load it for any component/API spec
- API catalog: same `uniapp-project` skill (需单独安装)
- Plugin market: https://ext.dcloud.net.cn/
- uni-app x docs: https://doc.dcloud.net.cn/uni-app-x/
- UTS language: https://doc.dcloud.net.cn/uni-app-x/uts/
- Community Q&A: https://ask.dcloud.net.cn/

## Anti-patterns to flag

- ❌ Mixing Vue 2 and Vue 3 syntax in the same project (choose one at scaffold time)
- ❌ Putting business logic in `App.vue` (it's the shell, not a service layer)

✅ **Correct App.vue pattern (Vue 3)** — only import app lifecycle hooks and thin shell logic:
```vue
<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App launched')
  // Init global config, check login status, etc.
})
</script>

<template>
  <App />
</template>
```
- ❌ Using `wx.xxx` / `my.xxx` / `tt.xxx` platform APIs directly — always go through `uni.xxx` so the same code can compile cross-platform
- ❌ Hard-coding `rpx` to `px` conversion in your head — just write `rpx` and let the framework do the work
- ❌ Fetching user info from `uni.getUserInfo` and trusting it for production — WeChat changed the rules in 2021; use the official `button open-type="chooseAvatar"` and `getUserProfile` pattern (or `uni.login` + server-side session)
- ❌ Calling `uni.getSystemInfoSync` to detect platform — use `uni.getSystemInfo` or, better, `/* #ifdef MP-WEIXIN */` for platform branches

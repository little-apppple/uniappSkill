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
3. **Sub-skill routing** — which of the 19 sibling skills to load for a given task

If you (the agent) already know which sub-skill applies, jump straight to it. Load this
skill only when the user's intent is ambiguous, when they ask for an overall architecture
review, or when they ask "where do I start".

## 能力范围

这个 skill 集覆盖 uni-app 开发的完整工作流：

| 领域 | 覆盖内容 |
|------|---------|
| **项目初始化** | 脚手架搭建、Vue2/Vue3/uvue 框架选择、HBuilderX/CLI 工具链选择 |
| **项目结构与配置** | `pages.json` / `manifest.json` / `App.vue` / `main.js` 配置、easycom、uni.scss、uni_modules |
| **路由与导航** | 页面跳转、tabBar、自定义导航栏、页面参数、深链 |
| **状态管理** | Pinia 集成、持久化存储、登录态管理 |
| **网络层** | `uni.request` 封装、拦截器、401 处理、文件上传下载 |
| **UI 模式** | 列表页、表单、骨架屏、空/错误状态、自定义导航 |
| **多平台配置** | 微信小程序、iOS 签名、Android 权限、条件编译 |
| **性能优化** | 启动优化、长列表、分包、nvue/uvue 选择 |
| **调试与发布** | vConsole、DevTools、构建命令、App/MP/H5 发布、CI/CD |
| **测试** | Vitest 单元测试、Playwright (H5)、miniprogram-automator (MP)、真机测试 |
| **小程序自动化** | 构建后自动调试、DevTools 操作、页面交互断言、截图 |
| **国际化** | 多语言、vue-i18n、RTL |
| **云开发** | uniCloud 云函数、JQL 数据库、云存储、uni-id 鉴权 |
| **支付** | 微信支付、支付宝、Apple Pay、Google Pay |
| **推送** | uni-push 离线推送、微信订阅消息 |
| **主题** | 亮/暗模式切换、品牌色覆盖 |
| **迁移** | Taro/原生小程序 → uni-app、Vue2 → Vue3、Vue3 → uvue |
| **插件开发** | uni_modules 插件结构、UTS 原生插件、发布到插件市场 |
| **UI 库选型** | uView Plus / FirstUI / ThorUI / Wot Design Uni 等对比与集成 |

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
| `uniapp-scaffolder` | List, filter, and fetch starter templates via CLI; curated registry with tag filtering; HBuilderX marketplace fallback |

> The pre-existing `uniapp-project` skill (component + API catalog with examples/references)
> stays the **reference** for "how do I use component X or API Y". The 19 skills above are
> the **workflow / pattern** layer that sits on top.

## 目录结构

```
uniapp-skills/
├── CLAUDE.md                           # 项目级入口 — agent 行为指引
├── README.md / README.zh.md            # 安装说明、skill 目录、设计原则
├── docs/superpowers/                   # scaffolder 设计文档 / 实现计划
├── uniapp-architect/                   # ★ 入口 — 先加载此 skill，路由到其他子 skill
├── uniapp-fundamentals/                # 项目结构、pages.json、manifest.json、Vue 选型
├── uniapp-routing-and-tabbar/          # 页面导航、tabBar、自定义导航栏
├── uniapp-state-and-data/              # Pinia、持久化、登录态
├── uniapp-network-layer/               # uni.request 封装、拦截器
├── uniapp-ui-patterns/                 # 列表/表单/骨架屏/空状态
├── uniapp-platform-config/             # 多平台配置、权限、条件编译
├── uniapp-performance/                 # 启动优化、长列表、分包
├── uniapp-debugging-and-publishing/    # 调试、构建、发布、CI/CD
├── uniapp-testing/                     # Vitest、Playwright、miniprogram-automator
├── uniapp-mp-automation/               # 小程序构建→启动→调试自动化（含 scripts/）
├── uniapp-i18n/                        # 国际化、多语言
├── uniapp-cloud/                       # uniCloud 云函数、JQL 数据库、uni-id
├── uniapp-payments/                    # 微信支付、支付宝、Apple/Google Pay
├── uniapp-uni-push/                    # 离线推送、订阅消息
├── uniapp-theming/                     # 亮/暗主题、品牌色
├── uniapp-migration/                   # Taro/原生 MP/Vue2 → uni-app 迁移
├── uniapp-plugin-authoring/            # uni_modules 插件开发
├── uniapp-ui-libraries/                # 第三方 UI 库选型与集成
└── uniapp-scaffolder/                  # Node.js CLI + 模板注册表（含 scripts/ + tests/）
```

每个子 skill 包含 `SKILL.md` 作为主体内容。`references/` 和 `examples/` 目录为计划中的拆分，目前大部分内容内联在 `SKILL.md` 中。`uniapp-mp-automation/scripts/` 和 `uniapp-scaffolder/` 是可执行代码目录。

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

## 使用约束

### Agent 行为约束

1. **不要同时加载所有子 skill** — 根据路由逻辑按需加载，避免 token 浪费。
2. **当用户意图跨多个领域时**：先加载本 skill（orchestrator），再按依赖顺序依次加载相关子 skill。
3. **当用户意图明确针对某一层时**：直接加载对应子 skill，跳过本 skill。
4. **不要用本 skill 回答组件/API 用法** — 用 `uniapp-project` skill。
5. **不要在本 skill 内完成具体实现** — 路由到对应子 skill 后再进行编码。

### 架构约束

1. **框架版本在脚手架阶段选定后不要混用** — Vue2 和 Vue3 语法不要出现在同一项目中。
2. **不要将业务逻辑放在 `App.vue`** — 它只是应用外壳，不是服务层。
3. **不要直接使用平台私有 API（`wx.xxx` / `my.xxx`）** — 始终通过 `uni.xxx` 编写跨平台代码。
4. **`appid` 不要硬编码提交到 git** — 使用 HBuilderX 的 manifest UI 或 `.gitignore` 管理。
5. **不要跳过 `pages.json` 注册直接引用页面** — 每个页面必须在 `pages` 数组中声明。

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

## Code review mode

When reviewing a uni-app project (or running `/code-review` against one), scan in
this order. Each item points to the canonical pitfalls section in the relevant
skill — open that section to see the full list and examples.

1. **Project shape** → `uniapp-fundamentals` Best practices #11–13
   - No `app.component()` global registration on MP (causes `up.split is not a function`)
   - No `<script setup>` `defineProps` in uni-app v3 alpha (use options API `export default { props, setup }`)
   - `ref`/`computed`/`reactive` from `'vue'`; `onShow`/`onLoad` from `'@dcloudio/uni-app'`
2. **WeChat MP footguns** → `uniapp-platform-config` Common mistakes #9–12
   - WXSS `*` selector doesn't work — list element types explicitly
   - No `position: sticky` / `backdrop-filter` / `env(safe-area-inset-bottom)` on MP — gate with `#ifndef MP-WEIXIN` or fallback
   - No `custom-style` / `css-text` / `inline-style` as prop names on components
   - No `@font-face` for icons on MP — see icon strategy below
3. **Icons on WeChat MP** → `uniapp-ui-patterns` "Icon strategy on WeChat MP"
   - No Google Fonts / Material Symbols CDN access
   - No inline `<svg>` (compiler drops it) or `@font-face` (WXSS unstable)
   - Stable: pre-rendered PNG via `<image :src>`
4. **Component usage** → `uniapp-ui-patterns`, `uniapp-routing-and-tabbar`
   - List page uses 3-state machine (`loading | empty | error | ready | loading-more | no-more`), not 3 booleans
   - Forms validate inline + dirty-track before nav-away
   - Custom nav bar respects tab bar bottom inset
5. **Network layer** → `uniapp-network-layer` Common pitfalls
   - Auth guard via `useAuthGuard()` instead of token check in every `onLoad`
   - `uni.showToast` title is a string — never pass the whole error object
   - Set explicit `timeout`; default is 60s on App, none on MP
6. **State / storage** → `uniapp-state-and-data` Common mistakes
   - No real secrets in `uni.storage` (it's plaintext)
   - `uni.$off` in `onUnmounted` to avoid memory leaks
   - Theme / locale choice persisted via settings store, not hardcoded
7. **Theming (if dark mode present)** → `uniapp-theming` Common pitfalls
   - Synchronous theme apply in `index.html` (H5) or `onLaunch` first line (MP/App) — no flash
   - CSS variables, not hex values, in components
8. **Testing** → `uniapp-testing` Common pitfalls
   - Mock `uni.*` API (or use a preset)
   - MP tests need WeChat DevTools + `miniprogram-automator` installed in the **user's** project
9. **Build / publish** → `uniapp-debugging-and-publishing` error table
   - `urlCheck: false` left in production (rejection risk)
   - iOS `privacyDescription` / WeChat `permission.scope.*.desc` populated
   - `requiredPrivateInfos` declared for `getLocation` / `chooseMedia`
10. **Performance** → `uniapp-performance` Common mistakes
    - `v-for` items have stable `:key`
    - Images have `mode` + `lazy-load`
    - `subPackages` when main > 2MB

Each numbered section maps to one skill's pitfalls section — drill in for the full
text and fix snippets. If a section has zero matches in the diff, move on; if it
has matches, read the source-of-truth section before suggesting a change.

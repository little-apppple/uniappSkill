---
name: uniapp-fundamentals
description: "Project shape, configuration, and lifecycle for uni-app. Use when starting a new uni-app project, editing pages.json / manifest.json / App.vue / main.js, choosing between Vue 2 / Vue 3 / uni-app x (uvue), wiring up easycom / uni.scss / uni_modules, or asking about the page/component/application lifecycle. Do NOT use for per-component API lookups (use uniapp-project) or routing/tabBar (use uniapp-routing-and-tabbar)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **shape** of a uni-app project. After loading this skill, the agent should be able to:

1. Scaffold a new project (Vue 2 / Vue 3 / uni-app x) — or know the exact command to ask the
   user to run
2. Explain and edit every key in `pages.json`, `manifest.json`, `App.vue`, `main.js`/`main.ts`
3. Pick the right Vue version and toolchain for the user's situation
4. Wire up `easycom` (auto-import), `uni.scss` (global SCSS vars), `uni_modules` (plugin mgmt)
5. Use the right lifecycle hook (application vs page vs component)

If the user's question is *not* about project shape, route to a sibling skill
(`uniapp-routing-and-tabbar`, `uniapp-state-and-data`, etc.) instead of digging deeper
here.

## When to use this skill

- "How do I start a new uni-app project?" / "Which template should I pick?"
- "What goes in `pages.json`?" / "How do I configure the tabBar / globalStyle?"
- "How do I set the app name / icon / version in `manifest.json`?"
- "What's the difference between `App.vue` `onLaunch` and `onShow`?"
- "Should I use Vue 2 or Vue 3?" / "Should I move to uni-app x?"
- "How does `easycom` work?" / "How do I install a `uni_modules` plugin?"
- "Why is my `uni.scss` variable not being picked up?"

## When NOT to use this skill

- "How do I use `<scroll-view>`?" → `uniapp-project`
- "How do I navigate from page A to page B?" → `uniapp-routing-and-tabbar`
- "How do I store user info persistently?" → `uniapp-state-and-data`
- "The bundle is 8MB, what do I do?" → `uniapp-performance`

## Standard project structure

```
my-uniapp/
├── src/
│   ├── pages/                  # 业务页面（每个页面一个目录 + .vue）
│   │   ├── index/
│   │   │   └── index.vue
│   │   └── user/
│   │       └── user.vue
│   ├── pagesA/                 # （可选）分包 A
│   ├── components/             # 业务自定义组件（非 easycom）
│   ├── static/                 # 静态资源（图片、字体）
│   ├── uni_modules/            # 通过插件市场安装的模块（easycom 首选）
│   ├── common/                 # 工具函数、SCSS mixin
│   ├── store/                  # Pinia / Vuex 状态
│   ├── api/                    # 后端接口封装（详见 uniapp-network-layer）
│   ├── App.vue                 # 应用入口组件（应用生命周期）
│   ├── main.js / main.ts       # 应用入口脚本（创建应用实例）
│   ├── manifest.json           # 应用发布配置（名称、图标、appid、权限）
│   ├── pages.json              # 页面路由、tabBar、globalStyle
│   ├── uni.scss                # 内置 SCSS 变量
│   └── env.d.ts                # （TS 项目）环境声明
├── index.html                  # H5 入口模板
├── package.json
├── vite.config.ts / vue.config.js
└── tsconfig.json
```

Conventions worth keeping:

- **`pages/`** holds page-level files. Each page is a folder with a single `.vue` file
  (or just the `.vue` file at `pages/foo.vue`). New pages **must** be registered in
  `pages.json`.
- **`static/`** is copied verbatim to the output, no fingerprinting. Don't put large
  assets here — use CDN or `uniCloud` storage.
- **`uni_modules/`** is the canonical home for plugins from the DCloud plugin market
  (`https://ext.dcloud.net.cn/`). They auto-wire `easycom` and `package.json` deps.
- **`components/`** is for your own components. If you set up `easycom` (recommended),
  you don't need to `import` them in pages — they're auto-discovered by name.

## References in this skill

- `references/vue2-vs-vue3-vs-uvue.md` — framework version decision matrix
- `references/pages-json.md` — full `pages.json` field reference
- `references/manifest-json.md` — full `manifest.json` field reference (per-platform)
- `references/lifecycle.md` — application / page / component lifecycle, Vue 2 vs 3 mapping
- `references/easycom-uni-scss-uni-modules.md` — auto-import, global SCSS, plugin system

## Examples in this skill

- `examples/scaffold-vue3-vite.md` — step-by-step for Vue 3 + Vite CLI ✅ shipped
- `examples/scaffold-uvue.md` — step-by-step for uni-app x (uvue + UTS) ✅ shipped
- `examples/pages-json-full.md` — *planned*: full annotated `pages.json` (all common
  keys); the full schema lives in `references/pages-json.md`
- `examples/manifest-minimal.md` — *planned*: minimal `manifest.json` per platform; the
  full per-platform schema lives in `references/manifest-json.md`

## Core entry files — quick reference

### `App.vue`

The application shell. **Not** a page. Holds:

- App-level lifecycle: `onLaunch` (once, when app launches), `onShow` (foreground), `onHide`
- Global CSS (anything you want available to every page, put it in `App.vue`'s `<style>`)
- App-level providers (Pinia store providers, error boundary, etc.)
- Global event listeners (e.g. `uni.onNetworkStatusChange`)

Do **not** put business logic here. It runs once, can't navigate, and survives all page
changes — but it's not a service layer.

```vue
<script>
// Vue 2 / Options API style — still works in Vue 3
export default {
  onLaunch() {
    console.log('App Launch')
    // e.g. fetch user session, set up global error handler
  },
  onShow() {
    console.log('App Show — back to foreground')
  },
  onHide() {
    console.log('App Hide — to background')
  }
}
</script>

<style>
/* global styles, applied to every page */
page { background: #f5f5f5; }
</style>
```

In Vue 3 with `<script setup>`:

```vue
<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
onLaunch(() => { /* ... */ })
onShow(() => { /* ... */ })
onHide(() => { /* ... */ })
</script>
```

### `main.js` (Vue 2) / `main.ts` (Vue 3 + TS)

Create the app instance, register global plugins, set up error handlers.

```js
// main.js (Vue 2)
import Vue from 'vue'
import App from './App'
import { createPinia } from 'pinia'   // Pinia 2 also works for Vue 2

const app = new Vue({
  ...App
})
app.$mount()

// In Vue 3 with uni-app's createSSRApp, the entry is implicit;
// main.js typically just imports the App and runs side effects.
```

```ts
// main.ts (Vue 3 + uni-app + Vite)
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return { app }
}
```

Notes:

- `createSSRApp` is the uni-app convention because all uni-app targets are SSR-shaped
  (even MP, which is "rendered once, then run on a custom VM"). Don't use plain
  `createApp`.
- Vue 3 + Vite is now the default for new projects.

### `pages.json` — the most important file

Tells uni-app:

1. What pages exist (the `pages` array — first entry is the home page)
2. How they look globally (`globalStyle` — nav bar, background, etc.)
3. What's in the bottom tab bar (`tabBar`)
4. How to split into sub-packages (`subPackages`)
5. Preload rules (`preloadRule`)

```jsonc
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } },
    { "path": "pages/user/user",   "style": { "navigationBarTitleText": "我的" } }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "MyApp",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#F5F5F5"
  },
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#007AFF",
    "backgroundColor": "#FFFFFF",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/user/user",   "text": "我的" }
    ]
  }
}
```

See `references/pages-json.md` for the full field list. Critical things people miss:

- The first page in `pages` is the **home page**. Don't shuffle this casually.
- A page referenced by `tabBar.list` must also exist in `pages`.
- `subPackages` reduces first-load size — see `uniapp-performance`.
- `condition` is for dev-time mocking of "what if I were the launch page" — never use in
  production builds.

### `manifest.json` — the second most important file

App-level config: name, icon, version, appid (per platform), permission descriptions,
launch screen, and platform-specific blocks (`mp-weixin`, `app-plus`, `h5`).

```jsonc
{
  "name": "MyApp",
  "appid": "__UNI__XXXXXXX",  // auto-generated by HBuilderX
  "versionName": "1.0.0",
  "versionCode": 100,
  "transformPx": false,
  "app-plus": {
    "usingComponents": true,
    "splashscreen": { "alwaysShowBeforeRender": true, "waiting": true, "autoclose": true }
  },
  "mp-weixin": {
    "appid": "wx1234567890abcdef",
    "setting": { "urlCheck": false },
    "permission": { "scope.userLocation": { "desc": "用于显示附近的店铺" } }
  },
  "h5": {
    "title": "MyApp",
    "router": { "mode": "history", "base": "/" }
  }
}
```

See `references/manifest-json.md` for the full breakdown. Critical things people miss:

- **`mp-weixin.appid`** is your WeChat MP appid, *not* the DCloud `appid`. Get it from
  https://mp.weixin.qq.com.
- For App, you'll also configure icons, splash, signing — see
  `uniapp-platform-config` (iOS/Android section, inline) for v1.0; a dedicated
  `references/app-ios-android.md` is *planned* for v1.1.
- `transformPx: false` keeps `rpx` from being auto-converted; default is `false` in Vue 3
  and `true` in some legacy templates — verify with the project.

## Framework version — quick decision

| Situation | Recommend |
|---|---|
| Brand-new project, no legacy constraints | **Vue 3 + Vite + Pinia** |
| Need a third-party plugin that hasn't migrated to Vue 3 | **Vue 2** (still supported, fully functional) |
| Target is **HarmonyOS**, or you need maximum App performance with native UI | **uni-app x (uvue + UTS)** |
| Migrating an existing Vue 2 project | **Vue 3** unless blocked by a specific plugin |
| Migrating an existing Vue 3 project to native | **uni-app x** only if you genuinely need native UI performance |

See `references/vue2-vs-vue3-vs-uvue.md` for the complete mapping (lifecycle names, option
vs composition API, plugin support matrix).

## Lifecycle — quick reference

Three lifecycles, often confused:

| Level | Hooks (Vue 3 / `<script setup>`) | What runs |
|---|---|---|
| **App** | `onLaunch`, `onShow`, `onHide`, `onError` | Once per app process (App) or per launch (MP). |
| **Page** | `onLoad`, `onShow`, `onReady`, `onHide`, `onUnload`, `onPullDownRefresh`, `onReachBottom`, `onShareAppMessage`, `onPageScroll`, `onBackPress` | Per page instance, in `pages/.../*.vue` |
| **Component** | Standard Vue hooks: `created`, `mounted`, `updated`, `unmounted` (Vue 3) — plus `onLoad`/`onShow` only on **page** components | Per component instance |

Page-only hooks **don't fire in regular components** — only on the page root `.vue`. If
you want pull-to-refresh, you must put `onPullDownRefresh` in the page, not a child
component.

See `references/lifecycle.md` for the complete list and order, plus Vue 2 → Vue 3
lifecycle name mapping.

## easycom — auto-import for components

Recommended way to consume components in `components/` and `uni_modules/`.

Default rules (in `pages.json`):

```jsonc
{
  "easycom": {
    "autoscan": true,    // scan /components for *.vue
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  }
}
```

With this, you can use `<uni-badge />` in any page without importing it. `easycom` resolves
the path from the component name, so the file path matters:

- `components/uni-badge.vue` → `<uni-badge />`
- `components/my-comp/comp.vue` → `<comp />` (the last segment of the path)

Disable autoscan if you have many unrelated components in `components/`:

```jsonc
{
  "easycom": {
    "autoscan": false,
    "custom": {
      "^my-(.*)": "@/components/my-$1.vue"
    }
  }
}
```

## `uni.scss` — global SCSS variables

Uni-app's `uni.scss` exposes variables you can use anywhere SCSS is allowed. Most projects
add their own brand variables on top:

```scss
/* uni.scss */
@import "@/uni_modules/uview-ui/theme.scss";

/* Your brand */
$brand-color: #007AFF;
$brand-color-light: #4DA3FF;
$text-primary: #1A1A1A;
$bg-page: #F5F5F5;

/* Pre-defined uni-app variables you can override */
/* $uni-color-primary, $uni-text-color, $uni-bg-color, etc. — see official docs */
```

`uni.scss` is **automatically imported** as a global stylesheet — you don't need to
`@import` it in every page.

> **Picking a UI library?** The `uni.scss` overrides above assume uView 2.x's variable
> names. For other libraries (FirstUI / ThorUI / Wot Design Uni / etc.), the variable
> names and override locations differ. See `uniapp-ui-libraries` for the full
> comparison and per-library setup.

## `uni_modules` — plugin management

Canonical home for plugins installed from the DCloud plugin market. Each plugin is its own
folder under `uni_modules/<plugin-id>/` with its own `package.json`, components, and
`easycom.json` for auto-registration.

To install a plugin from the market:

1. In HBuilderX: **Tools → Plugin Import** or click "Import Plugin" on the plugin page.
2. In CLI: download the plugin zip, extract to `src/uni_modules/`, then `npm install` if it
   has a `package.json`.

**Don't** install uni_modules via `npm i xxx` unless the plugin explicitly publishes to
npm. Most uni-app plugins only work via the `uni_modules/` folder structure.

## Best practices

1. **Pick the framework version once, at scaffold time.** Don't mix Vue 2 and Vue 3 in the
   same project.
2. **One page = one `.vue` file** (or one folder if you want to co-locate `.json`/`.scss`).
3. **Always register a new page in `pages.json`** before referencing it. HBuilderX does
   this for you when you right-click → New Page.
4. **Use `easycom`** for any component you'll use in 2+ places. Don't `import` it manually.
5. **Keep `App.vue` minimal.** It's not a place for business logic. Use a Pinia store or
   a service module for that.
6. **Use `rpx` for sizing, not `px`.** `750rpx` = screen width. Scales automatically.
7. **Don't put large assets in `static/`.** Use CDN or uniCloud storage (see
   `uniapp-cloud` for the serverless storage pattern); `static/` is unprocessed and
   unfingerprinted.
8. **Use `subPackages`** when first-load bundle exceeds ~2MB — see `uniapp-performance`.
9. **TypeScript for new projects.** Vue 3 + Vite + TS is the modern default and uni-app
   types are good.
10. **Don't hardcode `appid` in `manifest.json`** for the WeChat MP — use HBuilderX's
    "manifest basics" UI to avoid leaking it to git (or use `.gitignore` if hand-edited).

## Resources

- Official docs: https://uniapp.dcloud.net.cn/
- Project structure: https://uniapp.dcloud.net.cn/tutorial/project.html
- `pages.json` reference: https://uniapp.dcloud.net.cn/collocation/pages.html
- `manifest.json` reference: https://uniapp.dcloud.net.cn/collocation/manifest.html
- `easycom` spec: https://uniapp.dcloud.net.cn/collocation/pages.html#easycom
- `uni_modules`: https://uniapp.dcloud.net.cn/plugin/uni_modules.html
- uni-app x (uvue + UTS): https://doc.dcloud.net.cn/uni-app-x/
- HBuilderX: https://www.dcloud.io/hbuilderx.html
- Plugin market: https://ext.dcloud.net.cn/

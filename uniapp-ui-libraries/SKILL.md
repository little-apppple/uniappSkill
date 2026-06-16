---
name: uniapp-ui-libraries
description: "Third-party UI library ecosystem for uni-app — comparison and integration for the top libraries (uView / uView Plus, FirstUI, ThorUI, Wot Design Uni, uv-ui, Tuniao UI, ColorUI, GraceUI, vk-uview-ui). Use when the user wants to pick a UI library, integrate one (install, configure, theme, easycom), compare features between libraries, or migrate between libraries."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **third-party UI library ecosystem** for uni-app. After loading this skill, the
agent should be able to:

1. Compare the major UI libraries on features, framework support, size, and
   maintenance status
2. Pick the right library for a given scenario
3. Install + configure each of the top libraries
4. Customize theme variables per library
5. Use the right `easycom` config for each library
6. Migrate from one library to another (when needed)
7. Avoid the most common setup pitfalls

If the question is about generic UI design or how to use a specific component, the
**library's own docs** are the right answer. This skill is for **picking and setting
up** a library, not for individual component docs.

## When to use this skill

- "Which uni-app UI library should I use?"
- "How do I install uView Plus / FirstUI / ThorUI?"
- "How do I configure easycom for X library?"
- "How do I customize the theme of X library?"
- "I'm using uView 1.x, should I move to uView Plus / FirstUI?"

## When NOT to use this skill

- "How do I make a list page?" → `uniapp-ui-patterns`
- "How do I install just one component?" → `uniapp-fundamentals` (uni_modules)
- "How do I write my own UI library?" → `uniapp-plugin-authoring`

## The landscape in 2025-2026

These are the libraries that matter. Maintenance status is current as of mid-2025; check
each library's GitHub / DCloud plugin page for the latest.

| Library | Vue 2 | Vue 3 | TS | Components | Bundle | Maintenance | Notes |
|---|---|---|---|---|---|---|---|
| **uni-ui** (DCloud 官方) | ✅ | ✅ | ⚠️ | 60+ | Small | ✅ Active | Default; ships with every uni-app project |
| **uView UI 1.x** | ✅ | ❌ | ⚠️ | 100+ | Medium | ⚠️ Maintenance mode | "Classic" uView; legacy projects only |
| **uView Plus (uView 2.x)** | ✅ | ✅ | ✅ | 110+ | Medium-large | ✅ Active | Vue 3 successor; most popular third-party |
| **vk-uview-ui** | ✅ | ❌ | ❌ | 80+ (fork of 1.8.3) | Medium | ✅ VK maintained | For projects on Vue 2 that want continued updates |
| **FirstUI** | ✅ | ✅ | ✅ | 120+ | Medium-large | ✅ Active | Performance-focused; built-in dark mode |
| **ThorUI** | ✅ | ✅ | ⚠️ | 80+ | Medium | ✅ Active | Clean modern design; dark mode |
| **Wot Design Uni** | ❌ | ✅ | ✅ | 70+ | Medium | ✅ Active | Vue 3 + TS only; ported from Wot Design (h5) |
| **uv-ui** | ✅ | ✅ | ⚠️ | 60+ | Small-medium | ✅ Active | Lightweight Vue 3 uView 2.x alternative |
| **Tuniao UI (图鸟UI)** | ❌ | ✅ | ✅ | 50+ | Medium | ⚠️ Less active | Has mobile + admin templates |
| **ColorUI** | ✅ | ✅ | ❌ | CSS-only | Tiny | ⚠️ Inactive | Pure CSS library, no JS components |
| **GraceUI** | ✅ | ✅ | ⚠️ | 80+ | Medium | ⚠️ Less active | Enterprise focus; strong on forms |

> "Components" = approximate count from each library's docs. Treat as a rough
> indicator, not exact.

## How to choose

The 90% answer: **for a new Vue 3 + TypeScript project in 2025, use `uView Plus`
(`uview-plus` npm) or `FirstUI`**. Both are mature, both have good DX, and both
handle the common cases well.

### Decision tree

```
Starting a new project in 2025?
├─ Yes, Vue 3
│   ├─ Want Vue 3 + TypeScript + modern design? → Wot Design Uni
│   ├─ Want the most popular + battle-tested? → uView Plus
│   ├─ Want dark mode out of the box? → FirstUI
│   ├─ Want lightweight + uView 2.x compatible API? → uv-ui
│   └─ Want admin templates too? → Tuniao UI
│
├─ Yes, Vue 2 (legacy)
│   ├─ New project? Consider Vue 3 instead
│   └─ Existing codebase?
│       ├─ Already on uView 1.x? → stay, or migrate to uView Plus
│       └─ Need ongoing maintenance on Vue 2? → vk-uview-ui
│
├─ No, want lightest possible
│   └─ ColorUI (CSS-only) + custom JS components
│
└─ Building a SaaS / enterprise app?
    └─ GraceUI (if you can find an active version) or FirstUI
```

### Specific recommendations

| Scenario | Library | Why |
|---|---|---|
| Standard e-commerce / social app, Vue 3 | **uView Plus** | Most components, active maintenance, big community |
| Performance-critical app, Vue 3 | **FirstUI** | Optimized for FPS; built-in dark mode |
| Modern TypeScript-first, Vue 3 only | **Wot Design Uni** | TS-first design, atomic CSS |
| Vue 2 legacy | **vk-uview-ui** | Continuation of uView 1.x, actively maintained |
| Quick prototype, low bundle | **uv-ui** | Lightweight uView 2.x compatible |
| Want extensive templates too | **Tuniao UI** | Mobile + admin templates |
| Pure CSS, no JS | **ColorUI** | Tiny, no JS components |

## uni-ui — the DCloud official default

`uni-ui` is built into every uni-app project via the `uni_modules` folder structure.
It's the **safe default** — small, maintained, no extra setup.

### When to use

- You need a few basic components (button, icon, list, badge, etc.)
- Bundle size matters
- You don't want a heavy dependency

### When NOT to use

- You need rich form components (date picker, file uploader with progress, etc.)
- You need chart / map / advanced visualization
- You want a "designed" look out of the box

`uni-ui` is covered by the pre-existing `uniapp-project` skill — see the `uni-ui`
examples folder for usage. Set up `easycom` for it:

```jsonc
// pages.json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  }
}
```

## uView Plus (`uview-plus`)

The most popular third-party UI library. 110+ components, Vue 2 + Vue 3, active
maintenance as of 2025.

### Install

```bash
npm install uview-plus
```

For Vue 3 + Vite + TypeScript, also install the types:

```bash
npm install -D @types/uview-plus  # uview-plus 3.x+ has built-in types, this is only needed for older versions
```

### Configure (Vue 3 + Vite + TypeScript)

`main.ts`:

```ts
import { createSSRApp } from 'vue'
import uViewPlus from 'uview-plus'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(uViewPlus)
  return { app }
}
```

`App.vue` `<style lang="scss">` (must be the **first** import):

```scss
@import "uview-plus/theme.scss";
@import "uview-plus/index.scss";

/* your own globals */
page { background: #f5f5f5; }
```

`vite.config.ts` (Vite needs the alias):

```ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      'uview-plus': path.resolve(__dirname, 'node_modules/uview-plus')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "uview-plus/theme.scss";'
      }
    }
  }
})
```

`pages.json` `easycom`:

```jsonc
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^u-(.*)": "uview-plus/components/u-$1/u-$1.vue"
    }
  }
}
```

### Customize theme

Override the SCSS variables **before** importing uView:

```scss
/* uni.scss (or your own theme file, imported first) */
$u-primary: #5856D6;       /* brand color */
$u-warning: #FF9500;
$u-success: #34C759;
$u-error: #FF3B30;

@import "uview-plus/theme.scss";   /* this will use your overrides */
```

### Common pitfalls

- **`App.vue` style import order matters** — theme before index
- **Vite needs the alias** — without it, `import "uview-plus"` fails
- **`easycom` regex must match the path** — wrong regex = no auto-import

## FirstUI

120+ components, performance-focused, built-in dark mode.

### Install

```bash
npm install firstui-uni

> The npm package `firstui-uni` resolves to the `node_modules/firstui/` directory — no alias needed.
```

### Configure (Vue 3)

`main.ts`:

```ts
import { createSSRApp } from 'vue'
import App from './App.vue'
// FirstUI uses on-demand import via easycom — no global registration needed
import './firstui/style/fui-theme.css'  // theme variables

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
```

`pages.json` `easycom`:

```jsonc
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^fui-(.*)": "firstui/components/firstui/fui-$1/fui-$1.vue"
    }
  }
}
```

### Dark mode

FirstUI has a built-in `fui-dark-mode` class. Apply to the page root:

```vue
<template>
  <view :class="['page', { 'fui-dark-mode': theme.resolved === 'dark' }]">
    <fui-button text="Dark mode button" type="primary" />
  </view>
</template>
```

For app-wide dark mode, see `uniapp-theming` skill.

## ThorUI

80+ components, clean design, dark mode, modern feel.

### Install

```bash
npm install thorui-uni

> The npm package `thorui-uni` resolves to the `node_modules/thorui/` directory — no alias needed.
```

### Configure (Vue 3)

`main.ts`:

```ts
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
```

`pages.json` `easycom`:

```jsonc
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^tui-(.*)": "thorui/components/thorui/tui-$1/tui-$1.vue"
    }
  }
}
```

`App.vue` style:

```scss
@import "thorui/tui-theme.scss";
```

## Wot Design Uni

Vue 3 + TypeScript only. 70+ components, atomic CSS, good for TS-first projects.

### Install

```bash
npm install wot-design-uni
```

### Configure (Vue 3 + TS)

`main.ts`:

```ts
import { createSSRApp } from 'vue'
import WotDesign from 'wot-design-uni'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(WotDesign)
  return { app }
}
```

`pages.json` `easycom`:

```jsonc
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
    }
  }
}
```

Wot Design has solid TS types out of the box; no `@types/` package needed.

## uv-ui

Lightweight uView 2.x compatible. Good if you want uView's API but smaller bundle.

### Install

```bash
npm install uv-ui
```

### Configure (Vue 3)

`main.ts`:

```ts
import { createSSRApp } from 'vue'
import uvUi from 'uv-ui'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(uvUi)
  return { app }
}
```

`vite.config.ts` (alias + SCSS):

```ts
resolve: {
  alias: {
    'uv-ui': path.resolve(__dirname, 'node_modules/uv-ui')
  }
}
```

`App.vue` style:

```scss
@import "uv-ui/style/index.scss";
```

`pages.json` `easycom`:

```jsonc
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uv-(.*)": "uv-ui/components/uv-$1/uv-$1.vue"
    }
  }
}
```

## vk-uview-ui (Vue 2 only)

Active fork of uView 1.8.3, for projects on Vue 2 that need continued maintenance.

### Install

```bash
npm install vk-uview-ui
```

### Configure (Vue 2)

`main.js`:

```js
import Vue from 'vue'
import vkUviewUi from 'vk-uview-ui'
import App from './App'

Vue.use(vkUviewUi)

const app = new Vue({ ...App })
app.$mount()
```

Same `App.vue` SCSS and `pages.json` config as uView 1.x — API is compatible.

## ColorUI (CSS only)

ColorUI is just CSS — no JS components. It's a base design system you build on top
of.

### Use

```html
<view class="bg-blue padding radius text-white">Hello</view>
```

Or import the SCSS variables:

```scss
@import "colorui/main.css";
```

Useful when you want to build your own components but want a coherent design
language underneath.

## How to migrate between libraries

Most libraries have a similar API (button, input, list, etc.), so migrations are
mostly mechanical:

```ts
// uView Plus
<u-button type="primary" @click="onSave">Save</u-button>

// FirstUI
<fui-button text="Save" type="primary" @click="onSave" />

// Wot Design Uni
<wd-button type="primary" @click="onSave">Save</wd-button>
```

The differences are:
- Prefix (`u-` vs `fui-` vs `wd-`)
- Prop names (`text` vs default slot)
- Event names (`click` vs `btnClick`)

A migration approach:

1. **Find / replace** the prefix globally (`u-button` → `fui-button`)
2. **Search for prop differences** — usually a grep catches 90%
3. **Run a full regression test** on each platform
4. **Update `package.json` + lockfile**
5. **Delete the old library's `uni_modules/`**

For an app with 50+ components using the library, expect 1-2 days of mechanical work.

## Common pitfalls (cross-library)

1. **Mixing two libraries** — uView Plus + FirstUI in the same project doubles the
   bundle and the design language. Pick one.
2. **Not testing on real devices** — UI libraries look great in the IDE and broken
   on iOS Safari. Test on a real device.
3. **Not overriding theme variables** — your app will look like everyone else's
   uView Plus app. Spend 10 minutes on the brand colors.
4. **Forgetting `easycom`** — without it, you have to `import` every component
   manually, and the bundle grows.
5. **Ignoring tree-shaking** — many libraries register all components globally. If
   you only use 5, the other 100+ still ship. Use `easycom` for on-demand loading.
6. **Following a tutorial for a different Vue version** — the `main.ts` for Vue 2
   (`new Vue({...})`) is different from Vue 3 (`createSSRApp`). Make sure the
   tutorial matches your project.

## Performance notes

| Library | Approx. minified+gzipped (full import) | With tree-shaking |
|---|---|---|
| uni-ui | ~30 KB | ~10 KB (per component) |
| uView Plus | ~120 KB | ~30 KB (per component via easycom) |
| FirstUI | ~150 KB | ~40 KB |
| ThorUI | ~100 KB | ~25 KB |
| Wot Design Uni | ~80 KB | ~20 KB |
| uv-ui | ~60 KB | ~15 KB |
| ColorUI | ~5 KB (CSS only) | n/a |

These are ballpark — measure on your actual project. Tree-shaking via `easycom` is
the single biggest lever; on-demand import can shrink bundles 5-10x.

## Choosing a Vue version in 2025

If you have a choice: **Vue 3**.

- All major libraries support Vue 3
- Vue 2 reached EOL December 2023; some libraries (Wot Design Uni) are Vue 3 only
- TypeScript support is dramatically better
- `<script setup>` is the future

The exception: if you have a substantial Vue 2 codebase that works, the migration
cost may not be worth it. See `uniapp-migration` skill for migration patterns.

## Resources

- DCloud plugin market (all libraries): https://ext.dcloud.net.cn/
- uni-ui: https://uniapp.dcloud.net.cn/component/uniui/uni-ui.html
- uView 1.x: https://v1.uviewui.com/
- uView Plus (2.x): https://www.uviewui.com/
- FirstUI: https://www.firstui.cn/
- ThorUI: https://thorui.cn/
- Wot Design Uni: https://wot-design-uni.gitee.io/
- uv-ui: https://www.uv-ui.com/
- vk-uview-ui: https://ext.dcloud.net.cn/plugin?id=6692
- Tuniao UI: https://www.kuazhi.com/tuniao
- ColorUI: https://color-ui.com/
- GraceUI: https://www.graceui.com/

## A practical default

If you have no specific reason to pick differently, use this:

- **Vue 3 + Vite + TypeScript + Pinia + uView Plus + uni-id (via uniCloud)**

This combination is the most popular, most documented, and most likely to have
Stack Overflow answers when you hit a snag. It's the path of least resistance for a
new Vue 3 uni-app project in 2025.

---
name: uniapp-migration
description: "Migration TO uni-app — from Taro (React), from native WeChat MP / Alipay MP, from Vue 2 uni-app to Vue 3, and from Vue 3 to uni-app x (uvue). Use when the user wants to migrate an existing Taro project, port a native mini-program, upgrade a Vue 2 uni-app codebase to Vue 3 + Vite, or convert a Vue 3 + uView app to uni-app x. Covers feature parity, code transformation patterns, and gotchas for each migration path."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **migration TO uni-app** patterns. After loading this skill, the agent should be
able to:

1. Migrate a **Taro (React)** project to uni-app + Vue 3
2. Port a **native WeChat MP** (WXML/WXSS/JS) project to uni-app
3. Upgrade an existing **Vue 2 uni-app** to Vue 3
4. Migrate a **Vue 3 + uView 1.x** project to **uni-app x (uvue + UTS)** when native UI
   is needed
5. Spot the parts that don't translate cleanly (uni-app-specific patterns, build
   toolchain differences, platform-specific APIs)

If the question is about how to *start* a new uni-app project, this isn't the right
skill — load `uniapp-fundamentals` instead.

## When to use this skill

- "How do I convert my Taro + React app to uni-app + Vue 3?"
- "How do I port my WeChat MP to uni-app so it can run on H5 and App too?"
- "How do I upgrade my Vue 2 uni-app to Vue 3?"
- "Can I move my uView app to uni-app x for HarmonyOS support?"
- "What features of my existing project will NOT translate cleanly?"

## When NOT to use this skill

- "I'm starting a new project" → `uniapp-fundamentals`
- "How do I deploy?" → `uniapp-debugging-and-publishing`
- "What's the diff between uni-app and Taro?" → generic question; out of scope

## Should you migrate?

Before doing the work, sanity-check the migration:

**Migrate if**:
- You need a target uni-app supports but Taro doesn't (Alipay MP + Harmony in one codebase)
- You want to consolidate around DCloud's ecosystem (uniCloud, uni-push, uniPay)
- Your team prefers Vue over React
- You're hitting Taro-specific issues that uni-app handles better

**Don't migrate if**:
- Your existing project is small (< 5K lines) and not actively being developed
- Taro works for you and the team is productive in it
- The migration cost is more than the expected gain (3+ months of work for a small team)

There's no universal "right" answer. Most migrations are driven by **business need**:
need a new platform (HarmonyOS), need a feature uni-app supports (uniCloud, uni-push),
or team preference.

## Path 1: Taro (React) → uni-app (Vue 3)

The two frameworks have similar goals (cross-platform mini-program / H5 / App) but
different paradigms.

### Conceptual mapping

| Taro (React) | uni-app (Vue 3) |
|---|---|
| `.jsx` / `.tsx` | `.vue` |
| `class App extends React.Component` | `<script setup>` Composition API |
| `useState` | `ref` / `reactive` |
| `useEffect` | `watch` / `onMounted` |
| `useContext` | `provide` / `inject` |
| JSX (e.g. `<View>`) | Vue template (e.g. `<view>` lowercase) |
| `app.config` | `App.vue` + `manifest.json` |
| `app.tsx` for entry | `main.ts` |
| Taro components (`<View>`, `<Text>`, `<Image>`) | uni-app built-in components (`<view>`, `<text>`, `<image>`) |
| Taro UI / NutUI / TDesign | uni-ui / uView / FirstUI |
| Taro's `Taro.xxx` API | uni-app's `uni.xxx` API |
| Taro's `process.env.TARO_ENV` | uni-app's `#ifdef MP-WEIXIN` etc. |
| Redux / Zustand | Pinia |
| Webpack | Vite (recommended) |

### Migration strategy

You have three options:

1. **Rewrite** — start a new uni-app project, port screens one at a time
2. **Strangler** — keep Taro running, add uni-app pages, redirect traffic over time
3. **Co-exist** — both frameworks in the same project (very rare, usually not worth it)

For most teams, **option 1 (rewrite)** is the cleanest. Taro and uni-app are similar
enough that you can port a screen in hours, not days.

### Component-level translation example

**Before (Taro / React)**:

```tsx
// pages/index/index.tsx
import { View, Text, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'

export default function Index() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    Taro.setStorageSync('count', count)
  }, [count])

  return (
    <View className="container">
      <Text>Count: {count}</Text>
      <Button onClick={() => setCount(count + 1)}>+1</Button>
      <Image src="/logo.png" mode="aspectFit" />
    </View>
  )
}
```

**After (uni-app / Vue 3)**:

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="container">
    <text>Count: {{ count }}</text>
    <button @click="count++">+1</button>
    <image src="/static/logo.png" mode="aspectFit" />
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const count = ref(0)
watch(count, (val) => {
  uni.setStorageSync('count', val)
})
</script>
```

Key translation points:
- JSX → Vue template (lowercase custom elements, `@click` instead of `onClick`)
- `useState` → `ref`
- `useEffect` with deps → `watch`
- `@tarojs/taro` → `uni` global (core APIs map 1:1; Taro 3+ also uses direct imports from `@tarojs/components` etc.)
- `className` → `class`

### State management translation

**Taro + Redux**:

```ts
// store/counter.ts
import { createSlice } from '@reduxjs/toolkit'
const counter = createSlice({ name: 'counter', initialState: { value: 0 }, reducers: { increment: s => { s.value++ } } })
export const { increment } = counter.actions
export default counter.reducer
```

**uni-app + Pinia**:

```ts
// store/counter.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const value = ref(0)
  function increment() { value.value++ }
  return { value, increment }
})
```

Pinia is dramatically simpler than Redux for typical apps. The Composition-style
`defineStore` looks like a Vue composable, not a framework.

### Conditional compilation

**Taro**:

```tsx
if (process.env.TARO_ENV === 'weapp') {
  // WeChat MP code
}
```

**uni-app**:

```vue
<!-- #ifdef MP-WEIXIN -->
<view>WeChat MP only</view>
<!-- #endif -->
```

or in script:

```ts
// #ifdef MP-WEIXIN
const code = await new Promise<string>((resolve, reject) => {
  uni.login({ success: l => resolve(l.code), fail: reject })
})
// #endif
```

### Routing

**Taro** uses `@tarojs/router` (or `taro-router`); **uni-app** uses built-in routing
via `pages.json` and `uni.navigateTo`. There's no direct equivalent — you rewire
navigation to use uni-app's API.

### What DOESN'T translate

Some Taro-specific things you'll need to redesign:

- **Taro UI** components — replace with uni-ui / uView / FirstUI
- **Custom Taro plugins** — DCloud has its own plugin ecosystem; you may need to find
  uni-app equivalents
- **Taro's atomic CSS** — uni-app uses SCSS; conversion is usually manual
- **Taro's micro-app / sub-package** — uni-app's `subPackages` is similar but configured
  differently

## Path 2: Native WeChat MP → uni-app

This is the most common migration. The goal: write once, run on WeChat MP + H5 + App.

### Conceptual mapping

| WeChat MP | uni-app |
|---|---|
| `.wxml` | `.vue` (template part) |
| `.wxss` | `.vue` (style part) or `.scss` |
| `.js` (Page) | `.vue` (script part) |
| `.json` (page config) | `pages.json` |
| `app.js` / `app.json` / `app.wxss` | `App.vue` / `main.js` / `manifest.json` |
| `wx.login` / `wx.request` / `wx.getStorage` | `uni.login` / `uni.request` / `uni.getStorage` |
| `wx:for` / `wx:if` | `v-for` / `v-if` |
| `<view>` / `<text>` / `<image>` | Same names (lowercase) |
| `bindtap` / `bindinput` | `@click` / `@input` |
| `data-` (custom data) | `data-` (still works) or `v-bind` |
| Custom components in `components/` | Same, but with `.vue` files |
| `this.setData({ ... })` | `ref` / `reactive` |

### Page-level translation example

**Before (WeChat MP)**:

```html
<!-- pages/index/index.wxml -->
<view class="container">
  <text>Hello, {{ name }}</text>
  <button bindtap="onTap">Tap me</button>
  <view wx:if="{{ showList }}">
    <view wx:for="{{ items }}" wx:key="id" class="item">
      {{ item.name }}
    </view>
  </view>
</view>
```

```js
// pages/index/index.js
Page({
  data: {
    name: 'World',
    showList: true,
    items: []
  },
  onLoad() {
    wx.request({
      url: 'https://api.example.com/items',
      success: (res) => {
        this.setData({ items: res.data })
      }
    })
  },
  onTap() {
    this.setData({ showList: !this.data.showList })
  }
})
```

**After (uni-app)**:

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="container">
    <text>Hello, {{ name }}</text>
    <button @click="onTap">Tap me</button>
    <view v-if="showList">
      <view v-for="item in items" :key="item.id" class="item">
        {{ item.name }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const name = ref('World')
const showList = ref(true)
const items = ref<any[]>([])

onLoad(async () => {
  items.value = await api.getItems()
})

function onTap() {
  showList.value = !showList.value
}
</script>
```

### Page config

**Before** (`pages/index/index.json`):

```json
{
  "navigationBarTitleText": "Home",
  "enablePullDownRefresh": true
}
```

**After** (`pages.json`):

```jsonc
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Home",
        "enablePullDownRefresh": true
      }
    }
  ]
}
```

### Custom component translation

**Before** (`components/my-card/index.json` + `index.wxml` + `index.js` + `index.wxss`):

```json
// index.json
{ "component": true, "usingComponents": {} }
```

```html
<!-- index.wxml -->
<view class="card">
  <text>{{ title }}</text>
  <slot />
</view>
```

```js
// index.js
Component({
  properties: {
    title: { type: String, value: '' }
  }
})
```

**After** (`components/MyCard.vue`):

```vue
<template>
  <view class="card">
    <text>{{ title }}</text>
    <slot />
  </view>
</template>

<script setup>
defineProps<{ title?: string }>()
</script>
```

Plus `easycom` config in `pages.json` to auto-import by name.

### Things that need attention

1. **`<block>`** in WXML — has no direct equivalent in uni-app; use `<template>` for
   multiple-element fragments
2. **`wx.createSelectorQuery()`** — replace with `uni.createSelectorQuery()` (uni-app
   inherits this) or `ref` for component queries
3. **Custom navigation bar** — WeChat MP's `wx.getMenuButtonBoundingClientRect()` is
   available as `uni.getMenuButtonBoundingClientRect()` in uni-app
4. **`<wxs>`** — has no direct equivalent; convert to JS in `<script>` or use a
   `filters` / computed property
5. **Component lifecycle** — `lifetimes: { attached, ready, detached }` in WeChat MP
   becomes `onMounted`, `onReady`, `onUnmounted` in Vue
6. **Behaviors** (`wx.Component({ behaviors: [...] })`) — use Vue's `mixins` or
   Composition API composables
7. **App-level events** (`getApp().globalData`) — use Pinia for shared state instead

### Page lifecycle

| WeChat MP | uni-app |
|---|---|
| `onLoad(options)` | `onLoad((options) => {...})` (same) |
| `onShow` | `onShow` (same) |
| `onReady` | `onReady` (same) |
| `onHide` | `onHide` (same) |
| `onUnload` | `onUnload` (same) |
| `onPullDownRefresh` | `onPullDownRefresh` (same; needs `enablePullDownRefresh: true`) |
| `onReachBottom` | `onReachBottom` (same; uses `onReachBottomDistance`) |
| `onShareAppMessage` | `onShareAppMessage` (same) |

Most lifecycles translate 1:1. The only difference is the API import location.

## Path 3: Vue 2 uni-app → Vue 3 uni-app

This is the simplest migration — same framework, just a major version bump.

### Key changes

1. **Composition API** — you can stay on Options API, but Composition is the future.
   Migrate gradually.
2. **Pinia replaces Vuex** — Pinia is the official state library for Vue 3.
3. **`<script setup>`** — new syntax sugar for Composition API.
4. **Vue 3 lifecycle names** — same hooks, just imported from `vue` instead of as
   options.
5. **Multiple root nodes** — Vue 3 templates no longer require a single root.

### Migration strategy

The DCloud team has a `dcloudio/uni-cli` migration tool. For most apps:

1. **Update tooling first** — change `package.json` to use the Vue 3 + Vite preset
2. **Update `main.js`** — `new Vue({...App})` → `createSSRApp(App)`
3. **Run the build** — fix compilation errors (usually minor)
4. **Migrate components incrementally** — convert Options API to Composition at your
   own pace; they can coexist
5. **Replace Vuex with Pinia** — if you have a large Vuex codebase, do this last
6. **Test on each platform** — especially MP and App, where Vue 3 has different
   runtime characteristics

### Composition API translation

**Before (Options API)**:

```js
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubleCount() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  },
  mounted() {
    console.log('Mounted')
  }
}
```

**After (Composition API)**:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)
function increment() { count.value++ }

onMounted(() => {
  console.log('Mounted')
})
</script>
```

### Pinia migration from Vuex

Vuex 3 → Pinia is largely mechanical. Each Vuex module becomes a Pinia store:

```js
// Vuex 3
const user = {
  state: { name: '', loggedIn: false },
  mutations: {
    setUser(state, payload) { state.name = payload.name; state.loggedIn = true }
  },
  actions: {
    async login({ commit }, creds) {
      const res = await api.login(creds)
      commit('setUser', res)
    }
  }
}
```

```ts
// Pinia
import { defineStore, ref, computed } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const loggedIn = ref(false)
  async function login(creds: any) {
    const res = await api.login(creds)
    name.value = res.name
    loggedIn.value = true
  }
  return { name, loggedIn, login }
})
```

Note: no mutations, no commit types — just `ref` and direct mutation. Pinia is
dramatically simpler.

## Path 4: Vue 3 → uni-app x (uvue + UTS)

This is a more advanced migration. uni-app x is for performance-critical App UIs
using native rendering.

### When this makes sense

- You need to ship to **HarmonyOS** (only uni-app x supports it)
- You have a Vue 3 + uView 2.x app that has scroll performance issues on App
- You want to write native plugins in a single language (UTS → Kotlin/Swift/ArkTS)
- You're willing to accept alpha-channel tooling and a smaller plugin ecosystem

### Migration approach

1. **Don't migrate the whole app at once** — start with the performance-critical
   screens
2. **Co-exist is supported** — uni-app x and regular uni-app can co-exist in the
   same project (different file extensions: `.vue` vs `.uvue`)
3. **Use UTS selectively** — keep your existing JS/Vue for business logic; write new
   screens in UTS only where performance matters

### What changes

| Vue 3 | uvue |
|---|---|
| `<view>` | `<view>` (same) |
| `<text>` | `<text>` (same) |
| `<div>`, `<span>`, `<p>` | ❌ use `<view>`, `<text>` |
| `ref` / `reactive` | Same |
| `<style scoped>` | ❌ limited or no scoped |
| `import { ... } from 'vue'` | `import { ... } from 'vue'` (Vue 3) |
| `import { ... } from 'uni-app'` | `import { ... } from '@dcloudio/uni-app-x'` |
| Native plugins | UTS plugins (`@dcloudio/uts`) |

### Don't migrate if

- You're not targeting HarmonyOS
- Your app is primarily H5 / MP
- The team isn't familiar with native UI concepts
- You'd lose too much by switching (your UI library isn't on uvue yet)

## General migration strategy

For any migration, the recommended order:

1. **Audit the existing codebase** — count lines, identify platform-specific code,
   map dependencies
2. **Set up the new project** — scaffold, configure, run "hello world" on each target
3. **Port utilities first** — request wrapper, auth flow, storage, state management
4. **Port a representative screen** — pick a medium-complexity page, port it
   end-to-end, find all the gotchas
5. **Port screens in priority order** — start with the most important user flows
6. **Keep both running** — Taro + uni-app side-by-side, route users to uni-app
   gradually
7. **Delete the old project** — once all flows are migrated and verified

This is a 1-3 month project for a typical app, depending on size. For larger apps
(50K+ lines), plan for 6+ months with a dedicated team.

## Common pitfalls

1. **Forgetting that `process.env.X` doesn't work the same** — in uni-app, use
   `import.meta.env.X` (Vite) or define a custom variable in `vite.config.ts`
2. **Hardcoding paths** — WeChat MP's `/images/` becomes `static/` in uni-app
3. **Component naming case** — WeChat MP accepts `<View>`, uni-app prefers lowercase
   `<view>` (Vue's HTML-like syntax)
4. **Missing `easycom` config** — without it, you have to manually import every
   component
5. **State management differences** — Redux's immutability rules don't apply in
   Pinia; you mutate refs directly
6. **Taro JSX expressions vs Vue templates** — JSX uses `{x}` for expressions, Vue
   uses `{{ x }}` for text and `v-bind` for attributes
7. **H5 routing 404 on refresh** — uni-app's history mode requires server-side
   rewrite (Nginx `try_files`)
8. **Native module re-implementation** — anything that called `wx.*` / `Taro.*`
   platform-specific APIs needs to be re-checked
9. **Lost in the platform matrix** — uni-app covers more targets than Taro and
   native MP; you may discover new bugs in H5 / App during migration

## Resources

- Taro docs: https://docs.taro.zone/
- WeChat MP docs: https://developers.weixin.qq.com/miniprogram/dev/framework/
- uni-app Vue 2 → 3 migration: https://uniapp.dcloud.net.cn/tutorial/migration-to-vue3.html
- uni-app x: https://doc.dcloud.net.cn/uni-app-x/
- Pinia migration from Vuex: https://pinia.vuejs.org/cookbook/migration-vuex.html
- Vue 3 migration guide: https://v3-migration.vuejs.org/
- dcloudio migration tools: https://github.com/dcloudio/uni-app/issues

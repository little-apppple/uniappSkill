# Vue 2 vs Vue 3 vs uni-app x (uvue) — Decision Guide

This is the **first decision** a new uni-app project makes, and it propagates to every
later choice: state management, plugin support, performance, and platform coverage. Don't
defer it.

## TL;DR (default recommendation)

| Year / context | Pick |
|---|---|
| **2025+, brand-new project, no legacy constraint** | **Vue 3 + Vite + Pinia** |
| Have to use a Vue-2-only plugin (most `uView 1.x`, many `uni-ui` examples) | **Vue 2** |
| Need native performance, HarmonyOS, or "single language for UI + native" | **uni-app x (uvue + UTS)** |
| Migrating an existing Vue 2 uni-app | **Vue 3** unless blocked by a specific plugin |

## Side-by-side

| Dimension | Vue 2 | Vue 3 | uni-app x (uvue + UTS) |
|---|---|---|---|
| Status | Maintenance — HBuilderX 3.x stable | Active development — HBuilderX 4.x alpha channel for non-H5 | Active — HBuilderX 4.31+ |
| `<script>` style | Options API (default) | Options API **or** `<script setup>` (recommended) | Options API or `<script setup>` |
| State (recommended) | Vuex 3 / Pinia 2 | Pinia 2 | Pinia 2 |
| TS support | Decent | First-class | First-class |
| Build tool | `vue-cli` (webpack) | `vite` (default) | `vite` (default) |
| Composition API | ❌ | ✅ | ✅ |
| Custom native UI | `nvue` (weex) | `nvue` (weex) | `uvue` (native renderer) |
| Source of truth for platform code | `#ifdef` + JS | `#ifdef` + JS | `#ifdef` + **UTS** |
| HBuilderX channel | Standard | Alpha (for non-H5) | Alpha |
| Plugin ecosystem maturity | Mature | Mature, but a few stragglers | New, growing |
| App performance | OK | OK | Best (native UI) |
| iOS / Android / HarmonyOS | iOS + Android | iOS + Android | iOS + Android + **HarmonyOS** |
| WeChat / other MP | ✅ | ✅ | ⚠️ (MP support is still WIP) |

## API mapping (Vue 2 → Vue 3)

Most code converts mechanically. The pain points are:

| Vue 2 | Vue 3 equivalent | Notes |
|---|---|---|
| `data() { return { x: 1 } }` | `const x = ref(1)` or `reactive({ x: 1 })` | Use `ref` for primitives, `reactive` for objects |
| `methods: { foo() {} }` | `function foo() {}` inside `<script setup>` | Methods become plain functions |
| `computed: { ... }` | `const c = computed(() => ...)` | Imported from `vue` |
| `mounted() {}` | `onMounted(() => {})` | All Vue 3 lifecycle hooks imported from `vue` |
| `this.$emit('x')` | `const emit = defineEmits(['x']); emit('x')` | Macro, no `this` |
| `props: ['x']` | `defineProps({ x: String })` | Macro, supports type + default |
| `mixins: [...]` | `composables/` (custom hooks) | Composition API replaces mixins |
| `provide / inject` via component options | `provide('key', value)` / `inject('key')` | Same, just function-style |

## App / page lifecycle mapping

These names are different in Vue 2 vs Vue 3, and uni-app adds its own:

| Lifecycle | Vue 2 hook | Vue 3 hook (in `<script setup>`) | Where it runs |
|---|---|---|---|
| App launch | `onLaunch` (option) | `onLaunch` (imported from `@dcloudio/uni-app`) | `App.vue` |
| App foreground | `onShow` | `onShow` | `App.vue` |
| App background | `onHide` | `onHide` | `App.vue` |
| App error | `onError` | `onError` | `App.vue` |
| Page load (with query) | `onLoad(options)` | `onLoad((options) => {...})` | page `.vue` |
| Page show | `onShow` | `onShow` | page `.vue` |
| Page ready (DOM ready) | `onReady` | `onReady` | page `.vue` |
| Page hide | `onHide` | `onHide` | page `.vue` |
| Page unload | `onUnload` | `onUnload` | page `.vue` |
| Pull-to-refresh | `onPullDownRefresh` | `onPullDownRefresh` | page `.vue` (not in components) |
| Reach bottom | `onReachBottom` | `onReachBottom` | page `.vue` |
| Page scroll | `onPageScroll` | `onPageScroll` | page `.vue` |
| Share (WeChat) | `onShareAppMessage` | `onShareAppMessage` | page `.vue` |
| Back press | `onBackPress` | `onBackPress` | page `.vue` |

Page-level hooks **only run on the page root component**, not in child components. If
you need a child component to react to "page showed", use `uni.$emit` / `uni.$on` for
broadcast, or pass a prop.

## State management

| Vue 2 | Vue 3 | uni-app x |
|---|---|---|
| Vuex 3 (state/getters/mutations/actions modules) | Pinia 2 (defineStore, composition-friendly) | Pinia 2 |

If you're starting fresh, **skip Vuex and use Pinia directly** — even on Vue 2. The
`pinia` package supports both, and the API is dramatically simpler. See
`uniapp-state-and-data`.

## Plugin / UI library support

| Library | Vue 2 | Vue 3 | uni-app x |
|---|---|---|---|
| `uni-ui` (DCloud official) | ✅ | ✅ | ⚠️ Most components work; some use `nvue`-only APIs |
| `uView UI 1.x` | ✅ | ❌ | ❌ |
| `uView Plus` | ❌ | ✅ | ❌ |
| `FirstUI` (First-Unicorn) | ✅ | ✅ | ⚠️ Most work |
| `ThorUI` | ✅ | ✅ | ❌ |
| `uv-ui` | ✅ | ✅ | ✅ |
| `vk-uview-ui` | ✅ | ✅ | ❌ |
| `lime-style` | ✅ | ✅ | ✅ (uvue-native) |

**General rule**: Before committing to a UI library, check its README for the matrix.
Don't trust the docs without trying it in your project's actual version.

## HBuilderX channel

| Channel | Vue 2 | Vue 3 | uni-app x |
|---|---|---|---|
| Standard (3.x) | ✅ | ❌ (won't compile) | ❌ |
| Alpha (3.4+) | ✅ | ✅ | ✅ |

If you use HBuilderX for non-H5 builds with Vue 3 or uni-app x, you must run the alpha
build. The CLI (`vite`) works regardless.

## When Vue 2 is still the right answer

- Existing team is fluent in Vue 2 + Vuex
- Required plugin only ships Vue 2 builds
- You have a legacy codebase and the migration cost is real
- The project will never need HarmonyOS and performance is fine

## When Vue 3 is the right answer

- Almost any new project in 2024–2025
- You want `<script setup>` and modern DX
- You want first-class TypeScript
- You want Pinia (simpler than Vuex) and the broader Vue 3 ecosystem (VeeValidate, VueUse, etc.)

## When uni-app x is the right answer

- You need to ship to **HarmonyOS** (only uni-app x supports it natively)
- You need extreme App performance and are willing to use `uvue` (native renderer) instead of webview
- You want to write plugins in **UTS** (compiles to Kotlin / Swift / ArkTS) so a single
  language covers the UI layer, native modules, and platform glue
- You're starting fresh and the alpha-channel warnings don't worry you

**Don't pick uni-app x for an MP-first project yet** — MP support is improving but
several platforms still need `uni-app` (non-x) for full feature coverage. As of late 2025,
uni-app x is mostly an App-only target, with H5/MP being secondary.

## Decision flow chart

```
Are you shipping to HarmonyOS?
└─ Yes → uni-app x
└─ No ↓

Do you have an existing codebase or required Vue-2-only plugin?
└─ Yes → Vue 2
└─ No ↓

Is maximum App performance (smooth 60fps scrolling, heavy native UI) a hard requirement?
└─ Yes, AND you can tolerate alpha tooling → uni-app x
└─ No ↓

Pick Vue 3 + Vite + Pinia + TypeScript.
```

## Resources

- Vue 3 in uni-app: https://uniapp.dcloud.net.cn/tutorial/migration-to-vue3.html
- uni-app x: https://doc.dcloud.net.cn/uni-app-x/
- UTS language: https://doc.dcloud.net.cn/uni-app-x/uts/
- Pinia: https://pinia.vuejs.org/
- HBuilderX alpha: https://www.dcloud.io/hbuilderx-alpha.html

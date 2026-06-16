---
name: uniapp-performance
description: "Performance optimization for uni-app — startup time, first-screen paint, long list rendering, image lazy-load, subPackages / preloadRule, when to use nvue vs uvue vs plain vue, bundle size, and platform-specific perf tips. Use when the user reports slow startup, janky scrolling with many items, large bundle size, or wants to choose between nvue / uvue / vue for a specific screen."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **performance optimizations** specific to uni-app: things you wouldn't find in a
generic Vue performance guide. After loading this skill, the agent should be able to:

1. Diagnose slow startup, janky scrolling, or large bundle size
2. Apply subPackages to shrink first-load
3. Render long lists with `recycle-view` / `uni-list` / virtual scroll
4. Choose between plain `<view>`, `nvue`, and `uvue` for a given screen
5. Optimize images (lazy-load, format, size)
6. Configure preloading rules for sub-packages

## When to use this skill

- "The list page is laggy with 1000+ items"
- "The app takes 3+ seconds to show the first screen"
- "The mini-program bundle is 4MB, exceeding the 2MB limit"
- "Should I use nvue / uvue for the chat screen?"
- "How do I implement image lazy load?"
- "How do I split the app into sub-packages?"

## When NOT to use this skill

- "How do I make a list page?" → `uniapp-ui-patterns`
- "How do I configure the WeChat MP appid?" → `uniapp-platform-config`
- "How do I deploy?" → `uniapp-debugging-and-publishing`
- "How do I split the bundle into sub-packages?" — the *pattern* is here; the
  *configuration* lives in `uniapp-platform-config` (subpackage fields in
  `pages.json`) and `uniapp-fundamentals` (`pages.json` schema)
- "How do I cache server data for offline?" → `uniapp-state-and-data`
  (persistence patterns) plus this skill's caching section

## The performance hierarchy

Uni-app's perf problems usually fall into one of these:

1. **Startup time** — first screen appears late
2. **First-paint time** — first content paints, but layout shifts / skeletons visible
3. **Long list rendering** — scroll jank, especially on mid-range Android
4. **Image loading** — large unoptimized images
5. **Bundle size** — MP / H5 bundle too large
6. **Memory usage** — leaks from un-cleaned-up listeners / images

Each has a different fix. Diagnose first, then apply.

## Startup time

### Measure

- **WeChat MP**: WeChat DevTools → "Performance" panel → record a launch
- **H5**: Chrome DevTools → Performance → record a hard refresh
- **App**: `uni.getPerformance()` returns timing info, or use Android Profiler / Xcode
  Instruments

### Common causes

1. **Large `App.vue` `onLaunch`** — runs before first paint. Move heavy work to a later
   lifecycle or async.
2. **Large first-screen bundle** — the home page imports a lot. Subpackage the rest.
3. **Sync network calls on launch** — block the first render. Use async / lazy.
4. **Many `easycom` components used on first screen** — they all get parsed.

### Fixes

```js
// App.vue
onLaunch(() => {
  // ✅ Synchronous, fast — OK
  user.restoreFromStorage()
  settings.restore()

  // ❌ Network call — delays first paint
  // await api.fetchConfig()

  // ✅ Better — defer to after first paint
  setTimeout(() => {
    api.fetchConfig().catch(() => {})
  }, 100)
})
```

```vue
<!-- Home page — defer non-critical loads -->
<script setup>
onLoad(() => {
  // Critical: fetch list immediately
  fetchList()

  // Non-critical: defer
  setTimeout(() => {
    fetchBanners()
    fetchUserRecommendations()
  }, 500)
})
</script>
```

## First-paint and skeleton timing

A skeleton should appear **immediately** (no async data needed), and the real content
should replace it as data arrives. The skeleton should match the real layout's shape.

```vue
<template>
  <view v-if="state === 'loading'" class="skeleton">
    <view class="sk-banner" />
    <view class="sk-row" />
    <view class="sk-row" />
  </view>
  <view v-else class="real-content">
    <!-- actual data -->
  </view>
</template>
```

Don't show a spinner for >500ms — show a skeleton. The user perceives the skeleton
page as faster because the layout doesn't shift.

## Long list rendering

A list with more than ~50 items starts to jank on mid-range devices. Solutions:

### Option 1: `recycle-view` (DCloud official)

```vue
<template>
  <recycle-view
    :list="list"
    :item-size="120"
    :scroll-y="true"
  >
    <recycle-item v-for="(item, i) in list" :key="i" class="item">
      <!-- item content -->
    </recycle-item>
  </recycle-view>
</template>
```

`recycle-view` only renders items in the visible viewport. Best for very long lists
with uniform item size.

### Option 2: `uni-list` + `uni-list-item`

```vue
<uni-list>
  <uni-list-item
    v-for="item in list"
    :key="item.id"
    :title="item.title"
    :note="item.subtitle"
    :thumb="item.cover"
    clickable
    @click="onTap(item)"
  />
</uni-list>
```

`uni-list` has built-in lazy loading. Easier than `recycle-view` for simple lists.

### Option 3: Progressive rendering with `<scroll-view>` and `v-for`

For when you can't install a library:

```vue
<template>
  <scroll-view scroll-y class="list" @scrolltolower="onReachBottom">
    <view v-for="item in displayList" :key="item.id" class="item">
      {{ item.title }}
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, computed } from 'vue'

const list = ref([])  // full data
const visibleCount = ref(50)

const displayList = computed(() => list.value.slice(0, visibleCount.value))

function onReachBottom() {
  if (visibleCount.value < list.value.length) {
    visibleCount.value += 20
  }
}
</script>
```

This is a **progressive rendering** approach (not true virtualization) — items past
the visible window are still in the DOM. Use for lists <200 items. For larger lists,
use a proper virtual list library or `nvue`/`uvue`.

### Option 4: `nvue` (Vue 2) or `uvue` (uni-app x)

`nvue` uses the **weex native renderer** instead of webview. It supports `<list>` /
`<cell>` with built-in virtualization:

```vue
<!-- pages/chat/chat.nvue -->
<template>
  <list class="list" loadmoreoffset="50">
    <cell v-for="msg in messages" :key="msg.id">
      <text>{{ msg.text }}</text>
    </cell>
  </list>
</template>
```

`uvue` (uni-app x) is the modern equivalent — uses native UI components, 60fps
scrolling on App. MP support is still maturing.

### When to use what

| List size | Recommendation |
|---|---|
| <50 | Plain `<view v-for>` |
| 50–200 | `<scroll-view>` + slice + lazy load more |
| 200–2000 | `recycle-view` or `uni-list` |
| 2000+, smooth scroll required | `nvue` / `uvue` |

## Image optimization

### Lazy load

```vue
<image
  :src="item.cover"
  lazy-load
  mode="aspectFill"
  class="cover"
/>
```

The `lazy-load` attribute defers loading until the image enters the viewport (MP only;
H5 needs `loading="lazy"` and App needs `<image lazy-load>`).

### Format and size

- **WebP** for H5 / App — 30% smaller than JPEG at same quality. iOS 14+, Android 5.0+.
- **AVIF** for new builds — 50% smaller; support varies.
- **CDN with auto-format** — your CDN serves WebP / AVIF if the client supports it.

```html
<img src="https://cdn.myapp.com/cover.jpg?format=webp&w=750" />
```

### Sizing

Don't ship 4K images to mobile. Resize on the server or use a CDN with auto-resize:

```
https://cdn.myapp.com/cover.jpg?w=750&q=80
```

Width = device's CSS pixel width × DPR (usually 2 or 3). Cap at 1080w for most cases.

### Compression

Run images through a compressor on upload (server-side). Aim for <200KB per cover image.

## Subpackages

WeChat MP has a **2MB main package limit** and a **20MB total** limit. Once your main
package exceeds 2MB, the MP refuses to upload.

```jsonc
// pages.json
{
  "subPackages": [
    {
      "root": "pagesA",
      "pages": [
        { "path": "detail/detail", "style": { "navigationBarTitleText": "详情" } }
      ]
    },
    {
      "root": "pagesB",
      "pages": [
        { "path": "settings/settings", "style": { "navigationBarTitleText": "设置" } }
      ]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "wifi",
      "packages": ["pagesA"]   // pre-download pagesA when on home
    }
  }
}
```

Then split your code:

- `src/pages/` — main package (home, tab pages, common)
- `src/pagesA/` — sub-package A
- `src/pagesB/` — sub-package B
- Each subpackage has its own `static/`, components, etc. (Don't share static assets
  across packages — they're copied into each.)

**Important rules**:

- The first page in `pages` (the launch page) MUST be in the main package
- Tab pages MUST be in the main package (not in a subpackage)
- The first page of each subpackage must NOT have the same path as a main-package page

### Subpackage naming strategy

- **By feature** (`pagesA` = shopping, `pagesB` = profile) — clean but harder to manage
- **By user frequency** (`pagesMain` = always visited, `pagesLazy` = rarely) — optimizes
  first-load
- **By tab** (each tab is a subpackage) — common, but breaks the "tab in main package"
  rule unless your tabs are minimal

## Bundle size audit

### WeChat MP

WeChat DevTools shows the bundle size on upload. If you're over 2MB:

1. Check what's in the main package: **WeChat DevTools → 代码依赖分析**
2. Common culprits:
   - Moment.js (use dayjs instead — 97% smaller)
   - Lodash full (use lodash-es with per-method imports)
   - Unused UI library
   - Large images in `static/` (use CDN)

### H5

Run `npm run build:h5` and check `dist/build/h5/static/js/` for size.

```bash
# Quick check
ls -la dist/build/h5/static/js/ | sort -k5 -n -r | head
```

Use Vite's bundle analyzer:

```bash
npm i -D rollup-plugin-visualizer
# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [visualizer({ open: true })]
```

## `nvue` / `uvue` — when to switch

### When `nvue` makes sense (Vue 2 / Vue 3)

- **Long lists (1000+ items)** with smooth scroll requirement
- **Heavy animation** (60fps drawing, complex gesture)
- **Native UI** (e.g. complex map overlays, video chat)
- **App-only** — nvue is for App, not MP or H5

`nvue` is harder to develop — limited CSS subset, no scoped styles, no `<style>` block
in the usual way. Use only for screens where plain `vue` can't hit the perf target.

### When `uvue` makes sense (uni-app x)

- Same as `nvue`, but with full Vue 3 + UTS
- Plus: HarmonyOS support
- Plus: native UI without the weex-era CSS limitations

If you're starting fresh and the alpha tooling doesn't scare you, **prefer `uvue`
over `nvue`** for performance-critical App screens.

### When to NOT use nvue / uvue

- The screen has <200 items
- The screen is on MP (nvue/uvue don't help; use recycle-view or uni-list)
- The team is new to uni-app — start with plain `vue`, optimize later

## Common mistakes

1. **`v-for` over 100 items** without virtualization — janks on mid-range Android
2. **Loading all images eagerly** — slow first paint, bandwidth waste
3. **Sync network calls in `onLaunch`** — delays first paint
4. **Main package > 2MB** on MP — split into subpackages
5. **Moment.js / Lodash full** — use dayjs / lodash-es
6. **Not removing `console.log` in production** — strip with a build plugin
7. **Heavy `computed` on long lists** — every reactive change re-runs the whole list.
   Use `v-memo` (Vue 3) for stable items.
8. **Not setting `image mode`** — images get stretched or cropped wrong; `aspectFill` /
   `widthFix` are usually right
9. **Forgetting `lazy-load`** on cover images in long lists

## References in this skill

> Some references are listed in the v1.0 plan but not yet shipped as separate files. Their
> content is currently **inline in this SKILL.md** for full coverage. They will be split
> out as the docs grow.

- `references/long-list.md` — *planned*: recycle-view, nvue, uvue, virtual scroll details
  (currently inline above)
- `references/subpackage.md` — *planned*: subpackage strategy, naming, preload rules
  (currently inline above; cross-referenced from
  `uniapp-fundamentals/references/pages-json.md` and `uniapp-platform-config`)
- `references/image-opt.md` — *planned*: format, sizing, CDN, lazy-load (currently inline)
- `references/startup.md` — *planned*: first-paint, skeleton, App.vue onLaunch (currently inline)

## Resources

- `recycle-view`: https://uniapp.dcloud.net.cn/component/recycle-view.html
- `uni-list`: https://uniapp.dcloud.net.cn/component/uniui/uni-list.html
- Subpackages: https://uniapp.dcloud.net.cn/collocation/pages.html#subpackages
- WeChat MP main package limit: https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html
- nvue: https://uniapp.dcloud.net.cn/tutorial/nvue-outline.html
- uvue: https://doc.dcloud.net.cn/uni-app-x/

---
name: uniapp-routing-and-tabbar
description: "Page navigation, tabBar configuration, and deep linking in uni-app. Use when the user needs to navigate between pages, configure the bottom tab bar, pass parameters across pages, manage the page stack (10-level limit on mini-programs), implement custom navigation bars, or handle deep links. Covers uni.navigateTo / redirectTo / reLaunch / switchTab / navigateBack, the <navigator> component, tabBar.list config, custom tabBar components, getCurrentPages(), and uni-app's URL scheme handling."
license: Complete terms in LICENSE.txt
---

## What this skill covers

How users (and code) move between pages in a uni-app, and how the chrome around
navigation looks (tab bar, custom nav bar, page title). After loading this skill, the
agent should be able to:

1. Pick the right jump API for a given intent (push, replace, tab switch, re-launch)
2. Configure the `tabBar` in `pages.json` (icons, mid-button, custom component)
3. Implement a custom navigation bar (per-page or app-wide)
4. Pass parameters between pages (URL query, global state, event bus)
5. Manage the **10-level page stack limit** on mini-program platforms
6. Handle deep links (URL scheme, WeChat MP entry, App scene)

If the user's question is about *what data flows through the route* (e.g. "carry the
user's selected items to the checkout page"), defer to `uniapp-state-and-data`. This
skill is about the *mechanics* of getting from A to B.

## When to use this skill

- "How do I navigate to a new page?"
- "How do I pass `id=123` to the detail page?"
- "The mini-program crashes when I push too many pages" (10-level limit)
- "How do I add a tab bar with icons?"
- "How do I hide the native nav bar and make a custom one?"
- "How do I handle the WeChat MP share card?"
- "How do I implement a deep link from SMS / browser into a specific page?"
- "How do I refresh the current page's data when the user comes back from page B?"

## When NOT to use this skill

- "What does `<navigator>` do?" — the basic spec is in `uniapp-project`; load this only
  for advanced patterns (delta back, open-type trade-offs)
- "How do I store user info?" → `uniapp-state-and-data`
- "How do I make a list page?" → `uniapp-ui-patterns`
- "Why does H5 routing 404 on refresh?" → `uniapp-platform-config` (H5 router mode)

## The five jump APIs

| API | Stack effect | Use when |
|---|---|---|
| `uni.navigateTo({ url })` | **Push** — adds a layer | User is drilling down: list → detail → settings |
| `uni.redirectTo({ url })` | **Replace** — swaps current layer | Login → home (don't allow back to login) |
| `uni.reLaunch({ url })` | **Clear all layers** → push this one | Logout, hard reset, error recovery |
| `uni.switchTab({ url })` | Switch to a `tabBar` page | Tapping a tab in the custom tab bar; or programmatic tab switch |
| `uni.navigateBack({ delta })` | Pop `delta` layers | Back button; default `delta=1` |

All return a Promise on Vue 3 (with the success/fail/complete callbacks still available
on Vue 2). Use `await` for the post-jump logic — e.g. refreshing the previous page after
returning from an edit page.

### Choosing the right one — decision tree

```
User taps a link in the current page
├─ Target is a tab bar page
│   └─ → uni.switchTab
├─ Target is deeper in the same flow (list → detail)
│   └─ → uni.navigateTo
├─ Target replaces the current screen (login → home, splash → main)
│   └─ → uni.redirectTo
└─ Target is a hard reset (logout, fatal error)
    └─ → uni.reLaunch

User taps "back" or system back
└─ → uni.navigateBack({ delta: 1 })
```

### Snippet

```js
// Vue 3
async function openDetail(id) {
  await uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  // After returning from detail, refresh this page's data
  await refresh()
}

function logout() {
  uni.reLaunch({ url: '/pages/login/login' })
}

function goToHomeTab() {
  uni.switchTab({ url: '/pages/home/home' })
}
```

```vue
<!-- The declarative <navigator> equivalent -->
<navigator url="/pages/detail/detail?id=123" open-type="navigate">
  <text>Open detail</text>
</navigator>

<!-- open-type values: navigate | redirect | switchTab | reLaunch | navigateBack -->
```

## Page parameters

```js
// Push
uni.navigateTo({ url: '/pages/detail/detail?id=123&from=list' })

// Receiver
onLoad((options) => {
  const id = options.id          // "123"
  const from = options.from      // "list"
  // ...
})
```

Rules:

- Parameters are **strings**. Parse to int / float / JSON yourself.
- For complex objects, serialize as JSON in the URL (with `encodeURIComponent`) — but
  URL length is limited (~32KB on WeChat MP). For larger payloads, use a Pinia store.
- Parameters survive `navigateBack` in reverse — but only if you re-fetch them in
  `onShow` of the previous page.

## The 10-level page stack limit

Mini-program platforms cap the navigation stack at **10 levels** (10 pages deep). Push
an 11th and the call fails with `navigateTo:fail page limit`.

Strategies to stay under the limit:

1. **Use `redirectTo` instead of `navigateTo`** when the user is mid-flow and the new
   page replaces an intermediate one. E.g. list → filter → results: results should
   `redirectTo`, not `navigateTo`, so the back stack is list → results, not
   list → filter → results.
2. **Use `reLaunch` for major flow changes** (login success, logout, error screens).
3. **Use `uni.removeSavedFile` / page removal APIs** where supported (rare; usually
   the better fix is the URL design).
4. **Design the flow with fewer layers** — if you find yourself at depth 5+, you probably
   have an over-nested flow.

`getCurrentPages()` returns the current stack — use it for debugging:

```js
const pages = getCurrentPages()
console.log(pages.length, pages.map(p => p.route))
```

## `tabBar` configuration

The bottom tab bar lives in `pages.json`:

```jsonc
"tabBar": {
  "color": "#7A7E83",
  "selectedColor": "#007AFF",
  "backgroundColor": "#FFFFFF",
  "borderStyle": "black",
  "list": [
    {
      "pagePath": "pages/home/home",
      "text": "首页",
      "iconPath": "static/tab/home.png",
      "selectedIconPath": "static/tab/home_active.png"
    },
    {
      "pagePath": "pages/me/me",
      "text": "我的",
      "iconPath": "static/tab/me.png",
      "selectedIconPath": "static/tab/me_active.png"
    }
  ]
}
```

Critical rules:

- **2 to 5** items in `list` (uni-app enforces this).
- Each `pagePath` **must exist** in the top-level `pages` array. (Subpackage pages are
  not allowed as tab pages.)
- Each `iconPath` / `selectedIconPath` file must exist in the build — typo = missing
  icon, no error message.
- To navigate to a tab page from elsewhere, use `uni.switchTab` (not `navigateTo`).

### Custom tab bar

For full styling control, set `"custom": true` and provide a component. The component
must be registered on each tab page (or via `easycom`) and is responsible for switching
tabs via `uni.switchTab`.

```jsonc
"tabBar": { "custom": true, "list": [/* ... */] }
```

```vue
<!-- components/CustomTabBar.vue -->
<template>
  <view class="tab-bar">
    <view
      v-for="(item, i) in list"
      :key="item.path"
      :class="['tab', { active: current === i }]"
      @click="onTap(item, i)"
    >
      <image :src="current === i ? item.activeIcon : item.icon" class="icon" />
      <text :class="['label', { active: current === i }]">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const list = [
  { path: '/pages/home/home', text: '首页', icon: '/static/tab/home.png', activeIcon: '/static/tab/home_active.png' },
  { path: '/pages/me/me',    text: '我的', icon: '/static/tab/me.png',    activeIcon: '/static/tab/me_active.png' }
]
const current = ref(0)
function onTap(item, i) {
  current.value = i
  uni.switchTab({ url: item.path })
}
</script>

<style>
.tab-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 100rpx; display: flex; background: #fff; }
.tab { flex: 1; text-align: center; padding: 10rpx 0; }
.icon { width: 40rpx; height: 40rpx; }
.label { font-size: 22rpx; color: #7A7E83; }
.label.active { color: #007AFF; }
</style>
```

Then on each tab page:

```vue
<template>
  <view>
    <CustomTabBar />
  </view>
</template>
```

### `midButton` — the center "+" button

```jsonc
"tabBar": {
  "list": [/* 2-4 items */],
  "midButton": {
    "text": "发布",
    "iconPath": "static/tab/plus.png",
    "iconWidth": "50rpx",
    "width": "80rpx",
    "height": "80rpx"
  }
}
```

`midButton` only renders on WeChat MP and App; some platforms ignore it. The tap event
fires `uni.onTabBarMidButtonTap` — handle globally or in `App.vue`'s `onLaunch`.

## Custom navigation bar

The default nav bar is a platform-rendered element above the page. Hide it per-page or
globally and draw your own for full control over appearance, animation, and behavior.

### Per-page

```jsonc
"pages": [
  {
    "path": "pages/detail/detail",
    "style": { "navigationStyle": "custom" }
  }
]
```

### Globally

```jsonc
"globalStyle": { "navigationStyle": "custom" }
```

After this, every page is responsible for its own nav bar. The system back gesture /
button still works, but the back arrow must be drawn by your component.

### Implementing a custom nav bar

```vue
<!-- components/AppNavBar.vue -->
<template>
  <view :style="{ height: statusBarHeight + navBarHeight + 'px' }">
    <view :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view v-if="showBack" class="back" @click="onBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="title">{{ title }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true }
})

const statusBarHeight = ref(20)
const navBarHeight = ref(44)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  // Cap with menu button rect on WeChat MP for precise alignment
  // #ifdef MP-WEIXIN
  const menu = uni.getMenuButtonBoundingClientRect()
  navBarHeight.value = (menu.top - statusBarHeight.value) * 2 + menu.height
  // #endif
})

function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/home/home' })
}
</script>

<style lang="scss" scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fff;
  border-bottom: 1rpx solid $uni-border-color;
}
.back { position: absolute; left: 20rpx; }
.back-icon { font-size: 56rpx; line-height: 44rpx; }
.title { font-size: 32rpx; font-weight: 500; }
</style>
```

See `references/custom-nav-bar.md` (in this skill) for the full implementation with
status bar handling, scroll-driven title, and WeChat MP capsule button alignment.

## Refresh-on-back pattern

Common scenario: edit page saves data, list page should reflect the change after the
user returns.

```js
// pages/edit/edit.vue
async function save() {
  await api.updateItem(form)
  uni.navigateBack({ delta: 1 })
}
```

```js
// pages/list/list.vue — option 1: refresh in onShow
onShow(() => {
  fetchList()  // refetch every time page becomes visible
})
```

```js
// pages/list/list.vue — option 2: await the back navigation
onShow(async () => {
  // re-fetch only if the user actually came from edit
  // (you'd need a flag for this; usually option 1 is fine)
})
```

For MP, `onShow` fires on `switchTab` return too, so it covers all back navigation
patterns. Note: `onLoad` arguments are the page's URL query params at first entry
only — after `navigateBack`, the page re-runs `onShow` but **not** `onLoad`. If
you need fresh params on return, read them via `getCurrentPages()` in `onShow`.

## Deep links

### WeChat MP entry

Configure in `app.json` / `mp-weixin` config:

```jsonc
"mp-weixin": {
  "appid": "wx...",
  "navigateToMiniProgramAppIdList": ["other-app-id"]
}
```

The MP "share card" sets the path + query; receiving app reads via `onLoad(options)`.
WeChat MP also supports "URL Link" and "Short Link" — generate via the WeChat backend
API.

### App URL scheme (iOS / Android)

In `manifest.json` `app-plus.distribute`:

```jsonc
"app-plus": {
  "distribute": {
    "android": {
      "schemes": "myapp"
    },
    "ios": {
      "urltypes": "myapp"
    }
  }
}
```

Then `myapp://pages/detail/detail?id=123` opens the app at that page. Implement the
deep-link handler in `App.vue` `onShow(options)`:

```js
onShow((options) => {
  // options contains the URL params from the deep link
  // options.path is the entry path
  if (options.path) {
    const queryStr = options.query
      ? '?' + Object.entries(options.query).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      : ''
    uni.reLaunch({ url: options.path + queryStr })
  }
})
```

### H5 routing

- **Hash mode** (`router.mode: "hash"`): URLs are `/#/pages/detail/detail`. No server
  config needed; just put a static host.
- **History mode** (`router.mode: "history"`): URLs are `/pages/detail/detail`. Needs
  the server to rewrite unknown paths back to `index.html` (Nginx try_files, etc.).

## Common mistakes

1. **`navigateTo` for tab pages** — fails silently or with `can not navigateTo a tabBar
   page`. Use `switchTab`.
2. **Passing objects without stringifying** — `?obj={...}` doesn't auto-encode. Use
   `encodeURIComponent(JSON.stringify(obj))` and parse on the other side, or use Pinia.
3. **Forgetting `redirectTo` for flow steps** — list → filter → results. If `filter`
   pushes, the back stack is wrong. `filter` should `redirectTo` to `results`.
4. **10-level stack** — diagnose with `getCurrentPages().length` early in development.
5. **Custom nav bar with `tabBar`** — the nav bar must respect the tab bar's bottom
   inset, or content gets hidden behind it. Use `env(safe-area-inset-bottom)` for iPhone
   X+ bottom.
6. **`<navigator open-type="switchTab">` with a wrong URL** — same rule as
   `uni.switchTab`: target must be a `tabBar` page.
7. **Custom nav bar with `position: fixed`** — works, but pages need to add top padding
   equal to the nav bar's height. Or use `padding-top: var(--status-bar-height)`.
8. **Sub-component lifecycle fires before the page** — a child component's
   `mounted` / `created` runs before the parent page's `onLoad`. Don't rely on
   data the page sets up in `onLoad` being available in child components'
   `created`; use `onShow` or a Pinia store instead.
9. **Tab page lifecycle varies by tabBar style and platform** — `switchTab`
   behavior is not uniform:
   - **Native tabBar on MP-WEIXIN**: tab pages are cached; the instance survives
     `switchTab`. State, refs, and listeners persist. Use `onShow` to refresh,
     gate one-shot init with a flag.
   - **Custom tabBar (`tabBar.custom: true`)**: the page instance is recreated
     on each switch; the framework re-mounts the page. Use `onLoad` / `setup`
     for per-activation init.
   - **H5 / App-Plus**: Vue Router / the native stack tears down and rebuilds
     the page on `switchTab`. Lifecycle runs every time.
10. **Custom tab bar uses ordinary `<view>` / `<image>`** — when `tabBar.custom: true`
    the native tab bar is *replaced* by your component (not overlaid), so it
    renders as a normal WebView region. The official WeChat custom-tab-bar demo
    uses ordinary `<view>` / `<image>`. Reach for `<cover-view>` / `<cover-image>`
    *only* when overlaying native components (`<map>`, `<video>`, `<canvas>`,
    `<live-player>` on MP-WEIXIN), not for the tabBar slot itself.
11. **URL query string length limit** — `navigateTo({ url: '/pages/x?data=...' })`
    has a length cap (~32KB on WeChat MP, less in practice). Long payloads in
    the URL silently truncate or fail. For large params:
    - Use a Pinia store (cross-page global state)
    - Or write to `uni.setStorageSync` and read on the destination page
    - Or pass an `id` and re-fetch on the destination

## References in this skill

- `references/page-jump-api.md` — deep dive on the five jump APIs and their edge cases
- `references/tabbar-patterns.md` — icon sizes, mid-button, custom tab bar, badge
- `references/custom-nav-bar.md` — implementing a custom nav bar with capsule button
- `references/deep-link-and-share.md` — URL scheme, share cards, scene values

## Examples in this skill

- `examples/login-redirect.md` — login flow with proper back-stack handling ✅ shipped
- `examples/list-to-detail.md` — *planned*: list page → detail page with params and
  refresh-on-back (the refresh-on-back pattern is in the SKILL.md body)
- `examples/custom-tab-bar.md` — *planned*: full custom tab bar component (the full
  pattern is in `references/tabbar-patterns.md`)

## Resources

- Routing API: https://uniapp.dcloud.net.cn/api/router.html
- Page jump: https://uniapp.dcloud.net.cn/tutorial/navigate.html
- tabBar config: https://uniapp.dcloud.net.cn/collocation/pages.html#tabbar
- Navigator component: https://uniapp.dcloud.net.cn/component/navigator.html
- Custom tab bar: https://uniapp.dcloud.net.cn/collocation/pages.html#custom-tabbar
- WeChat MP deep link: https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-link/urllink.generate.html

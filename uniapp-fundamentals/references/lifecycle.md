# Lifecycle Reference

Three separate lifecycles in uni-app, often confused. **This is one of the most common
sources of bugs** — read this once and you'll save yourself hours of debugging.

## 1. Application lifecycle (in `App.vue` only)

| Hook | When it runs | Typical use |
|---|---|---|
| `onLaunch` | Once when the app process starts (App) / when the MP is first loaded | Fetch user session, set up global state, init third-party SDKs |
| `onShow` | When the app comes to foreground (App) / when the MP becomes visible | Resume audio/video, refresh data, re-check auth |
| `onHide` | When the app goes to background (App) / when the MP hides | Pause timers, save state, release resources |
| `onError` | When an uncaught error fires anywhere in the app | Global error reporter, sentry hook |

In Vue 2 (Options API) and Vue 3 (`<script setup>`), the names are the same. Only the
import location changes:

```js
// Vue 2 + Options
export default {
  onLaunch() { /* ... */ },
  onShow() {},
  onHide() {},
  onError(err) { console.error(err) }
}
```

```vue
<!-- Vue 3 + <script setup> -->
<script setup>
import { onLaunch, onShow, onHide, onError } from '@dcloudio/uni-app'
onLaunch(() => { /* ... */ })
onShow(() => { /* ... */ })
onHide(() => { /* ... */ })
onError((err) => { console.error(err) })
</script>
```

Notes:

- `onLaunch` runs **once** for the whole app lifetime (App) or once per MP launch. Don't
  use it for things that need to re-run on every page show.
- `onShow` in App fires when returning from background; in MP it fires on every
  `navigateTo`/`redirectTo` *back* to the app — but for a *new* page, the page's own
  `onShow` fires, not the app's. Be careful not to double-handle.

## 2. Page lifecycle (in page `.vue` files only)

These hooks run **on the page root component** — putting them in a child component does
nothing. The page root is the `.vue` registered in `pages.json`.

| Hook | When it runs | Typical use |
|---|---|---|
| `onLoad(options)` | Once when the page is created; `options` is the query | Init data, parse `?id=123`, fetch initial data |
| `onShow` | Every time the page becomes visible (incl. back-from-other-page) | Refresh dynamic data, resume animations |
| `onReady` | Once after the first render; DOM is fully laid out | Use refs to access nodes, start animations |
| `onHide` | When the page is covered (navigate to another) | Pause timers, abort in-flight requests |
| `onUnload` | When the page is destroyed (back / reLaunch) | Cleanup, abort requests, save state |
| `onPullDownRefresh` | User pull-to-refresh (only if `enablePullDownRefresh: true`) | Refetch list data, then `uni.stopPullDownRefresh()` |
| `onReachBottom` | Page scrolled to `onReachBottomDistance` from bottom | Pagination / load more |
| `onPageScroll(e)` | Page scrolled (high frequency!) | Show/hide back-to-top, parallax, sticky headers |
| `onShareAppMessage` | User taps the share button (WeChat MP) | Return custom share title/image/path |
| `onShareTimeline` | User taps "Share to Moments" (WeChat MP) | Same |
| `onTabItemTap` | User taps the tab item that's the current page | Refresh tab content |
| `onBackPress(options)` | User hits back button (top-left, hardware, gesture) | Confirm before leaving, `return true` to cancel |
| `onNavigationBarButtonTap` | User taps a button in the nav bar (set in `pages.json`) | Handle nav bar action |
| `onNavigationBarSearchInputChanged` | Search input change in nav (if using `searchInput`) | Live search |
| `onNavigationBarSearchInputConfirmed` | User confirms nav search | Submit search |

### Vue 2 vs Vue 3 — naming

Names are **identical** in Vue 2 and Vue 3. Only the import changes in Vue 3:

```vue
<!-- Vue 3 + <script setup> page -->
<script setup>
import { onLoad, onShow, onReady, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { ref } from 'vue'

const list = ref([])

onLoad((options) => {
  console.log('Page loaded with options:', options)
  fetchInitial()
})

onPullDownRefresh(async () => {
  await fetchInitial()
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  loadMore()
})
</script>
```

### Vue 2 (Options API) equivalent

```js
export default {
  data() { return { list: [] } },
  onLoad(options) { /* ... */ },
  onPullDownRefresh() { /* ... */ },
  onReachBottom() { /* ... */ }
}
```

## 3. Component lifecycle (Vue standard)

These are the **standard Vue 3 / Vue 2** hooks. They run on every component instance,
including the page root. Use them when you want behavior tied to a specific component, not
to a page.

| Vue 3 | Vue 2 | When |
|---|---|---|
| `setup()` | (n/a) | Before component instance is created |
| `onBeforeMount` | `beforeMount` | Before first render |
| `onMounted` | `mounted` | After first render, DOM ready |
| `onBeforeUpdate` | `beforeUpdate` | Before re-render due to reactive data |
| `onUpdated` | `updated` | After re-render |
| `onBeforeUnmount` | `beforeDestroy` | Before removal |
| `onUnmounted` | `destroyed` | After removal |
| `onActivated` / `onDeactivated` | same | KeepAlive cache hit / miss |
| `onErrorCaptured` | `errorCaptured` | Caught a child component error |

Page-only hooks (`onLoad`, `onPullDownRefresh`, etc.) do **not** run in child components.
If a child needs to react to "page show", use `uni.$emit` / `uni.$on`:

```js
// In page
onShow(() => {
  uni.$emit('page-shown', { from: 'index' })
})

// In child component
onMounted(() => {
  uni.$on('page-shown', handler)
})
onUnmounted(() => {
  uni.$off('page-shown', handler)  // always clean up
})
```

## Lifecycle order — what fires when

When a user opens a page for the first time:

```
App.vue:         onLaunch → onShow
Page:            onLoad  → onShow  → onReady
```

When they navigate to page B from page A:

```
Page A:          onHide
Page B:          onLoad  → onShow  → onReady
```

When they come back to page A from B:

```
Page B:          onUnload
Page A:          onShow  (onLoad does NOT fire again)
```

When they hit the home button on App:

```
App.vue:         onHide
(no page events — pages are still in memory)
```

When they resume:

```
App.vue:         onShow
(current page)   onShow  (if visible)
```

## Common mistakes

1. **Putting `onLoad` in a child component.** It does nothing — `onLoad` only fires on
   the page root.
2. **Putting business logic in `onLaunch` that depends on a specific page.** Use a Pinia
   store and let the page `onLoad` read from it.
3. **Forgetting to call `uni.stopPullDownRefresh()`** after handling pull-to-refresh —
   the loading spinner never goes away.
4. **Heavy work in `onShow`.** `onShow` fires often (back-from-other-page, foreground
   resume). If it's expensive, debounce or only do it on `onLoad`.
5. **Forgetting to clean up `uni.$on` listeners** in `onUnmounted`. Memory leak.
6. **Assuming `onLoad` fires again on back-navigation.** It doesn't. Use `onShow` for
   "page became visible" logic.

## Anti-pattern: "I want a single source of truth for refresh"

Don't try to coordinate refresh across many components via lifecycle hooks. Use a Pinia
store and let the consumer read from it. The store is the source of truth; lifecycle is
just a trigger to re-read.

## Resources

- App lifecycle: https://uniapp.dcloud.net.cn/tutorial/app.html#applifecycle
- Page lifecycle: https://uniapp.dcloud.net.cn/tutorial/page.html#lifecycle
- Component lifecycle: standard Vue docs — https://vuejs.org/guide/essentials/lifecycle.html

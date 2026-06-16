# Page Jump API — Deep Dive

The five jump APIs look similar but have meaningfully different stack semantics. Picking
the wrong one causes back-button bugs, page-limit crashes, and "the user can go back to
the splash screen" awkwardness.

## Stack semantics at a glance

```
Initial state:    [A]

uni.navigateTo(B)        → [A, B]
uni.redirectTo(B)        → [B]            (A replaced)
uni.reLaunch(B)          → [B]            (all replaced)
uni.switchTab(B)         → [B]            (if B is tab; otherwise error)
uni.navigateBack(1)      → pop 1
```

## Detailed API reference

### `uni.navigateTo`

```js
uni.navigateTo({
  url: '/pages/detail/detail?id=123',
  animationType: 'slide-in-right',  // 'none' | 'slide-in-right' | 'slide-in-bottom' | 'fade-in' | 'slide-out-right' | ...
  animationDuration: 300,
  events: {                          // receive events from the opened page
    refresh: (data) => { /* ... */ }
  },
  success: () => {},
  fail: (err) => {},
  complete: () => {}
})
```

- **Returns**: Promise (Vue 3) / callback (Vue 2) — Promise is preferred.
- **Page limit**: 10 levels on mini-programs. The 11th call fails.
- **Events**: The opened page can `uni.$emit('refresh', data)` to send back; the opener
  listens via the `events` map. (Also see `uni.$emit` / `uni.$on` for global broadcast.)

### `uni.redirectTo`

Replaces the current page. The user can't go back to the previous page — back goes to
the page *before* the replaced one.

Use when:

- Login success → home (don't allow back to login)
- Splash → main
- One-step form → result (form should not be in the back stack)

### `uni.reLaunch`

Clears the entire stack and opens the given page. Use sparingly — every screen the user
came from is gone.

Use when:

- Logout
- Hard reset after a fatal error
- Switching between "user contexts" (e.g. switching accounts)
- After a major data refresh that invalidates all open pages

### `uni.switchTab`

Jumps to a `tabBar` page. **The target must be a tab page registered in `pages.json`**.
Calling with a non-tab page throws `can not switchTab to a non-tabBar page`.

Use when:

- Tapping a tab item (also from a custom tab bar component)
- Programmatic tab switch (e.g. "go to messages" from a notification)

### `uni.navigateBack`

```js
uni.navigateBack({ delta: 1 })
```

- `delta` defaults to 1.
- On H5, this calls `history.back()` and is subject to browser back behavior.
- On MP, this is a stack pop. Going below 0 throws.
- On App, this is a stack pop.

## Things you can't do (and what to do instead)

### "I want to pass a complex object between pages"

URL params are strings. For complex data:

```js
// Sender — store in Pinia, push page with id
const order = await api.createOrder(payload)
orderStore.setCurrent(order)
uni.navigateTo({ url: `/pages/order/result?orderId=${order.id}` })

// Receiver — read by id, hydrate from store or API
onLoad(({ orderId }) => {
  orderStore.fetchById(orderId)
})
```

Don't do `JSON.stringify` in URLs — long URLs fail on WeChat MP (32KB limit) and look
ugly in share cards.

### "I want to refresh the previous page after this one"

The previous page's `onShow` will fire when you navigate back. Refetch there:

```js
// In the list page
onShow(() => {
  fetchList()
})
```

If the refresh is expensive, gate it with a flag:

```js
// In the list page
const needsRefresh = ref(false)
onShow(() => {
  if (needsRefresh.value) fetchList()
})
// Reset the flag in fetchList's success

// In the edit page — set the flag before pushing
const pages = getCurrentPages()
const prev = pages[pages.length - 2] as any
if (prev?.$vm) prev.$vm.needsRefresh = true
uni.navigateTo({ url: '/pages/edit/edit?id=123' })
```

### "I want to chain navigations (e.g. login → home → profile)"

Use `reLaunch` from login to home, then normal `navigateTo` for further navigation. This
clears the back stack to a clean state.

### "I want to handle a deep link that opens a specific tab"

```js
// In App.vue
onShow((options) => {
  if (options.path?.startsWith('/pages/tab/')) {
    uni.switchTab({ url: options.path })
  }
})
```

## Return value from opened page

To send data back from the pushed page to the opener, use the `events` parameter:

```js
// Opener
uni.navigateTo({
  url: '/pages/picker/picker',
  events: {
    picked: (data) => {
      console.log('user picked:', data)
    }
  }
})
```

```js
// Picker page
const eventChannel = getOpenerEventChannel()  // uni-app helper
function onSelectItem(item) {
  eventChannel.emit('picked', item)
  uni.navigateBack({ delta: 1 })
}
```

This is cleaner than `uni.$emit` because it's scoped to the caller — no global event
namespace pollution.

## Debugging the page stack

```js
const stack = getCurrentPages()
console.log('Page stack depth:', stack.length)
console.log('Routes:', stack.map(p => p.route))
// Output:
// Page stack depth: 3
// Routes: ['pages/home/home', 'pages/list/list', 'pages/detail/detail']
```

The last element is the current page. The second-to-last is the opener (use it for
`eventChannel`).

## Common error messages and fixes

| Error | Cause | Fix |
|---|---|---|
| `navigateTo:fail page limit` | Stack > 10 | Use `redirectTo` / `reLaunch` to slim the stack |
| `navigateTo:fail can not navigateTo a tabBar page` | Wrong API for tab target | Use `switchTab` |
| `switchTab:fail can not switchTab to a non-tabBar page` | Target isn't a tab | Use `navigateTo` |
| `redirectTo:fail can not redirectTo a tabBar page` | Same | Use `switchTab` |
| `navigateBack:fail cannot navigate back at first page` | Already at root | Check `getCurrentPages().length` first |
| `fail page not found` | URL typo or page not registered in `pages.json` | Verify path matches `pages` entry |

## Resources

- Routing: https://uniapp.dcloud.net.cn/api/router.html
- `getOpenerEventChannel`: https://uniapp.dcloud.net.cn/api/router.html#getopenereventchannel
- Page stack introspection: https://uniapp.dcloud.net.cn/api/getCurrentPages.html

# Deep Links, Share Cards, and Scene Values

How users get **into** a specific page in your uni-app: from a WeChat share, a URL
scheme, a push notification, or a search engine. This is the inverse of routing — it's
entry points.

## WeChat MP share cards

### Page-level share

In the page `.vue`:

```vue
<script setup>
import { ref } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

const item = ref({ id: '123', title: '...' })

onShareAppMessage(() => {
  return {
    title: item.value.title,
    path: `/pages/detail/detail?id=${item.value.id}`,
    imageUrl: item.value.coverImage  // optional
  }
})

onShareTimeline(() => {
  return {
    title: item.value.title,
    query: `id=${item.value.id}`,
    imageUrl: item.value.coverImage
  }
})
</script>
```

The two hooks fire when the user taps the share button (friends) or "Share to Moments".
The returned object tells WeChat what to share.

- `title` — share card title
- `path` (for `onShareAppMessage`) — the path the **recipient** opens when they tap.
  Include query params for context.
- `query` (for `onShareTimeline`) — query string for "Share to Moments". The recipient
  opens the **home page** with this query (Moments doesn't deep-link).
- `imageUrl` — optional custom thumbnail (5:4 ratio recommended)

### Global share

If you want a single default share config for all pages, set it in `App.vue`:

```vue
<script setup>
import { onShareAppMessage } from '@dcloudio/uni-app'

onShareAppMessage(() => ({
  title: '快来用 MyApp',
  path: '/pages/home/home'
}))
</script>
```

This is overridden by page-level `onShareAppMessage` if defined.

### Reading share-entry context

When a user opens the app from a share card, the entry page's `onLoad` receives the
query. Use this to:

- Apply the right context (e.g. "viewing the same product the sharer is looking at")
- Track viral attribution (UTM-style)

```js
import { onLoad } from '@dcloudio/uni-app'

onLoad((options) => {
  if (options.from === 'share') {
    // logged in? show content : ask to login
  }
})
```

## WeChat MP — Short Link and URL Link

For sharing outside WeChat (in SMS, email, web pages), generate a "Short Link" or
"URL Link" via the WeChat backend API.

```js
// Server-side (NOT client-side)
POST https://api.weixin.qq.com/wxa/generate_urllink
{
  "path": "/pages/detail/detail",
  "query": "id=123",
  "expire_type": 1,           // 0 = permanent, 1 = time-limited
  "expire_interval": 30       // days
}
```

Returns a URL like `https://wxaurl.cn/xxx`. Tapping it on a phone with WeChat installed
opens the MP at the given path.

For the **WeChat URL Link** (slightly different API):

```js
POST https://api.weixin.qq.com/wxa/generate_url_link
```

## App URL scheme

Define in `manifest.json` `app-plus.distribute`:

```jsonc
"app-plus": {
  "distribute": {
    "android": {
      "schemes": "myapp,myapp-prod"
    },
    "ios": {
      "urltypes": "myapp,myapp-prod"
    }
  }
}
```

iOS `urltypes` format is more elaborate (plist-style); check the official docs. The
above is a shortcut.

### Handling the deep link

In `App.vue`:

```vue
<script setup>
import { onShow } from '@dcloudio/uni-app'

onShow((options) => {
  // options.path is the deep-link target path
  // options.query is the query object
  // options.scene is the launch scene (e.g. 1001 = URL scheme on iOS)

  if (options.path && options.path !== '/') {
    const queryStr = options.query
      ? '?' + Object.entries(options.query).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      : ''
    // Defer to ensure navigation is ready
    setTimeout(() => {
      uni.reLaunch({ url: options.path + queryStr })
    }, 100)
  }
})
</script>
```

### Universal Links (iOS) and App Links (Android)

For a "smarter" deep link that opens the app if installed, falls back to a web page if
not, you need:

- iOS: Apple App Site Association (AASA) file at `https://yourdomain.com/.well-known/apple-app-site-association`
- Android: Digital Asset Links file at `https://yourdomain.com/.well-known/assetlinks.json`

These are configured in your developer console, not in uni-app. Uni-app just receives
the deep link via the same `onShow(options)` mechanism.

## Push notification entry (App + MP)

### App (uni-push)

```vue
<script setup>
import { onShow } from '@dcloudio/uni-app'

// In App.vue
onShow((options) => {
  if (options.path?.startsWith('push:')) {
    const target = options.path.replace('push:', '')
    uni.reLaunch({ url: target })
  }
})
</script>
```

Configure the push payload to include the path. The DCloud uni-push console lets you
send a `payload` JSON; the App receives it and you handle the routing.

### WeChat MP (订阅消息 / 客服消息)

Server-side: send a 订阅消息 with a `miniprogram_state` and `page` parameter:

```json
{
  "touser": "OPENID",
  "template_id": "xxx",
  "page": "pages/detail/detail?id=123",
  "data": { /* ... */ }
}
```

WeChat opens the MP at the given page on tap.

## H5 entry from external source

For H5, you have several entry paths:

### QR code

Generate a QR that points to your H5 URL with a query:

```
https://h5.myapp.com/?utm_source=poster&itemId=123
```

In `App.vue` (H5 branch):

```vue
<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  // #ifdef H5
  const params = new URLSearchParams(location.search)
  const itemId = params.get('itemId')
  if (itemId) {
    uni.reLaunch({ url: `/pages/detail/detail?id=${itemId}` })
  }
  // #endif
})
</script>
```

For multi-environment H5 (dev, staging, prod), use `uni.getSystemInfoSync().host` or a
build-time env var.

### Browser → App

For an H5 page that has a corresponding App, offer an "Open in App" button:

```js
function openInApp() {
  // Try to open the URL scheme
  location.href = 'myapp://pages/detail/detail?id=123'
  // Fall back: stay on H5
  setTimeout(() => {
    // If we're still here, the app didn't open
    uni.showToast({ title: '请先安装 App', icon: 'none' })
  }, 1500)
}
```

This is approximate (the timeout is a guess). For a robust Universal Link / App Link
setup, use the platform mechanisms above.

## Tracking and attribution

For analytics, capture the entry source:

```vue
<script setup>
import { onShow } from '@dcloudio/uni-app'

// In App.vue onShow
onShow((options) => {
  const scene = options.scene ?? 'unknown'
  uni.setStorageSync('last-entry-scene', scene)

  // Forward to analytics
  // @ts-ignore
  wx?.reportAnalytics?.('app_open', { scene })

  // ... route to the right page
})
</script>
```

WeChat scene values: https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html

## Resources

- WeChat MP share: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareAppMessage-Object-object
- WeChat MP URL Link: https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-link/urllink.generate.html
- uni-push: https://uniapp.dcloud.net.cn/unipush/
- URL scheme (App): https://uniapp.dcloud.net.cn/tutorial/app-urlscheme.html
- Universal Links: https://developer.apple.com/ios/universal-links/
- App Links: https://developer.android.com/training/app-links

---
name: uniapp-uni-push
description: "Push notifications in uni-app — uni-push (DCloud's native push service) setup for WeChat MP subscribe messages, App push (offline push via Unipush / OEM push channels), web push, payload handling, and user segmentation. Use when the user needs to send notifications to users, integrate WeChat MP 订阅消息, set up offline push for iOS/Android, handle push click-through to specific pages, or wire up the unipush console."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **push notifications layer** for uni-app. After loading this skill, the agent should
be able to:

1. Set up **uni-push** (DCloud's native push) for App
2. Integrate WeChat MP **订阅消息** (subscribe messages)
3. Handle the **client-side push event flow** (foreground, background, click)
4. Send pushes from your **backend** via uni-push's API
5. Target by **user segments** (tags, aliases)
6. Debug common push issues (offline push, OEM channels, certificate problems)

If the question is about generic push notification concepts (APNs / FCM), this skill
assumes you know the basics. This skill is **uni-app-specific**: DCloud's uni-push
service, App client setup, and the interop with the `uniCloud` backend.

## When to use this skill

- "How do I set up push notifications for my App?"
- "How do I add 订阅消息 to my WeChat MP?"
- "How do I get the user's push token?"
- "How do I send a push from my backend?"
- "How do I handle a push click?"
- "How do I target a specific user segment?"

## When NOT to use this skill

- "How do I deploy?" → `uniapp-debugging-and-publishing`
- "How do I store user data?" → `uniapp-state-and-data`
- "How do I call the WeChat Open API?" → `uniapp-network-layer`

## The four push channels in uni-app

| Channel | What it is | When to use |
|---|---|---|
| **uni-push (offline push)** | DCloud's managed push service: integrates APNs (iOS), FCM (Android), and Chinese OEM push channels (Huawei/Xiaomi/OPPO/vivo/Honor) | Most App installs — server sends one push, uni-push fans it out to the right platform |
| **WeChat MP 订阅消息** | WeChat's subscription-based push (user must opt in once per message type) | WeChat MP for transactional notifications (order updates, etc.) |
| **In-app / online push** | `uni.$emit` / WebSocket for real-time in-app messages | Real-time chat, live updates while the app is open |
| **Web push** | Web Push API for H5 (with `navigator.serviceWorker`) | H5 with service worker + HTTPS |

This skill focuses on **uni-push** and **WeChat MP 订阅消息**. In-app and web push are
generic patterns covered by your existing skills.

## uni-push — the recommended starting point

**uni-push** is DCloud's managed push service. You don't need to integrate APNs, FCM,
and 6 Chinese OEM push channels yourself — uni-push fans out automatically.

### How uni-push works

```
[Your backend]  ──>  [uni-push cloud]   ──>  [APNs (iOS)]
                       │                       [FCM  (Android global)]
                       │                       [Huawei Push / Xiaomi Push / ... (Android China)]
                       └─> tracks client_id per device
                            translates to the right platform token
```

Your backend talks to uni-push's unified API. uni-push handles the platform-specific
plumbing.

### Quick start

1. **Create a uni-push app** in the DCloud console: https://dev.dcloud.net.cn/

2. **Get the appid** — this is different from the DCloud `appid` in `manifest.json`. It
   looks like `aBcD1234...`

3. **Configure `manifest.json`** in your uni-app project:

```jsonc
"app-plus": {
  "distribute": {
    "android": {
      "permissions": [
        "<uses-permission android:name=\"android.permission.INTERNET\"/>",
        "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>",
        "<uses-permission android:name=\"android.permission.WAKE_LOCK\"/>",
        "<uses-permission android:name=\"android.permission.VIBRATE\"/>",
        "<uses-permission android:name=\"android.permission.RECEIVE_BOOT_COMPLETED\"/>",
        "<uses-permission android:name=\"android.permission.GET_TASKS\"/>",
        "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
        "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>"
      ]
    },
    "modules": {
      "Push": {
        "ulappid": "your-unipush-appid"   // from step 2
      }
    },
    "sdkConfigs": {
      "push": {
        "unipush": {
          "appid": "your-unipush-appid",
          "iOSPushEnvironment": "production"   // or "development"
        }
      }
    }
  }
}
```

For iOS, you also need to upload your **APNs certificate** (`.p12` or `.p8`) to the
uni-push console.

### Client-side: get the push token

```ts
import { onLaunch } from '@dcloudio/uni-app'
import { ref } from 'vue'

const pushClientId = ref<string | null>(null)
const pushEnabled = ref(false)

onLaunch(() => {
  // #ifdef APP-PLUS
  // Get the device's push token (client_id in uni-push terms)
  const clientInfo = uni.getPushClientId({
    success: (res) => {
      pushClientId.value = res.cid
      console.log('Push CID:', res.cid)
      // Send this to your backend so you can target this device
    },
    fail: (err) => {
      console.error('Get push CID failed', err)
    }
  })
  // #endif
})

async function onEnablePush() {
  // iOS push consent is automatically requested on first getPushClientId() call.
  // No manual uni.authorize() call is needed — uni-push handles the system prompt.
  // #ifdef APP-IOS
  try {
    const { cid } = await uni.getPushClientId()
    pushClientId.value = cid
    pushEnabled.value = true
  } catch (e) {
    pushEnabled.value = false
  }
  // #endif

  // Android: required permissions must be in manifest (done at install time)
  // #ifdef APP-ANDROID
  pushEnabled.value = true
  // #endif
}
```

Send the `cid` to your backend on login. Store it alongside the user:

```ts
async function onLogin() {
  await user.login(credentials)
  if (pushClientId.value) {
    await api.registerPushToken({ token: pushClientId.value })
  }
}
```

### Handle push events

There are 3 key push events to handle. In App (native) mode, use the `plus.push` API.
For WeChat MP, push arrives via the MP lifecycle instead.

```ts
// In App.vue onLaunch — App native push events
// #ifdef APP-PLUS
// 1. Push received while app is in foreground
plus.push.addEventListener('receive', (msg) => {
  console.log('Push received:', msg.payload)
  // Don't show a system notification — the app is in the foreground
  // Optionally: show an in-app banner
})

// 2. User clicked a push notification
plus.push.addEventListener('click', (msg) => {
  // msg.payload = the JSON data you sent
  const target = msg.payload?.target as string | undefined
  if (target) {
    setTimeout(() => {
      uni.reLaunch({ url: target })  // e.g. '/pages/order/detail?id=123'
    }, 200)  // defer to ensure page navigation is ready
  }
})
// #endif

// 3. WeChat MP: handle push via page lifecycle
// In the page where push data is expected, use:
// onShow((options) => { /* check options for push data */ })
```

> **Note on API changes**: In older uni-app versions (HBuilderX 3.x), push events were
> available as `uni.onPushMessage()` / `uni.onPushClick()`. These are deprecated in
> favor of `plus.push.addEventListener('receive', ...)` / `plus.push.addEventListener('click', ...)`.
> For WeChat MP, push routing is handled via 订阅消息 with a `page` parameter (see below).

In `App.vue` (mounted once):

```vue
<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  // #ifdef APP-PLUS
  plus.push.addEventListener('receive', (msg) => { /* foreground received */ })
  plus.push.addEventListener('click', (msg) => { /* notification clicked */ })
  // #endif
})
</script>
```

### Send a push from the backend

If you're using **uniCloud + uni-push**, the cloud function is one line:

```js
// uniCloud-aliyun/cloudfunctions/send-push/index.js
'use strict'
const uniPush = require('uni-push')

exports.main = async (event) => {
  const { client_id, title, content, payload } = event
  const res = await uniPush.sendMessage({
    payload: {
      title,
      content,
      data: payload           // arbitrary JSON, accessible in onPushClick
    },
    push_clientid: client_id    // can be an array for batch send
  })
  return { code: 0, data: res }
}
```

If you're using a **traditional backend**, use uni-push's REST API:

```js
// POST https://restapi.getui.com/v2/{appid}/push_single
// Or the new open API: https://openapiv2.getui.com/v2/push
const axios = require('axios')

async function sendPush({ appId, appKey, masterSecret, clientId, title, content, payload }) {
  // Get auth token
  const { data: auth } = await axios.post('https://restapi.getui.com/v2/' + appId + '/auth_sign', {
    appkey: appKey,
    timestamp: Date.now(),
    sign: computeSign(...)
  }, { headers: { 'content-type': 'application/json' } })

  // Send push
  const { data } = await axios.post(
    `https://restapi.getui.com/v2/${appId}/push_single`,
    {
      message: {
        app_key: appKey,
        push_info: {
          title,
          content,
          payload
        },
        target: { appId, clientId }
      },
      request_id: Date.now().toString()
    },
    { headers: { token: auth.token, 'content-type': 'application/json' } }
  )
  return data
}
```

### Targeting: aliases and tags

For sending to specific users or segments:

```ts
// Set an alias (typically the user ID)
await uni.setPushAlias({
  alias: userStore.userId,
  cid: pushClientId.value
})

// Add a tag
await uni.subscribePush({
  options: ['new-promotion', 'order-update']
})

// Send to a tag
await uniPush.sendMessage({
  // ...
  filter: { tag: ['new-promotion'] }
})

// Send to a specific user
await uniPush.sendMessage({
  // ...
  filter: { alias: 'user-123' }
})
```

The alias is typically the user ID, so you can target by user without managing tokens
yourself.

## WeChat MP 订阅消息 (subscribe messages)

WeChat MP push is **opt-in**: the user must tap "Always allow" on a button before you
can send them 消息. This is to prevent spam.

### Get the user's subscription state

```ts
async function checkSubscription() {
  // Get current settings
  const { subscriptionsSetting } = await uni.getSetting({
    withSubscriptions: true
  })
  // subscriptionsSetting = { 'order-update': 'accept' | 'reject' | 'ban' | 'filter' | 'unknown' }
  return subscriptionsSetting
}
```

### Request subscription

```vue
<template>
  <button @click="onSubscribe" open-type="subscribe">订阅订单通知</button>
</template>

<script setup>
async function onSubscribe() {
  uni.requestSubscribeMessage({
    tmplIds: ['your_template_id_from_wechat_console'],
    success: (res) => {
      // res = { 'template_id_1': 'accept' | 'reject' }
      if (res['template_id_1'] === 'accept') {
        console.log('用户同意订阅')
      }
    },
    fail: (err) => {
      console.error('订阅失败', err)
    }
  })
}
</script>
```

The `tmplIds` come from your WeChat MP admin console (订阅消息 → 公共模板库 or
你的模板).

> **UX rule**: never ask the user to subscribe on app launch. Wait until they've taken
> an action that justifies the subscription request (e.g. after placing an order, "want
> to be notified when it ships?").

### Send a 订阅消息 from the backend

Server-side, call the WeChat API:

```js
// POST https://api.weixin.qq.com/cgi-bin/message/subscribe/send
const axios = require('axios')

async function sendSubscribeMessage({ accessToken, openid, templateId, data, page }) {
  const { data: res } = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
    {
      touser: openid,
      template_id: templateId,
      page,                       // optional: the MP page to open on click
      data                        // { key1: { value: 'foo' }, key2: { value: 'bar' } }
    }
  )
  // res = { errcode: 0, errmsg: 'ok', msgid: '...' }
  return res
}
```

### One-shot only

WeChat 订阅消息 has a **one-shot** model: after a user accepts, you can send them
**one** message of that template. To send another, you need to ask for subscription
again.

This is by design — WeChat is fighting spam. Plan your UX around it: ask for
subscription at the moment the user takes an action that benefits from a notification
("place order", "subscribe to weekly digest"), not as a blanket permission.

## Push payload format

The payload structure is up to you. The convention:

```ts
interface PushPayload {
  // The page to open on click (e.g. '/pages/order/detail?id=123')
  target?: string
  // Any data the receiving page might need
  [key: string]: any
}
```

Example:

```ts
// Backend
await uniPush.sendMessage({
  payload: {
    title: '您的订单已发货',
    content: '订单 #12345 已由顺丰发出',
    data: {
      target: '/pages/order/detail?id=12345',
      orderId: '12345'
    }
  }
})
```

```ts
// Client
uni.onPushClick((res) => {
  const data = res.data
  if (data.target) {
    uni.reLaunch({ url: data.target })
  }
})
```

## Web push (H5)

H5 push via the **Web Push API** + service worker:

`public/sw.js`:

```js
self.addEventListener('push', (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.content,
      icon: '/icon-192.png',
      data: data.payload
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.target || '/'
  event.waitUntil(clients.openWindow(target))
})
```

Register the service worker on the H5 page:

```ts
// #ifdef H5
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

Web push requires HTTPS and VAPID keys. Not all browsers support it (notably, iOS
Safari added support only in 16.4, with limitations).

## Common pitfalls

1. **Forgetting to enable Push module in `manifest.json`** — without `app-plus.modules.Push`,
   the push SDK isn't bundled. The `uni.getPushClientId` call will fail silently.
2. **iOS APNs certificate mismatch** — your `.p12` cert's `Bundle ID` must match
   your `manifest.json`'s appid prefix. Mismatched certs result in "Push registered but
   never delivered".
3. **Android Huawei / Xiaomi / OPPO / vivo device tokens** — without their OEM push
   channels enabled, your push only works when the app is in the foreground on those
   devices. Enable OEM channels in the uni-push console for full coverage.
4. **WeChat MP 订阅消息 one-shot** — the user can only receive **one** message per
   template per subscription. Asking for subscription again is the only way to send
   more. Plan UX around it.
5. **Push events fire on the wrong page** — `uni.onPushClick` is a global event.
   Make sure to navigate from a global handler (in `App.vue` or a Pinia store) so the
   navigation works regardless of which page is open.
6. **`uni.getPushClientId` returning empty on first call** — sometimes the push
   channel isn't fully connected yet. Retry with a short delay or in `onLaunch`.
7. **Sending the same push 5 times because 5 devices** — use aliases (set to user_id)
   and send to the alias. Each user gets one push, not one per device.
8. **Not handling push click when the app is closed** — the click event fires
   after `onLaunch` has resolved. If you navigate too early, the page stack isn't
   ready. Defer the navigation by a few hundred ms, or wait for `onShow`.

## iOS vs Android differences

| Aspect | iOS | Android |
|---|---|---|
| Push channel | APNs | FCM (global) / OEM channels (China) |
| User consent | Required (system prompt on first launch) | Not required (auto) |
| Silent push | ✅ | ✅ |
| Rich push (image, action buttons) | ✅ with iOS 15+ | ✅ |
| Background handler | `onPushMessage` + `onPushClick` | Same |
| Foreground display | By default, no banner — show your own | By default, banner shows |

For iOS, if you want the **system notification banner** to show even when the app is
in foreground, configure the manifest's `iOSPushForegroundType`:

```jsonc
"app-plus": {
  "sdkConfigs": {
    "push": {
      "unipush": {
        "iOSPushForegroundType": "1"  // show banner in foreground
      }
    }
  }
}
```

## When uni-push isn't enough

uni-push is great for:
- Standard mobile apps that need push
- Apps in China (covers all major OEM push channels)
- Apps that need both iOS and Android with one integration

When to consider alternatives:
- **iOS-only apps with sophisticated push needs** — use APNs directly for fine control
- **Apps with massive scale (>10M users)** — direct integration with FCM/APNs may be
  cheaper (uni-push charges per push at high volume)
- **Apps in industries with strict compliance (finance, healthcare)** — some require
  direct control over the push pipeline

## Resources

- uni-push docs: https://uniapp.dcloud.net.cn/unipush/
- uni-push console: https://dev.dcloud.net.cn/
- WeChat 订阅消息: https://developers.weixin.qq.com/miniprogram/dev/extended/subscribe-message.html
- APNs: https://developer.apple.com/documentation/usernotifications
- FCM: https://firebase.google.com/docs/cloud-messaging
- Web Push: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Individual OEM push docs:
  - Huawei: https://developer.huawei.com/consumer/cn/hms/huawei-pushkit
  - Xiaomi: https://dev.mi.com/console/doc/detail?pId=68
  - OPPO: https://push.oppo.com/
  - vivo: https://dev.vivo.com.cn/documentCenter/doc/365

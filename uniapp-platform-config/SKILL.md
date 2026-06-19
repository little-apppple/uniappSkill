---
name: uniapp-platform-config
description: "Per-platform configuration and cross-platform compatibility in uni-app — manifest.json per platform (WeChat MP appid, iOS/Android signing, H5 router), conditional compilation with #ifdef, permission descriptions, domain whitelists, and platform-specific quirks. Use when the user needs to set up a new platform target, configure signing, fix a 'works on H5 but not on WeChat MP' issue, gate code per platform, or understand which uni.* API works where."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **per-platform differences** that bite you right before launch:

1. WeChat MP: appid, permission descriptions, domain whitelist, `requiredPrivateInfos`
2. App (iOS / Android): signing, certificates, icons, splash, native modules
3. H5: router mode, public path, server-side concerns
4. Other MP: Alipay, Baidu, ByteDance, QQ, Kuaishou — each has its own quirks
5. **Conditional compilation** — the `#ifdef` preprocessor for cross-platform code
6. Platform-specific UI quirks (e.g. iOS safe area, MP cover-view)

After loading this skill, the agent should be able to:

- Configure `manifest.json` for any target platform
- Diagnose "works on H5 but not on MP" issues
- Use `#ifdef` / `#ifndef` to write cross-platform code
- Avoid the most common per-platform footguns

## When to use this skill

- "How do I configure the WeChat MP appid?"
- "How do I sign the iOS app for App Store submission?"
- "How do I add a domain to the WeChat whitelist?"
- "The build works on H5 but fails on MP — what's different?"
- "How do I write code that runs only on iOS?"
- "What permissions do I need for camera access?"

## When NOT to use this skill

- "Which UI library should I use?" → `uniapp-ui-patterns` (or the existing `uniapp-project`)
- "How do I make a list page render fast?" → `uniapp-performance`
- "How do I publish to the App Store?" → `uniapp-debugging-and-publishing` (this skill
  configures the cert; the *upload+submit* step is in that skill)
- "How do I configure pages.json?" → `uniapp-fundamentals/references/pages-json.md`
- "How do I implement a deep link / URL scheme?" → the *manifest.json* side is here;
  the *handler code* lives in `uniapp-routing-and-tabbar/references/deep-link-and-share.md`

## Conditional compilation — the cross-platform escape hatch

Uni-app uses a preprocessor that lets you write platform-specific code:

```vue
<template>
  <view>
    <!-- All platforms -->
    <button @click="onClick">Click me</button>

    <!-- H5 only -->
    <!-- #ifdef H5 -->
    <view class="h5-only">H5 sees this</view>
    <!-- #endif -->

    <!-- Mini-program only (any MP) -->
    <!-- #ifdef MP -->
    <view class="mp-only">MP sees this</view>
    <!-- #endif -->

    <!-- WeChat MP only -->
    <!-- #ifdef MP-WEIXIN -->
    <button open-type="share">Share</button>
    <!-- #endif -->

    <!-- App only (iOS or Android) -->
    <!-- #ifdef APP -->
    <view class="app-only">App sees this</view>
    <!-- #endif -->

    <!-- App-iOS only -->
    <!-- #ifdef APP-IOS -->
    <image src="/static/apple-pay.png" />
    <!-- #endif -->

    <!-- Multiple platforms -->
    <!-- #ifdef MP-WEIXIN || MP-ALIPAY -->
    <view>WeChat or Alipay</view>
    <!-- #endif -->

    <!-- NOT on a platform -->
    <!-- #ifndef H5 -->
    <view>App + MP see this</view>
    <!-- #endif -->
</template>
```

In `<script>`:

```js
export default {
  onLoad() {
    // #ifdef H5
    console.log('H5-only init')
    // #endif

    // #ifdef MP-WEIXIN
    wx.login({ /* ... */ })
    // #endif

    // #ifdef APP  // APP-PLUS is a legacy alias, use APP
    uni.scanCode({ /* uses native scanner */ })
    // #endif
  }
}
```

The preprocessor strips out the non-matching blocks at compile time, so the wrong
code never reaches a platform where it would fail.

### Platform keys

| Key | Meaning |
|---|---|
| `H5` | H5 (browser) |
| `MP` | Any mini-program platform |
| `MP-WEIXIN` | WeChat MP |
| `MP-ALIPAY` | Alipay MP |
| `MP-BAIDU` | Baidu Smart Program |
| `MP-TOUTIAO` | ByteDance (Toutiao / Douyin / etc.) |
| `MP-QQ` | QQ MP |
| `MP-KUAISHOU` | Kuaishou MP |
| `APP` | Any app-platform (iOS or Android) |
| `APP-PLUS` | Legacy alias for `APP` (Vue 2) — still works |
| `APP-ANDROID` | Android only |
| `APP-IOS` | iOS only |
| `APP-HARMONY` | HarmonyOS (uni-app x) |
| `QUICKAPP` | Quick App (legacy) |

### TypeScript awareness

If using TypeScript, the `ifdef` blocks are stripped at compile time, but your editor
may not know that. Use type guards or `@ts-ignore`:

```ts
async function share() {
  // #ifdef MP-WEIXIN
  // Use onShareAppMessage lifecycle for WeChat sharing
  // See: https://uniapp.dcloud.net.cn/api/plugins/share.html#onshareappmessage
  return uni.share({ title: 'Hello' })
  // #endif
  // Fallback
  uni.showToast({ title: 'Not supported on this platform' })
}
```

For Vue 3 + Vite, install `@dcloudio/types` so the platform-specific globals (`wx`,
`my`, `tt`, etc.) are typed.

## WeChat MP — the most common target

### appid and project.config.json

`manifest.json`:

```jsonc
"mp-weixin": {
  "appid": "wx1234567890abcdef",
  "setting": {
    "urlCheck": true,            // true in production
    "es6": true,
    "postcss": true,
    "minified": true
  }
}
```

The actual `project.config.json` is generated by HBuilderX from `manifest.json`. Don't
edit it directly — your changes will be overwritten on the next build.

### Permission descriptions (WeChat MP)

WeChat shows the user a permission prompt with a description you control. Without a
description, the API call fails silently or shows a generic message.

```jsonc
"mp-weixin": {
  "permission": {
    "scope.userLocation":     { "desc": "用于显示附近的店铺" },
    "scope.userInfo":         { "desc": "用于完善个人资料" },
    "scope.address":          { "desc": "用于收货地址" },
    "scope.record":           { "desc": "用于录制语音消息" },
    "scope.album":            { "desc": "用于选择相册图片" },
    "scope.camera":           { "desc": "用于拍摄照片" }
  },
  "requiredPrivateInfos": [
    "getLocation",
    "chooseLocation",
    "chooseMedia"
  ]
}
```

WeChat added `requiredPrivateInfos` in 2022. APIs that touch personal info must be
declared here, or the call fails with a clear error.

### Domain whitelist (server / upload / download)

You can't `uni.request` to arbitrary domains on WeChat MP — only to whitelisted ones.
Configure in **WeChat MP admin console → 开发管理 → 服务器域名**:

- **request 合法域名**: backend API hostnames
- **uploadFile 合法域名**: hosts you can upload to
- **downloadFile 合法域名**: hosts you can download from
- **web-view 业务域名**: hosts your `<web-view>` can load

For dev, you can disable the check in `mp-weixin.setting.urlCheck: false` — but **always
turn it back on for production builds** and add the real domains.

For local dev (localhost:3000), use the "不校验合法域名" toggle in WeChat DevTools —
this is per-tool, not per-code, and only for development.

### WeChat-specific APIs

Some features are genuinely WeChat-only and you have to use `wx.*` directly:

- `wx.login` — get a `code` for the backend to exchange for `openid` and `session_key`
- `wx.checkSession` — check if the session is still valid
- `wx.requestPayment` — WeChat Pay
- `wx.openVoice` etc.

For most other things, prefer `uni.*` — it abstracts over the platform.

## App (iOS / Android)

iOS and Android are configured in the same `app-plus` block, but have distinct
concerns.

### Icons and splash

```jsonc
"app-plus": {
  "distribute": {
    "icons": {
      "android": {
        "hdpi":    "static/icons/72.png",
        "xhdpi":   "static/icons/96.png",
        "xxhdpi":  "static/icons/144.png",
        "xxxhdpi": "static/icons/192.png"
      },
      "ios": {
        "app@2x": "static/icons/120.png",
        "app@3x": "static/icons/180.png"
      }
    },
    "splashscreen": {
      "android": { /* density variants */ },
      "ios":     { "iphonex": "static/splash/1125x2436.png" }
    }
  }
}
```

Splash is the "loading" screen shown before the app is ready. Sizes are device-specific.
For HBuilderX's cloud build, you can let it generate default splash screens.

### Android permissions

```jsonc
"app-plus": {
  "distribute": {
    "android": {
      "permissions": [
        "<uses-permission android:name=\"android.permission.INTERNET\"/>",
        "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>",
        "<uses-permission android:name=\"android.permission.ACCESS_FINE_LOCATION\"/>",
        "<uses-permission android:name=\"android.permission.ACCESS_COARSE_LOCATION\"/>",
        "<uses-permission android:name=\"android.permission.CAMERA\"/>",
        "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>",
        "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
        "<uses-permission android:name=\"android.permission.RECORD_AUDIO\"/>",
        "<uses-permission android:name=\"android.permission.VIBRATE\"/>",
        "<uses-permission android:name=\"android.permission.WAKE_LOCK\"/>",
        "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\"/>"
      ],
      "minSdkVersion": 21,        // Android 5.0+
      "targetSdkVersion": 34,     // Android 14
      "abiFilters": ["armeabi-v7a", "arm64-v8a"]
    }
  }
}
```

**Only request what you use.** Android app stores scrutinize permissions; over-requesting
can get your app removed.

For Android 6.0+ (API 23+), dangerous permissions need to be requested at runtime. Use
`uni.authorize` or a native plugin.

### iOS privacy descriptions (App Store requirement)

```jsonc
"app-plus": {
  "distribute": {
    "ios": {
      "idfa": false,                              // don't use IDFA unless you have to
      "privacyDescription": {
        "NSLocationWhenInUseUsageDescription": "用于显示附近的店铺",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "用于持续追踪位置",
        "NSCameraUsageDescription": "用于拍摄照片",
        "NSPhotoLibraryUsageDescription": "用于选择相册图片",
        "NSPhotoLibraryAddUsageDescription": "用于保存图片到相册",
        "NSMicrophoneUsageDescription": "用于录制语音",
        "NSContactsUsageDescription": "用于选择联系人"
      }
    }
  }
}
```

**Required by App Store review.** Every iOS permission your app uses needs a
`*UsageDescription` string. App Store will reject the binary if any is missing.

### iOS signing

For iOS, you need a provisioning profile and a certificate:

1. Create an App ID in the Apple Developer Portal
2. Create a CSR (Certificate Signing Request) on your Mac
3. Generate a development / distribution certificate
4. Register your test devices (for dev)
5. Create a provisioning profile linking the cert, App ID, and devices
6. Upload to HBuilderX's "iOS Certificate" panel

This is the most error-prone part of the uni-app App build. The HBuilderX docs walk
through it; expect to spend a day setting it up the first time.

### Native modules

Uni-app App supports native modules that you opt into via `manifest.json`:

```jsonc
"app-plus": {
  "modules": {
    "OAuth": {},          // WeChat / Apple login
    "Share": {},          // system share
    "Payment": {},        // WeChat / Alipay payment
    "VideoPlayer": {},    // native video
    "Maps": {},           // native map (China region)
    "Push": {
      "ulappid": "your-uni-push-appid"
    }
  }
}
```

Adding a module increases binary size. Only add what you use.

> **Module setup vs. module usage**: this skill covers **how to enable the module** in
> `manifest.json`. For the actual setup flow — getting appId / cert, writing the call
> code, handling push events, integrating with your backend — see the dedicated
> skills: `uniapp-uni-push` (for `Push`), `uniapp-payments` (for `Payment`), and
> `uniapp-cloud` (for `uni-id` auth if you use it).

## H5

```jsonc
"h5": {
  "title": "MyApp",
  "router": {
    "mode": "history",
    "base": "/"
  },
  "publicPath": "/",
  "devServer": {
    "port": 8080,
    "https": false
  }
}
```

### Router mode

- **`hash`** (default): URLs look like `/#/pages/detail/detail?id=123`. Works without
  server config. Best for static hosting.
- **`history`**: URLs look like `/pages/detail/detail?id=123`. Cleaner, but the server
  must rewrite unknown paths back to `index.html` (Nginx `try_files $uri /index.html`).

### Public path

`publicPath` is where static assets are served from. If you deploy to `https://myapp.com/myapp/`, set `publicPath: '/myapp/'`.

### H5-specific gotchas

- **`window`, `document`, `localStorage`** are H5-only. Wrap with `#ifdef H5`.
- **CORS**: backend must include `Access-Control-Allow-Origin` for the H5 origin.
- **iOS Safari URL bar**: `100vh` includes the URL bar on iOS. Use `100%` on a fixed
  parent or `min-height: 100vh`.
- **Back button**: `uni.navigateBack` calls `history.back()`. Browser back from a deep
  page may exit the app — handle it.

## Other mini-program platforms

### Alipay MP

```jsonc
"mp-alipay": {
  "appid": "2021000000000000",
  "usingComponents": true
}
```

Differences from WeChat:
- Different storage quota (smaller, ~10MB)
- Slightly different async behavior
- Has its own `my.*` API; use `uni.*` for portability

### ByteDance (Toutiao / Douyin / Lark)

```jsonc
"mp-toutiao": {
  "appid": "tt-xxxxxxxxxx"
}
```

The "ByteDance MP" actually serves Toutiao, Douyin, and Lark (Feishu) with different
appids. Configure each via the byteDance MP console.

Differences:
- `tt.*` API; use `uni.*` when possible
- Some APIs (e.g. `getLocation`) have stricter rate limits
- File upload size limits vary

### Baidu Smart Program

```jsonc
"mp-baidu": {
  "appid": "xxxxxxxx"
}
```

Strictest storage quota (~2MB). Limited plugins. `swan.*` is the platform API.

## Cross-platform code patterns

### Detecting the platform

Avoid `uni.getSystemInfoSync().platform === 'ios'` — use `#ifdef`:

```js
// BAD
if (uni.getSystemInfoSync().platform === 'ios') {
  // iOS-specific
}

// GOOD
// #ifdef APP-IOS
// iOS-specific
// #endif
```

The `#ifdef` version is **statically stripped** at build time — no runtime cost, no
typos, no error.

### Polyfilling platform APIs

```js
async function share(opts: { title: string; url: string }) {
  // #ifdef MP-WEIXIN
  return wx.shareAppMessage({ title: opts.title })
  // #endif

  // #ifdef MP-ALIPAY
  return my.share({ title: opts.title })
  // #endif

  // #ifdef H5
  if (navigator.share) {
    return navigator.share({ title: opts.title, url: opts.url })
  }
  // Fallback: copy link
  await uni.setClipboardData({ data: opts.url })
  uni.showToast({ title: '链接已复制', icon: 'success' })
  // #endif
}
```

### Cross-platform component differences

- **`<scroll-view>`** with `refresher-enabled` — works on WeChat MP, ignored on others.
  Use page-level `onPullDownRefresh` for cross-platform behavior.
- **`<web-view>`** — works on most platforms with quirks. Some platforms block third-party
  URLs.
- **`<video>`** — wildly different on each platform. Test on every target.
- **`<map>`** — H5 needs a third-party map library (AMap, Google Maps); MP uses
  Tencent Maps natively.

## Common mistakes

1. **`urlCheck: false` left in production** — MP builds accept any URL, but App Store /
   WeChat reviews check this.
2. **Missing iOS `privacyDescription`** — App Store rejection.
3. **Missing WeChat `permission.scope.*.desc`** — auth scopes fail without description.
4. **`requiredPrivateInfos` not declared** — `getLocation` and similar APIs fail
   silently in newer WeChat versions.
5. **Asking for permissions you don't use** — Android stores remove apps that over-request.
6. **Using `wx.*` directly when `uni.*` exists** — loses cross-platform portability.
7. **`#ifdef` with the wrong key** — `APP-PLUS` is the legacy key, `APP` is current.
   Some users mix them and wonder why nothing compiles.
8. **No splash screen on slow devices** — users see a white flash. Set a splash with
   your brand color.
9. **WXSS (WeChat MP) doesn't support `*` universal selector** — on MP-WEIXIN you
    can't write `* { box-sizing: border-box }`. List element types explicitly:
    `view, text, image, scroll-view, input, textarea { box-sizing: border-box }`.
    Without this, `width: 100% + padding` causes horizontal overflow.
10. **WXSS unsupported CSS features (MP-WEIXIN)** — `position: sticky`,
    `backdrop-filter`, `env(safe-area-inset-bottom)`, and `html`/`body` selectors
    don't work on WeChat MP. Wrap with `#ifndef MP-WEIXIN` or provide fallbacks:
    - `position: sticky` → `position: fixed` + padding-top to reserve space
    - `backdrop-filter` → solid `rgba()` background
    - `env(safe-area-inset-bottom)` → CSS variable set to `0px` in MP-WEIXIN branch
    - `html, body { ... }` → `#ifdef MP-WEIXIN` with per-element selectors instead
11. **Component prop names intercepted by WeChat MP runtime** — `custom-style`,
    `css-text`, and `inline-style` are intercepted by uni-app's `mp-weixin` runtime
    (it does `.split(';')` on them for style parsing). Using any as a prop or
    attribute triggers `up.split is not a function` (see `uniapp-debugging-and-publishing`
    error table for the symptom). Use custom names like `color`, `variant`,
    `customCss` instead.
12. **`@font-face` with local `.ttf` or base64 is unreliable on MP-WEIXIN** — WXSS
    doesn't support `src: url()` for local files, and base64 font embedding has
    unstable compatibility across WeChat versions. Use PNG images rendered from the
    TTF for icons on WeChat MP (see `uniapp-ui-patterns` for the icon strategy).
13. **Tab bar icons must be PNG / JPG** — the system native bottom tab bar doesn't
    render SVG. Only raster formats (`iconPath` / `selectedIconPath` in `tabBar.list`
    accept PNG / JPG). Put them under `static/tab/` and keep each ≤40KB for fast
    first paint. See `uniapp-ui-patterns` for the broader icon strategy.
14. **Native components sit on top of normal views** — `<canvas>`, `<textarea>`,
    `<video>`, `<map>`, `<live-player>` render on a separate OS-native layer with
    the highest z-index. Any popup / mask / drawer drawn with regular `<view>` will
    be pierced / covered. Use `<cover-view>` / `<cover-image>` for overlays, and
    temporarily hide the native component while the popup is shown (e.g. set
    `v-if` off, or set the canvas to a 1×1 placeholder).
15. **`navigationBarTextStyle` only accepts `"black"` or `"white"`** — you can't
    use custom hex colors on the system nav bar. For arbitrary nav text color, set
    `navigationStyle: "custom"` in `pages.json` and draw your own (see
    `uniapp-routing-and-tabbar` custom nav bar pattern).
16. **Custom nav bar capsule is fixed; popups need 8px clearance** — when
    `navigationStyle: "custom"` is set, WeChat still reserves the top-right capsule
    (menu) button at a fixed position. You cannot hide it, move it, or restyle it.
    Popups that visually cover the capsule area may be flagged in review as
    obscuring official back / menu controls — leave at least 8px clearance
    around the capsule. (WeChat MP-only — Alipay/Baidu/Douyin use different
    more-menu placements or none; don't reserve top-right space on those.)
17. **`navigationBarTitleText` is truncated** — long titles auto-cut with
    ellipsis. Keep ≤8 Chinese characters or ≤16 English chars. For dynamic titles,
    use `uni.setNavigationBarTitle` with a short string.
18. **WXSS unsupported CSS gotchas (extended)** — beyond the `*` selector and
    `position: sticky` already listed: complex descendant selectors fail, multi-
    background gradients have spotty support, `calc()` doesn't support all
    expressions. Use `rpx` (750rpx = screen width) for sizing; `px` is fixed and
    breaks multi-screen adaptation.
19. **`rpx` / `upx` aren't recognized in native component internals on MP-WEIXIN** —
    uni-app compiles `upx` to `rpx`, but certain native components' internal
    config (canvas coordinates, video / live-player config, map marker offsets)
    uses absolute `px` that bypass the rpx mapping. Size these explicitly in `px`
    after measuring on a target device. **On App-Plus and H5, `<map>` / `<video>`
    / `<canvas>` respect `rpx` / `upx` normally** — no special handling needed.

## References in this skill

> Some references are listed in the v1.0 plan but not yet shipped as separate files. Their
> content is currently **inline in this SKILL.md** for full coverage. They will be split
> out as the docs grow.

- `references/wechat-mp.md` — *planned*: full WeChat MP setup, debug, submit (inline)
- `references/app-ios-android.md` — *planned*: iOS signing, Android signing, cloud build
  vs local (inline)
- `references/h5.md` — *planned*: router mode, public path, server config, SEO (inline)
- `references/other-mp.md` — *planned*: Alipay, Baidu, ByteDance, QQ, Kuaishou (inline)
- `references/conditional-compile.md` — *planned*: full key list, edge cases, TS
  support (inline)

## Resources

- `manifest.json` reference: https://uniapp.dcloud.net.cn/collocation/manifest.html
- Conditional compilation: https://uniapp.dcloud.net.cn/tutorial/platform.html
- WeChat MP server domain: https://developers.weixin.qq.com/miniprogram/dev/framework/ability/url-extranet.html
- WeChat MP requiredPrivateInfos: https://developers.weixin.qq.com/miniprogram/dev/framework/ability/private-info.html
- iOS privacy descriptions: https://developer.apple.com/documentation/bundleresources/information_property_list
- Android permissions: https://developer.android.com/guide/topics/permissions/overview

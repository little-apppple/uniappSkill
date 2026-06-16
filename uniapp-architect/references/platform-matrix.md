# Platform Capability Matrix

Quick reference: which capability is available on which platform, and which API to use.
For the full spec, load `uniapp-project` (the component/API catalog).

## Read this when

- You're about to call an `uni.*` API and need to know if the target platform supports it
- The user says "this works on WeChat MP but not on App" and you need to map the difference
- You're writing a feature that needs to behave differently across platforms

## Legend

- ✅ Fully supported, recommended path
- ⚠️ Supported with caveats (see notes)
- ❌ Not supported, need a different API
- 🔁 Use platform-specific API directly (not abstracted by `uni.*`)

## Routing & Navigation

| Capability | H5 | WeChat MP | App-iOS | App-Android | Other MP | Notes |
|---|---|---|---|---|---|---|
| `uni.navigateTo` | ✅ | ✅ | ✅ | ✅ | ✅ | 10-level stack limit on MP |
| `uni.redirectTo` | ✅ | ✅ | ✅ | ✅ | ✅ | No back, replaces current |
| `uni.reLaunch` | ✅ | ✅ | ✅ | ✅ | ✅ | Clears stack, use sparingly |
| `uni.switchTab` | — | ✅ | ✅ | ✅ | ✅ | Only for tabBar pages |
| `uni.navigateBack` | ✅ | ✅ | ✅ | ✅ | ✅ | `delta` = layers to pop |
| Page back gesture | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | H5 needs `popstate` handling |
| Custom navigation bar | ✅ | ✅ | ✅ | ✅ | ⚠️ | `"navigationStyle": "custom"` |
| Deep link | ✅ | ✅ | ✅ | ✅ | ⚠️ | MP needs appid whitelisting |

## Network

| Capability | H5 | WeChat MP | App-iOS | App-Android | Other MP | Notes |
|---|---|---|---|---|---|---|
| `uni.request` | ✅ | ✅ | ✅ | ✅ | ✅ | All platforms; recommended |
| `uni.uploadFile` | ✅ | ✅ | ✅ | ✅ | ✅ | Single file; multi-file needs `Promise.all` |
| `uni.downloadFile` | ✅ | ✅ | ✅ | ✅ | ✅ | Returns temp path |
| `uni.connectSocket` (WebSocket) | ✅ | ✅ | ✅ | ✅ | ⚠️ | Baidu/QQ have limits |
| CORS | ✅ | n/a | n/a | n/a | n/a | H5 needs server CORS |
| Domain whitelist | n/a | ✅ | n/a | n/a | ✅ | MP only — must add to MP backend |
| Native `fetch` / axios | ✅ | ❌ | ❌ | ❌ | ❌ | Web only |

## Storage

| Capability | H5 | WeChat MP | App-iOS | App-Android | Other MP | Notes |
|---|---|---|---|---|---|---|
| `uni.setStorage` (async) | ✅ | ✅ | ✅ | ✅ | ✅ | Recommended; ~10MB limit on MP |
| `uni.setStorageSync` | ✅ | ✅ | ✅ | ✅ | ✅ | Synchronous; blocks UI if huge |
| `uni.removeStorage` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Storage quota | ~5–10MB | 10MB total | unbounded | unbounded | varies | MP has hard cap |
| Encryption | manual | manual | iOS Keychain via plugin | Android EncryptedSharedPreferences via plugin | manual | `uni.setStorage` is **not** encrypted |

## UI & Media

| Capability | H5 | WeChat MP | App-iOS | App-Android | Other MP | Notes |
|---|---|---|---|---|---|---|
| `uni.chooseImage` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `uni.chooseMedia` | ✅ | ✅ | ✅ | ✅ | ⚠️ | Newer, more powerful |
| `uni.previewImage` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `uni.saveImageToPhotosAlbum` | ❌ | ✅ | ✅ | ✅ | ⚠️ | H5 can't save to gallery |
| `uni.scanCode` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | H5 needs `BarcodeDetector` polyfill |
| `uni.getLocation` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `<map>` component | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | H5 falls back to leaflet/AMap |
| `cover-view` (over native) | ❌ | ✅ | ❌ | ❌ | ✅ | MP only |

## Device & System

| Capability | H5 | WeChat MP | App-iOS | App-Android | Other MP | Notes |
|---|---|---|---|---|---|---|
| `uni.getSystemInfo` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `uni.getSystemInfoSync` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `uni.vibrate*` | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | H5 needs user gesture |
| `uni.setClipboardData` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `uni.makePhoneCall` | ❌ | ✅ | ✅ | ✅ | ⚠️ | H5 must use `tel:` link |
| `uni.onNetworkStatusChange` | ✅ | ✅ | ✅ | ✅ | ⚠️ | |
| `uni.getBatteryInfo` | ❌ | ✅ | ✅ | ✅ | ❌ | |

## Native Capabilities (App only)

These need `manifest.json` module permission or a UTS/native plugin:

| Capability | App-iOS | App-Android | Notes |
|---|---|---|---|
| Bluetooth LE | ⚠️ | ⚠️ | Use `uni-ble` plugin or UTS |
| NFC | ⚠️ | ✅ | Android native; iOS needs CoreNFC |
| Push (uni-push) | ✅ | ✅ | Use `uni-push` SDK |
| Apple Pay / Google Pay | ✅ | ✅ | UTS plugin or uniPay |
| Face ID / Touch ID | ✅ | ✅ | `uni.checkIsSupportSoterAuthentication` |
| Background audio | ⚠️ | ⚠️ | Needs UTS plugin |

## Cross-platform compile directives

Use `#ifdef` to switch behavior per platform. Common keys:

```
#ifdef H5
  // h5-only
#endif

#ifdef MP-WEIXIN
  // WeChat MP
#endif

#ifdef APP
  // iOS + Android (any uni-app runtime)
#endif

#ifdef APP-ANDROID
  // Android only
#endif

#ifdef APP-IOS
  // iOS only
#endif

#ifdef MP-WEIXIN || MP-ALIPAY
  // WeChat OR Alipay MP
#endif
```

For TypeScript-aware `#ifdef`, install the `@dcloudio/types` or use the `uni-app` preset
in `tsconfig.json` so the editor knows the types are valid.

## When to use platform-specific APIs directly

Almost never. The only legitimate cases:

- `wx.scanCode` vs `uni.scanCode` — same thing under the hood, prefer `uni.scanCode`
- iOS/Android native module: write a UTS plugin, expose through `uni.xxx`
- WeChat-specific UI (sticky chat head, official-account reply) — these genuinely only
  exist on WeChat and you must use `wx.*`

**Default rule**: use `uni.*`. Fall back to platform-specific only when the unified
API doesn't cover it.

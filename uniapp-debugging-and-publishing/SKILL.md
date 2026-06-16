---
name: uniapp-debugging-and-publishing
description: "Debugging and publishing uni-app apps to all platforms — H5 debug with vConsole, mini-program debug with WeChat DevTools, real-device debug for App, common error codes and fixes, build and publish to WeChat MP / iOS App Store / Google Play / domestic Android stores, miniprogram-ci for automated MP upload, H5 deploy to static hosts, wgt hot updates, and CI/CD with GitHub Actions / GitLab CI. Use when the user reports a bug, needs to deploy, or wants to set up CI/CD for uni-app."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **operational layer** — turning working code into a shipped product:

1. Debugging on each platform (H5, MP, App)
2. Building for production
3. Publishing to each platform's store
4. CI/CD automation
5. Hot updates (wgt for Vue 2, wgtu for uni-app x)

After loading this skill, the agent should be able to:

- Set up `vConsole` for H5 debug on real devices
- Use WeChat DevTools' debugger for MP
- Build and submit iOS / Android apps
- Configure `miniprogram-ci` for automated MP upload
- Set up GitHub Actions for uni-app
- Diagnose the most common error messages

## When to use this skill

- "How do I debug on a real device?"
- "How do I submit to the App Store?"
- "How do I upload to WeChat MP from CI?"
- "How do I deploy the H5 build?"
- "I'm getting `[object Object]` with no details — how do I get the error?"
- "How do I push a hot update without going through the store review?"

## When NOT to use this skill

- "How do I configure the WeChat MP appid?" → `uniapp-platform-config`
- "How do I make a list page?" → `uniapp-ui-patterns`
- "How do I persist user data?" → `uniapp-state-and-data`
- "How do I set up the iOS signing cert / Android keystore?" → `uniapp-platform-config`
  (this skill covers the *upload/submit* step; the cert itself is set up there)
- "How do I read the build output for `npm run build:mp-weixin`?" → `uniapp-fundamentals`
  (project structure + scripts)
- "How do I debug a 401 / network error?" → `uniapp-network-layer` for the request
  layer itself; this skill for the error-decoding + devtools part

## Debugging on each platform

### H5 debug

Standard browser DevTools. Plus:

- **Vue Devtools extension** — works in H5 once installed
- **vConsole** — embedded devtools for H5 viewed on a phone. Add to your project:

```bash
npm i vconsole
```

```ts
// main.ts (dev only)
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  if (process.env.NODE_ENV !== 'production') {
    // #ifdef H5
    import('vconsole').then(({ default: VConsole }) => {
      new VConsole()
    })
    // #endif
  }
  return { app }
}
```

For production debugging (when a user reports a bug), use a remote logging service
(Sentry, Fundebug, etc.) — see the Error reporting section below.

### WeChat MP debug

WeChat DevTools has its own debugger:

- **Console** — `console.log` output (weirdly formatted vs browser)
- **Sources** — JS source maps (set in `mp-weixin.setting.es6 = true`)
- **Network** — see all `wx.request` calls with timing
- **Storage** — view and edit `wx.storage` directly
- **Performance** — record and analyze a session

The "代码依赖分析" (Code dependency analysis) panel shows bundle composition — your
best friend for "why is my main package 3MB".

For real-device testing, click "预览" (Preview) in WeChat DevTools — generates a QR
code the user scans in WeChat to open the dev build.

### App debug

App debugging is more complex. HBuilderX supports:

- **H5 + mobile debug view** — opens Chrome DevTools against the H5 portion of the app
- **Real device debug** — runs the app on a connected device, with HBuilderX attaching
  to its WebView for inspection
- **Logcat / Xcode console** — for native (nvue / uvue / UTS) code

For the **WebView** (Vue 2 default, Vue 3 if not using `nvue`):

1. Connect device via USB
2. Enable USB debugging (Android) or set up Safari Web Inspector (iOS)
3. HBuilderX auto-attaches when running

For **uvue** (native):

- Android: Android Studio's debugger, attach to process
- iOS: Xcode's debugger, attach to process

## Common error messages and fixes

| Error | Platform | Cause | Fix |
|---|---|---|---|
| `url not in domain list` | WeChat MP | Backend domain not whitelisted | Add to WeChat MP admin; for dev, set `urlCheck: false` |
| `request:fail timeout` | All | Backend slow or network issue | Increase timeout; check backend |
| `fail page limit` | MP | Page stack > 10 | Use `redirectTo` / `reLaunch` to slim the stack |
| `navigateTo:fail can not navigateTo a tabBar page` | All | Wrong API for tab target | Use `switchTab` |
| `[object Object]` toast | All | Object passed as title | Cast to string in catch block |
| `Cannot read property 'X' of undefined` | All | Undefined access | Add guards; check Pinia store hydration order |
| `wx.login:fail` | WeChat MP | Often a stale session or auth issue | Call `wx.checkSession` first |
| `uni.scanCode:fail` | App | Missing camera permission | Add permission to `manifest.json` |
| `undefined is not a function` | All | Missing import or wrong import | Check `easycom` config; check for typos |
| `requestPayment:fail` | WeChat MP | Missing appid / cert / sign | Verify WeChat Pay config in `manifest.json` and backend |
| `Error: 上传失败` | WeChat MP | Miniprogram size > 2MB main | Subpackage, or check WeChat DevTools dependency analysis |
| `Build failed: gradlew not found` | App | Android Studio setup issue | Reinstall Android Studio with default options |
| `Code Signing Error` | iOS | Provisioning profile mismatch | Re-download profile from Apple Developer Portal |

## Error reporting

For production, **don't rely on `console.log`**. Add a remote error reporter:

```ts
// src/utils/logger.ts
export const logger = {
  error(err: Error, context?: Record<string, any>) {
    console.error(err)
    // Sentry / Fundebug / your own
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(err, { extra: context })
    }
  }
}
```

Wrap your app's error boundary:

```vue
<!-- App.vue -->
<script setup>
import { onError } from '@dcloudio/uni-app'
import { logger } from '@/utils/logger'

onError((err) => {
  logger.error(err, { source: 'app' })
})
</script>
```

In async functions:

```ts
async function onSubmit() {
  try {
    await api.save(...)
  } catch (e: any) {
    logger.error(e, { action: 'save-form' })
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
```

Sentry has a uni-app SDK: https://github.com/sentry-dcloud/uniapp

## Build commands

```bash
# H5
npm run build:h5
# → dist/build/h5/ (static site)

# WeChat MP
npm run build:mp-weixin
# → dist/build/mp-weixin/ (open in WeChat DevTools)

# App-Android
npm run build:app-android
# → dist/build/app-android/ (wgt package only; for APK, use HBuilderX)

# App-iOS
npm run build:app-ios
# → dist/build/app-ios/ (wgt package only; for IPA, use HBuilderX)

# Other platforms
npm run build:mp-alipay
npm run build:mp-baidu
npm run build:mp-toutiao
# ...
```

HBuilderX has equivalent menu items under **发行 (Distribute)**.

## Publishing — H5

Static build. Deploy to any static host:

- Vercel / Netlify — `vercel deploy` / `netlify deploy`
- Alibaba OSS / Tencent COS — upload `dist/build/h5/` to bucket, enable static hosting
- Nginx — copy to webroot, configure `try_files $uri /index.html` for SPA routing

For Hash mode (`/#/path`), no server config needed.

## Publishing — WeChat MP

### Manual

1. `npm run build:mp-weixin`
2. Open WeChat DevTools
3. **Import project** → `dist/build/mp-weixin/`
4. Fill in the AppID (or test AppID)
5. **Upload** (top-right) → version + notes
6. In WeChat MP admin (https://mp.weixin.qq.com), submit the uploaded version for review

### Automated (CI)

`miniprogram-ci`:

```bash
npm i -D miniprogram-ci
```

```js
// scripts/upload-mp.js
const ci = require('miniprogram-ci')
const path = require('path')

const project = new ci.Project({
  appid: 'wx...',
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, '../dist/build/mp-weixin'),
  privateKeyPath: path.resolve(__dirname, '../keys/private.key'),
  ignores: ['node_modules/**/*'],
})

;(async () => {
  const result = await ci.upload({
    project,
    version: process.env.VERSION || '1.0.0',
    desc: process.env.DESC || 'CI upload',
    setting: { es6: true, minified: true },
  })
  console.log('Upload result:', JSON.stringify(result, null, 2))
})()
```

The `privateKeyPath` is a CI upload key generated in WeChat MP admin → 开发管理 → 开发设置 → 小程序代码上传密钥. **Don't commit the key to git.**

### GitHub Actions example

```yaml
# .github/workflows/mp-upload.yml
name: Upload Mini Program
on:
  push:
    tags: ['v*']

jobs:
  build-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci
      - run: npm run build:mp-weixin
      - run: node scripts/upload-mp.js
        env:
          VERSION: ${{ github.ref_name }}
          DESC: ${{ github.event.head_commit.message }}
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/build/mp-weixin.zip
```

## Publishing — App (iOS)

For iOS, the workflow is:

1. **Generate iOS certificate and provisioning profile** in Apple Developer Portal
2. **Upload cert to HBuilderX** (HBuilderX → 发行 → 原生APP-云打包, or **发行 → 生成本地打包App资源**)
3. **Submit via App Store Connect**:
   - Either use HBuilderX's "云打包" (cloud build) to produce an IPA, then upload via
     Transporter or `xcrun altool`
   - Or set up a local Xcode project and build there

### Cloud build (HBuilderX)

1. **发行 → 原生APP-云打包**
2. Choose iOS, fill in:
   - Bundle ID (com.yourcompany.appname)
   - Version, build number
   - Signing identity (your Apple Developer profile)
   - Provisioning profile
3. Click **打包** — DCloud's cloud builds the IPA
4. Download and submit via Transporter to App Store Connect

### App Store review checklist

- Privacy policy URL (required for any app with user data)
- All `*UsageDescription` strings in `manifest.json`
- App icon (1024x1024 PNG, no transparency)
- Screenshots for each device size
- Export compliance info (encryption usage)
- Test account (if app requires login)
- Content rating

## Publishing — App (Android)

Android has many stores. The main ones:

- **Google Play** — $25 one-time fee, review process
- **Huawei AppGallery** — required for Huawei devices in China
- **Xiaomi / OPPO / vivo / Honor** — Chinese OEM stores
- **Tencent / 360 / Baidu** — Chinese app stores

For each, you typically need:
- APK or AAB (AAB preferred for Google Play since 2021)
- Signing certificate
- App metadata (name, description, screenshots)
- Privacy policy
- Category-specific docs (some categories need extra review)

HBuilderX's cloud build can produce APK / AAB for Android. For Google Play, you also
need to **sign with a Google Play App Signing key** (different from your upload key).

## Hot updates (wgt)

`wgt` is a uni-app-specific package format: just the resources (not the native shell).
You can update the JS / Vue / images of an already-installed app without going through
the store review.

### When to use

- Bug fixes that don't need a native change
- New features that don't change native modules
- A/B testing

### When NOT to use

- Native module changes
- iOS — Apple disallows hot-updates that change "the purpose of the app" (App Store
  guideline 3.3.2). A `wgt` that only patches JS is usually fine, but be careful.

### Flow

1. User has app v1.0.0 installed
2. You release v1.0.1 as a wgt (resources only)
3. App checks your server on launch: "is there a wgt newer than my installed version?"
4. If yes, downloads and applies (or prompts to restart)

HBuilderX's hot update guide:
https://uniapp.dcloud.net.cn/tutorial/app-hotupdate.html

## CI/CD — full pipeline

For a production uni-app app, your CI/CD needs to:

1. **Build** the H5, MP, App targets
2. **Test** (lint, type check, unit tests)
3. **Upload** MP via `miniprogram-ci`
4. **Trigger** cloud build for App (or build via local Xcode / Android Studio)
5. **Deploy** H5 to static host
6. **Notify** team (Slack / DingTalk / Lark)

GitHub Actions matrix build:

```yaml
strategy:
  matrix:
    target: [h5, mp-weixin, app-android]
steps:
  - run: npm run build:${{ matrix.target }}
  # Upload or deploy per target
```

## Resources

- WeChat DevTools: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- `miniprogram-ci`: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
- App Store Connect: https://appstoreconnect.apple.com/
- Google Play Console: https://play.google.com/console
- HBuilderX cloud build: https://uniapp.dcloud.net.cn/tutorial/app-build.html
- wgt hot update: https://uniapp.dcloud.net.cn/tutorial/app-hotupdate.html
- Sentry for uni-app: https://github.com/sentry-dcloud/uniapp

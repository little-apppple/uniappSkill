# Scaffold a uni-app x (uvue + UTS) Project

uni-app x is the **future** of uni-app: native renderer (`uvue` instead of `nvue`/webview)
and a single language (UTS, which compiles to Kotlin/Swift/ArkTS) for the UI layer and
native plugins. This guide gets you from zero to a running uvue project.

## When to pick uni-app x

- You need to ship to **HarmonyOS** (only uni-app x supports it)
- You need extreme App performance (60fps scrolling, heavy native UI)
- You're OK with the alpha channel of HBuilderX
- You're starting a new project and want the modern stack
- Your project is App-only (MP support is still maturing in uni-app x as of late 2025)

**Don't pick uni-app x if**:

- You primarily target WeChat MP / other MP platforms
- You depend on a Vue-2-only plugin
- You can't tolerate alpha tooling

See `uniapp-fundamentals/references/vue2-vs-vue3-vs-uvue.md` for the full comparison.

## Prerequisites

- **HBuilderX alpha** (4.31+ for App, 4.61+ for Harmony) — https://www.dcloud.io/hbuilderx-alpha.html
- **Node.js 18+** (for CLI workflow)
- For App build:
  - iOS: macOS + Xcode
  - Android: Android Studio + a device or emulator
  - Harmony: DevEco Studio (Huawei)
- For Android: JDK 17+
- For iOS: a valid Apple Developer account (for device install / TestFlight)

## Scaffold via CLI

```bash
# 1. Create the project (use the official vite preset)
npx degit dcloudio/uni-preset-vue#vite my-uvue-app
cd my-uvue-app

# 2. Switch to a uvue project structure
#    Open the project in HBuilderX alpha, then:
#    - Right-click src/ → New → uni-app x project
#    - Or manually rename *.vue → *.uvue and add UTS plugins as needed

# 3. Install deps
npm install

# 4. Run on a target
npm run dev:app              # HBuilderX will handle the App build
```

**Reality check**: as of late 2025, the CLI's `dev:app` for uvue is limited. For
genuine App build, **use HBuilderX alpha**:

1. Open the project in HBuilderX alpha
2. **Run → Run to Android App-base** or **Run to iOS App-base**
3. HBuilderX handles the native shell, UTS compilation, and packaging

## Project structure (uni-app x differences from uni-app)

```
my-uvue-app/
├── src/
│   ├── pages/                  # .uvue files (not .vue)
│   │   └── index/
│   │       └── index.uvue
│   ├── components/             # .uvue components
│   ├── utssdk/                 # UTS plugins (custom)
│   │   └── app-android/
│   │       ├── config.json
│   │       └── MyPlugin.uts
│   │   └── app-ios/
│   │       └── MyPlugin.uts
│   ├── App.uvue                # app entry (NOT App.vue)
│   ├── main.uts                # app entry script
│   ├── manifest.json
│   ├── pages.json
│   └── uni.scss
├── package.json
└── vite.config.ts
```

Key differences from regular uni-app:

- Page and component files use `.uvue` extension (not `.vue`)
- App entry is `App.uvue` + `main.uts` (not `App.vue` + `main.js`)
- Native plugins go in `utssdk/<plugin-name>/<platform>/<file>.uts`
- `manifest.json` adds a `app-harmony` block for HarmonyOS

## Writing a basic uvue page

`index.uvue`:

```vue
<template>
  <view class="content">
    <text class="title">{{ message }}</text>
    <button @click="increment" class="btn">Tap me: {{ count }}</button>
  </view>
</template>

<script setup lang="uts">
import { ref } from 'vue'

const message = ref('Hello uni-app x')
const count = ref(0)

function increment() {
  count.value++
  message.value = `Tapped ${count.value} times`
}
</script>

<style>
.content { padding: 40rpx; }
.title { font-size: 48rpx; font-weight: bold; }
.btn { margin-top: 40rpx; padding: 20rpx 40rpx; }
</style>
```

Notes:

- `lang="uts"` in `<script setup>` — UTS is a strict TypeScript superset
- `ref` works the same as Vue 3
- The template is mostly the same Vue template syntax; differences are in the runtime
  primitives, not the template

## UTS — what you get vs regular TS

UTS = "Uni-app TypeScript Strict". It compiles to:

- **Kotlin** for Android
- **Swift** for iOS
- **ArkTS** for HarmonyOS
- **JS** for H5 and MP (limited)

```uts
// utssdk/app-android/MyPlugin.uts
export function getBatteryLevel(): number {
  // Compiles to Kotlin
  // Android-specific API
  return 0.85
}
```

```uts
// utssdk/app-ios/MyPlugin.uts
export function getBatteryLevel(): number {
  // Compiles to Swift
  return 0.85
}
```

Then consume from a page:

```vue
<script setup lang="uts">
import { getBatteryLevel } from '@/utssdk/app-common/MyPlugin.uts'

const battery = ref(0)
onMounted(() => {
  battery.value = getBatteryLevel()
})
</script>
```

The `app-common` directory holds platform-shared UTS; `app-android` / `app-ios` /
`app-harmony` hold platform-specific overrides.

## Differences from regular Vue 3

| Feature | Vue 3 | uvue |
|---|---|---|
| `<script setup>` | ✅ | ✅ |
| `ref` / `reactive` | ✅ | ✅ |
| `<style>` | ✅ | ✅ (no `<style scoped>`) |
| `scoped` style | ✅ | ⚠️ limited |
| DOM components (`<div>`, `<span>`) | ✅ | ❌ use `view`, `text` |
| `v-if` / `v-for` | ✅ | ✅ |
| Pinia | ✅ | ✅ |
| `vue-router` | ✅ | ❌ use uni-app's built-in routing |
| Most npm JS libraries | ✅ | ⚠️ depends on whether they use forbidden DOM APIs |
| Native module access | via plugin | direct via UTS |

## When to write UTS

- You need a capability that `uni.*` doesn't expose (e.g. specific Bluetooth services)
- You want to wrap a native SDK (e.g. a payment SDK not in the plugin market)
- You're building a performance-critical native UI element

For most apps, you won't write UTS — you'll consume existing plugins. The UTS learning
curve is real, so only invest when you have a concrete need.

## Building and running

### HBuilderX (recommended for App)

1. Open the project in HBuilderX alpha
2. **Run → Run to Android App-base** (or iOS / Harmony)
3. First run: HBuilderX will install the native shell template (a few minutes)
4. Subsequent runs: fast HMR

### CLI (limited)

```bash
npm run dev:h5         # H5 works in CLI
npm run build:h5       # → dist/build/h5
npm run build:app-android  # → wgt package only; APK requires HBuilderX
```

For real APK/IPA/HAP output, you need HBuilderX or a manual native shell project (advanced).

## Resources

- uni-app x docs: https://doc.dcloud.net.cn/uni-app-x/
- UTS language: https://doc.dcloud.net.cn/uni-app-x/uts/
- Hello uni-app x: https://doc.dcloud.net.cn/uni-app-x/tutorial/hello.html
- UTS plugin tutorial: https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin.html
- HBuilderX alpha: https://www.dcloud.io/hbuilderx-alpha.html
- GitHub examples: https://gitcode.net/dcloud (look for `hello-uvue`, `uni-api`)

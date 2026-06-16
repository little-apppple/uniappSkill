---
name: uniapp-plugin-authoring
description: "Authoring and publishing uni-app plugins (uni_modules format) — directory structure, package.json, easycom.json, multi-platform support (Vue 2 / Vue 3 / uni-app x), UTS native plugins, publish to the DCloud plugin market, versioning, dependencies. Use when the user wants to package reusable code as a uni-app plugin, publish to ext.dcloud.net.cn, write a uni_modules plugin, or build a UTS native plugin for iOS / Android / Harmony."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **plugin authoring layer** for uni-app. After loading this skill, the agent should
be able to:

1. Build a **uni_modules plugin** that other uni-app projects can install
2. Write the canonical directory structure, `package.json`, and `easycom.json`
3. Support **Vue 2 + Vue 3 + uni-app x** in the same plugin
4. Write **UTS native plugins** (Kotlin / Swift / ArkTS source, auto-compiled)
5. Publish to the **DCloud plugin market** (https://ext.dcloud.net.cn/)
6. Version and maintain the plugin
7. Add TypeScript types, README, examples
8. Test the plugin end-to-end before publishing

If the question is about using a uni_modules plugin (installing, configuring), this
isn't the right skill — load `uniapp-fundamentals` instead.

## When to use this skill

- "How do I package my reusable component as a uni-app plugin?"
- "How do I publish to the DCloud plugin market?"
- "How do I write a UTS native plugin?"
- "How do I support both Vue 2 and Vue 3 in the same plugin?"
- "How do I version my plugin?"

## When NOT to use this skill

- "How do I install a plugin?" → `uniapp-fundamentals` (uni_modules section)
- "How do I use a plugin from the market?" → `uniapp-ui-libraries`
- "How do I write a UTS plugin for HarmonyOS only?" → `uniapp-fundamentals` + this skill

## What is a uni_modules plugin?

A `uni_modules` plugin is a self-contained folder under `src/uni_modules/<plugin-id>/`
(or in a separate repo, distributed as a zip) that contains:

- Components
- Styles / SCSS
- JS / TS utilities
- UTS native code
- Page templates
- Configuration (`package.json`, `easycom.json`, `pages_init.json`)
- Documentation (`readme.md`)

When dropped into a project, it's auto-discovered by `easycom` (for components) and
its dependencies are auto-installed.

## Canonical directory structure

```
my-plugin/
├── package.json              # Plugin metadata + dependencies
├── readme.md                 # User-facing docs
├── changelog.md              # Version history
├── easycom.json              # Auto-import rules
├── components/               # Components
│   ├── my-button/
│   │   └── my-button.vue
│   └── my-card/
│       ├── my-card.vue
│       └── my-card.scss
├── pages/                    # Optional: page templates
│   └── my-page/
│       ├── my-page.vue
│       └── my-page.json
├── static/                   # Static assets (icons, images)
│   └── icon.png
├── common/                   # Utility JS / TS
│   ├── utils.ts
│   └── constants.ts
├── utssdk/                   # UTS native code (optional)
│   ├── app-android/
│   │   ├── config.json
│   │   └── MyNativeFeature.uts
│   ├── app-ios/
│   │   ├── config.json
│   │   └── MyNativeFeature.uts
│   └── app-common/           # Common (UTS-typed) code
│       └── MySharedType.uts
├── license.md                # License file (optional)
└── preview.png               # Marketplace preview image
```

## `package.json`

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "A reusable component / utility for uni-app",
  "main": "components/my-button/my-button.vue",
  "dependencies": {
    "dayjs": "^1.11.0"
  },
  "uni_modules": {
    "dependencies": ["another-uni-modules-plugin"],
    "scripts": {},
    "encrypt": [],
    "native": {
      "app-android": {
        "dependencies": [],
        "sourceMaps": false
      },
      "app-ios": {
        "dependencies": [],
        "sourceMaps": false
      },
      "app-harmony": {
        "dependencies": [],
        "sourceMaps": false
      }
    }
  },
  "keywords": ["uni-app", "uni_modules", "component"],
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "engines": {
    "HBuilderX": "^3.4.0"
  }
}
```

The `uni_modules` block is the DCloud-specific part. The most important fields:

- **`dependencies`** — npm packages your plugin needs
- **`uni_modules.dependencies`** — other uni_modules plugins you depend on
- **`uni_modules.encrypt`** — files to encrypt (paid plugins)
- **`uni_modules.native`** — UTS / native module config (for plugins with native code)

## `easycom.json`

Auto-import config — declares which components to make available by name:

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^my-(.*)": "./components/my-$1/my-$1.vue"
    }
  }
}
```

With this, users can write `<my-button />` in their pages without importing.

## A complete example: a button component plugin

`my-button/my-button.vue`:

```vue
<template>
  <button
    :class="['my-btn', `my-btn--${type}`, { 'my-btn--disabled': disabled }]"
    :style="{ backgroundColor: bgColor, color: textColor }"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps<{
  type?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  bgColor?: string
  textColor?: string
}>()

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

function onClick(event: Event) {
  // #ifdef MP-WEIXIN
  // Haptic feedback on WeChat MP
  // #endif
  emit('click', event)
}
</script>

<style lang="scss" scoped>
.my-btn {
  display: inline-block;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  transition: opacity 0.2s;
}
.my-btn--primary { background: #007AFF; color: #FFFFFF; }
.my-btn--secondary { background: #F5F5F5; color: #1A1A1A; }
.my-btn--danger { background: #FF3B30; color: #FFFFFF; }
.my-btn--disabled { opacity: 0.5; pointer-events: none; }
</style>
```

`package.json`:

```json
{
  "name": "my-button-plugin",
  "version": "1.0.0",
  "description": "A simple button component for uni-app",
  "main": "components/my-button/my-button.vue",
  "uni_modules": {
    "dependencies": []
  }
}
```

`easycom.json`:

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^my-button$": "./components/my-button/my-button.vue"
    }
  }
}
```

Users install by either downloading the zip and dropping into `src/uni_modules/`, or
via the DCloud plugin market. Then they just use `<my-button>Click me</my-button>`.

## Multi-platform support

A single plugin can support **Vue 2 + Vue 3 + uni-app x** with conditional code or
separate files.

### Approach 1: Same code, conditional

Use `#ifdef` to switch behavior:

```vue
<template>
  <view>
    <!-- #ifdef VUE3 || UNI-APP-X -->
    <text>{{ message }}</text>
    <!-- #else -->
    <text>{{ message }}</text>
    <!-- #endif -->
  </view>
</template>
```

Most Vue 3 templates work in Vue 2 too (with minor adjustments).

### Approach 2: Separate files

For bigger differences, use `package.json` `exports`:

```json
{
  "main": "components/my-component/my-component.vue",
  "exports": {
    ".": {
      "import": "./components/my-component/my-component.vue",
      "vue2": "./components-vue2/my-component.vue"
    }
  }
}
```

Or use `uni_modules.versions` to declare per-platform versions:

```json
{
  "uni_modules": {
    "versions": {
      "vue2": {
        "main": "components-vue2/my-component/my-component.vue"
      },
      "vue3": {
        "main": "components/my-component/my-component.vue"
      }
    }
  }
}
```

## UTS native plugins

UTS (Uni-app TypeScript Strict) is a TypeScript superset that compiles to Kotlin
(Swift / ArkTS for Harmony). It's uni-app x's language for native code.

### When to write UTS

- The capability isn't covered by `uni.*` or an existing plugin
- You need to wrap a native SDK (Bluetooth, custom payment, etc.)
- You want to ship a native UI component with custom gestures

### Layout

```
my-native-plugin/
├── package.json
├── utssdk/
│   ├── app-common/           # TS-typed shared code
│   │   └── types.uts
│   ├── app-android/          # Android (Kotlin) source
│   │   ├── config.json
│   │   ├── index.uts
│   │   ├── MyPlugin.uts
│   │   └── libs/             # Optional: native .aar / .jar
│   ├── app-ios/              # iOS (Swift) source
│   │   ├── config.json
│   │   ├── index.uts
│   │   ├── MyPlugin.uts
│   │   └── MyPlugin.swift    # Optional: raw Swift
│   ├── app-harmony/          # HarmonyOS (ArkTS) source
│   │   ├── config.json
│   │   └── MyPlugin.uts
│   └── index.uts              # The exported API
```

### Example: a UTS plugin that does BLE scanning

`utssdk/index.uts`:

```uts
// This file is the public API consumed by .uvue / .vue files
import { startScanning, stopScanning } from './app-common/api.uts'

export type BleDevice = {
  id: string
  name: string
  rssi: number
}

export function startBleScan(onDevice: (device: BleDevice) => void) {
  startScanning(onDevice)
}

export function stopBleScan() {
  stopScanning()
}
```

`utssdk/app-common/api.uts`:

```uts
// Shared types — written in UTS, compiled per-platform
export type DeviceCallback = (device: BleDevice) => void

export interface BleDevice {
  id: string
  name: string
  rssi: number
}

// Internal API — implemented per platform
export function startScanning(callback: DeviceCallback): void {
  // #ifdef APP-ANDROID
  // @ts-ignore - Android impl
  startScanningAndroid(callback)
  // #endif
  // #ifdef APP-IOS
  // @ts-ignore - iOS impl
  startScanningIOS(callback)
  // #endif
}
```

`utssdk/app-android/MyPlugin.uts`:

```uts
// Android-specific — compiles to Kotlin
import bluetooth from '@ohos.bluetooth.LE'  // (actually Android API)
// ...

@UTSJVM.annotations.JvmStatic
export function startScanningAndroid(callback: DeviceCallback) {
  // Kotlin / Android Bluetooth API code
  // ...
}
```

`utssdk/app-ios/MyPlugin.uts`:

```uts
// iOS-specific — compiles to Swift
@ObjC
export function startScanningIOS(callback: DeviceCallback) {
  // Swift / CoreBluetooth API code
  // ...
}
```

The user consumes it like any other uni-app API:

```ts
// In a uvue page
import { startBleScan, stopBleScan } from '@/uni_modules/my-ble-plugin/utssdk/index.uts'

onMounted(() => {
  startBleScan((device) => {
    console.log('Found device:', device.name)
  })
})

onUnmounted(() => {
  stopBleScan()
})
```

## Publishing to the DCloud plugin market

The plugin market is at https://ext.dcloud.net.cn/ — the de-facto registry for
uni-app plugins.

### Steps

1. **Sign up** at https://dev.dcloud.net.cn/ as a developer
2. **Create a new plugin** in the DCloud developer console
3. **Upload your plugin** as a zip — exclude `node_modules`, `.git`, build output
4. **Fill in metadata**:
   - Plugin ID (must match your folder name)
   - Display name
   - Description
   - Category
   - Tags
   - License (MIT, Apache 2.0, etc.)
5. **Set pricing** — free or paid (DCloud handles payment)
6. **Submit for review** — DCloud reviews for malware, security, basic quality
7. **After approval** — published to the marketplace

### Packaging checklist

Before zipping:

- [ ] All components in `components/` work
- [ ] `package.json` has all dependencies
- [ ] `easycom.json` declares all auto-import components
- [ ] `readme.md` is complete with usage examples
- [ ] `changelog.md` is up to date
- [ ] All UTS code is tested on real devices
- [ ] `preview.png` is a representative screenshot
- [ ] `license.md` is included if non-MIT
- [ ] No `node_modules/` in the zip
- [ ] No secrets (API keys, passwords) in the source

### Versioning

Follow **semver**:

- **MAJOR** (1.0.0 → 2.0.0) — breaking changes
- **MINOR** (1.0.0 → 1.1.0) — new features, backward-compatible
- **PATCH** (1.0.0 → 1.0.1) — bug fixes, backward-compatible

When you push a new version:

1. Bump the version in `package.json`
2. Add an entry to `changelog.md`
3. Update the zip on the marketplace
4. Notify users via the marketplace's "version update" system

## Testing the plugin

Before publishing, test the plugin in a real uni-app project:

```bash
# In a test project
mkdir -p src/uni_modules/my-plugin
cp -r /path/to/my-plugin/* src/uni_modules/my-plugin/

# Restart HBuilderX (or re-scan with vite) so easycom picks up the new plugin
# Then use it in a test page
```

Test on each target:

- WeChat MP (real device or simulator)
- H5 (browser)
- App-Android (real device or emulator)
- App-iOS (real device — App Store / TestFlight)
- Alipay MP (if you support it)
- Harmony (if you have uni-app x)

## Plugin discovery patterns

When users install a plugin, they expect certain features:

1. **Demo page** — a `pages/<plugin>/<plugin>.vue` showing common usage
2. **TypeScript types** — `.d.ts` files for IDE intellisense
3. **Theme variables** — let users customize colors via SCSS variables
4. **Tree-shaking support** — only include used components (via `easycom`)
5. **Documentation in `readme.md`** — install, usage, props/events, examples
6. **Changelog** — `changelog.md` with notable changes per version

A polished plugin follows these conventions; a basic one doesn't.

## Example: complete readme.md

```markdown
# my-button-plugin

A simple, customizable button component for uni-app.

## Install

In HBuilderX: **Tools → Plugin Import** → search "my-button-plugin" → install.
Or copy `my-button-plugin.zip` to `src/uni_modules/`.

## Usage

```vue
<my-button type="primary" @click="onSave">Save</my-button>
<my-button type="danger" :disabled="isSubmitting">Delete</my-button>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Button variant |
| `disabled` | `boolean` | `false` | Disable click |
| `bgColor` | `string` | — | Custom background color |
| `textColor` | `string` | — | Custom text color |

## Events

| Event | Payload | Description |
|---|---|---|
| `click` | `Event` | Fired on click (not fired if `disabled`) |

## Theming

Override the SCSS variables in your `uni.scss`:

```scss
$my-btn-primary-bg: #5856D6;
$my-btn-danger-bg: #FF2D55;
```

## Changelog

### 1.0.0
- Initial release
```

## Common pitfalls

1. **Hardcoding platform-specific code without `#ifdef`** — your plugin will break on
   other platforms. Use `#ifdef` for cross-platform safety.
2. **Not declaring dependencies in `uni_modules.dependencies`** — users install your
   plugin, missing sub-dependency causes confusing errors.
3. **Missing `easycom.json`** — users have to manually import every component.
4. **Not testing on real devices** — particularly for native plugins. Simulators
   miss real-world issues (BLE, push, biometric, etc.).
5. **Breaking the `easycom` convention** — naming your component `MyButton` (PascalCase)
   breaks auto-import. Use `my-button` (kebab-case).
6. **Putting `main` / `App.vue` / `pages.json` config in the plugin** — your plugin
   shouldn't modify the host project's app config.
7. **Encrypting open-source plugins** — the encrypt feature is for paid plugins only.
   Don't use it for free ones; users can't audit the code.
8. **Not providing TypeScript types** — most users want intellisense. Without types,
   the plugin feels low-quality.

## Resources

- uni_modules spec: https://uniapp.dcloud.net.cn/plugin/uni_modules.html
- Plugin market: https://ext.dcloud.net.cn/
- DCloud developer console: https://dev.dcloud.net.cn/
- UTS plugin tutorial: https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin.html
- UTS language: https://doc.dcloud.net.cn/uni-app-x/uts/
- Plugin publishing: https://uniapp.dcloud.net.cn/plugin/publish.html
- Examples: https://gitcode.net/dcloud (look for `HelloUTSPlugin`)

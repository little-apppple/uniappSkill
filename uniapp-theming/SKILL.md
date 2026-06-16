---
name: uniapp-theming
description: "Theming and dark mode in uni-app — system theme detection, light/dark/auto switching, color token design, manual override, persistence, integrating with UI libraries (uView / FirstUI / ThorUI), and platform-specific quirks. Use when the user needs to add dark mode, support a brand-color override, design a color token system, persist the user's theme choice, or handle iOS/Android automatic dark mode."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **theming layer** for uni-app. After loading this skill, the agent should be able
to:

1. Set up a light / dark / auto theme switcher
2. Detect the system's current theme (`light` / `dark`)
3. Design a **color token system** (semantic names, not hex codes)
4. Persist the user's choice across launches
5. Make the switch **smooth** (no flash of wrong theme on first paint)
6. Integrate with the major UI libraries (uView / FirstUI / ThorUI) — they each have
   their own theme variable system
7. Handle platform quirks (iOS H5, MP theme attribute, App system theme)

If the question is about generic CSS theming, that's a generic web design topic.
This skill is **uni-app-specific**: system theme detection across platforms, the
`theme.json` convention in `manifest.json`, integrating with uni-app's SCSS variable
system.

## When to use this skill

- "How do I add dark mode to my uni-app?"
- "How do I support a brand-color override?"
- "How do I detect the system theme?"
- "How do I avoid the flash of wrong theme on launch?"
- "How do I integrate dark mode with uView / FirstUI / ThorUI?"

## When NOT to use this skill

- "How do I structure my project?" → `uniapp-fundamentals`
- "How do I use a UI library?" → `uniapp-ui-libraries`
- "How do I persist user preferences?" → `uniapp-state-and-data`

## The four levels of theming

| Level | What it covers | How to implement |
|---|---|---|
| **1. Light only** | One set of colors, no switching | Just write SCSS with hex values |
| **2. Light + Dark** | Two themes, user picks one | SCSS variables + theme class on `<body>` or `<page>` |
| **3. Light + Dark + Auto** | System preference by default, user can override | Combine #2 with `prefers-color-scheme` media query + persisted override |
| **4. Light + Dark + Auto + Brand overrides** | Custom brand color per tenant or A/B test | SCSS variables + override layer |

Most apps need level **3**. Level 4 is for SaaS / multi-tenant apps.

## Level 1: Light only (no theming)

You can skip this skill — write your SCSS with hex values. But even for "light only"
apps, I recommend using **CSS variables** for the brand color so you can change it
in one place:

```scss
/* uni.scss */
$brand-primary: #007AFF;
$brand-secondary: #5856D6;
$brand-danger: #FF3B30;
$text-primary: #1A1A1A;
$text-secondary: #666666;
$text-muted: #999999;
$divider: #EBEEF5;
$bg-page: #F5F5F5;
$bg-card: #FFFFFF;
```

## Level 2-3: Light / Dark / Auto

### Step 1: design the color tokens

```scss
/* src/styles/tokens.scss */
/* 
 * Note: CSS variables via :root work on H5 and App (webview).
 * For mini-programs (MP), use page selector instead — 
 * mini-programs don't have :root but support <page> as the top-level element.
 * The [data-theme] attribute selector works on all platforms.
 */

/* Brand colors — same in both modes */
$brand-primary: #007AFF;
$brand-primary-hover: #4DA3FF;
$brand-danger: #FF3B30;
$brand-success: #34C759;

/* Light theme (default) */
:root, page, [data-theme="light"] {
  --color-bg-page: #F5F5F5;
  --color-bg-card: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  --color-text-inverse: #FFFFFF;
  --color-divider: #EBEEF5;
  --color-border: #E0E0E0;
  --color-mask: rgba(0, 0, 0, 0.5);
  /* Brand-derived */
  --color-primary: var(--brand-primary);
  --color-primary-soft: #E5F2FF;
  --color-danger: var(--brand-danger);
  --color-success: var(--brand-success);
}

/* Dark theme */
[data-theme="dark"] {
  --color-bg-page: #000000;
  --color-bg-card: #1C1C1E;
  --color-bg-elevated: #2C2C2E;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #AAAAAA;
  --color-text-muted: #666666;
  --color-text-inverse: #1A1A1A;
  --color-divider: #2C2C2E;
  --color-border: #3A3A3C;
  --color-mask: rgba(0, 0, 0, 0.7);
  --color-primary-soft: rgba(0, 122, 255, 0.15);
}

/* System dark preference (when no override) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]), page:not([data-theme]) {
    --color-bg-page: #000000;
    /* ... etc */
  }
}
```

### Step 2: the theme store (Pinia)

`src/store/theme.ts`:

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('auto')
  // The resolved theme (what's actually applied)
  const resolved = ref<'light' | 'dark'>('light')

  // Watch system changes
  // H5: use matchMedia; MP/App: use uni.onThemeChange
  // #ifdef H5
  const systemMediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null
  if (systemMediaQuery) {
    systemMediaQuery.addEventListener('change', (e) => {
      if (mode.value === 'auto') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    })
  }
  // #endif
  // #ifdef MP || APP-PLUS
  uni.onThemeChange((res) => {
    if (mode.value === 'auto') {
      applyTheme(res.theme === 'dark' ? 'dark' : 'light')
    }
  })
  // #endif

  function applyTheme(theme: 'light' | 'dark') {
    resolved.value = theme
    // #ifdef H5 || APP-PLUS
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    // #endif
    // #ifdef MP
    // Mini-programs use page-level CSS variable via scoped class or style binding
    // See Step 1 note about the page selector
    // #endif
  }

  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    if (newMode === 'auto') {
      const systemDark = systemMediaQuery?.matches ?? false
      applyTheme(systemDark ? 'dark' : 'light')
    } else {
      applyTheme(newMode)
    }
    // Persist
    uni.setStorageSync('theme-mode', newMode)
  }

  function restore() {
    try {
      const saved = uni.getStorageSync('theme-mode')
      if (saved && ['light', 'dark', 'auto'].includes(saved)) {
        setMode(saved as ThemeMode)
      } else {
        setMode('auto')
      }
    } catch {
      setMode('auto')
    }
  }

  return { mode, resolved, setMode, restore }
})
```

In `App.vue`:

```vue
<script setup>
import { useThemeStore } from '@/store/theme'

onLaunch(() => {
  useThemeStore().restore()
})
</script>
```

### Step 3: the theme switcher component

```vue
<!-- components/ThemeSwitcher.vue -->
<template>
  <view class="theme-switcher">
    <view
      v-for="opt in options"
      :key="opt.value"
      :class="['option', { active: theme.mode === opt.value }]"
      @click="onPick(opt.value)"
    >
      <text>{{ opt.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { useThemeStore } from '@/store/theme'

const theme = useThemeStore()
const options = [
  { value: 'light', label: '浅色' },
  { value: 'dark',  label: '深色' },
  { value: 'auto',  label: '跟随系统' }
]

function onPick(value: 'light' | 'dark' | 'auto') {
  theme.setMode(value)
}
</script>

<style lang="scss" scoped>
.theme-switcher {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
}
.option {
  padding: 12rpx 24rpx;
  border: 1rpx solid var(--color-border);
  border-radius: 8rpx;
  color: var(--color-text-primary);
}
.option.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
</style>
```

### Step 4: use tokens in components

```vue
<style lang="scss" scoped>
.card {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1rpx solid var(--color-border);
}
.muted {
  color: var(--color-text-muted);
}
.danger {
  color: var(--color-danger);
}
</style>
```

CSS variables in `rpx` and `px` work the same way — they cascade through the DOM.

### Step 5: avoid the flash of wrong theme

The problem: when the app launches, it briefly shows the **default** theme before the
store restores the user's choice. On a slow device, you see a white flash before
dark mode kicks in.

**Fix**: render-blocking initialization. In `App.vue` or `index.html`:

```html
<!-- index.html (H5) -->
<script>
  // Synchronously apply the theme before any rendering
  try {
    const saved = localStorage.getItem('theme-mode')
    const mode = saved || 'auto'
    let theme = 'light'
    if (mode === 'dark') theme = 'dark'
    else if (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    }
    document.documentElement.setAttribute('data-theme', theme)
  } catch (e) {}
</script>
```

For MP / App, the theme attribute on `document.documentElement` is honored on
first paint (App) and at component mount (MP). The flash is usually less of an issue
on these platforms but can still happen on slow devices.

## Integrating with UI libraries

Most major UI libraries have their own theme variables. You need to swap them when
the user switches theme.

### uView / uView Plus

uView uses SCSS variables prefixed with `$u-`. Override them in your theme SCSS:

```scss
/* src/styles/uview-theme-light.scss */
$u-primary: #007AFF;
$u-warning: #FF9500;
$u-success: #34C759;
$u-error: #FF3B30;
$u-info: #8E8E93;
$u-text-color: #1A1A1A;
$u-text-color-inverse: #FFFFFF;
$u-bg-color: #FFFFFF;
$u-bg-color-page: #F5F5F5;
$u-border-color: #EBEEF5;

/* src/styles/uview-theme-dark.scss */
$u-primary: #4DA3FF;
$u-warning: #FFB340;
$u-success: #5CD87D;
$u-error: #FF6058;
$u-info: #B0B0B5;
$u-text-color: #F5F5F5;
$u-text-color-inverse: #1A1A1A;
$u-bg-color: #1C1C1E;
$u-bg-color-page: #000000;
$u-border-color: #2C2C2E;
```

When the user switches theme, dynamically inject the right SCSS variables. The simplest
way: import the right theme file in your `App.vue`'s `<style>` and use Vite's
`additionalData` in `vite.config.ts` to swap based on a CSS class on the body.

Practical approach for most apps:

1. Define both theme files
2. Add a `data-theme` attribute to `<html>` (or `<page>` in MP)
3. Use `[data-theme="dark"] .u-button { background: ... }` overrides for the few
   components that don't auto-adapt

### FirstUI

FirstUI has built-in dark mode support via its `fui-dark-mode` class. Apply to the
page root:

```vue
<template>
  <view :class="['page', { 'fui-dark-mode': theme.resolved === 'dark' }]">
    <!-- FirstUI components auto-adapt -->
  </view>
</template>
```

### ThorUI

ThorUI has its own theme system. Check the latest docs for the variable names.

## WeChat MP specific

WeChat MP supports a per-page theme attribute:

```jsonc
// pages.json
"globalStyle": {
  "navigationBarTextStyle": "white",        // "white" or "black"
  "navigationBarBackgroundColor": "#000000"
}
```

This controls the **nav bar** theme, separate from the page body. For nav bar:

- iOS MP: dark mode is automatic (the system nav bar inverts)
- Android MP: nav bar theme follows the OS; you can override with the
  `navigationBarTextStyle` key

For the page body, use the same CSS variables as above. WeChat MP **does** support
`prefers-color-scheme` media query as of recent versions.

## iOS H5 / PWA

iOS Safari has special support:

```html
<meta name="theme-color" content="#007AFF">                  <!-- address bar -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

For a PWA-installed web app, you can set the status bar style:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">  <!-- or "black" or "black-translucent" -->
```

## App (iOS / Android)

The App-side `manifest.json` has a `theme` field:

```jsonc
"app-plus": {
  "theme": {
    "primaryColor": "#007AFF",
    "background": "#FFFFFF"
  }
}
```

This controls the **splash screen** and some native UI bits. The app's webview
content uses the same CSS variables as H5.

## Brand color override (Level 4)

For multi-tenant apps where each tenant has its own brand color:

```ts
// src/store/branding.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useBrandingStore = defineStore('branding', () => {
  const primaryColor = ref('#007AFF')
  const logo = ref<string | null>(null)

  function apply() {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--brand-primary', primaryColor.value)
    }
  }

  watch(primaryColor, apply)

  function loadForTenant(tenantId: string) {
    // Fetch branding from server
    api.getTenantBranding(tenantId).then(b => {
      primaryColor.value = b.primaryColor
      logo.value = b.logo
    })
  }

  return { primaryColor, logo, apply, loadForTenant }
})
```

Inject the `--brand-primary` SCSS variable, then derive all other colors from it
using `color-mix()` or SCSS functions:

```scss
:root {
  --brand-primary: #007AFF;
  --color-primary: var(--brand-primary);
  --color-primary-hover: color-mix(in srgb, var(--brand-primary) 80%, white);
  --color-primary-active: color-mix(in srgb, var(--brand-primary) 80%, black);
  --color-primary-soft: color-mix(in srgb, var(--brand-primary) 15%, transparent);
}
```

`color-mix()` is supported in all modern browsers (iOS 16.4+, Android Chrome 111+).
For older browsers, use a JS function to compute the derived colors.

## Common pitfalls

1. **Flash of wrong theme** — the most common dark mode bug. Always apply the theme
   before the first paint via inline script in `index.html` (H5) or as the first
   thing in `App.vue`'s `onLaunch` (MP / App).
2. **Hardcoding hex values in components** — defeats the whole point. Use CSS
   variables for any color that varies by theme.
3. **Image colors not adapting** — if you have a dark image, you can't invert it with
   CSS. Provide separate light and dark assets, or use SVG with `currentColor` so
   they inherit text color.
4. **Third-party UI library not adapting** — most don't auto-adapt; you need to
   override their variables. Test the dark mode of every library component.
5. **Status bar / nav bar mismatch** — page is dark but the OS status bar is light
   (or vice versa). Sync them.
6. **Forgetting the print stylesheet** — when users print, they usually want light
   theme. Add `@media print { :root { ... light theme forced ... } }`.
7. **OS-inverted icons** — white icons on dark backgrounds look wrong on light
   backgrounds (and vice versa). Use SVG with `currentColor` or provide both.
8. **Forgetting persistence** — without `uni.setStorageSync`, the user's choice
   resets on every launch.
9. **Animations when switching** — abrupt color changes are jarring. Use CSS
   transitions on `background-color`, `color`, `border-color` for 200-300ms ease.

## Resources

- CSS `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- CSS `color-mix()`: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- uni-app manifest theme: https://uniapp.dcloud.net.cn/collocation/manifest.html
- iOS theme-color: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- WeChat MP theme: https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window
- uView theme: https://www.uviewui.com/components/setting.html
- FirstUI dark mode: https://www.firstui.cn/
- ThorUI: https://thorui.cn/

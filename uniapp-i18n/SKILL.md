---
name: uniapp-i18n
description: "Internationalization (i18n) in uni-app — uni-app's built-in locale API, vue-i18n integration, language switching, lazy-loading translations, number/date/currency formatting via Intl, RTL support, plural rules, and server-side i18n coordination. Use when the user needs to add multi-language support, switch between languages, format dates/numbers/currencies per locale, handle right-to-left languages (Arabic/Hebrew), or coordinate translations between client and server."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **i18n layer** for uni-app. After loading this skill, the agent should be able to:

1. Decide between uni-app's built-in i18n API and `vue-i18n` (and when to use both)
2. Set up translation files for multiple languages
3. Build a language-switcher (UI + persistence)
4. Format numbers, dates, and currencies per locale (via `Intl`)
5. Handle plural rules and gender (with `vue-i18n` v9+)
6. Handle right-to-left (RTL) languages
7. Lazy-load translations to keep bundles small
8. Coordinate client-side and server-side translations

If the question is about generic web i18n (e.g. "how do I structure translation
files?"), `vue-i18n` has excellent docs — load them. This skill is **uni-app-specific**:
locale detection per platform, WeChat MP locale quirks, App system language.

## When to use this skill

- "How do I add English / Chinese / Japanese support to my uni-app?"
- "How do I let the user switch language at runtime?"
- "How do I format dates for the user's locale?"
- "How do I support Arabic / Hebrew (RTL)?"
- "How do I lazy-load translations to keep the bundle small?"

## When NOT to use this skill

- "What is i18n?" → out of scope; this skill assumes you know the basics
- "How do I deploy?" → `uniapp-debugging-and-publishing`
- "How do I persist user preferences?" → `uniapp-state-and-data` (use a settings store
  for the chosen locale)

## Two layers: built-in vs vue-i18n

uni-app has its **own built-in i18n API** that is simple and zero-dependency. For
serious apps, you'll likely want **`vue-i18n`** on top. They are not mutually exclusive.

| Feature | Built-in (`uni.getLocale`) | `vue-i18n` v9 |
|---|---|---|
| String translations | Manual switch via `$t` from `@dcloudio/uni-i18n` | ✅ `$t('key')` |
| Locale detection | ✅ `uni.getLocale()` reads system | ✅ `useI18n()` composable |
| Plural rules | ❌ | ✅ built-in |
| Number / date / currency | ❌ use `Intl` directly | ✅ `n`, `d`, `n` with currency |
| Lazy loading | ❌ manual | ✅ built-in |
| RTL handling | ❌ | ⚠️ manual CSS direction |
| Server-side SSR | ❌ | ✅ |
| Bundle size cost | 0 KB | ~10–15 KB gzipped |

**Default recommendation**: for a small app with 2-3 languages and a few hundred keys,
**use the built-in API** — zero dependency, easy. For a real production app with
plurals, formatting, lazy-loading, or 5+ languages, use **`vue-i18n`**.

## Option A: built-in uni-app i18n

The built-in API comes from `@dcloudio/uni-i18n`. Most projects don't install it
explicitly — it's bundled with uni-app. The official built-in approach uses
`app.use()` to register i18n (see [uni-app i18n docs](https://uniapp.dcloud.net.cn/tutorial/i18n.html)),
making `$t` available in templates.

The example below shows a **manual alternative** using `globalProperties.$t` for when
you want full control without adding a dependency. It uses `uni.getLocale()` /
`uni.setLocale()` for locale detection and switching — these are real uni-app APIs.

### Translation files

Convention: put translations in `src/i18n/<locale>.json` (or `.js` for dynamic
loading).

```jsonc
// src/i18n/zh-CN.json
{
  "app": {
    "name": "我的应用"
  },
  "home": {
    "greeting": "你好，{name}"
  },
  "cart": {
    "empty": "购物车是空的",
    "items": "{count} 件商品"
  }
}
```

```jsonc
// src/i18n/en.json
{
  "app": {
    "name": "MyApp"
  },
  "home": {
    "greeting": "Hello, {name}"
  },
  "cart": {
    "empty": "Your cart is empty",
    "items": "{count} items"
  }
}
```

### Wire it up

In `main.ts`:

```ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import en from './i18n/en.json'
import zhCN from './i18n/zh-CN.json'

const messages = {
  en,
  'zh-CN': zhCN
}

export function createApp() {
  const app = createSSRApp(App)
  // Make `$t` available in templates
  app.config.globalProperties.$t = (key: string, values?: Record<string, any>) => {
    const locale = uni.getLocale() || 'en'
    const dict = messages[locale as keyof typeof messages] || messages.en
    // Try nested path lookup first, fall back to flat key lookup
    let str: any = key.split('.').reduce<any>(
      (o, k) => (o == null ? undefined : o[k]),
      dict
    )
    // If nested lookup failed, try flat key lookup (e.g. {"app.name": "..."})
    if (str == null) str = (dict as any)[key]
    if (str == null) return key  // fall back to the key itself
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }
  return { app }
}
```

### Use in components

```vue
<template>
  <view>
    <text>{{ $t('home.greeting', { name: userName }) }}</text>
    <text>{{ $t('cart.items', { count: 5 }) }}</text>
  </view>
</template>
```

### Detect / set locale

```ts
// Get current locale (from system, or override via settings)
const currentLocale = uni.getLocale()
// Returns: 'zh-CN' | 'en' | 'zh-HK' | 'ja' | 'ko' | etc.

// Set locale (must be called BEFORE rendering)
uni.setLocale('en')
```

`uni.getLocale()` follows the WeChat MP locale convention. On WeChat MP, it reads
`wx.getSystemInfoSync().language` and maps to BCP-47. On H5, it reads
`navigator.language`. On App, it reads the OS locale.

## Option B: vue-i18n (recommended for production)

### Install

```bash
npm i vue-i18n@9
```

### Setup

`src/i18n/index.ts`:

```ts
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const i18n = createI18n({
  legacy: false,        // use Composition API style
  globalInjection: true, // $t available in templates
  locale: uni.getLocale() || 'zh-CN',
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN
  }
})
```

`main.ts`:

```ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

export function createApp() {
  const app = createSSRApp(App)
  app.use(i18n)
  return { app }
}
```

### Use in components

```vue
<template>
  <view>
    <text>{{ t('home.greeting', { name: userName }) }}</text>
  </view>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/store/settings'
const { t, locale } = useI18n()

function switchLocale(loc: string) {
  locale.value = loc
  uni.setLocale(loc)  // sync uni-app's built-in locale too
  // persist
  useSettingsStore().setLanguage(loc)
}
</script>
```

### Locale files with plurals and rich text

```jsonc
// src/i18n/locales/en.json
{
  "cart": {
    "empty": "Your cart is empty",
    "items": "no items | one item | {count} items",
    "checkout": "Go to checkout ({total})"
  },
  "user": {
    "greeting": "Hello {name}",
    "lastSeen": "Last seen {time}"
  }
}
```

```jsonc
// src/i18n/locales/zh-CN.json
{
  "cart": {
    "empty": "购物车是空的",
    "items": "没有商品 | 一件商品 | {count} 件商品",
    "checkout": "去结算 (¥{total})"
  },
  "user": {
    "greeting": "你好 {name}",
    "lastSeen": "上次登录 {time}"
  }
}
```

Use in template:

```vue
<text>{{ t('cart.items', cart.totalCount) }}</text>
<!-- "0 items" / "1 item" / "5 items" -->
```

The `|`-separated form is the i18n **plural rule**: zero, one, other.

### Number, date, and currency formatting

vue-i18n uses the `Intl` APIs under the hood:

```ts
const { n, d, n: c } = useI18n()

n(1234.5)                  // "1,234.5" (en) or "1.234,5" (de)
n(1234.5, 'currency', { currency: 'USD' })  // "$1,234.50"
n(new Date(), 'short')     // "1/15/26" (en) or "2026/1/15" (zh-CN)
d(new Date(), 'long')      // "January 15, 2026" or "2026年1月15日"
```

For pure `Intl` (no vue-i18n):

```ts
const fmt = new Intl.NumberFormat(uni.getLocale(), { style: 'currency', currency: 'USD' })
fmt.format(1234.5)  // "$1,234.50"

const dtf = new Intl.DateTimeFormat(uni.getLocale(), { dateStyle: 'long' })
dtf.format(new Date())  // locale-specific
```

## Lazy-loading translations

For apps with 5+ languages, lazy-load each language file:

```ts
// src/i18n/index.ts
import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: uni.getLocale() || 'zh-CN',
  fallbackLocale: 'en',
  messages: {}  // start empty
})

export async function loadLocale(locale: string) {
  // Whitelist: only allow known locale files
  const allowed = ['en', 'zh-CN', 'zh-HK', 'ja', 'ko', 'fr', 'de', 'es']
  if (!allowed.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}, falling back to 'en'`)
    locale = 'en'
  }
  // Only download the language we need
  const messages = await import(`./locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  i18n.global.locale.value = locale
}
```

```ts
// App.vue
import { loadLocale } from '@/i18n'

onLaunch(async () => {
  const locale = uni.getLocale() || 'zh-CN'
  await loadLocale(locale)
})
```

This keeps the initial bundle to one language; switching downloads on demand.

## Language switcher component

```vue
<!-- components/LanguageSwitcher.vue -->
<template>
  <view class="lang-switcher">
    <view
      v-for="loc in available"
      :key="loc.code"
      :class="['lang', { active: current === loc.code }]"
      @click="onPick(loc.code)"
    >
      <text>{{ loc.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/store/settings'

const { locale } = useI18n()
const settings = useSettingsStore()

const available = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en',    label: 'English' },
  { code: 'ja',    label: '日本語' }
]

const current = computed(() => locale.value)

function onPick(code: string) {
  locale.value = code
  uni.setLocale(code)
  settings.setLanguage(code)
}
</script>

<style lang="scss" scoped>
.lang-switcher { display: flex; gap: 20rpx; padding: 20rpx; }
.lang {
  padding: 12rpx 24rpx;
  border: 1rpx solid $uni-border-color;
  border-radius: 8rpx;
}
.lang.active {
  background: $brand-primary;
  color: #fff;
  border-color: $brand-primary;
}
</style>
```

## RTL (right-to-left) languages

For Arabic, Hebrew, Persian, Urdu: set the document direction and use logical CSS
properties.

### Detect + apply

```ts
const rtlLocales = ['ar', 'he', 'fa', 'ur']

function applyDirection(locale: string) {
  const dir = rtlLocales.includes(locale.split('-')[0]) ? 'rtl' : 'ltr'
  // #ifdef H5
  document.documentElement.setAttribute('dir', dir)
  // #endif
  // MP / App — write to global data and read in pages
  getApp().globalData.dir = dir
}

onLaunch(() => applyDirection(uni.getLocale()))
```

### Use logical CSS properties

Replace physical properties with logical ones to make layouts direction-aware:

| Physical (LTR-only) | Logical (RTL-aware) |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `text-align: left` | `text-align: start` |
| `left: 0` | `inset-inline-start: 0` |
| `right: 0` | `inset-inline-end: 0` |
| `border-left` | `border-inline-start` |

```scss
.card {
  margin-inline-start: 20rpx;   // becomes right-side in RTL
  padding-inline-end: 30rpx;
  text-align: start;
}
```

Browser support for logical properties: iOS 14.5+, Android 5+, all modern browsers. Safe
to use.

## Server-side i18n coordination

When the server returns data (order status, error messages, etc.), you need a
strategy. Three common patterns:

### Pattern 1: Server returns keys, client translates

```json
{ "status": "ORDER_PENDING", "messageKey": "order.status.pending" }
```

```ts
const msg = t(data.messageKey)  // client translates
```

Pros: simple, no server-side translation needed. Cons: every language change requires
re-fetching.

### Pattern 2: Server returns translations (i18n aware)

```json
{
  "status": "ORDER_PENDING",
  "messages": {
    "en": "Order pending",
    "zh-CN": "订单待处理"
  }
}
```

```ts
const msg = data.messages[locale] || data.messages['en']
```

Pros: stable, no re-fetch on language change. Cons: server must maintain translations.

### Pattern 3: Pure server, client receives rendered text

```json
{ "status": "ORDER_PENDING", "message": "Order pending" }
```

Pros: simplest client. Cons: server becomes i18n-aware; language must be sent with every
request.

**Recommendation**: Pattern 1 for most apps. Server returns stable keys; client
translates. Switch to Pattern 2 only if you have many language-specific server
messages (e.g. notifications).

To send the user's locale with every request, add an interceptor:

```ts
// src/utils/request.ts
header['Accept-Language'] = uni.getLocale()
```

## Platform-specific locale quirks

| Platform | How it detects locale | Gotchas |
|---|---|---|
| WeChat MP | `wx.getSystemInfoSync().language` mapped to BCP-47 | Maps `zh_CN` → `zh-CN`; user may have set custom in WeChat settings |
| H5 | `navigator.language` | Browser default; user rarely changes |
| App (iOS) | `NSLocale.preferredLanguages[0]` | iOS's preferred language list (may differ from system) |
| App (Android) | `java.util.Locale.getDefault().toLanguageTag()` | Maps to BCP-47 |
| Alipay / ByteDance | Similar to WeChat MP | Slight differences in the mapping |

For MP, you can't always trust the system locale — many users in CN have set their
WeChat to English but the system to Chinese. Let the user override.

## Common pitfalls

1. **Hardcoding user-facing strings in templates** — every string should go through
   `t()`. Run a regex sweep before each release: `>[^<{]+<` looking for untranslated text.
2. **Mixing `$t` from uni-app's built-in with `t` from vue-i18n** — pick one. They
   both end up using the same key namespace but expect different config.
3. **Forgetting to set `dir="rtl"`** on the document for RTL languages — the layout
   looks wrong without it.
4. **Using `margin-left` / `right` instead of `margin-inline-start` / `end`** — your
   RTL users get a broken layout.
5. **Not handling locale in URL or storage** — the user's choice must be persisted and
   applied on next launch. `useSettingsStore.setLanguage()` + restore in `onLaunch`.
6. **Date format doesn't account for locale** — `new Date().toLocaleString()` is fine,
   but `new Date().toISOString().slice(0, 10)` is not (always returns ISO date).
7. **Currency formatting without `Intl`** — manual `$${amount.toFixed(2)}` doesn't
   account for different currency formats. Use `Intl.NumberFormat`.
8. **Translating empty strings** — `t('')` returns `''` but `t('key.missing')` returns
   `'key.missing'`. Be careful with the "fall back to key" behavior.

## References in this skill

> v1.0 keeps all content inline. Splits planned for v1.1.

- `references/vue-i18n-integration.md` — *planned*: deep vue-i18n setup (inline)
- `references/locale-switching.md` — *planned*: language switcher patterns (inline)
- `references/number-date-currency.md` — *planned*: Intl API deep dive (inline)
- `references/rtl-and-plural.md` — *planned*: RTL + plural rules (inline)
- `references/server-coordination.md` — *planned*: client/server i18n coordination
  (inline)

## Examples in this skill

> v1.0 keeps all content inline. Standalone files planned for v1.1.

- `examples/i18n-setup.ts` — *planned* (currently inline)
- `examples/en.json`, `examples/zh-CN.json` — *planned* (currently inline)
- `examples/language-switcher.vue` — *planned* (currently inline)

## Resources

- uni-app i18n: https://uniapp.dcloud.net.cn/tutorial/i18n.html
- vue-i18n: https://vue-i18n.intlify.dev/
- MDN Intl: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- BCP-47 language tags: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
- WeChat MP locale: https://developers.weixin.qq.com/miniprogram/dev/reference/api/wx.getSystemInfo.html

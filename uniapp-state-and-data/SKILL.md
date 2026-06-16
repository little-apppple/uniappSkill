---
name: uniapp-state-and-data
description: "State and persistence in uni-app — Pinia setup, useStore patterns, uni.storage strategy, user session, persistence plugins, login flow integration. Use when the user needs to share state across pages, persist data across launches, manage user session/auth, implement a cart/settings/notifications store, or choose between Pinia and uni.storage. Do NOT use for per-component reactive state (use ref/reactive), server data fetching (use uniapp-network-layer), or event bus patterns (covered in this skill as a side note)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

How to manage data that lives longer than a single page: user session, app-wide
preferences, server data cache, and the persistence of all of it across app launches.

After loading this skill, the agent should be able to:

1. Set up **Pinia** (the recommended state library) — even on Vue 2
2. Decide what goes in Pinia vs `uni.storage` vs server-fetched on demand
3. Design `useUserStore`, `useCartStore`, etc. with proper TS types
4. Implement persistence: when `uni.setStorage` is right, when a sync wrapper is right,
   and when you need a real persistence plugin
5. Wire up login/logout flow with the rest of the app

If the user is asking about *server data fetching* (`uni.request`), that's
`uniapp-network-layer` — load that skill, not this one.

## When to use this skill

- "How do I share state between pages?"
- "How do I keep the user logged in across launches?"
- "Where do I put the cart / favorites / settings?"
- "How do I persist Pinia state?"
- "How do I implement login + redirect-to-login on session loss?"

## When NOT to use this skill

- "How do I call my API?" → `uniapp-network-layer`
- "How do I store JWT in a secure way on iOS?" → also a touch of `uniapp-platform-config`
- "How do I implement a list page that loads more?" → `uniapp-ui-patterns`

## Pinia — the default recommendation

Pinia is the de-facto state library for Vue 3 (and works on Vue 2 via `pinia@2`). It
replaces Vuex 3 with a much simpler API. Use it for:

- **User session** (`useUserStore`)
- **Cart** (`useCartStore`)
- **Global UI state** (`useUIStore` — modals, sidebars, toasts)
- **App-wide settings** (`useSettingsStore` — theme, language)

Don't use Pinia for:

- **Per-page local state** — just use `ref()` / `reactive()` in the page
- **Server data** — fetch on demand, cache in Pinia only if you need cross-page sharing
- **Form state** — keep in the component, not the global store

### Setup

`main.ts` (Vue 3 + Vite):

```ts
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return { app }
}
```

`main.js` (Vue 2):

```js
import Vue from 'vue'
import App from './App'
import { createPinia, PiniaVuePlugin } from 'pinia'

Vue.use(PiniaVuePlugin)
const pinia = createPinia()

const app = new Vue({ ...App, pinia })
app.$mount()
```

### A `useUserStore` (Vue 3 + TS, composition style)

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile, refreshToken as refreshTokenApi } from '@/api/user'

export interface UserProfile {
  id: string
  nickname: string
  avatar: string
}

export const useUserStore = defineStore('user', () => {
  // ---- state ----
  const token = ref<string | null>(null)
  const profile = ref<UserProfile | null>(null)
  const expiresAt = ref<number | null>(null)

  // ---- getters ----
  const isLoggedIn = computed(() =>
    !!token.value && (expiresAt.value ?? 0) > Date.now()
  )
  const userId = computed(() => profile.value?.id ?? null)

  // ---- actions ----
  async function login(credentials: { phone: string; code: string }) {
    const { token: t, expiresIn } = await loginApi(credentials)
    token.value = t
    expiresAt.value = Date.now() + expiresIn * 1000
    await fetchProfile()
  }

  async function fetchProfile() {
    if (!token.value) return
    profile.value = await getProfile()
  }

  function logout() {
    token.value = null
    profile.value = null
    expiresAt.value = null
    uni.removeStorageSync('user-session')
  }

  function restoreFromStorage() {
    try {
      const raw = uni.getStorageSync('user-session')
      if (raw) {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        token.value = data.token
        expiresAt.value = data.expiresAt
        profile.value = data.profile
      }
    } catch (e) {
      console.warn('Failed to restore user session', e)
    }
  }

  async function refreshSession() {
    if (!token.value) throw new Error('No token to refresh')
    // Call your backend to refresh the token (implementation depends on your auth backend)
    const { token: newToken, expiresIn } = await refreshTokenApi({ token: token.value })
    token.value = newToken
    expiresAt.value = Date.now() + expiresIn * 1000
  }

  return {
    token, profile, expiresAt,
    isLoggedIn, userId,
    login, fetchProfile, logout, restoreFromStorage, refreshSession
  }
})
```

Composition style (with `ref` / `computed` inside `defineStore` callback) is the
recommended form. The options style (`{ state, getters, actions }`) is older and looks
like Vuex.

### A `useCartStore` with persistence

```ts
// src/store/cart.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { CartItem } from '@/types'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalCount = computed(() =>
    items.value.reduce((s, i) => s + i.qty, 0)
  )
  const totalPrice = computed(() =>
    items.value.reduce((s, i) => s + i.qty * i.price, 0)
  )

  function add(item: CartItem) {
    const existing = items.value.find(i => i.skuId === item.skuId)
    if (existing) existing.qty += item.qty
    else items.value.push({ ...item })
  }

  function remove(skuId: string) {
    items.value = items.value.filter(i => i.skuId !== skuId)
  }

  function clear() {
    items.value = []
  }

  // Persist on every change
  watch(items, (val) => {
    uni.setStorageSync('cart', JSON.stringify(val))
  }, { deep: true })

  function restore() {
    try {
      const raw = uni.getStorageSync('cart')
      if (raw) items.value = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (e) {}
  }

  return { items, totalCount, totalPrice, add, remove, clear, restore }
})
```

### Restore on app launch

In `App.vue`:

```vue
<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useCartStore } from '@/store/cart'

const user = useUserStore()
const cart = useCartStore()

onLaunch(() => {
  user.restoreFromStorage()
  cart.restore()
})
</script>
```

## `uni.storage` — when to use it directly

`uni.setStorage` / `uni.getStorage` / etc. are the platform-abstracted key-value store.
Use them when:

- You have **non-Pinia** data you want to persist (a recent-searches list, draft
  messages, theme override)
- You want to **bypass Pinia** for hot-path data (e.g. logging a beacon)
- You're writing a low-level utility that needs storage but doesn't want to depend on
  a store

Async vs sync:

- `uni.setStorage({ key, data, success, fail })` — async, doesn't block UI; recommended
- `uni.setStorageSync(key, data)` — sync; OK for small writes; large values block

Limits:

- WeChat MP: 10MB total per app
- Other MP: varies; usually 5–10MB
- H5: localStorage, ~5MB
- App: uses native preference storage (iOS UserDefaults / Android SharedPreferences); no hard limit but not recommended for large data (>100KB). Use SQLite or file system for large datasets.

**`uni.storage` is not encrypted.** Don't put real secrets (refresh tokens, passwords)
there. For sensitive data, use platform-specific secure storage (Keychain on iOS,
EncryptedSharedPreferences on Android — these require a UTS plugin or uni-id).

> **Note on the examples above**: the `useUserStore` stores a JWT access token in
> `uni.storage` for simplicity. This is acceptable for most apps (access tokens are
> short-lived and not high-value secrets). For security-critical apps, store the
> refresh token in secure storage (via a UTS plugin) and only keep the access token
> in memory.

## The login / session-loss flow

The classic uni-app auth pattern:

1. **App launch**: restore session from storage; if present and not expired, fetch
   profile.
2. **API request**: every request includes the auth token; interceptor checks for
   401 and triggers re-auth.
3. **Session loss**: re-auth modal or redirect to login.
4. **Login success**: store token, fetch profile, redirect to original target.

```ts
// src/utils/request.ts
import { useUserStore } from '@/store/user'

export async function request<T>(options: UniApp.RequestOptions): Promise<T> {
  // Call useUserStore() inside the function — Pinia is guaranteed to be ready at call time
  const user = useUserStore()
  const token = user.token
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      header: {
        ...options.header,
        Authorization: token ? `Bearer ${token}` : ''
      },
      success: async (res) => {
        if (res.statusCode === 401) {
          user.logout()
          const current = getCurrentPages().slice(-1)[0]
          const route = current ? `/${current.route}` : ''
          const query = current?.$page?.options
            ? '?' + Object.entries(current.$page.options)
                .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
                .join('&')
            : ''
          const redirect = route
            ? `?redirect=${encodeURIComponent(route + query)}`
            : ''
          uni.reLaunch({ url: `/pages/login/login${redirect}` })
          reject(res)
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}
```

See `uniapp-routing-and-tabbar/examples/login-redirect.md` for the full login page
implementation and the `requireAuth` guard.

## Persistence patterns

### Option 1: `watch` + `setStorageSync` (manual)

Cheapest. One watcher per store. Synchronous, blocks UI on large writes.

```ts
watch(state, (val) => uni.setStorageSync('my-store', JSON.stringify(val)), { deep: true })
```

### Option 2: `pinia-plugin-persistedstate`

```bash
npm i pinia-plugin-persistedstate
```

```ts
// main.ts
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

```ts
export const useSettingsStore = defineStore('settings', () => {
  // ...
}, {
  persist: {
    key: 'settings',
    storage: {
      getItem: (k) => uni.getStorageSync(k),
      setItem: (k, v) => uni.setStorageSync(k, v)
    }
  }
})
```

### Option 3: `pinia-plugin-unistorage`

Designed for uni-app. Handles `uni.storage` directly:

```bash
npm i pinia-plugin-unistorage
```

```ts
import { createUnistorage } from 'pinia-plugin-unistorage'
const pinia = createPinia()
pinia.use(createUnistorage())
```

Enable persistence per-store with the `persist` option:

```ts
export const useSettingsStore = defineStore('settings', () => {
  // ...
}, {
  persist: {
    key: 'settings'  // storage key; omit `persist` to skip persistence
  }
})
```

### Option 4: Server-side persistence (when security matters)

If the data is sensitive (cart with prices that change, loyalty points), **don't** rely
on local persistence. The server is the source of truth. Local is just a cache —
revalidate before any monetary action.

## Common patterns

### Settings store with a theme

```ts
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark' | 'auto'>('auto')
  const language = ref<'zh' | 'en'>('zh')

  function setTheme(t: typeof theme.value) { theme.value = t }
  function setLanguage(l: typeof language.value) { language.value = l }

  return { theme, language, setTheme, setLanguage }
}, {
  persist: true
})
```

> **Light/dark/auto theme, color tokens, system theme detection, and UI library
> integration** are all covered in depth by the `uniapp-theming` skill. The store
> pattern above is just the persistence piece; the actual CSS variables, first-paint
> no-flash, and per-library theme overrides all live there.

### UI store for global toasts / modals

```ts
export const useUIStore = defineStore('ui', () => {
  const toast = ref<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  const confirmDialog = ref<{
    title: string; message: string; resolve: (ok: boolean) => void
  } | null>(null)

  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 2000)
  }

  function confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      confirmDialog.value = { title, message, resolve }
    })
  }

  function closeConfirm(ok: boolean) {
    confirmDialog.value?.resolve(ok)
    confirmDialog.value = null
  }

  return { toast, confirmDialog, showToast, confirm, closeConfirm }
})
```

Mount a global `<GlobalToast />` / `<GlobalConfirm />` in `App.vue` — they read from
`useUIStore` and render. Any component calls `ui.showToast('保存成功')` without needing
to know the DOM structure.

## Cross-page events (event bus)

For one-off broadcasts (e.g. "user updated their avatar, refresh header"):

```ts
// Sender
uni.$emit('user-avatar-updated', newUrl)

// Receiver
onMounted(() => uni.$on('user-avatar-updated', (url) => { avatar.value = url }))
onUnmounted(() => uni.$off('user-avatar-updated'))  // critical — clean up
```

For anything more substantial, prefer Pinia. Event buses leak.

## Common mistakes

1. **Storing real secrets in `uni.storage`** — unencrypted, readable by anyone with
   file access on the device.
2. **Forgetting to call `uni.$off` in `onUnmounted`** — memory leak.
3. **Pinia store too large** — if your user store has 30 fields, split it
   (`useUserSession`, `useUserProfile`, `useUserPreferences`).
4. **Not hydrating from storage on launch** — store exists but `token` is null, so the
   API call fails.
5. **Local persistence of prices / loyalty points** — server is the source of truth;
   revalidate before charging.
6. **Mixing Pinia and `uni.$emit` for the same data** — pick one; mixing causes
   "updated from two places, which one wins?" bugs.
7. **Calling `setStorage` in a tight loop** — debounce writes. Or use
   `pinia-plugin-unistorage` which handles this.

## Resources

- Pinia: https://pinia.vuejs.org/
- `uni.storage`: https://uniapp.dcloud.net.cn/api/storage/storage.html
- `pinia-plugin-persistedstate`: https://prazdevs.github.io/pinia-plugin-persistedstate/
- `pinia-plugin-unistorage`: https://github.com/yang1201/pinia-plugin-unistorage
- `uni.$emit` / `$on`: https://uniapp.dcloud.net.cn/api/window/communication.html

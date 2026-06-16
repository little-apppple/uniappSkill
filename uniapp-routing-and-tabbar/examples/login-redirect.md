# Login → Redirect → Back Pattern

The standard "user must log in before doing X" flow, with proper back-stack handling.

## The flow

1. User taps an action that requires auth (e.g. "View Order History")
2. App checks `useUserStore().isLoggedIn`
3. If not logged in, redirect to login, passing the original target as `?redirect=...`
4. User logs in; login page reads `redirect`, calls `uni.redirectTo({ url: redirect })`
5. If no `redirect`, default to home

## The guard (call this before any auth-required action)

```ts
// src/utils/auth.ts
import { useUserStore } from '@/store/user'

export function requireAuth(targetUrl?: string): boolean {
  const user = useUserStore()
  if (user.isLoggedIn) return true

  const current = getCurrentPages().slice(-1)[0]
  const here = current ? `/${current.route}` : ''
  const redirect = encodeURIComponent(targetUrl || here)

  uni.reLaunch({ url: `/pages/login/login?redirect=${redirect}` })
  return false
}

// Usage in a page
function onTapViewOrders() {
  if (!requireAuth('/pages/order/list')) return
  uni.navigateTo({ url: '/pages/order/list' })
}
```

## The login page

```vue
<template>
  <view class="login-page">
    <AppNavBar title="登录" :show-back="false" />

    <view class="form">
      <input
        v-model="phone"
        type="number"
        maxlength="11"
        placeholder="手机号"
        class="input"
      />
      <view class="code-row">
        <input
          v-model="code"
          type="number"
          maxlength="6"
          placeholder="验证码"
          class="input"
        />
        <button
          :disabled="countdown > 0 || sending"
          @click="sendCode"
          class="send-btn"
        >
          {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
        </button>
      </view>
      <button :disabled="loading" @click="onSubmit" class="submit">
        登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const phone = ref('')
const code = ref('')
const countdown = ref(0)
const sending = ref(false)
const loading = ref(false)
const redirect = ref<string | null>(null)

const user = useUserStore()

let countdownTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

onLoad((options) => {
  redirect.value = options.redirect ? decodeURIComponent(options.redirect) : null
})

async function sendCode() {
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '手机号不正确', icon: 'none' })
    return
  }
  sending.value = true
  try {
    await api.sendSmsCode(phone.value)
    uni.showToast({ title: '已发送', icon: 'success' })
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } finally {
    sending.value = false
  }
}

async function onSubmit() {
  if (!phone.value || !code.value) {
    uni.showToast({ title: '请填写完整', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await user.login({ phone: phone.value, code: code.value })
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      if (redirect.value) {
        // Go to the original target, replacing the login page in the stack
        uni.redirectTo({ url: redirect.value })
      } else {
        uni.reLaunch({ url: '/pages/home/home' })
      }
    }, 500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page { min-height: 100vh; background: #fff; }
.form { padding: 40rpx; }
.input {
  height: 88rpx;
  border: 1rpx solid $uni-border-color;
  border-radius: 8rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}
.code-row { display: flex; align-items: center; }
.code-row .input { flex: 1; margin-right: 20rpx; }
.send-btn {
  width: 200rpx;
  height: 88rpx;
  font-size: 26rpx;
  background: $brand-primary;
  color: #fff;
  border-radius: 8rpx;
}
.submit {
  height: 88rpx;
  background: $brand-primary;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  margin-top: 40rpx;
}
</style>
```

## Auto-login on app launch (silent token refresh)

```vue
<!-- App.vue -->
<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const user = useUserStore()

onLaunch(async () => {
  user.restoreFromStorage()
  if (user.isLoggedIn) {
    try {
      // Refresh the token silently if it's about to expire
      await user.refreshSession()
    } catch (e) {
      // Refresh failed; user has to log in again
      user.logout()
    }
  }
})
</script>
```

The `refreshSession` action calls your server's `/auth/refresh` endpoint with the
current refresh token (stored in storage). On success, update the access token. On
failure, log out.

## Session-loss interceptor

In your `request` wrapper (see `uniapp-network-layer`):

```ts
if (res.statusCode === 401) {
  user.logout()
  // Re-launch to login, saving the current page as redirect
  const pages = getCurrentPages()
  const here = pages.length > 0 ? `/${pages[pages.length - 1].route}` : ''
  const redirect = encodeURIComponent(here)
  uni.reLaunch({ url: `/pages/login/login?redirect=${redirect}` })
}
```

## Things to get right

1. **Use `reLaunch` for "lost session → login"** — you don't want the user to be able
   to navigate back to the page that triggered the 401, because the data is gone.
2. **Default the redirect** — if the user opened the app from a share card and got 401'd,
   you need a sensible default (e.g. home).
3. **Don't loop the login page** — if `requireAuth` runs on the login page itself (it
   shouldn't), you'd recurse. Guard against it:
   ```ts
   if (current?.route === 'pages/login/login') return true
   ```
4. **Persist the redirect across page reloads** — H5 sometimes triggers a full page
   refresh; if the URL still has `?redirect=`, the login page can recover.
5. **Token refresh on 401** — if your backend supports refresh, do the refresh in the
   interceptor and retry the original request, so the user doesn't have to re-login for
   a transient expired token.

## Common mistakes

- **Forgetting `redirectTo` vs `reLaunch`** — `redirectTo` keeps the login page in the
  stack (back button returns to it). `reLaunch` clears. For "force to login", use
  `reLaunch` from the call site; for "user just logged in, go to original target", use
  `redirectTo` from the login page.
- **Storing the redirect in a global ref** — the URL is the right place; it survives
  page reloads and works for H5 back/forward.
- **Showing the login page over a modal** — confusing UX. Use full-page reLaunch.
- **Calling `requireAuth` from a child component** — child components shouldn't know
  about the login flow. The guard belongs in the page that owns the action, or in a
  store action that wraps the API call.

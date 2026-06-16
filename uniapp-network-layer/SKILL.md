---
name: uniapp-network-layer
description: "Network layer in uni-app — request wrapper, interceptors, upload/download, error handling, retry, concurrency, and integration with Pinia auth. Use when the user needs to call APIs, encapsulate uni.request, handle 401/auth errors, upload images/files, manage request cancellation, configure base URL per environment, or build a typed API client. Covers uni.request, uni.uploadFile, uni.downloadFile, request/response interceptors, file upload to OSS/cos, timeout/retry, and common pitfalls (CORS on H5, domain whitelist on MP)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **network layer** — the code that talks to your backend, third-party APIs, and
storage. After loading this skill, the agent should be able to:

1. Build a typed `request` wrapper around `uni.request`
2. Add interceptors for auth (token injection), error toast, retry, 401 handling
3. Configure base URL per environment (dev / staging / prod)
4. Handle uploads (`uni.uploadFile`) and downloads (`uni.downloadFile`)
5. Cancel in-flight requests on page unload
6. Avoid the most common pitfalls (CORS on H5, domain whitelist on MP, timeout on
   large uploads)

If the user is asking about *what data to store locally* (cache, persistence), that's
`uniapp-state-and-data`. If they need to display a list of data, that's
`uniapp-ui-patterns`.

## When to use this skill

- "How do I call my backend API?"
- "How do I add an auth token to every request?"
- "The MP gives 'url not in domain whitelist' — what do I do?"
- "How do I upload an image from `<uploader>` to OSS?"
- "How do I cancel a request when the user navigates away?"
- "How do I set a different base URL for dev and prod?"

## When NOT to use this skill

- "How do I store the user info returned by /me?" → `uniapp-state-and-data`
- "How do I show a list of items?" → `uniapp-ui-patterns`
- "How do I show a network error toast?" → not a network question; use `uni.showToast`
  with a try/catch in the caller

## The minimal request wrapper

`src/utils/request.ts`:

```ts
import { useUserStore } from '@/store/user'

const BASE_URL = 'https://api.myapp.com'

export interface ApiError {
  code: number
  message: string
  raw?: any
}

let isRedirectingToLogin = false

export async function request<T = any>(
  options: UniApp.RequestOptions & { skipAuth?: boolean; silent?: boolean }
): Promise<T> {
  const user = useUserStore()
  const { skipAuth, silent, ...opts } = options

  // Inject auth token
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.header as Record<string, string> | undefined)
  }
  if (!skipAuth && user.token) {
    header.Authorization = `Bearer ${user.token}`
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...opts,
      url: opts.url.startsWith('http') ? opts.url : BASE_URL + opts.url,
      header,
      timeout: opts.timeout ?? 15000,
      success: (res) => {
        if (res.statusCode === 401) {
          handle401()
          reject({ code: 401, message: '未登录' } as ApiError)
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
          return
        }
        const err: ApiError = {
          code: res.statusCode,
          message: (res.data as any)?.message || `HTTP ${res.statusCode}`,
          raw: res
        }
        if (!silent) uni.showToast({ title: err.message, icon: 'none' })
        reject(err)
      },
      fail: (err) => {
        if (!silent) uni.showToast({ title: '网络错误', icon: 'none' })
        reject({ code: -1, message: '网络错误', raw: err } as ApiError)
      }
    })
  })
}

function handle401() {
  const user = useUserStore()
  if (isRedirectingToLogin) return
  isRedirectingToLogin = true
  user.logout()
  const current = getCurrentPages().slice(-1)[0]
  const redirect = current ? `?redirect=${encodeURIComponent(current.route)}` : ''
  uni.reLaunch({ url: `/pages/login/login${redirect}` })
  setTimeout(() => { isRedirectingToLogin = false }, 1000)
}
```

Usage in a page:

```ts
import { request } from '@/utils/request'

interface Order { id: string; total: number }

async function loadOrder(id: string) {
  const order = await request<Order>({
    url: `/api/orders/${id}`,
    method: 'GET'
  })
  return order
}
```

## Per-environment base URL

Use a build-time variable. With Vite:

```ts
// src/config.ts
const ENV = import.meta.env.MODE  // 'development' | 'production'

export const BASE_URL = {
  development: 'https://api-dev.myapp.com',
  production: 'https://api.myapp.com'
}[ENV] || 'https://api.myapp.com'

export const ENV_NAME = ENV
```

For more environments (staging, preview), use `import.meta.env.VITE_APP_ENV` and a
`.env.staging` file. See [Vite env variables](https://vitejs.dev/guide/env-and-mode.html).

For HBuilderX CLI, the same pattern works.

For runtime switching (a "switch environment" feature for QA builds), expose a
`useSettingsStore` flag that overrides the URL.

## API client with typed methods

```ts
// src/api/order.ts
import { request } from '@/utils/request'
import type { Order, OrderItem, CreateOrderPayload } from '@/types'

export const orderApi = {
  list: (params?: { status?: string; page?: number }) =>
    request<{ items: Order[]; total: number }>({
      url: '/api/orders',
      method: 'GET',
      data: params
    }),

  get: (id: string) =>
    request<Order>({ url: `/api/orders/${id}`, method: 'GET' }),

  create: (payload: CreateOrderPayload) =>
    request<Order>({ url: '/api/orders', method: 'POST', data: payload }),

  cancel: (id: string) =>
    request<void>({ url: `/api/orders/${id}/cancel`, method: 'POST' })
}
```

This is the pattern most uni-app projects use. The `api/` folder holds one file per
backend resource; the `request` wrapper handles the boilerplate.

## Request cancellation

`uni.request` doesn't return a cancel handle on Vue 3 (it does on Vue 2 with
`abort()`). To cancel, you have two options:

### Option 1: AbortController (Vue 3, recent versions)

If your uni-app version supports it:

```ts
const controller = new AbortController()
const promise = uni.request({
  url: '/api/foo',
  signal: controller.signal
})
// later
controller.abort()
```

Check the uni-app changelog for AbortController support — it varies by version.

### Option 2: Manual cancel flag

Wrap the request with a flag, ignore the result if cancelled:

```ts
let cancelled = false
const request = uni.request({
  url: '/api/foo',
  success: (res) => {
    if (cancelled) return
    // handle
  }
})

onUnload(() => { cancelled = true })
```

This is the most reliable cross-platform approach. Crude but works everywhere.

### Option 3: Page-scoped request registry

For complex apps, wrap a "request manager" that tracks all in-flight requests and
aborts them on page unload:

```ts
// src/utils/request-manager.ts
const inflight = new Set<UniApp.RequestTask>()

export function trackRequest(task: UniApp.RequestTask) {
  inflight.add(task)
  return task
}

export function abortAll() {
  inflight.forEach(t => {
    try { t.abort() } catch (e) {}
  })
  inflight.clear()
}
```

In a page:

```ts
import { abortAll } from '@/utils/request-manager'

onUnload(() => abortAll())
```

## File upload

`uni.uploadFile` is the multi-platform upload primitive. It accepts a single file path
per call.

```ts
async function uploadAvatar(filePath: string) {
  const user = useUserStore()
  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: 'https://api.myapp.com/api/avatar',
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${user.token}`
      },
      success: (res) => {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        resolve(data.url)  // server returns the CDN URL
      },
      fail: reject
    })
  })
}
```

### Multi-file upload

`uni.uploadFile` only takes one file per call. To upload many:

```ts
async function uploadImages(paths: string[]) {
  return Promise.all(paths.map(p => uploadOne(p)))
}

function uploadOne(path: string): Promise<string> {
  // ... single-file version above
}
```

For very large files (>5MB), use chunked upload. The protocol depends on your backend
(Tus, S3 multipart, etc.) — write a `chunkedUpload` helper.

### Direct-to-OSS upload (skipping your backend)

For high-throughput scenarios (e.g. user uploads 10 images), upload directly to OSS
or COS to avoid bottlenecking your server:

1. Backend returns a signed PUT URL
2. Client `uni.uploadFile`s to that URL
3. Save the resulting URL in your DB via a follow-up API call

```ts
// Step 1: get signed URL
const { url, key } = await request<{ url: string; key: string }>({
  url: '/api/uploads/sign',
  method: 'POST',
  data: { ext: 'jpg' }
})

// Step 2: upload directly to OSS
await new Promise<void>((resolve, reject) => {
  uni.uploadFile({
    url,                                  // pre-signed PUT URL
    filePath,
    name: 'file',
    header: { 'Content-Type': 'image/jpeg' },
    success: () => resolve(),
    fail: reject
  })
})

// Step 3: tell backend about the uploaded file
await request({ url: '/api/uploads/confirm', method: 'POST', data: { key } })
```

## File download

```ts
async function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.tempFilePath)
        else reject(res)
      },
      fail: reject
    })
  })
}
```

`tempFilePath` is a platform-specific temp location. To save persistently:

```ts
// On App
const saved = await uni.saveFile({ tempFilePath })
// `saved.savedFilePath` survives until uni.removeSavedFile is called

// On MP — use uni.getFileSystemManager().saveFile
```

## WebSocket

```ts
const socket = uni.connectSocket({
  url: 'wss://api.myapp.com/ws',
  header: { Authorization: `Bearer ${token}` }
})

uni.onSocketOpen(() => {
  socket.send({ data: JSON.stringify({ type: 'subscribe', channel: 'orders' }) })
})

uni.onSocketMessage((res) => {
  const msg = JSON.parse(res.data)
  // handle
})

uni.onSocketError((err) => console.error(err))
uni.onSocketClose(() => {/* cleanup */})

// On page unload
onUnload(() => uni.closeSocket())
```

For multiple WebSocket connections, use the `@dcloudio/uni-ui`'s pattern or roll your
own. Don't open more than 2–3 sockets per app; mobile networks are flaky.

## Retry strategy

Most apps need a simple retry for transient network errors:

```ts
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, backoffMs = 500): Promise<T> {
  let lastErr: any
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      if (e?.code === 401 || e?.code === 403 || e?.code === 404) break  // don't retry
      if (i === maxRetries) break
      await new Promise(r => setTimeout(r, backoffMs * (i + 1)))
    }
  }
  throw lastErr
}
```

Don't retry 5xx errors indefinitely. Don't retry 4xx (client error). Only retry
network-level failures (`fail` callback).

## Common pitfalls

### CORS on H5

`uni.request` on H5 uses the browser's `fetch`, which is subject to CORS. Your backend
must include the right `Access-Control-Allow-Origin` header for the H5 origin.

For dev, configure a Vite proxy in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

For prod, configure the reverse proxy (Nginx, etc.) — don't ship dev proxies.

### Domain whitelist on WeChat MP

WeChat MP only allows requests to domains you've whitelisted in the WeChat MP admin
console. For dev, you can disable this with `mp-weixin.setting.urlCheck: false` — but
**turn it back on for production**.

Steps for prod:

1. Backend has HTTPS with a valid cert
2. Add the domain to "request 合法域名" in WeChat MP admin
3. Add to "uploadFile 合法域名" if you upload
4. Add to "downloadFile 合法域名" if you download

If you forget step 1, the MP gives "url not in domain list" — the most common error
newcomers hit.

### Timeout

`uni.request` default timeout is **60 seconds on App, no default on MP**. Always set an
explicit timeout:

```ts
uni.request({ ..., timeout: 15000 })  // 15s is a good default
```

For uploads, set a higher timeout (60s for images, 5min for videos).

### Large response body

If the response is several MB, `uni.request` may succeed but parsing can fail. For
those cases, use `responseType: 'arraybuffer'` and process manually.

### Cookie handling

`uni.request` doesn't auto-manage cookies. If your backend uses session cookies, you
have to:

1. Capture `Set-Cookie` from the login response
2. Store it (e.g. in Pinia)
3. Inject it on every subsequent request

```ts
// In the request success callback
const setCookie = res.header['Set-Cookie']
if (setCookie) cookieStore.set(setCookie)
```

Most modern apps use **token-based auth** instead of session cookies — easier.

## References in this skill

> v1.0 keeps the full content inline. Splits are planned for v1.1.

- `references/upload-to-oss.md` — *planned*: full guide to direct-to-OSS upload
  (inline above)
- `references/error-handling.md` — *planned*: error type hierarchy, retry strategies,
  user-facing error messages (inline above; Sentry integration also touched in
  `uniapp-debugging-and-publishing`)

## Examples in this skill

> v1.0 keeps the full content inline. Standalone files are planned for v1.1.

- `examples/api-client.md` — *planned*: full typed API client with multiple resources
  (inline above)
- `examples/upload-images.md` — *planned*: uploader component with multi-file + progress
  (inline above)
- `examples/websocket.md` — *planned*: reconnecting WebSocket client (inline above)

## Resources

- `uni.request`: https://uniapp.dcloud.net.cn/api/request/request.html
- `uni.uploadFile`: https://uniapp.dcloud.net.cn/api/request/upload-file.html
- `uni.downloadFile`: https://uniapp.dcloud.net.cn/api/request/download-file.html
- `uni.connectSocket`: https://uniapp.dcloud.net.cn/api/request/websocket.html
- WeChat MP network config: https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
- WeChat MP server domain: https://developers.weixin.qq.com/miniprogram/dev/framework/ability/url-extranet.html

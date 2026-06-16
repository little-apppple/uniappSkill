---
name: uniapp-testing
description: "Testing uni-app apps — unit tests with Vitest (mocking uni.* APIs), component tests, E2E on H5 with Playwright, mini-program automation with miniprogram-automator and miniprogram-ci, real-device App testing, and CI integration across all target platforms. Use when the user wants to add tests, set up a test framework, mock uni.* globals, write E2E flows on H5, automate WeChat MP testing, or wire tests into GitHub Actions / GitLab CI."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **test layer** for uni-app. After loading this skill, the agent should be able to:

1. Set up Vitest (or Jest) for unit + component tests, with `uni.*` mocks
2. Set up Playwright for H5 E2E
3. Set up `miniprogram-automator` for WeChat MP UI automation
4. Use `miniprogram-ci` for automated MP preview + screenshot diffs
5. Wire tests into GitHub Actions / GitLab CI with a per-platform matrix
6. Test on real devices for App (iOS / Android)
7. Avoid the most common pitfalls (testing without mocking `uni.*`, MP closed
   environment, platform-specific behavior)

If the question is about generic Vue testing strategy (e.g. "should I write a test
first?"), point the user to the existing `tdd` or `test-driven-development` skills in
your skill set. This skill is **uni-app-specific**: mocking `uni.*`, cross-platform
behavior, MP automation.

## When to use this skill

- "How do I set up Vitest for a uni-app project?"
- "How do I mock `uni.request` / `uni.getStorage` in tests?"
- "How do I write an E2E test for my H5 build?"
- "How do I automate clicks inside WeChat DevTools?"
- "How do I run tests on multiple platforms in CI?"
- "How do I take a screenshot of my MP for visual regression?"

## When NOT to use this skill

- "Should I write tests first?" → `tdd` / `test-driven-development` skills
- "How do I deploy?" → `uniapp-debugging-and-publishing`
- "How do I structure my code for testability?" → `uniapp-state-and-data` (Pinia stores
  are easy to test) + `uniapp-network-layer` (the request wrapper is the seam for mocks)
- "How do I test a specific platform (MP / App / H5) on real device?" → this skill
  covers the CI matrix; manual device QA is mentioned in the App testing section
  (no separate skill — it's covered inline above)
- "What about uni-app x (uvue)?" → uvue uses native UI, traditional Vitest DOM tests
  don't apply. The right answer is "test the UTS logic in isolation, then manual
  verification on device". This is mentioned in the skill but is a fast-moving area.

## The four testing layers

A uni-app project has **four orthogonal testing surfaces**, and you need different
tools for each:

| Layer | Tool | What it covers | Where it runs |
|---|---|---|---|
| **Unit tests** | Vitest | Pure functions, Pinia stores, composables | Node.js (in CI) |
| **Component tests** | Vitest + @vue/test-utils | Vue components in isolation | Node.js (in CI) |
| **E2E (H5)** | Playwright | Real user flows in a real browser | Headless Chrome / Firefox in CI |
| **Mini-program automation** | `miniprogram-automator` | Click flows, screen capture, network inspection | WeChat DevTools (CI or local) |

App (iOS / Android) doesn't have a viable automated E2E story inside uni-app; use
manual QA or device farms (BrowserStack, Sauce Labs, or DCloud's own cloud test
service).

## Unit + component tests with Vitest

### Install

```bash
npm i -D vitest @vue/test-utils happy-dom @dcloudio/types
```

`@vue/test-utils` is the standard Vue testing utility. `happy-dom` is a lightweight DOM
implementation that's faster than `jsdom` for most cases.

### Vitest config

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['src/main.ts', 'src/App.vue', 'src/uni_modules/**']
    }
  }
})
```

`test/setup.ts` is where you put global mocks:

```ts
// test/setup.ts
import { vi } from 'vitest'

// Mock the global `uni` object
const uniMock = {
  request: vi.fn(),
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn(),
  getStorageSync: vi.fn(() => ''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    platform: 'devtools',
    system: 'iOS 15',
    version: '1.0.0',
    statusBarHeight: 20,
    screenWidth: 375,
    screenHeight: 812
  })),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  navigateBack: vi.fn(),
  reLaunch: vi.fn(),
  getCurrentPages: vi.fn(() => [{ route: 'pages/index/index' }]),
  // Only for Vue 2 projects — Vue 3 removed the event bus
  $emit: vi.fn(),
  $on: vi.fn(),
  $off: vi.fn(),
  login: vi.fn(),
  checkSession: vi.fn(),
  getUserProfile: vi.fn(), // Deprecated — WeChat removed this API
  getLocation: vi.fn(),
  scanCode: vi.fn(),
  chooseImage: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  connectSocket: vi.fn(),
  onSocketOpen: vi.fn(),
  onSocketMessage: vi.fn(),
  onSocketError: vi.fn(),
  onSocketClose: vi.fn(),
  closeSocket: vi.fn(),
  getMenuButtonBoundingClientRect: vi.fn(() => ({ top: 44, right: 87, width: 87, height: 32, bottom: 76, left: 0 }))
}

// Make `uni` available globally as the runtime does
;(globalThis as any).uni = uniMock

// Reset between tests
beforeEach(() => {
  Object.values(uniMock).forEach(fn => {
    if (typeof fn === 'function' && 'mockReset' in fn) fn.mockReset()
  })
})
```

This setup gives you a working `uni` global for every test. The `mockReset()` call in
`beforeEach` ensures tests don't leak state into each other.

### Test a Pinia store

```ts
// src/store/__tests__/cart.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart'

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds an item', () => {
    const cart = useCartStore()
    cart.add({ skuId: 'A1', name: 'Apple', price: 5, qty: 1 })
    expect(cart.totalCount).toBe(1)
    expect(cart.totalPrice).toBe(5)
  })

  it('merges same skuId', () => {
    const cart = useCartStore()
    cart.add({ skuId: 'A1', name: 'Apple', price: 5, qty: 1 })
    cart.add({ skuId: 'A1', name: 'Apple', price: 5, qty: 2 })
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].qty).toBe(3)
  })

  it('removes by skuId', () => {
    const cart = useCartStore()
    cart.add({ skuId: 'A1', name: 'Apple', price: 5, qty: 1 })
    cart.add({ skuId: 'A2', name: 'Banana', price: 3, qty: 1 })
    cart.remove('A1')
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].skuId).toBe('A2')
  })

  it('persists to uni.setStorageSync', () => {
    const cart = useCartStore()
    cart.add({ skuId: 'A1', name: 'Apple', price: 5, qty: 1 })
    expect((globalThis as any).uni.setStorageSync).toHaveBeenCalledWith(
      'cart',
      expect.stringContaining('A1')
    )
  })
})
```

### Test a request wrapper

```ts
// src/utils/__tests__/request.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/store/user'
import { request } from '../request'

describe('request wrapper', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(uni.request).mockReset()
  })

  it('injects Authorization header when token present', async () => {
    const user = useUserStore()
    user.token = 'test-token'
    user.expiresAt = Date.now() + 60_000

    vi.mocked(uni.request).mockImplementation(({ success }) => {
      success!({ statusCode: 200, data: { ok: true }, header: {} } as any)
    })

    await request({ url: '/api/me' })

    const call = vi.mocked(uni.request).mock.calls[0][0]
    expect(call.header).toMatchObject({ Authorization: 'Bearer test-token' })
  })

  it('returns parsed data on 2xx', async () => {
    vi.mocked(uni.request).mockImplementation(({ success }) => {
      success!({ statusCode: 200, data: { id: 1 }, header: {} } as any)
    })

    const data = await request<{ id: number }>({ url: '/api/x' })
    expect(data).toEqual({ id: 1 })
  })

  it('rejects with ApiError on 4xx', async () => {
    vi.mocked(uni.request).mockImplementation(({ success }) => {
      success!({ statusCode: 422, data: { message: 'Bad' }, header: {} } as any)
    })

    await expect(request({ url: '/api/x' })).rejects.toMatchObject({
      code: 422,
      message: 'Bad'
    })
  })
})
```

### Test a Vue component

```ts
// src/components/__tests__/EmptyState.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: '📭', title: 'Empty', subtitle: 'Nothing here' }
    })
    expect(wrapper.text()).toContain('Empty')
    expect(wrapper.text()).toContain('Nothing here')
  })

  it('emits action click', async () => {
    const wrapper = mount(EmptyState, {
      props: { icon: '📭', title: 'Empty' },
      slots: { default: '<button class="action">Go</button>' }
    })
    await wrapper.find('.action').trigger('click')
    // If you wired `@click` to emit, check that
  })
})
```

> Component tests in uni-app have a key limitation: components often use uni-app
> primitives like `<view>`, `<text>`, `<image>` instead of HTML elements. `@vue/test-utils`
> with `happy-dom` will treat them as unknown elements. They render fine, but selector
> matching needs custom handling. The workaround is to either:
> 1. Stub the uni-app components globally (recommended for unit tests)
> 2. Use real browsers (Playwright on H5) for full DOM assertions

## E2E on H5 with Playwright

H5 builds are just static HTML/JS, so you can use any web testing tool. Playwright is
the modern choice.

### Install

```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
```

### Config

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',  // vite dev server
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev:h5',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } }
  ]
})
```

### Sample E2E test

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can log in and see home', async ({ page }) => {
  await page.goto('/pages/login/login')

  // Mock the API by intercepting requests
  await page.route('**/api/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'fake-token',
        expiresIn: 3600
      })
    })
  })

  await page.getByPlaceholder('手机号').fill('13800138000')
  await page.getByPlaceholder('验证码').fill('1234')
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page).toHaveURL(/.*\/pages\/home\/home/)
  await expect(page.getByText('首页')).toBeVisible()
})

test('shows empty state on cart with no items', async ({ page }) => {
  await page.goto('/pages/cart/cart')
  await expect(page.getByText('购物车是空的')).toBeVisible()
})
```

### Run

```bash
npx playwright test                 # headless
npx playwright test --ui            # interactive
npx playwright codegen http://localhost:5173   # record
```

## Mini-program automation with miniprogram-automator

`miniprogram-automator` lets you drive WeChat DevTools from Node — perfect for E2E on
the WeChat MP build.

### Install

```bash
npm i -D miniprogram-automator
```

### Sample script

```js
// scripts/mp-e2e.js
const assert = require('assert')
const { spawn } = require('child_process')
const automator = require('miniprogram-automator')
const path = require('path')

async function main() {
  // Launch WeChat DevTools with the built MP project
  const devtools = await automator.launch({
    cliPath: 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
    projectPath: path.resolve(__dirname, '../dist/build/mp-weixin')
  })

  try {
    // Wait for the page to be ready
    await devtools.connect()
    const page = await devtools.page
    const mpPage = await page.waitFor('pages/index/index')

    // Take initial screenshot
    await mpPage.screenshot({ path: 'e2e/screenshots/home.png' })

    // Get the current page data
    const data = await mpPage.data()
    console.log('Page data:', data)

    // Tap a button by selector (use the wxml selector)
    await mpPage.tap('button.confirm')

    // Wait for the next page
    const detailPage = await page.waitFor('pages/detail/detail')
    await detailPage.waitFor(2000)  // 2s for network/UI to settle
    const detail = await detailPage.data()
    assert.strictEqual(detail.id, '123')

    // Capture network calls
    const requests = []
    await mpPage.exposeFunction('__recordRequest', (url) => requests.push(url))
    // (instrument the app's request wrapper to call __recordRequest)

    console.log('Captured requests:', requests)
  } finally {
    await devtools.close()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
```

### Visual regression with screenshot diffs

```js
// scripts/mp-visual.js
const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

function diff(a, b) {
  const A = PNG.sync.read(fs.readFileSync(a))
  const B = PNG.sync.read(fs.readFileSync(b))
  if (A.width !== B.width || A.height !== B.height) {
    throw new Error('Dimension mismatch')
  }
  let diffPixels = 0
  for (let i = 0; i < A.data.length; i += 4) {
    if (A.data[i] !== B.data[i] || A.data[i+1] !== B.data[i+1] || A.data[i+2] !== B.data[i+2]) {
      diffPixels++
    }
  }
  return diffPixels / (A.width * A.height)
}

const ratio = diff('baseline.png', 'current.png')
if (ratio > 0.01) {  // >1% pixels different
  console.error(`Visual regression: ${(ratio * 100).toFixed(2)}% pixels differ`)
  process.exit(1)
}
```

## App testing on real devices

There is **no good automated E2E story** for uni-app's App build. Options:

| Approach | When to use |
|---|---|
| **Manual QA on test devices** | Most common. Use a small device matrix (2 iOS + 2 Android) and a structured test plan. |
| **DCloud cloud test** | For one-off smoke tests on real devices. DCloud's IDE has a "云测试" panel. |
| **BrowserStack / Sauce Labs** | For hybrid (H5-in-WebView) flows. Doesn't work for native (`nvue` / `uvue`) pages. |
| **Appium** | Theoretically works for `nvue` / `uvue`, but flaky and poorly supported. Avoid. |

For critical flows, combine:
1. **Unit + component tests** in CI (fast, cheap, catch most regressions)
2. **H5 E2E in CI** (covers 90% of user flows if your app is mostly H5)
3. **MP automation in CI** (covers MP-specific paths)
4. **Manual device QA on every release** for the final 10% (App-specific features)

## CI integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18, cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  e2e-h5:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  mp-automator:
    runs-on: macos-latest   # WeChat DevTools is Windows/macOS
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18, cache: 'npm' }
      - run: npm ci
      - run: npm run build:mp-weixin
      - name: Install WeChat DevTools
        run: |
          brew install --cask wechat-webdevtools   # macOS
          # or: download from https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
      - run: node scripts/mp-e2e.js
        env:
          WECHAT_DEVTOOLS_CLI: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
```

### GitLab CI

```yaml
test:unit:
  image: node:18
  script:
    - npm ci
    - npx vitest run

test:e2e:
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: on_failure
    paths:
      - playwright-report/
```

## Common pitfalls

1. **Forgetting to mock `uni.*`** — your test will throw `uni.request is not a function`
   the first time a component tries to call it. Set up the global mock in
   `test/setup.ts`.
2. **Mocking `uni.request` but not `uni.uploadFile`** — they are different APIs in uni-app.
   Mock both, or mock just the ones you use.
3. **`uni.getSystemInfoSync` returns different shapes on different platforms** — your
   mock should match the platform you intend to test. Use the `platform` field.
4. **Component tests with `view` / `text` / `image` elements** — happy-dom doesn't know
   them; use E2E on H5 for full DOM assertions.
5. **`miniprogram-automator` requires WeChat DevTools to be installed** — CI must install
   it first. On Linux, you'd need to use the Windows or macOS runner.
6. **Playwright's webServer is flaky on first run** — `reuseExistingServer: !process.env.CI`
   lets local dev skip the wait.
7. **Tests that pass locally but fail in CI** — usually a missing `await`, a race on
   the dev server, or platform differences (H5's URL bar vs the headless browser).
   Use `test.retry` for genuinely flaky external dependencies.

## References in this skill

- `references/unit-testing.md` — *planned*: deep dive on Vitest config, mocks, store testing
  (inline above)
- `references/e2e-h5.md` — *planned*: Playwright patterns for H5 (inline above)
- `references/mp-automator.md` — *planned*: full miniprogram-automator guide (inline above)
- `references/mocking-uni.md` — *planned*: the complete `uni.*` mock surface
  (inline in `test/setup.ts` example)
- `references/ci-integration.md` — *planned*: per-platform CI matrix, runner choice
  (inline above)

## Examples in this skill

> All examples in v1.0 are inline in SKILL.md. Standalone files are planned for v1.1.

- `examples/vitest-config.ts` — *planned* (currently inline)
- `examples/component-test.vue` — *planned* (currently inline)
- `examples/store-test.ts` — *planned* (currently inline)
- `examples/mp-automator-script.js` — *planned* (currently inline)
- `examples/playwright-test.spec.ts` — *planned* (currently inline)

## Resources

- Vitest: https://vitest.dev/
- @vue/test-utils: https://test-utils.vuejs.org/
- Playwright: https://playwright.dev/
- miniprogram-automator: https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/
- miniprogram-ci: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
- Happy DOM: https://github.com/capricorn86/happy-dom
- WeChat DevTools: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

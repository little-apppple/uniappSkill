---
name: uniapp-payments
description: "Payment integration in uni-app — WeChat Pay (JSAPI / Mini-Program / H5 / App), Alipay, Apple Pay, Google Pay, and uni-pay / uni-payment module setup. Use when the user needs to charge users, integrate WeChat Pay / Alipay / Apple Pay / Google Pay, set up a payment module, build a checkout flow, handle refunds, or wire payments into an e-commerce flow. Covers the full client-to-server-to-provider round trip and the most common failure modes (sign errors, prepay_id expiry, appId mismatches)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **payments layer** for uni-app. After loading this skill, the agent should be able
to:

1. Choose the right integration path for each platform (MP / H5 / App)
2. Implement WeChat Pay across all uni-app targets (WeChat MP, H5, App-iOS, App-Android)
3. Implement Alipay across uni-app targets
4. Implement Apple Pay (iOS only) and Google Pay (Android only)
5. Build the full **client → your backend → payment provider** round trip
6. Handle the most common failure modes (sign error, prepay_id expired, appId mismatch)
7. Set up a payment module using DCloud's **uni-pay** plugin (optional shortcut)
8. Handle refunds and reconciliation

If the question is about general payment concepts (PCI compliance, settlement cycles),
this skill doesn't cover that — load a generic payments skill. This skill is
**uni-app-specific**: platform-specific APIs, appId / merchantId setup, uni-pay plugin.

## When to use this skill

- "How do I integrate WeChat Pay into my WeChat MP?"
- "How do I integrate WeChat Pay into my H5 page?"
- "How do I integrate WeChat Pay into my iOS / Android App?"
- "How do I integrate Alipay across all platforms?"
- "How do I add Apple Pay / Google Pay to my App?"
- "How do I handle refunds?"
- "How do I use uni-pay / uni-payment?"

## When NOT to use this skill

- "How do I deploy my uni-app?" → `uniapp-debugging-and-publishing`
- "How do I make a checkout UI?" → `uniapp-ui-patterns` (form + popup + skeleton)
- "How do I store order data in the cloud?" → `uniapp-cloud` (cloud DB) or your own
  backend (`uniapp-network-layer`)

## The five platform / provider combinations

| uni-app target | WeChat Pay | Alipay | Apple Pay | Google Pay |
|---|---|---|---|---|
| **WeChat MP** | ✅ JSAPI / `wx.requestPayment` | ⚠️ via web-view redirect | ❌ | ❌ |
| **Alipay MP** | ⚠️ via web-view redirect | ✅ Alipay MP | ❌ | ❌ |
| **H5 (browser)** | ✅ H5 ("MWEB") | ✅ Alipay H5 (auto-redirect) | ❌ | ❌ |
| **App-iOS** | ✅ via SDK or uni-pay | ✅ via SDK or uni-pay | ✅ Apple Pay (PassKit) | ❌ |
| **App-Android** | ✅ via SDK or uni-pay | ✅ via SDK or uni-pay | ❌ | ✅ Google Pay |

The key insight: **almost every payment flow is "client gets a `pay` payload from the
backend, then calls the platform's `pay` API"**. The differences are in *how* the
backend gets the payload from the provider.

## Two integration paths

You can integrate payments two ways:

| Path | When to use |
|---|---|
| **A. Direct SDK** — call WeChat / Alipay / Apple / Google APIs yourself | Maximum control, no plugin dependency, requires backend work |
| **B. `uni-pay` plugin** — DCloud's official plugin that wraps all four | Faster integration, less code, suitable for most apps |

For most apps, **`uni-pay` is the recommended starting point**. Drop to direct SDK
only when you have a specific need (custom signing, complex refund flows, multi-merchant
scenarios).

This skill covers both. Start with `uni-pay` if you don't have a strong reason
otherwise.

## Option A: Direct integration

### The universal flow

```
[Client]                  [Your backend]                  [Payment provider]
    |                            |                              |
    |---(1) "create order"------>|                              |
    |                            |---(2) "unified order"-------->|
    |                            |<---(3) "prepay_id / payload"--|
    |<---(4) "pay params"--------|                              |
    |---(5) platform pay API---->| (no roundtrip)                |
    |<---(6) payment result------|                              |
    |                            |---(7) "query / notify"------->|
    |                            |<---(8) "payment confirmed"---|
    |<---(9) "order paid"--------|                              |
```

Critical: **never trust the client's payment result** (step 6). Always wait for the
provider's **async callback** (step 7-8) before marking the order as paid.

### WeChat Pay on WeChat MP

> **⚠️ API version note**: The example below uses the legacy **API v2** (XML + MD5).
> WeChat officially deprecated MD5 signing in favor of **API v3** (JSON + HMAC-SHA256).
> For new projects, use WeChat Pay's API v3. The v2 example is kept for reference
> when working with existing integrations. See Resources for the v3 docs.

**Backend side** — create the order, get the prepay_id:

```js
// POST /api/payments/wechat-mp
const crypto = require('crypto')
const axios = require('axios')

const WECHAT_MP_APPID = process.env.WECHAT_MP_APPID
const WECHAT_MCH_ID = process.env.WECHAT_MCH_ID
const WECHAT_API_KEY = process.env.WECHAT_API_KEY

function signWechat(params, key) {
  // Sort, concat, sign with MD5 + key
  // ⚠️ MD5 is deprecated in API v3 — use HMAC-SHA256 for new projects
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  const str = `${sorted}&key=${key}`
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

// Simple XML parser (use xml2js in production)
function parseXml(xml) {
  const match = xml.match(/<prepay_id>(.*?)<\/prepay_id>/)
  return match ? match[1] : null
}

async function createWechatMpOrder({ orderId, totalFen, openid, body, clientIp }) {
  const params = {
    appid: WECHAT_MP_APPID,
    mch_id: WECHAT_MCH_ID,
    nonce_str: crypto.randomBytes(16).toString('hex'),
    body,
    out_trade_no: orderId,
    total_fee: totalFen,            // in cents
    spbill_create_ip: clientIp || '127.0.0.1',
    notify_url: 'https://api.yourapp.com/api/payments/wechat-notify',
    trade_type: 'JSAPI',
    openid
  }
  params.sign = signWechat(params, WECHAT_API_KEY)

  // Convert to XML (escape special chars to prevent XML injection)
  const xml = `<xml>${Object.entries(params).map(([k, v]) =>
    `<${k}><![CDATA[${String(v)}]]></${k}>`
  ).join('')}</xml>`

  const { data } = await axios.post(
    'https://api.mch.weixin.qq.com/pay/unifiedorder',
    xml,
    { headers: { 'Content-Type': 'text/xml' } }
  )
  const prepay_id = parseXml(data)
  if (!prepay_id) throw new Error('Failed to get prepay_id: ' + data)

  const payParams = {
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: crypto.randomBytes(16).toString('hex'),
    package: `prepay_id=${prepay_id}`,
    signType: 'MD5'
  }
  payParams.paySign = signWechat(payParams, WECHAT_API_KEY)
  return payParams
}
```

**Client side** — call the WeChat payment API:

```ts
async function onPayOrder(orderId: string, totalFen: number) {
  // 1. Get pay params from your backend
  const { payParams } = await api.createWechatMpPayment({ orderId, totalFen })

  // 2. Call WeChat's pay API
  await new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: () => resolve(),
      fail: (err) => reject(err)
    })
  })

  // 3. Show success, but DON'T mark order as paid yet
  //    (wait for the backend's notify_url callback)
  uni.showToast({ title: '支付完成', icon: 'success' })

  // 4. Poll the backend to check if the order is paid
  await pollOrderStatus(orderId)
}

async function pollOrderStatus(orderId: string, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    // Exponential backoff: 2s, 3s, 4.5s, 6.75s, ... capped at 10s
    const delay = Math.min(2000 * Math.pow(1.5, i), 10000)
    await new Promise(r => setTimeout(r, delay))
    const { status } = await api.getOrder(orderId)
    if (status === 'PAID') return true
  }
  throw new Error('Payment confirmation timeout')
}
```

### WeChat Pay on H5

H5 uses the "MWEB" trade type. The flow:

1. Backend calls WeChat's unified order with `trade_type: 'MWEB'`
2. WeChat returns a `mweb_url` — a URL that opens WeChat's payment page
3. Client navigates to that URL inside the page
4. User completes payment in WeChat
5. WeChat redirects back to a `redirect_url` you provided

```ts
async function onH5Pay(orderId: string) {
  const { mwebUrl } = await api.createWechatH5Payment({ orderId })
  // Redirect the browser to WeChat's payment page
  window.location.href = mwebUrl
}
```

The `mwebUrl` contains the `redirect_url` query param — set it to your app's
"payment success" page.

**H5 quirks**:
- WeChat's "MWEB" requires the user to have WeChat installed on the same device
- If the user is in a desktop browser, it prompts them to scan a QR code
- The redirect back happens in a fragment (`#wechat_redirect`) — make sure your
  router handles it

### WeChat Pay in App (iOS / Android)

You need a native SDK because `uni.requestPayment` works differently for in-app
payments:

- iOS: WeChat Open SDK (`WechatOpenSDK`) — handle via a UTS plugin or `uni-pay`
- Android: WeChat Open SDK for Android — same

Configuration in `manifest.json` `app-plus`:

```jsonc
"app-plus": {
  "distribute": {
    "ios": {
      "urltypes": [
        "wx_YOUR_WECHAT_APPID"  // URL scheme for WeChat to call back
      ],
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["weixin", "wechat"]
      }
    },
    "android": {
      "schemes": ["wx_YOUR_WECHAT_APPID"]
    },
    "modules": {
      "Payment": {}  // required to bundle the payment module
    }
  },
  "sdkConfigs": {
    "payment": {
      "weixin": {
        "__platform__": ["ios", "android"],
        "appid": "wx...",
        "universalLink": "https://yourdomain.com/uni-universallinks/"   // iOS
      }
    }
  }
}
```

Then on the client:

```ts
await uni.requestPayment({
  provider: 'wxpay',
  orderInfo: {
    appid: 'wx...',
    noncestr: '...',
    package: 'Sign=WXPay',
    partnerid: '...',
    prepayid: '...',
    timestamp: '...',
    sign: '...'
  }
})
```

### Alipay

Alipay has fewer quirks — the same flow works across MP, H5, and App.

**H5 flow** (most common):

```ts
async function onAlipayH5(orderId: string) {
  // Backend returns the Alipay payment URL (already signed)
  const { payUrl } = await api.createAlipayH5Payment({ orderId })
  // Redirect to Alipay
  window.location.href = payUrl
}
```

After payment, Alipay redirects back to your `return_url` synchronously, but **don't
trust it** — wait for the async `notify_url` callback before marking paid.

**App flow** (Alipay SDK in App):

```ts
await uni.requestPayment({
  provider: 'alipay',
  orderInfo: 'alipay_sdk_signed_string_from_backend'
})
```

**WeChat MP / Alipay MP cross-payment**:
WeChat MP users can pay with Alipay via web-view:

```vue
<web-view src="https://your-alipay-h5-page.com/pay?orderId=123" />
```

The Alipay H5 page handles the actual payment; on success it redirects back to your
return_url.

### Apple Pay (iOS only)

Apple Pay is fundamentally different — there's no "order" step. The client tokenizes
the card, sends the token to your backend, your backend charges the token.

```ts
import { ref } from 'vue'

// 1. Check Apple Pay availability
const isAvailable = ref(false)
onMounted(() => {
  // #ifdef APP-IOS
  uni.checkIsSupportApplePay({
    success: (res) => { isAvailable.value = res.support }
  })
  // #endif
})

async function onApplePay() {
  // 2. Show the Apple Pay sheet
  // #ifdef APP-IOS
  uni.requestApplePay({
    // The merchant ID, configured in your Apple Developer account
    merchantIdentifier: 'merchant.com.yourapp',
    // Items being purchased
    orderInfo: {
      items: [{ label: 'Order #123', amount: '99.00' }],
      total: { label: 'Total', amount: '99.00' }
    },
    success: async (res) => {
      // res.payment contains the encrypted payment token
      await api.processApplePay({ token: res.payment.token.paymentData })
      uni.showToast({ title: '支付成功', icon: 'success' })
    },
    fail: (err) => {
      console.error('Apple Pay failed', err)
    }
  })
  // #endif
}
```

Your backend processes the token via Apple's `Payment Processing` API or a PSP
(Stripe, Adyen, etc.) that supports Apple Pay.

### Google Pay (Android only)

Similar to Apple Pay — tokenize the card, send the token to your backend.

```ts
// #ifdef APP-ANDROID
await uni.requestPayment({
  provider: 'googlepay',
  orderInfo: {
    // Google Pay token request config
    environment: 'PRODUCTION',  // or 'TEST'
    paymentDataRequest: {
      transactionInfo: {
        totalPrice: '99.00',
        currencyCode: 'CNY',
        totalPriceStatus: 'FINAL'
      }
    }
  },
  success: async (res) => {
    await api.processGooglePay({ token: res.paymentToken })
  }
})
// #endif
```

## Option B: `uni-pay` plugin

DCloud's official `uni-pay` plugin wraps all four providers. It's available from the
plugin market: https://ext.dcloud.net.cn/plugin?id=1477

### Install

In HBuilderX: **Tools → Plugin Import** → search "uni-pay" → install to `uni_modules/`.

### Configuration

`uniCloud-aliyun/cloudfunctions/common/uni-pay/config.js` (if using uniCloud):

```js
module.exports = {
  // WeChat MP
  'wxpay-mp': {
    appId: 'wx...',
    mchId: '...',
    key: '...',
    // pfx: require('fs').readFileSync('apiclient_cert.p12'),  // for refund
    // pfx_password: '...'
  },
  // WeChat H5
  'wxpay-h5': {
    appId: 'wx...',
    mchId: '...',
    key: '...'
  },
  // WeChat App
  'wxpay-app': {
    appId: 'wx...',
    mchId: '...',
    key: '...',
    universalLink: 'https://yourdomain.com/uni-universallinks/'
  },
  // Alipay
  'alipay': {
    appId: '...',
    privateKey: '...',
    alipayPublicKey: '...'
  }
}
```

### Use from the client

```ts
import { createOrder } from '@/uni_modules/uni-pay'

async function onPay(orderId: string, totalFen: number, provider: 'wxpay' | 'alipay') {
  // 1. Create the order on the server
  const orderInfo = await createOrder({
    provider,                              // 'wxpay' | 'alipay' | 'wxpay-mp' | 'appleiap' | 'googlepay'
    out_trade_no: orderId,
    total_fee: totalFen,                   // in cents
    subject: 'Order subject',
    notify_url: 'https://api.yourapp.com/payment/notify',
    // openid: '...',   // for WeChat MP
    // appid: 'wx...',  // for WeChat H5 / App
  })

  // 2. Call the platform's pay API
  await new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      provider: provider === 'wxpay' ? 'wxpay' : 'alipay',
      orderInfo,
      success: () => resolve(),
      fail: reject
    })
  })
}
```

### Use from a cloud function

If you're using uniCloud + `uni-pay`, the cloud function is even simpler:

```js
// uniCloud-aliyun/cloudfunctions/pay/index.js
'use strict'
const uniPay = require('uni-pay')

exports.main = async (event, context) => {
  const { out_trade_no, total_fee, provider } = event
  const uid = context.auth?.uid
  if (!uid) return { code: 401, message: '未登录' }

  const orderInfo = await uniPay.createOrder({
    provider,
    out_trade_no,
    total_fee,
    subject: 'Order',
    uid,
    notify_url: 'https://api.yourapp.com/payment/notify',
    // ...
  })

  return { code: 0, data: orderInfo }
}
```

## Refunds

**Always** implement refunds on the backend. The client just calls a refund API:

```ts
async function onRefundOrder(orderId: string, reason: string) {
  await api.refundOrder({ orderId, reason })
  uni.showToast({ title: '退款申请已提交', icon: 'success' })
}
```

**Backend side** (refund flow):

```js
// POST /api/payments/refund
const { out_trade_no, out_refund_no, total_fee, refund_fee, reason } = event

// For WeChat
const result = await uniPay.refund({
  provider: 'wxpay',
  out_trade_no,
  out_refund_no,
  total_fee,
  refund_fee,
  reason,
  notify_url: 'https://api.yourapp.com/payment/refund-notify'
})

// For Alipay
const result = await uniPay.refund({
  provider: 'alipay',
  out_trade_no,
  out_refund_no,
  refund_amount: refund_fee / 100,    // Alipay uses yuan
  reason
})
```

**Important**:
- Refunds take 1-3 business days to settle
- WeChat refunds require an `apiclient_cert.p12` (or `.pem`) cert, configured in
  `uni-pay` config
- Test refunds in the WeChat / Alipay sandbox before going live
- Always log refund requests for accounting reconciliation

## Common pitfalls

1. **Trusting the client's payment success** — `uni.requestPayment`'s `success`
   callback means "the user finished the payment flow", not "the payment succeeded".
   A user can dismiss the WeChat sheet, the network can drop, etc. **Always wait for
   the async `notify_url` callback** before marking the order as paid.
2. **Sign error in WeChat** — usually a `key` mismatch. Make sure the `key` you use on
   the client (for paySign) matches the `key` you used on the backend to compute the
   `sign`. Also, case-sensitive.
3. **`prepay_id` expired** — `prepay_id` is valid for 2 hours. If the user takes
   longer, the payment fails. Re-create the order if too much time has passed.
4. **AppId mismatch on WeChat** — the WeChat MP `appid` (for `wx.login`) and the
   merchant `appid` (for WeChat Pay) are usually the same, but if you have multiple
   apps (e.g. a subscription-account MP and a main MP), make sure they match the
   merchant config.
5. **H5 redirect not coming back** — WeChat H5 needs the user to be on a device with
   WeChat installed. On desktop, it shows a QR code. Make sure your `redirect_url`
   handles both cases.
6. **Alipay sandbox vs production** — Alipay's sandbox has different gateway URLs.
   Make sure to switch to production before shipping.
7. **Universal Link for WeChat App Pay** — iOS 13+ requires a Universal Link
   (not just URL scheme) for WeChat to call back into your app. Set it up in
   `manifest.json` and your Apple Developer account.
8. **Apple Pay merchant ID** — must match what's in your Apple Developer account,
   and the domain verification file must be in place.
9. **Currency mismatch** — WeChat Pay in mainland China only supports CNY.
   International payments require WeChat Pay HK / WeChat Pay Global with different
   merchant accounts.
10. **`uni.requestPayment` `provider` value** — for WeChat Pay, it's `'wxpay'` (not
    `'wechat'`, despite the name being WeChat Pay). Easy to get wrong.

## Platform-specific appId / merchantId setup

| Provider | Where to get appId | Where to get merchantId |
|---|---|---|
| WeChat Pay | mp.weixin.qq.com (your MP) | pay.weixin.qq.com (merchant account) |
| Alipay | open.alipay.com (your app) | open.alipay.com (merchant account) |
| Apple Pay | developer.apple.com | developer.apple.com + payment processor |
| Google Pay | pay.google.com + processor | pay.google.com + processor |

**WeChat MP and WeChat Pay share the same `appid`** (the MP appid). You don't need
a separate one.

**WeChat Pay's `mch_id` (merchant ID) is separate from the appid.** Get it from
pay.weixin.qq.com → 商户中心.

## When to use a payment processor (Stripe, Adyen, etc.)

For international apps, going direct to Apple/Google/Stripe may be easier than going
to WeChat Pay/Alipay. Most cross-border payment processors:

- Provide a unified API for multiple providers
- Handle currency conversion and settlement
- Provide hosted checkout pages (less custom UI work)
- Have better fraud detection

If your app has international users or needs to support many currencies, consider:
- **Stripe** — best for international, supports Apple Pay / Google Pay
- **Adyen** — enterprise, supports all major providers
- **Paddle / LemonSqueezy** — for SaaS / digital goods

## Resources

- WeChat Pay docs: https://pay.weixin.qq.com/wiki/doc/apiv3/
- WeChat Pay H5: https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_3_1.shtml
- Alipay docs: https://opendocs.alipay.com/
- Apple Pay: https://developer.apple.com/documentation/passkit
- Google Pay: https://developers.google.com/pay
- uni-pay: https://ext.dcloud.net.cn/plugin?id=1477
- WeChat Open SDK (iOS): https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/iOS.html
- WeChat Open SDK (Android): https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/Android.html

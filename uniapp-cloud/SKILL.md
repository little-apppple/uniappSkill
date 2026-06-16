---
name: uniapp-cloud
description: "uniCloud — DCloud's serverless backend for uni-app. Covers cloud functions, cloud database (NoSQL), cloud storage, uni-id auth, client SDK calls, uni-cloud-router for routing, security rules, and deployment. Use when the user wants serverless backend, auth with uni-id, file storage, real-time data, or to know how to call cloud functions from a uni-app client."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **uniCloud** backend layer for uni-app. After loading this skill, the agent should
be able to:

1. Decide when to use uniCloud vs a traditional backend
2. Write cloud functions (server-side JavaScript)
3. Use the cloud database (NoSQL — MongoDB-like)
4. Use cloud storage for file uploads/downloads
5. Implement auth with **uni-id** (DCloud's auth system)
6. Set up `uni-cloud-router` for organized cloud function routing
7. Call cloud functions from a uni-app client
8. Configure security rules
9. Deploy cloud functions to the cloud

If the question is about general serverless concepts (cold starts, billing), the AWS
or Aliyun docs cover them — uniCloud is essentially Alibaba Cloud Function Compute
under the hood. This skill is **uni-app / uniCloud-specific**.

## When to use this skill

- "How do I add a backend to my uni-app without setting up a server?"
- "How do I use uni-id for login / signup / session?"
- "How do I store user data in the cloud?"
- "How do I upload files to cloud storage?"
- "How do I deploy my cloud functions?"
- "How do I call a cloud function from a Vue page?"

## When NOT to use this skill

- "How do I deploy my uni-app?" → `uniapp-debugging-and-publishing`
- "How do I set up state management on the client?" → `uniapp-state-and-data`
- "How do I make HTTP calls to a non-uniCloud backend?" → `uniapp-network-layer`

## uniCloud in 60 seconds

uniCloud is a **serverless backend-as-a-service** tightly integrated with uni-app. It
runs on Alibaba Cloud (China region: Alibaba; international: AWS via partner). Three
primitives:

| Primitive | What it is | When to use |
|---|---|---|
| **Cloud functions** | Serverless JavaScript functions (Node.js runtime) | Business logic, server-side API, scheduled jobs, webhooks |
| **Cloud database** | NoSQL document store (MongoDB-compatible API) | User data, content, order records, anything schema-flexible |
| **Cloud storage** | Object storage (S3-compatible) | Images, videos, user-uploaded files |

You write code in a `uniCloud-aliyun/cloudfunctions/` folder in your uni-app project,
and HBuilderX (or CLI) deploys to the cloud. The client calls cloud functions via
`uniCloud.callFunction()`.

## Quick start

### Initialize uniCloud in your project

1. In HBuilderX: right-click `uniCloud-aliyun` → associate cloud space (creates a
   `uniCloud-aliyun/cloudfunctions/` folder)
2. Or via CLI: install `@dcloudio/uni-cloud` and run init scripts

### Project layout

```
my-uniapp/
├── src/                    # client code
├── uniCloud-aliyun/
│   ├── cloudfunctions/     # server-side functions
│   │   ├── login/          # each function = one folder
│   │   │   ├── index.js
│   │   │   ├── package.json
│   │   │   └── config.json
│   │   ├── getOrderList/
│   │   │   └── index.js
│   │   └── ...
│   ├── database/           # DB schema, init scripts
│   │   ├── opendb-uni-id-users.schema.json
│   │   └── ...
│   └── ...
```

### Call a cloud function from the client

```ts
// Any Vue page or store
import { useUserStore } from '@/store/user'

const user = useUserStore()

async function onLoad() {
  const res = await uniCloud.callFunction({
    name: 'getUserProfile',
    data: { userId: user.userId }
  })
  // res = { result: { ... }, requestId, errMsg }
  if (res.result.code === 0) {
    console.log(res.result.data)
  } else {
    console.error(res.result.message)
  }
}
```

Conventions:

- Client calls `uniCloud.callFunction({ name, data })`; the `name` is the function's
  folder name
- Server returns `{ code, message, data }` — the `code === 0` convention is the
  DCloud standard
- `data` is the input payload (JSON-serializable)
- `requestId` is a unique ID for debugging

## Cloud functions

### Minimal function

`uniCloud-aliyun/cloudfunctions/hello/index.js`:

```js
'use strict'

exports.main = async (event, context) => {
  // event = the client's `data`
  // context = call context (uniIdToken, userInfo, etc.)
  return {
    code: 0,
    message: 'ok',
    data: {
      hello: 'world',
      time: Date.now()
    }
  }
}
```

`package.json` (required for any function with dependencies):

```json
{
  "name": "hello",
  "version": "1.0.0",
  "description": "Hello world function",
  "main": "index.js",
  "dependencies": {},
  "extensions": {
    "uni-cloud-jql": {}    // enables JQL (JSON Query Language) for the DB
  }
}
```

### A real example: create an order

```js
// uniCloud-aliyun/cloudfunctions/createOrder/index.js
'use strict'

const { createOrder } = require('./service.js')

exports.main = async (event, context) => {
  // 1. Authenticate
  const uid = context.auth?.uid
  if (!uid) {
    return { code: 401, message: '未登录' }
  }

  // 2. Validate input
  const { items, addressId } = event
  if (!Array.isArray(items) || items.length === 0) {
    return { code: 400, message: '订单商品不能为空' }
  }
  if (!addressId) {
    return { code: 400, message: '请选择收货地址' }
  }

  try {
    const order = await createOrder({ uid, items, addressId })
    return { code: 0, message: 'ok', data: order }
  } catch (err) {
    return { code: 500, message: err.message || '创建订单失败' }
  }
}
```

`uniCloud-aliyun/cloudfunctions/createOrder/service.js`:

```js
'use strict'
const db = uniCloud.database()
const dbCmd = db.command
const $ = db.command.aggregate

exports.createOrder = async ({ uid, items, addressId }) => {
  // Compute total from items
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0)

  // Insert order
  const now = Date.now()
  const orderRes = await db.collection('orders').add({
    uid,
    items,
    addressId,
    total,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now
  })

  return {
    id: orderRes.id,
    total,
    status: 'PENDING',
    createdAt: now
  }
}
```

### Config: timeouts, scheduled, HTTP triggers

`config.json` per function:

```json
{
  "triggers": [
    {
      "name": "timer",
      "type": "timer",
      "config": "0 0 2 * * *"  // 2 AM daily
    },
    {
      "name": "http",
      "type": "http",
      "config": {
        "path": "/webhook",
        "method": ["POST"]
      }
    }
  ]
}
```

## Cloud database

The cloud database is **NoSQL** (document store). The query API is similar to
MongoDB. To use it, install `uni-cloud-jql` extension in your function's
`package.json`.

### Basic CRUD

```js
const db = uniCloud.database()

// Insert
const res = await db.collection('todos').add({
  title: 'Buy milk',
  done: false,
  createdAt: Date.now()
})

// Query
const { data } = await db.collection('todos')
  .where({ done: false })
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// Update
await db.collection('todos').doc('todo-id').update({
  done: true,
  updatedAt: Date.now()
})

// Delete
await db.collection('todos').doc('todo-id').remove()
```

### JQL (JSON Query Language)

JQL is uniCloud's higher-level query language. It runs in the cloud (the client just
sends a JQL expression), which means **permissions are enforced server-side** — the
client can never read data it shouldn't.

```js
// Server-side: in a cloud function
const dbJQL = uniCloud.databaseForJQL({ clientDB: true })
// or use uniCloud.database() and pass JQL directly

const { result } = await dbJQL.collection('orders')
  .where('status == "PENDING" && uid == $cloudEnv.uid')
  .field('_id, status, total, createdAt')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()
```

JQL supports:
- Comparison: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Logic: `&&`, `||`, `!`
- String: `test(/regex/)`, `.includes()`, `.startsWith()`
- Array: `arrayElemAt(arr, i)`, `arr.size()`, `in` / `nin`
- Geo: `near(point, [lng, lat], maxDistance)`

### Schema and validation

Create `uniCloud-aliyun/database/<collection>.schema.json`:

```json
{
  "bsonType": "object",
  "required": ["uid", "total", "status"],
  "permission": {
    "read": "auth.uid == doc.uid",
    "create": "auth.uid != null",
    "update": "auth.uid == doc.uid",
    "delete": "auth.uid == doc.uid"
  },
  "properties": {
    "_id": { "bsonType": "string" },
    "uid": { "bsonType": "string" },
    "items": {
      "bsonType": "array",
      "items": { "bsonType": "object" }
    },
    "total": { "bsonType": "double" },
    "status": {
      "bsonType": "string",
      "enum": ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
    },
    "createdAt": { "bsonType": "long" },
    "updatedAt": { "bsonType": "long" }
  }
}
```

Schemas give you:

- **Type validation** — invalid writes are rejected
- **Permission rules** — declarative, no need for manual checks in every function
- **Auto-generated CRUD** — combined with uni-id, you get a full backend with no code

### Aggregation

```js
const $ = db.command.aggregate

const { data } = await db.collection('orders').aggregate()
  .match({ uid: 'u-1', status: 'PAID' })
  .group({
    _id: null,
    totalSpent: $.sum('$total'),
    orderCount: $.sum(1)
  })
  .end()
```

## uni-id — auth as a service

**uni-id** is uniCloud's built-in auth system. It supports username/password,
SMS code, WeChat MP login, Apple login, and more. Out of the box, you get JWT
tokens, refresh tokens, role-based access, and password reset.

### Initialize uni-id

1. In HBuilderX: right-click `uniCloud-aliyun/cloudfunctions/common/uni-id` → "上传并初始化"
2. This creates the `uni-id-users` collection and sets up the JWT secret

### Login flow

**Client side** — WeChat MP one-click login:

```ts
async function onWechatLogin() {
  // 1. WeChat MP returns a code
  const { code } = await uni.login({ provider: 'weixin' })

  // 2. Send the code to uni-id's loginByWeixin function
  const res = await uniCloud.callFunction({
    name: 'uni-id-login-by-weixin',
    data: {
      code,
      // optional: anonymous info
      nickname: 'Anonymous',
      avatar: ''
    }
  })

  if (res.result.errCode === 0) {
    const { token, tokenExpired, userInfo } = res.result
    userStore.setSession({ token, tokenExpired, userInfo })
  }
}
```

**Server side** — custom function that wraps uni-id:

```js
// uniCloud-aliyun/cloudfunctions/login/index.js
'use strict'

const uniID = require('uni-id')

exports.main = async (event, context) => {
  const { phone, code } = event

  // Verify the SMS code
  const verifyRes = await uniID.verifyCode({
    mobile: phone,
    code,
    type: 'login'
  })
  if (verifyRes.errCode) {
    return { code: verifyRes.errCode, message: verifyRes.errMsg }
  }

  // Find or create user
  const loginRes = await uniID.loginBySms({
    mobile: phone,
    code
  })

  return {
    code: 0,
    message: 'ok',
    data: {
      token: loginRes.token,
      tokenExpired: loginRes.tokenExpired,
      userInfo: loginRes.userInfo
    }
  }
}
```

### Token management on the client

```ts
// In request wrapper
async function callCloudFunction<T = any>(name: string, data: any): Promise<T> {
  const user = useUserStore()

  return new Promise((resolve, reject) => {
    uniCloud.callFunction({
      name,
      data,
      success: (res) => {
        // Token expired → refresh
        if (res.result?.errCode === 'TOKEN_INVALID' || res.result?.errCode === 'TOKEN_EXPIRED') {
          uniCloud.callFunction({
            name: 'uni-id-refresh-token',
            data: { token: user.token }
          }).then(refreshRes => {
            if (refreshRes.result.errCode === 0) {
              user.setSession({
                token: refreshRes.result.token,
                tokenExpired: refreshRes.result.tokenExpired
              })
              // Retry original call
              uniCloud.callFunction({ name, data, success: (r) => resolve(r.result as T) })
            } else {
              user.logout()
              reject(refreshRes.result)
            }
          })
        } else if (res.result.errCode === 0) {
          resolve(res.result.data as T)
        } else {
          reject(res.result)
        }
      },
      fail: reject
    })
  })
}
```

## Cloud storage

### Upload from client

```ts
async function uploadAvatar(filePath: string): Promise<string> {
  // Get a temporary upload URL from the cloud
  const res = await uniCloud.callFunction({
    name: 'getUploadUrl',
    data: { ext: 'jpg' }
  })

  if (res.result.errCode !== 0) throw new Error(res.result.message)

  // Upload directly to cloud storage using uni.uploadFile
  await new Promise<void>((resolve, reject) => {
    uni.uploadFile({
      url: res.result.data.uploadUrl,    // pre-signed PUT URL
      filePath,
      name: 'file',
      header: { 'Content-Type': 'image/jpeg' },
      success: () => resolve(),
      fail: reject
    })
  })

  return res.result.data.cdnUrl   // CDN URL to display
}
```

### Server-side: generate upload URL

```js
// uniCloud-aliyun/cloudfunctions/getUploadUrl/index.js
'use strict'

const { getUploadFileOptions } = require('uni-cloud-s2')  // uniCloud security SDK

exports.main = async (event, context) => {
  const uid = context.auth?.uid
  if (!uid) return { code: 401, message: '未登录' }

  const { ext } = event
  // Generate a random object key
  const key = `user-uploads/${uid}/${Date.now()}.${ext}`

  // Get a pre-signed upload URL (5 min expiry)
  const uploadUrl = await uniCloud.getUploadFileOptions({
    cloudPath: key,
    // Optional: security policy
    policy: {
      expire: 300,
      // maxSize: 10 * 1024 * 1024
    }
  })

  return {
    code: 0,
    message: 'ok',
    data: {
      uploadUrl: uploadUrl.uploadFileOptions,
      fileKey: key,
      cdnUrl: `https://your-cdn-domain.com/${key}`
    }
  }
}
```

### Download / display

Cloud storage files are served via a CDN. Get the URL once, cache it, and use it in
`<image :src="..." />`. For private files, generate a temporary access URL.

## uni-cloud-router (organized cloud functions)

For non-trivial apps, dozens of `cloudfunctions/<name>/index.js` files get messy.
**uni-cloud-router** is a koa-style router for cloud functions, like a mini Express:

```js
// uniCloud-aliyun/cloudfunctions/router/index.js
'use strict'

const Router = require('uni-cloud-router').createRouter()
const db = uniCloud.database()

const uniID = require('uni-id')

// Public route
Router.post('/public/hello', async (ctx, next) => {
  ctx.body = { code: 0, message: 'hi' }
})

// Authenticated routes
Router.use('/api', async (ctx, next) => {
  const auth = await uniID.createTokenInfo(ctx.event.uniIdToken)
  if (auth.errCode) {
    ctx.body = { code: 401, message: '未登录' }
    return
  }
  ctx.auth = { uid: auth.uid, role: auth.role }
  await next()
})

Router.post('/api/orders', async (ctx, next) => {
  const { items, addressId } = ctx.event
  const collection = db.collection('orders')
  const { id } = await collection.add({
    uid: ctx.auth.uid,
    items,
    addressId,
    status: 'PENDING',
    createdAt: Date.now()
  })
  ctx.body = { code: 0, data: { id, status: 'PENDING' } }
})

Router.get('/api/orders', async (ctx, next) => {
  const orders = await db.collection('orders')
    .where({ uid: ctx.auth.uid })
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()
  ctx.body = { code: 0, data: orders.data }
})

exports.main = (event, context) => {
  return Router.serve(event, context)
}
```

Client calls the same as before, but the function name is just `router`:

```ts
const res = await uniCloud.callFunction({
  name: 'router',
  data: { path: '/api/orders', method: 'GET' }
})
```

This is the standard pattern for production uniCloud apps.

## Security rules

uniCloud has a **declarative permission system** in schema files:

```json
{
  "permission": {
    "read": "doc.uid == auth.uid",
    "create": "auth.uid != null",
    "update": "doc.uid == auth.uid && doc.status == 'PENDING'",
    "delete": "doc.uid == auth.uid && doc.status == 'PENDING'"
  }
}
```

`auth` is the caller's identity (from the JWT). `doc` is the document being accessed.
These rules are enforced server-side, not by the client.

For fine-grained control in cloud functions, do checks manually:

```js
const db = uniCloud.database()

exports.main = async (event, context) => {
  const uid = context.auth?.uid
  if (!uid) return { code: 401, message: '未登录' }

  // Look up the order
  const order = (await db.collection('orders').doc(event.orderId).get()).data[0]
  if (!order) return { code: 404, message: '订单不存在' }

  // Authorize
  if (order.uid !== uid) {
    return { code: 403, message: '无权访问' }
  }

  // ... rest of the function
}
```

## Local development

uniCloud functions run in the cloud. For local iteration, HBuilderX can run them
locally (downloads a Node.js runtime). The experience is "edit + save + auto-reload",
similar to serverless dev tools.

For CLI workflows, the recommended pattern:

1. Write the function
2. Run `uniCloud-aliyun:tcb:run` or use `hbuilderx-cli` to deploy
3. Test from the client immediately

You can also run cloud functions locally with Node.js for unit testing — see
`uniapp-testing` skill.

## Deployment

### Via HBuilderX

Right-click `uniCloud-aliyun` → "上传云函数" or "上传公共模块". This uploads
individual functions (only the changed ones for fast iteration).

### Via CLI

```bash
# Install the CLI
npm i -g @dcloudio/uni-cloud

# Login
unicloud login

# Deploy all functions
unicloud deploy --provider aliyun --space-id <your-space>

# Deploy one function
unicloud deploy --provider aliyun --space-id <your-space> --function login
```

### Alias environments

For dev / staging / prod separation, use uniCloud's **space aliases**:

- `default` — your main dev space
- `staging` — staging environment
- `production` — production

Configure per-function which space it deploys to. HBuilderX supports this natively.

## When NOT to use uniCloud

uniCloud is great for:
- New projects, MVPs, internal tools, China-market apps
- Apps that fit in Alibaba Cloud (international apps can use the AWS partner variant,
  but it's less mature)
- Teams that don't want to operate servers

uniCloud is **not** ideal for:
- Apps that need sub-50ms latency globally (use a traditional multi-region backend)
- Apps that need a relational database (uniCloud DB is NoSQL; use uni's SQL serverless
  or a separate service)
- Apps with heavy long-running processes (cloud functions are limited to ~5min
  execution; for longer use scheduled tasks or a separate worker)
- Compliance-bound apps where you need to choose your cloud provider (uniCloud is
  tied to Alibaba in China; AWS partner for international)

## Common pitfalls

1. **Forgetting to upload `common/` modules** — if your functions share a `common/`
   module, you must upload it for changes to take effect. The HBuilderX prompt
   reminds you, but it's easy to miss.
2. **Trusting client-provided `uid`** — always read from `context.auth.uid` (the JWT),
   never from `event.uid` (the request body). The JWT is signed; the body is not.
3. **Missing error handling in cloud functions** — uncaught exceptions return generic
   500s. Wrap in try/catch and return `{ code, message }`.
4. **Cold start latency** — first invocation of a function takes 1-3 seconds
   (Node.js startup). Use scheduled warm-up or `keepRunning: true` config if
   latency matters.
5. **DB queries without indexes** — the cloud DB will scan the entire collection
   for unmatched fields. Add indexes for any field you query by:
   ```js
   await db.collection('orders').createIndex({
     IndexName: 'idx_uid_status',
     MgoKeySchema: {
       MgoIndexKeys: [{ Name: 'uid', Direction: '1' }, { Name: 'status', Direction: '1' }]
     }
   })
   ```
6. **Putting business logic in the client** — the client should be a thin shell. All
   rules (pricing, discount calculation, permission checks) go in cloud functions.
7. **Not setting schema permissions** — without a schema, anyone with the function
   name can read/write any document. Always schema + permission rules.
8. **Storing secrets in cloud functions** — use uniCloud's "云函数配置" (config)
   for secrets, not hardcoded in the code.

## References in this skill

> v1.0 keeps all content inline. Splits planned for v1.1.

- `references/cloud-functions.md` — *planned*: full function patterns (inline above)
- `references/cloud-database.md` — *planned*: JQL + schema + aggregation (inline above)
- `references/cloud-storage.md` — *planned*: upload + CDN patterns (inline above)
- `references/uni-id-auth.md` — *planned*: full auth flow (inline above)
- `references/client-sdk.md` — *planned*: `uniCloud.callFunction` deep dive
  (inline above)
- `references/security-rules.md` — *planned*: schema permission + manual checks
  (inline above)
- `references/deployment.md` — *planned*: HBuilderX + CLI deploy (inline above)

## Examples in this skill

> v1.0 keeps all content inline. Standalone files planned for v1.1.

- `examples/cloud-function-login.js` — *planned* (currently inline)
- `examples/cloud-db-query.js` — *planned* (currently inline)
- `examples/upload-to-cloud-storage.ts` — *planned* (currently inline)
- `examples/uni-id-pages-usage.vue` — *planned* (currently inline)

## Resources

- uniCloud docs: https://unicloud.dcloud.net.cn/
- uni-id: https://uniapp.dcloud.net.cn/uniCloud/uni-id.html
- uni-cloud-router: https://uniapp.dcloud.net.cn/uniCloud/uni-cloud-router.html
- Cloud database (JQL): https://uniapp.dcloud.net.cn/uniCloud/jql.html
- Cloud storage: https://uniapp.dcloud.net.cn/uniCloud/storage.html
- uniCloud pricing: https://unicloud.dcloud.net.cn/price
- DCloud plugin market (uniCloud modules): https://ext.dcloud.net.cn/

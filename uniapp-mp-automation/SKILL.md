---
name: uniapp-mp-automation
description: "WeChat Mini Program automated build+debug workflow — npm build, verify appid, launch WeChat DevTools, automate debugging via MCP (weixin-devtools-mcp), inspect built bundles, assert UI state, monitor network, and integrate into CI/CD. Use when the user wants to automate the build→launch→debug cycle, write E2E scripts for mini-programs, or integrate DevTools automation into CI. Do NOT use for manual DevTools debugging (use uniapp-debugging-and-publishing) or Vitest/Playwright unit testing (use uniapp-testing)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

After loading this skill, the agent should be able to:

1. **Build and verify** — run `npm run build:mp-weixin`, confirm appid injection, validate built output
2. **Launch WeChat DevTools** — open the built project in DevTools via CLI or auto-connect
3. **MCP-driven automated debugging** — configure and use `weixin-devtools-mcp` (31 MCP tools) to connect,
   interact, assert, and inspect the running mini-program
4. **Assertion and verification** — check UI text, element state, console errors, network requests
5. **CI/CD integration** — wire the build→launch→debug pipeline into GitHub Actions

## When to use this skill

- "构建完小程序后帮我自动调试一下页面"
- "帮我写个自动化脚本，构建后验证页面正常渲染"
- "检查一下构建产物中的 appid 配置是否正确"
- "构建后自动启动 DevTools 并检查 console 有没有报错"
- "在 CI 里集成小程序构建后的自动化测试"
- 用户已经完成 `npm run build:mp-weixin` 但需要验证构建结果
- 用户需要反复手动打开 DevTools 检查页面，想自动化这个过程

## When NOT to use this skill

- "帮我手动调试小程序" → `uniapp-debugging-and-publishing`（手动调试面板使用）
- "写单元测试 / H5 E2E / CI 测试矩阵" → `uniapp-testing`（Vitest / Playwright）
- "需要 `miniprogram-automator` 的轻量脚本用于 CI 步骤" → `uniapp-testing`
  （本 skill 提供完整 MCP + automator 深度内容，`uniapp-testing` 提供轻量引用）
- "配置 manifest.json" → `uniapp-platform-config`（appid、权限声明）
- "如何上传审核" → `uniapp-debugging-and-publishing`（发版流程）
- "如何使用 `wx.xxx` API" → `uniapp-project`（组件/API 查阅）

## Prerequisites

Before starting, ensure these are in place:

| 条件 | 说明 |
|---|---|
| **Node.js >= 16** | 运行构建和 MCP 服务器 |
| **微信开发者工具** | 已安装，并开启 **服务端口**（设置 → 安全 → 服务端口） |
| **`mp-weixin.appid` 已配置** | 在 `manifest.json` 中设置，或使用测试号 |
| **项目已初始化** | `npm install` 完成，uni-app 项目可正常构建 |
| **MCP 客户端** | Claude Desktop / Cursor / VS Code (Cline) 等支持 MCP 的 AI 客户端 |

> 服务端口是 MCP 连接的关键：微信开发者工具 → 设置 → 安全设置 → **开启服务端口**。
> 如果未开启，`weixin-devtools-mcp` 无法通过 `auto` 策略自动连接。

## Workflow overview

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  确认 AppID  │ ──→ │  npm run build:  │ ──→ │  启动 DevTools  │ ──→ │  MCP 连接调试   │ ──→ │  生成报告/截图  │
│  manifest   │     │  mp-weixin       │     │  CLI / 手动    │     │  weixin-       │     │  断言结果       │
│  .json      │     │  dist/build/     │     │  open project  │     │  devtools-mcp  │     │                 │
└─────────────┘     └──────────────────┘     └────────────────┘     └─────────────────┘     └─────────────────┘
```

整个流程可一键执行，也可以拆解为单独的步骤分别调试。

## Step 1: Confirm AppID

AppID 是微信小程序的唯一标识，在 `manifest.json` 中配置，构建时会自动注入到 `project.config.json`。

### 读取 manifest.json 中的 appid

```jsonc
// src/manifest.json
{
  "mp-weixin": {
    "appid": "wx1234567890abcdef",    // ← 这里配置
    "setting": {
      "urlCheck": false,              // 开发阶段设为 false
      "es6": true,
      "postcss": true
    }
  }
}
```

### 验证构建后的 project.config.json

构建完成后，检查 `dist/build/mp-weixin/project.config.json` 中的 `appid` 是否正确注入：

```jsonc
// dist/build/mp-weixin/project.config.json
{
  "appid": "wx1234567890abcdef",      // ← 应与 manifest.json 一致
  "projectname": "my-uniapp",
  "compileType": "miniprogram"
}
```

### AppID 未配置时的处理

如果 `appid` 为空或未配置：

- 使用**测试号**：在微信开发者工具中点击"测试号"，自动分配 `wx` 开头的测试 appid
- 正式配置：登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 开发 → 开发设置 → 获取 AppID
- CI 环境：通过环境变量注入，例如在构建脚本中动态替换 `manifest.json` 的 appid

```ts
// scripts/verify-appid.js
const fs = require('fs')
const path = require('path')

const manifestPath = path.resolve('./src/manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
const appid = manifest['mp-weixin']?.appid

if (!appid || appid === '__UNI__XXXXXXX') {
  console.warn('⚠️ AppID 未配置或使用了默认值')
  console.warn('   请在 manifest.json 中配置 mp-weixin.appid')
  console.warn('   或使用微信开发者工具的"测试号"功能')
  process.exit(1)
}

console.log('✅ AppID:', appid)

// 构建后验证
const builtConfigPath = path.resolve('./dist/build/mp-weixin/project.config.json')
if (fs.existsSync(builtConfigPath)) {
  const builtConfig = JSON.parse(fs.readFileSync(builtConfigPath, 'utf-8'))
  console.log('✅ 构建产物 AppID:', builtConfig.appid)
  if (builtConfig.appid !== appid) {
    console.warn('⚠️ 构建产物中的 appid 与 manifest.json 不一致')
  }
}
```

## Step 2: Build the mini-program

```bash
npm run build:mp-weixin
```

输出目录：`dist/build/mp-weixin/`。

### 验证构建产物

构建完成后，确认以下关键文件存在：

```ts
// scripts/verify-build.js
const fs = require('fs')
const path = require('path')

const buildDir = path.resolve('./dist/build/mp-weixin')
const requiredFiles = ['app.json', 'project.config.json', 'app.js', 'app-wxss.js']

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(buildDir, file))) {
    throw new Error(`❌ 构建产物缺少关键文件: ${file}`)
  }
}
console.log('✅ 构建产物完整性检查通过')

// 检查 app.json 中的页面配置
const appJson = JSON.parse(fs.readFileSync(path.join(buildDir, 'app.json'), 'utf-8'))
console.log(`📄 页面数: ${appJson.pages?.length || 0}`)
console.log(`📦 分包数: ${appJson.subPackages?.length || 0}`)
```

如果有分包配置（`subPackages`），确认分包目录也已生成。

## Step 3: Launch WeChat DevTools

### 方式 A：手动导入

1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择目录：`dist/build/mp-weixin/`
4. 确认 AppID 已自动填入（来自 `project.config.json`）
5. 点击"导入"

### 方式 B：CLI 一键启动（推荐）

微信开发者工具提供了命令行工具（CLI），可以一键打开项目：

```bash
# Windows
"C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat" open --project "D:/path/to/dist/build/mp-weixin"

# macOS
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project /path/to/dist/build/mp-weixin
```

CLI 还支持其他操作：

```bash
# 仅打开项目（不启动模拟器）
cli open --project <path> --no-open

# 登录二维码
cli login

# 预览（生成二维码）
cli preview --project <path>

# 上传
cli upload --project <path> --version 1.0.0 --desc "auto upload"
```

### 方式 C：Node.js 脚本自动化

```ts
// scripts/launch-devtools.js
const { execSync } = require('child_process')
const path = require('path')

const projectPath = path.resolve('./dist/build/mp-weixin')

const cliPath = process.platform === 'win32'
  ? 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat'
  : '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

try {
  execSync(`"${cliPath}" open --project "${projectPath}"`, {
    stdio: 'inherit',
    timeout: 30000
  })
  console.log('✅ DevTools 启动成功')
} catch (e) {
  console.error('❌ DevTools 启动失败:', e.message)
  console.error('请确认：1) 微信开发者工具已安装 2) 服务端口已开启')
  process.exit(1)
}
```

> **注意**：CLI 启动后 DevTools 在后台运行，不会自动显示窗口。
> 可以通过 `--project` 参数让已有的 DevTools 窗口切换到该项目的 tab。

## Step 4: Configure the MCP Server

`weixin-devtools-mcp` 是一个基于 MCP 协议的 MCP 服务器，提供 31 个工具来操作微信开发者工具。
它通过 `miniprogram-automator` 与 DevTools 通信，AI 客户端通过标准 MCP 协议调用。

### 安装

**方式一：npx（推荐，无需安装）**

```bash
# 无需执行安装命令，直接在配置中使用 npx
```

**方式二：全局安装**

```bash
npm install -g weixin-devtools-mcp
```

**方式三：源码安装**

```bash
git clone https://github.com/wooter-s/weixin-devtools-mcp.git
cd weixin-devtools-mcp
npm install && npm run build
```

### Claude Desktop 配置

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "weixin-devtools-mcp": {
      "command": "npx",
      "args": ["-y", "weixin-devtools-mcp"]
    }
  }
}
```

### Cursor / VS Code (Cline) 配置

```json
{
  "mcpServers": {
    "weixin-devtools-mcp": {
      "command": "npx",
      "args": ["-y", "weixin-devtools-mcp", "--tools-profile=full"]
    }
  }
}
```

### Profile 配置

服务器支持按 profile 控制暴露的工具数量：

| Profile | 工具数 | 说明 |
|---|---|---|
| `core`（默认） | 20 | 连接、页面、交互、断言、导航、脚本 |
| `full` | 31 | core + console + network + debug 全部工具 |
| `minimal` | 10 | 最精简模式 |

按类别启停：

```bash
--tools-profile=core          # 使用默认 20 个工具
--enable-categories=network,debug  # 在 core 基础上额外启用 network 和 debug
--disable-categories=console  # 禁用 console 类别
```

```json
{
  "mcpServers": {
    "weixin-devtools-mcp": {
      "command": "npx",
      "args": ["-y", "weixin-devtools-mcp", "--enable-categories=console,network,debug"]
    }
  }
}
```

> 启用 `debug` 类别可获得 `screenshot`、`diagnose_connection`、`check_environment` 等调试工具。
> 启用 `network` 类别可监控 `wx.request` 等网络请求。

## Step 5: Automated Debugging with MCP

MCP 服务器启动后，AI agent 可以直接调用工具来操作微信开发者工具。
以下是完整的工作流脚本（在 AI 对话中以工具调用的形式执行）：

### 完整调试脚本

```
// === 阶段 1：连接 ===
connect_devtools({
  projectPath: "/path/to/dist/build/mp-weixin",
  strategy: "auto",       // auto: 自动检测已打开的 DevTools 或启动新的
  verbose: true
})
// 返回: { connected: true, mode: "launch", projectPath: "...", ... }

// === 阶段 2：确认首页已加载 ===
get_current_page({})
// 返回: { path: "pages/index/index", query: {}, ... }

// === 阶段 3：检查页面元素 ===
query_selector({ selector: ".page-content" })
// 返回: { uid: "...", tagName: "view", attributes: {...}, children: [...] }

// === 阶段 4：验证 UI 文本 ===
assert_text({
  uid: ".page-content",
  textContains: "首页"      // 检查文本包含
})

// === 阶段 5：检查控制台是否有报错 ===
list_console_messages({ type: "error" })
// 返回: []  — 空数组表示没有错误

// === 阶段 6：检查网络请求 ===
list_network_requests({ urlPattern: "/api", successOnly: true })
// 返回: [{ url: "...", statusCode: 200, ... }]

// === 阶段 7：截图保存 ===
screenshot({ path: "/tmp/mp-homepage.png" })
// 返回: { path: "/tmp/mp-homepage.png", width: 375, height: 812 }

// === 阶段 8：断开连接 ===
disconnect_devtools({})
```

### 常用调试场景

#### 场景 1：验证构建页面正常渲染

```ts
// 1. 连接
connect_devtools({ projectPath, strategy: "auto" })

// 2. 获取当前页面快照
const snapshot = get_page_snapshot({})
// 检查页面结构

// 3. 验证首页标题
assert_text({ selector: ".nav-bar-title", textContains: "首页" })

// 4. 检查页面元素数量
const items = query_selector({ selector: ".product-item" })
// items.children.length 应该 > 0

// 5. 截图
screenshot({ path: "/tmp/render-check.png" })
```

#### 场景 2：检查 API 请求是否正确发出

```ts
connect_devtools({ projectPath, strategy: "auto" })

// 导航到需要检查 API 的页面
navigate_to({ url: "/pages/detail/detail?id=123" })

// 等待页面加载
wait_for({ selector: ".detail-content", timeout: 5000 })

// 列出网络请求
const requests = list_network_requests({ urlPattern: "/api/product/detail" })
// 确认请求已发出且状态码正确

// 检查某个请求的详情
if (requests.length > 0) {
  const detail = get_network_request({ reqid: requests[0].reqid })
  console.log(detail.response)  // 查看响应数据
}
```

#### 场景 3：确认分包加载

```ts
connect_devtools({ projectPath, strategy: "auto" })

// 导航到分包页面
navigate_to({ url: "/pagesA/list/list" })

// 检查控制台是否有分包加载错误
const errors = list_console_messages({ type: "error" })
assert_state({ condition: errors.length === 0, description: "分包加载无报错" })
```

#### 场景 4：表单提交验证

```ts
connect_devtools({ projectPath, strategy: "auto" })

// 输入表单
query_selector({ selector: "input#name" })
input_text({ uid: "input#name", text: "张三" })

query_selector({ selector: "input#phone" })
input_text({ uid: "input#phone", text: "13800138000" })

// 提交
query_selector({ selector: "button.submit" })
click({ uid: "button.submit" })

// 等待提交结果
wait_for({ selector: ".success-toast", timeout: 3000 })

// 验证
assert_text({ uid: ".success-toast", textContains: "提交成功" })
```

### Node.js 脚本封装（适用于 CI 环境）

以下脚本将 MCP 工具调用包装为 Node.js 可执行脚本，适用于没有 AI 客户端的 CI 环境：

```ts
// scripts/mp-automated-debug.js
const { execSync } = require('child_process')
const path = require('path')

async function main() {
  const projectPath = path.resolve('./dist/build/mp-weixin')

  // 1. 启动 DevTools
  const cliPath = process.platform === 'win32'
    ? 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat'
    : '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
  execSync(`"${cliPath}" open --project "${projectPath}"`, { stdio: 'inherit' })

  // 2. 等待 DevTools 启动
  await new Promise(r => setTimeout(r, 5000))

  // 3. 使用 miniprogram-automator 执行基本检查
  const automator = require('miniprogram-automator')
  const devtools = await automator.launch({
    projectPath,
    cliPath
  })

  const page = await devtools.connect()
  const systemInfo = await page.callWxMethod('getSystemInfo')
  console.log('System info:', systemInfo)

  // 检查页面元素
  const elements = await page.$$('.page-content')
  console.log(`Page elements found: ${elements.length}`)

  // 截图
  await page.screenshot({ path: '/tmp/mp-debug-screenshot.png' })

  await devtools.close()
  console.log('✅ 自动化调试完成')
}

main().catch(err => {
  console.error('❌ 自动化调试失败:', err)
  process.exit(1)
})
```

## MCP Tools Reference

以下为 `weixin-devtools-mcp` 完整工具列表（full profile，31 个工具）。

### 连接类（3 个）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `connect_devtools` | `projectPath`, `strategy` (auto/launch/connect), `verbose` | 连接状态 | 连接到 DevTools，auto 策略自动检测或启动 |
| `reconnect_devtools` | 无 | 连接状态 | 重新连接 |
| `disconnect_devtools` | 无 | 断开状态 | 断开当前连接 |
| `get_connection_status` | 无 | 连接信息 | 获取当前连接状态 |

### 页面类（3 个）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `get_current_page` | 无 | 页面信息（path, query） | 获取当前页面路径和参数 |
| `get_page_snapshot` | 无 | 页面快照 | 获取当前页面的完整 a11y 树快照 |
| `query_selector` | `selector` (CSS 选择器) | 元素信息（uid, tag, attrs） | 按选择器查找元素 |

### 交互类（4 个）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `click` | `uid` | 点击结果 | 点击指定元素 |
| `input_text` | `uid`, `text` | 输入结果 | 在输入框中填入文本 |
| `get_value` | `uid` | 元素值 | 获取表单元素的值 |
| `set_form_control` | `uid`, `value` | 设置结果 | 设置表单控件值（picker, switch, slider） |

### 断言类（3 个）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `assert_text` | `uid`, `text` / `textContains` | 断言结果 | 验证元素文本内容 |
| `assert_attribute` | `uid`, `attribute`, `value` | 断言结果 | 验证元素属性值 |
| `assert_state` | `condition` (visible/enabled/selected) | 断言结果 | 验证元素状态 |

### 导航类（4 个）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `navigate_to` | `url` | 导航结果 | 页面跳转 |
| `navigate_back` | `delta` | 返回结果 | 返回上一页 |
| `switch_tab` | `url` | 切换结果 | 切换 tab 页面 |
| `relaunch` | `url` | 重开结果 | 重新启动到指定页面 |

### 脚本类（1 个）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `evaluate_script` | `script` (JS 代码字符串) | 执行结果 | 在页面上下文中执行 JS 代码 |

### 控制台类（2 个，默认关闭）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list_console_messages` | `type` (error/warn/log/debug) | 消息列表 | 列出控制台消息 |
| `get_console_message` | `msgid` | 消息详情 | 获取单条控制台消息详情 |

### 网络类（4 个，默认关闭）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list_network_requests` | `urlPattern`, `successOnly` | 请求列表 | 列出网络请求 |
| `get_network_request` | `reqid` | 请求详情 | 获取单条请求头/体/响应详情 |
| `stop_network_monitoring` | 无 | 停止结果 | 停止网络监控 |
| `clear_network_requests` | 无 | 清空结果 | 清空已记录的请求 |

### 调试类（5 个，默认关闭）

| 工具 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `screenshot` | `path` | 截图文件路径 | 截取当前页面截图 |
| `diagnose_connection` | 无 | 诊断报告 | 诊断连接问题 |
| `check_environment` | 无 | 环境报告 | 检查 DevTools/Node 环境 |
| `debug_page_elements` | `selector` | 调试信息 | 调试页面元素布局 |
| `debug_connection_flow` | 无 | 连接流日志 | 调试连接流程 |

## CI/CD Integration

完整的 GitHub Actions 工作流——构建、启动 DevTools、自动化调试：

```yaml
# .github/workflows/mp-automated-debug.yml
name: MP Automated Debug

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  mp-debug:
    runs-on: macos-latest   # WeChat DevTools 需要 macOS 或 Windows
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - run: npm ci

      # 1. 确认 appid
      - name: Verify AppID
        run: node scripts/verify-appid.js

      # 2. 构建
      - name: Build MP
        run: npm run build:mp-weixin

      # 3. 安装微信开发者工具（macOS）
      - name: Install WeChat DevTools
        run: brew install --cask wechat-webdevtools

      # 4. 启动 DevTools + 自动化调试
      - name: Run Automated Debug
        run: node scripts/mp-automated-debug.js
        env:
          WECHAT_DEVTOOLS_CLI: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

      # 5. 上传截图作为 artifact
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: mp-debug-screenshots
          path: /tmp/mp-debug-screenshot*.png

      # 6. 如果有控制台错误，输出警告
      - name: Check Console Errors
        if: failure()
        run: echo "::warning::MP automated debug found issues. Check artifacts for screenshots."
```

> **macOS runner 注意**：WeChat DevTools 官方支持 macOS 和 Windows。
> GitHub Actions 的 `macos-latest` runner 可以通过 `brew install --cask wechat-webdevtools` 安装。
> Windows runner 需要先安装 DevTools（可通过 choco/scoop 或预装镜像）。
> `ubuntu-latest` runner **不支持** WeChat DevTools。

### 本地调试的快捷脚本

```bash
# package.json 中添加
{
  "scripts": {
    "build:mp": "npm run build:mp-weixin",
    "debug:mp": "node scripts/verify-appid.js && npm run build:mp && node scripts/launch-devtools.js",
    "debug:mp:full": "node scripts/verify-appid.js && npm run build:mp && node scripts/launch-devtools.js && node scripts/mp-automated-debug.js"
  }
}
```

```bash
# 一键执行：验证 → 构建 → 启动 DevTools
npm run debug:mp

# 一键执行完整流程：验证 → 构建 → 启动 → 自动化调试
npm run debug:mp:full
```

## Common mistakes

1. **服务端口未开启** — `connect_devtools` 连接失败时，首先检查微信开发者工具 → 设置 → 安全 → 服务端口是否开启。开启后需要**重启 DevTools**。

2. **DevTools 版本过低** — 旧版 DevTools 可能不支持自动化接口。请更新到最新稳定版。

3. **appid 不匹配** — `manifest.json` 中的 appid 与 `project.config.json` 中的不一致。运行 `node scripts/verify-appid.js` 检查。

4. **构建后未关闭 DevTools** — 如果 DevTools 已打开旧版本的项目，构建后需要重新导入或重启 DevTools 才能加载最新代码。

5. **MCP client 超时** — DevTools 首次启动可能需要较长时间（尤其是 macOS），MCP 工具的 `timeout` 参数可以适当调大（如 30000ms）。

6. **macOS 权限问题** — macOS 下首次运行 DevTools CLI 需要在"系统偏好设置 → 安全性与隐私 → 辅助功能"中授权终端。

7. **`npx` 缓存问题** — 如果 `npx -y weixin-devtools-mcp` 运行旧版本，可以手动清除缓存：`npx clear-cache`。

8. **`auto` 策略找不到 DevTools** — 如果同时打开了多个 DevTools 窗口，`auto` 策略可能连接错误。尝试使用 `launch` 策略指定 `cliPath`。

9. **网络监控没有数据** — 默认 `core` profile 不包括网络工具。启动时需要加 `--enable-categories=network` 参数。

10. **CI 中 DevTools 无法启动** — GitHub Actions 的 macOS runner 需要先安装 DevTools（`brew install --cask wechat-webdevtools`），且需要 GUI 环境支持。

## Resources

- `weixin-devtools-mcp` GitHub: https://github.com/wooter-s/weixin-devtools-mcp
- `weixin-devtools-mcp` npm: https://www.npmjs.com/package/weixin-devtools-mcp
- miniprogram-automator docs: https://developers.weixin.qq.com/miniprogram/dev/devtools/automator.html
- WeChat DevTools CLI docs: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
- WeChat MP admin: https://mp.weixin.qq.com/
- Model Context Protocol: https://modelcontextprotocol.io/
- miniprogram-ci: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
- uni-app MP build config: https://uniapp.dcloud.net.cn/tutorial/build.html

---
name: uniapp-mp-automation
description: "WeChat Mini Program automated build + debug workflow — npm build, verify appid, launch WeChat DevTools, and run 31 automation operations (connect / page / interaction / assertion / navigation / script / console / network / debug) through a local helper daemon (mp-debug-helper.js) that AI drives via Bash + curl. No MCP server required. Use when the user wants to automate the build→launch→debug cycle, write E2E scripts for mini-programs, or integrate DevTools automation into CI. Do NOT use for manual DevTools debugging (use uniapp-debugging-and-publishing) or Vitest/Playwright unit testing (use uniapp-testing)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

After loading this skill, the agent should be able to:

1. **Build and verify** — run `npm run build:mp-weixin`, confirm appid injection, validate built output
2. **Launch WeChat DevTools** — open the built project in DevTools via CLI or the bundled `mp-launch.js`
3. **Run 31 automation operations** via a local helper daemon (`mp-debug-helper.js`) — the AI sends operations via
   `node mp-debug-helper.js <op> key=value` (or raw `curl` against `http://127.0.0.1:9876/cmd`); state (connection,
   page reference, console/network buffers) persists across calls
4. **Assert and verify** — UI text, element state, console errors, network requests, screenshots
5. **CI/CD integration** — `mp-ci-debug.js` runs a scenario config in pure Node.js (no AI agent required); works
   in GitHub Actions

> **Why a helper daemon instead of MCP?** MCP requires client support (Claude Desktop / Cursor / Cline). The
> helper daemon uses only Bash + curl + Node.js, so it works in **any** environment — including CI runners and
> AI agents without MCP. The 31 operations are a 1:1 mapping of the `weixin-devtools-mcp` tool surface.
>
> **与微信官方 Skills 的关系**：微信开发者工具内置了 [官方 Skills](https://developers.weixin.qq.com/miniprogram/dev/devtools/Skills.html)（`miniprogram-dev-skill`），通过 `wechatide` CLI 直接调用。本 skill 的 31 个操作与官方工具的 42 个操作功能重叠但不完全一致——官方 Skills 更完整（支持云开发、项目列表管理、编译等），而本 skill 更轻量（纯 Bash+curl，无需 MCP 客户端）。建议 AI agent 优先使用官方 Skills（如果已安装），本 skill 作为无 MCP 环境下的备选方案。

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
- "写单元测试 / H5 E2E / Playwright" → `uniapp-testing`（Vitest / Playwright）
- "在 CI 里跑几个轻量的 automator 断言" → `uniapp-testing`（轻量入口，本 skill 是 AI 驱动深度版）
- "配置 manifest.json" → `uniapp-platform-config`（appid、权限声明）
- "如何上传审核" → `uniapp-debugging-and-publishing`（发版流程）
- "如何使用 `wx.xxx` API" → `uniapp-project`（组件/API 查阅）

## Prerequisites

| 条件 | 说明 |
|---|---|
| **Node.js >= 16** | 运行 helper 和构建 |
| **微信开发者工具** | 已安装，并开启 **服务端口**（设置 → 安全 → 服务端口） |
| **`mp-weixin.appid` 已配置** | 在 `manifest.json` 中设置，或使用测试号 |
| **项目已初始化** | `npm install` 完成 |
| **`miniprogram-automator`** | `npm i -D miniprogram-automator`（helper 通过它连接 DevTools） |
| **任何能跑 Bash + curl 的环境** | 不需要 MCP 客户端 |
| **（Windows）有 GUI session** | 31 ops（截图/UI 断言/网络/console）、`mp-ci-debug.js` 场景、真实点击/输入测试都需要 active Windows desktop session（有登录用户 + 窗口管理器）；无 GUI 环境下只能跑 build/verify 类步骤 |

> 服务端口是连接的关键：微信开发者工具 → 设置 → 安全设置 → **开启服务端口**。开启后需重启 DevTools。
>
> **`miniprogram-automator` 路径**：helper 自身不带 `node_modules`。如果从 skill 目录直接跑，要在用户的 uni-app 项目里装 `miniprogram-automator` 并用 `NODE_PATH=<项目根>/node_modules` 指过去，否则 `connect` 报 `miniprogram_automator_not_installed`。
>
> **DevTools 安装位置**：自动检测会扫 `C:/Program Files (x86)/Tencent/微信web开发者工具`、`C:/Program Files/Tencent/...`、`%LOCALAPPDATA%/Programs/...`、Windows 注册表。装在 D 盘或其他自定义位置的，设 `WECHAT_DEVTOOLS_CLI` 环境变量或在 TTY 中按提示输入路径。详见 [DevTools CLI 路径自动检测](#devtools-cli-路径自动检测)。

## Files in this skill

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 本文档 |
| `scripts/mp-paths.js` | **路径自动检测**（uni-app 构建产物路径） |
| `scripts/mp-devtools-cli.js` | **路径自动检测**（微信开发者工具 CLI 路径 + 交互式输入） |
| `scripts/mp-debug-helper.js` | **核心**：长驻 HTTP daemon（31 ops） |
| `scripts/mp-launch.js` | 一键 CLI 启动 DevTools |
| `scripts/mp-verify-appid.js` | 校验 manifest 与构建产物的 appid |
| `scripts/mp-verify-build.js` | 校验构建产物完整性 |
| `scripts/mp-ci-debug.js` | CI 场景执行入口（不依赖 AI） |
| `scripts/mp-debug-scenarios.example.json` | CI 场景配置示例 |

## Path auto-detection

所有脚本**默认无需指定项目路径**。`scripts/mp-paths.js` 按以下顺序解析：

1. 显式传入（`--project` 参数、`scenario.config` 的 `projectPath` 字段）
2. 环境变量 `MP_PROJECT_PATH`
3. **CWD 向上查找** `src/manifest.json` / `manifest.json` / `app.json` 定位项目根
4. 项目根下按顺序探测构建输出：

   | 候选路径 | 适用项目 |
   |---|---|
   | `unpackage/dist/build/mp-weixin/` | HBuilderX 3.x+ / vue-cli vite |
   | `unpackage/dist/dev/mp-weixin/` | HBuilderX 3.x+ dev 模式 |
   | `dist/build/mp-weixin/` | uni-app vue-cli 旧版 / 标准 vite |
   | `dist/dev/mp-weixin/` | dev 模式 |
   | `./`（当前目录含 `app.json`） | 原生小程序项目 |

第一个 `app.json` 存在的路径即为构建产物目录。找不到时给出完整搜索列表与提示。

**覆盖方式（按优先级）**：

```bash
# 1. 环境变量（适合 CI）
export MP_PROJECT_PATH=/abs/path/to/mp-weixin

# 2. CLI 参数
node scripts/mp-launch.js --project /abs/path
node scripts/mp-ci-debug.js --project /abs/path --config scenarios.json

# 3. 场景配置中显式声明
{ "projectPath": "/abs/path", "scenarios": [...] }
```

调试用：`node scripts/mp-paths.js` 输出当前检测到的所有路径。

## DevTools CLI 路径自动检测

`scripts/mp-devtools-cli.js` 负责解析 **微信开发者工具 CLI 入口**（Windows: `cli.bat`；macOS/Linux: `cli`），按以下顺序探测，第一个命中的为准：

1. `--cli <path>` 显式传入（最优先；路径必须存在）
2. 环境变量 `WECHAT_DEVTOOLS_CLI`（必须存在，否则报错）
3. 缓存 `~/.uniapp-mp-automation/devtools-cli.json`（每次成功解析后自动写入，下次跳过扫描）
4. Windows 注册表 `HKLM\...\Tencent\微信web开发者工具` 的 `InstallLocation`
5. 平台默认安装路径（`Program Files`、`~/AppData/Local/Programs`、`/Applications` 等）
6. **交互式输入**（仅在 TTY 下）—— 提示用户粘贴 `cli.bat` 完整路径，输入后校验并缓存

非 TTY 场景（CI、daemon 模式、AI agent 调用）会自动跳过第 6 步，直接以清晰报错退出。报错信息会附带完整的 `Diagnostics` 对象，列出已尝试过的所有路径，方便用户排查。

**覆盖方式**（按优先级）：

```bash
# 1. CLI 参数
node scripts/mp-launch.js --cli "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
node scripts/mp-debug-helper.js connect --cli /Applications/wechatwebdevtools.app/Contents/MacOS/cli

# 2. 环境变量（CI 友好）
export WECHAT_DEVTOOLS_CLI="C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
node scripts/mp-launch.js

# 3. 交互式输入
node scripts/mp-launch.js            # 在终端运行，未自动检测到时提示输入
```

**自检与缓存管理**：

```bash
node scripts/mp-devtools-cli.js --probe   # 列出所有检测源的实际状态，不弹提示、不抛错
node scripts/mp-devtools-cli.js --clear   # 清除缓存（DevTools 重装后用得到）
node mp-debug-helper.js detect-cli        # 同 --probe，daemon 风格的入口
```

**`connect` op 新增 `cliPath` / `cliSource` 字段**：

```bash
node scripts/mp-debug-helper.js connect
# → {
#     "ok": true,
#     "data": {
#       "connected": true,
#       "mode": "launch_fallback",
#       "projectPath": "...",
#       "cliPath": "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat",
#       "cliSource": "common_path",     # env | explicit | cache | registry | common_path
#       "pid": 12345
#     }
#   }
```

## Workflow overview

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  校验 AppID  │ ──→ │  npm run build:  │ ──→ │  启动 DevTools  │ ──→ │  启动 helper   │ ──→ │  发送 ops       │
│  verify-    │     │  mp-weixin       │     │  mp-launch.js  │     │  daemon (Bash) │     │  Bash + curl    │
│  appid.js   │     │  verify-build.js │     │                │     │  :9876         │     │  state 持久     │
└─────────────┘     └──────────────────┘     └────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                              ↓
                                                                                       screenshots / report
```

整个流程可一键执行（CI 模式），也可拆解为 AI 在对话中逐步调用。

## Step 1: Confirm AppID

```bash
node scripts/mp-verify-appid.js   # 自动查找 manifest.json + project.config.json
```

输出示例：

```json
{
  "ok": true,
  "manifest": "D:/proj/src/manifest.json",
  "build": "D:/proj/unpackage/dist/build/mp-weixin/project.config.json",
  "source": "wx1234567890abcdef",
  "built_appid": "wx1234567890abcdef",
  "projectname": "my-uniapp"
}
```

未配置时返回 `appid_unconfigured` 并以 exit code 1 退出。处理方式：

- **测试号**：在微信开发者工具中点击"测试号"，自动分配 appid
- **正式配置**：登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 开发 → 开发设置 → 获取 AppID
- **CI 环境**：构建脚本中动态替换 `manifest.json` 的 appid

构建产物未生成时跳过 build 校验（warning 而非 fail），方便先校验 manifest 再构建。

**开发期小贴士** — `manifest.json` 中 `mp-weixin.setting.urlCheck` 在开发期应设为 `false`，避免本地未配置合法 HTTPS 证书时请求被微信拦截：

```jsonc
// src/manifest.json (开发期)
{
  "mp-weixin": {
    "appid": "wx1234567890abcdef",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "postcss": true
    }
  }
}
```

正式发版前再把 `urlCheck` 改回 `true`。

## Step 2: Build the mini-program

```bash
npm run build:mp-weixin
node scripts/mp-verify-build.js   # 自动查找构建产物
```

`mp-verify-build.js` 校验 `app.json` / `project.config.json` / `app.js` / `app.wxss` 是否齐全，分包目录是否生成。输出示例：

```json
{ "ok": true, "pages": 12, "subPackages": 2, "missing_subpackages": [], "size_kb": 1843 }
```

## Step 3: Launch WeChat DevTools

```bash
node scripts/mp-launch.js                          # 自动定位构建产物 + 自动定位 DevTools CLI
node scripts/mp-launch.js --no-open                # 仅打开项目不启动模拟器
node scripts/mp-launch.js --project /abs/path      # 显式覆盖构建产物路径
node scripts/mp-launch.js --cli /abs/cli.bat       # 显式覆盖 DevTools CLI 路径
node scripts/mp-launch.js --no-interactive         # 不要弹提示（CI / agent 用）
```

> DevTools CLI 路径自动检测见 [DevTools CLI 路径自动检测](#devtools-cli-路径自动检测) 一节。找不到时会按 TTY/非 TTY 分别走"用户输入"或"清晰报错"两条路。

底层调用微信开发者工具 CLI：

```bash
# Windows
"C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat" open --project "D:/path/to/dist/build/mp-weixin"

# macOS
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project /path/to/dist/build/mp-weixin
```

CLI 还支持 `preview`（预览二维码）、`upload`（上传）等子命令，需要时直接调用即可，helper 不强制介入。

## Step 4: Start the helper daemon

```bash
node scripts/mp-debug-helper.js start
# → { "ok": true, "status": "started", "pid": 12345, "port": 9876 }

node scripts/mp-debug-helper.js status
# → { "ok": true, "status": "running", "pid": 12345, "port": 9876 }

node scripts/mp-debug-helper.js stop    # 用完停止
```

Daemon 做的事：

- 监听 `127.0.0.1:9876`（可通过 `MP_DEBUG_PORT` 覆盖）
- 接受 JSON 命令 `{op, args}`，执行后返回 `{ok, data}` 或 `{ok:false, error}`
- 持有 DevTools 连接、当前页面引用、元素 UID 缓存、console/network 缓冲
- **不连接 MCP server** — 完全本地

> 如果 9876 端口被占用，设置 `MP_DEBUG_PORT=9877 node scripts/mp-debug-helper.js start`。

## Step 5: Send operations

两种调用方式，效果一致：

**方式 A：直接调用（推荐，AI 友好）**

```bash
node scripts/mp-debug-helper.js connect      projectPath=/abs/path
node scripts/mp-debug-helper.js query_selector  selector=".page-content"
node scripts/mp-debug-helper.js assert_text     uid=el-1  textContains="首页"
node scripts/mp-debug-helper.js screenshot      path=/tmp/home.png
node scripts/mp-debug-helper.js click           uid=el-3
```

参数既支持 `key=value` 也支持 `--key value`，值含空格时用引号包起来：

```bash
node scripts/mp-debug-helper.js assert_text uid=el-1 textContains="Hello World"
```

helper 在 daemon 未启动时会自动 `start` 再发命令，单次脚本可直接用。

**方式 B：直接 curl（复杂脚本场景）**

```bash
curl -sS -X POST http://127.0.0.1:9876/cmd \
  -H 'Content-Type: application/json' \
  -d '{"op":"query_selector","args":{"selector":".page-content"}}'
```

返回 JSON：`{"ok":true,"data":{...}}` 或 `{"ok":false,"error":"..."}`。

### 元素 UID 模型

每次 `query_selector` 返回的 `uid`（如 `el-1`）缓存在 daemon 进程内，后续 `click` / `input_text` / `assert_text` 等通过 uid 引用。**每次 Bash 调用拿到的 uid 在同 daemon 内跨调用有效**——这是 helper 与一次性脚本的核心差异。

### 典型完整流程

```bash
# 1. 连接（自动探测构建产物路径）
node scripts/mp-debug-helper.js connect

# 2. 确认当前页面
node scripts/mp-debug-helper.js current_page
# → {"ok":true,"data":{"path":"pages/index/index","query":{},"uid":"el-1"}}

# 3. 查询元素（拿到 uid）
node scripts/mp-debug-helper.js query_selector selector=".nav-bar-title"
# → {"ok":true,"data":{"uid":"el-2","tagName":"view","text":"首页","attributes":{"class":"nav-bar-title"}}}

# 4. 断言 UI 文本
node scripts/mp-debug-helper.js assert_text uid=el-2 textContains="首页"

# 5. 检查控制台错误
node scripts/mp-debug-helper.js list_console_messages type=error
# → {"ok":true,"data":{"count":0,"messages":[]}}

# 6. 截图
node scripts/mp-debug-helper.js screenshot path=/tmp/homepage.png

# 7. 用完停止
node scripts/mp-debug-helper.js stop
```

## 常用操作速查

| 目标 | 命令 |
|------|------|
| 启动 daemon | `node scripts/mp-debug-helper.js start` |
| 连接 DevTools | `node scripts/mp-debug-helper.js connect` |
| 打开指定页面 | `node scripts/mp-debug-helper.js navigate_to url="/pages/detail/detail?id=1"` |
| 查询页面元素 | `node scripts/mp-debug-helper.js query_selector selector=".page-title"` |
| 点击元素 | `node scripts/mp-debug-helper.js click uid=el-1` |
| 输入文本 | `node scripts/mp-debug-helper.js input_text uid=el-2 text="hello"` |
| 断言文本 | `node scripts/mp-debug-helper.js assert_text uid=el-1 textContains="首页"` |
| 等待元素出现 | `node scripts/mp-debug-helper.js wait_for selector=".content" timeout=5000` |
| 截图 | `node scripts/mp-debug-helper.js screenshot path=/tmp/page.png` |
| 检查 console 错误 | `node scripts/mp-debug-helper.js list_console_messages type=error` |
| 检查网络请求 | `node scripts/mp-debug-helper.js list_network_requests urlPattern="/api/"` |
| 执行自定义 JS | `node scripts/mp-debug-helper.js evaluate_script script="(() => getApp())()"` |
| 停止 daemon | `node scripts/mp-debug-helper.js stop` |
| 校验 AppID | `node scripts/mp-verify-appid.js` |
| 校验构建产物 | `node scripts/mp-verify-build.js` |
| 启动 DevTools | `node scripts/mp-launch.js` |
| CI 场景执行 | `node scripts/mp-ci-debug.js --config ./scenarios.json` |

> 如果已安装微信官方 Skills（`miniprogram-dev-skill`），上述操作也可通过 `wechatide -c <agentName> -t <toolName>` 完成，参见[官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/Skills.html)。

## Common debugging scenarios

### 场景 1：验证构建页面正常渲染

```bash
node scripts/mp-debug-helper.js connect
node scripts/mp-debug-helper.js wait_for     selector=".page-content" timeout=5000
node scripts/mp-debug-helper.js query_selector selector=".nav-bar-title"
# → 记录返回的 uid，下一步用
node scripts/mp-debug-helper.js assert_text  uid=el-2 textContains="首页"
node scripts/mp-debug-helper.js screenshot   path="$PWD/screenshots/home.png"
```

### 场景 2：检查 API 请求是否正确发出

```bash
node scripts/mp-debug-helper.js navigate_to url="/pages/detail/detail?id=123"
node scripts/mp-debug-helper.js wait_for    selector=".detail-content" timeout=5000
node scripts/mp-debug-helper.js list_network_requests urlPattern="/api/product/detail" successOnly=true
# → 返回所有匹配的请求列表
node scripts/mp-debug-helper.js get_network_request reqid=1
# → 返回单条请求的 header/body/response
```

### 场景 3：确认分包加载

```bash
node scripts/mp-debug-helper.js navigate_to url="/pagesA/list/list"
node scripts/mp-debug-helper.js list_console_messages type=error
# → 空数组表示分包加载成功
node scripts/mp-debug-helper.js assert_state condition=no_console_errors
```

### 场景 4：表单提交验证

```bash
node scripts/mp-debug-helper.js query_selector selector="input#name"
node scripts/mp-debug-helper.js input_text    uid=el-1 text="张三"
node scripts/mp-debug-helper.js query_selector selector="input#phone"
node scripts/mp-debug-helper.js input_text    uid=el-2 text="13800138000"
node scripts/mp-debug-helper.js query_selector selector="button.submit"
node scripts/mp-debug-helper.js click         uid=el-3
node scripts/mp-debug-helper.js wait_for      selector=".success-toast" timeout=3000
node scripts/mp-debug-helper.js query_selector selector=".success-toast"
node scripts/mp-debug-helper.js assert_text   uid=el-4 textContains="提交成功"
```

### 场景 5：执行任意 JS（评估）

```bash
node scripts/mp-debug-helper.js evaluate_script script="(() => ({ system: wx.getSystemInfoSync() }))()"
```

## Operations Reference (31 ops)

完整操作列表（与 `weixin-devtools-mcp` 1:1 对应）。

### 连接（4）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `connect` | `projectPath`, `strategy` (auto/connect/launch) | `{connected, mode, projectPath, pid}` | 连接 DevTools；strategy=auto 时若已有连接则复用 |
| `reconnect` | — | 同 connect | 关闭后重连 |
| `disconnect` | — | `{disconnected:true}` | 关闭连接 |
| `connection_status` | — | `{connected, currentPagePath, cachedElements, consoleBuffered, ...}` | 当前连接状态 |

### 页面（3）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `current_page` | — | `{path, query, uid}` | 当前页面 |
| `page_snapshot` | — | `{path, accessibility, uid}` | 页面 a11y 快照 |
| `query_selector` | `selector` | `{uid, tagName, text, attributes}` | 按 CSS 选择器查元素，返回 uid 用于后续操作 |

### 交互（4）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `click` | `uid` | `{clicked:true}` | 点击元素 |
| `input_text` | `uid`, `text` | `{input:true, length}` | 输入文本 |
| `get_value` | `uid` | `{value}` | 获取表单值 |
| `set_form_control` | `uid`, `value` | `{set:true}` | 设置 picker/switch/slider |

### 断言（4）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `assert_text` | `uid`, `text` / `textContains` | `{passed:true}` | 验证文本相等或包含；失败抛错 |
| `assert_attribute` | `uid`, `attribute`, `value` | `{passed:true}` | 验证属性值相等 |
| `assert_state` | `condition` (no_console_errors/connected) | `{passed:true}` | 验证系统状态 |
| `wait_for` | `selector`, `timeout`, `interval` | `{found:true, uid, elapsed_ms}` | 轮询等待元素出现 |

### 导航（4）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `navigate_to` | `url` | `{navigated, url, path}` | 保留当前页跳转 |
| `navigate_back` | `delta` | `{back, delta, path}` | 返回 |
| `switch_tab` | `url` | `{switched, url, path}` | 切换 tabBar 页 |
| `relaunch` | `url` | `{relaunched, url, path}` | 重新启动到指定页 |

### 脚本（1）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `evaluate_script` | `script` (JS 字符串) | `{result}` | 在当前页面上下文执行 JS |

### 控制台（2）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list_console_messages` | `type`, `sinceId` | `{count, messages}` | 按类型过滤 |
| `get_console_message` | `msgid` | 单条 message | 按 id 取详情 |

### 网络（4）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list_network_requests` | `urlPattern`, `successOnly`, `sinceId` | `{count, requests}` | 列出请求 |
| `get_network_request` | `reqid` | 单条 request + response | 请求详情 |
| `stop_network_monitoring` | — | `{stopped:true}` | 停止缓冲新请求 |
| `clear_network_requests` | — | `{cleared:true}` | 清空缓冲 |

### 调试（5）

| 操作 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `screenshot` | `path` | `{saved}` | 截图到本地路径 |
| `diagnose_connection` | — | `{checks, issues, healthy}` | 综合诊断 |
| `check_environment` | — | `{node, platform, automator_version, ...}` | 环境自检 |
| `debug_page_elements` | `selector` (默认 "page") | `{root, tree}` | 元素树（depth ≤ 4） |
| `debug_connection_flow` | `limit` | `{events, total}` | 连接流日志 |

## CI/CD Integration

### 场景驱动模式（推荐）

复制 `scripts/mp-debug-scenarios.example.json` 为 `mp-debug-scenarios.json`，编辑后：

```bash
node scripts/mp-ci-debug.js                          # 自动定位构建产物
node scripts/mp-ci-debug.js --config ./e2e/scenarios.json
node scripts/mp-ci-debug.js --project /abs/path      # 显式覆盖
```

**场景配置文件 `projectPath` 字段是可选的** — 不填时由 `mp-paths.js` 自动探测。

CI 脚本会：

1. 启动 helper daemon
2. `connect` 到 DevTools
3. 顺序执行每个场景的每个 step
4. 收集 console errors 作为最后兜底检查
5. 输出 JSON 报告，失败时 exit 1

支持的 step 操作：`relaunch` / `navigate_to` / `switch_tab` / `wait_for` / `query_selector` / `click` /
`input_text` / `assert_text` / `assert_attribute` / `assert_state` / `screenshot` /
`list_network_requests` / `list_console_messages` / `evaluate_script` / `get_value`。

step 中可用 `save_as` 把上一步的 uid 缓存下来，后续用 `$name` 引用：

```json
{
  "op": "query_selector", "args": { "selector": ".btn" }, "save_as": "btn"
},
{ "op": "click", "args": { "uid": "$btn" } }
```

### GitHub Actions

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
        with: { node-version: 18 }

      - run: npm ci
      - run: npm i -D miniprogram-automator

      - name: Verify AppID
        run: node scripts/mp-verify-appid.js

      - name: Build MP
        run: npm run build:mp-weixin

      - name: Install WeChat DevTools (macOS)
        run: brew install --cask wechat-webdevtools

      - name: Run automated scenarios
        run: node scripts/mp-ci-debug.js --config ./mp-debug-scenarios.json
        env:
          WECHAT_DEVTOOLS_CLI: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: mp-debug-screenshots
          path: ./mp-debug-screenshots/*.png
```

> **macOS runner**：WeChat DevTools 官方支持 macOS / Windows。`ubuntu-latest` **不支持**。

### 本地快捷脚本

```jsonc
// package.json
{
  "scripts": {
    "build:mp":       "npm run build:mp-weixin",
    "verify:mp":      "node scripts/mp-verify-appid.js && node scripts/mp-verify-build.js",
    "launch:mp":      "node scripts/mp-launch.js",
    "debug:mp":       "node scripts/mp-debug-helper.js start",
    "debug:mp:stop":  "node scripts/mp-debug-helper.js stop",
    "ci:mp":          "node scripts/mp-ci-debug.js"
  }
}
```

## Common mistakes

1. **服务端口未开启** — `connect` 失败时，先检查微信开发者工具 → 设置 → 安全 → 服务端口是否开启，**重启 DevTools**。
2. **DevTools 版本过低** — 旧版 DevTools 可能不支持自动化接口。请更新到最新稳定版。
3. **appid 不匹配** — `manifest.json` 与 `project.config.json` 不一致。运行 `node scripts/mp-verify-appid.js` 检查。
4. **未重启 DevTools 就用新构建** — 构建后需 `node scripts/mp-launch.js` 重新打开项目（或手动切换）才能加载新代码。
5. **端口 9876 被占用** — 用 `MP_DEBUG_PORT=9877 node scripts/mp-debug-helper.js start` 改端口。
6. **macOS 权限** — 首次运行 DevTools CLI 需在"系统偏好设置 → 安全性与隐私 → 辅助功能"中授权终端。
7. **uid 跨 daemon 失效** — 每个 `start` 是新的 daemon 进程，旧的 uid 缓存作废；query_selector 重新拿。
8. **console/network 缓冲累积** — 长时间运行的 daemon 缓冲可能很大；`stop_network_monitoring` / `clear_network_requests` 必要时清理。
9. **CI 中 DevTools 启动失败** — macOS runner 需 `brew install --cask wechat-webdevtools`，且需要 GUI 会话支持；Linux runner 不支持。
10. **`miniprogram-automator` 未安装** — helper 启动时会自动加载；若缺失，`connect` 报 `automator_not_loaded`。`npm i -D miniprogram-automator`。
11. **路径自动检测找不到** — `node scripts/mp-paths.js` 查看实际搜索路径；非标准布局用 `--project` 或 `MP_PROJECT_PATH` 显式覆盖。
12. **CWD 不在 uni-app 项目根** — 检测器会向上找 `manifest.json`，但若 CWD 离项目根太远（如 `/tmp`）会回退到 CWD 本身。`cd` 到项目根再跑脚本。
13. **DevTools CLI 路径未自动检测到** — `node scripts/mp-devtools-cli.js --probe` 列出所有检测源；非默认位置用 `--cli <path>` 显式指定或设置 `WECHAT_DEVTOOLS_CLI` 环境变量。详见 [DevTools CLI 路径自动检测](#devtools-cli-路径自动检测) 一节。
14. **Windows 上 `automator.launch()` 跑不动 `.bat`** — `miniprogram-automator/out/Launcher.js` 用 `child_process.spawn` 直接调 `cli.bat`，在 Windows 报 `Failed to launch wechat web devTools, please make sure cliPath is correctly specified`。workaround：手动按顺序跑两条 CLI，再用 `automator.connect({ wsEndpoint })` 走 HTTP 路径，**不要直接用 `automator.launch()`**：

    ```bash
    # 1. 起 IDE + HTTP 服务
    cli.bat open --project <path> --port 9420
    # 2. 开调试 websocket（关键 — 见 #15）
    cli.bat auto --project <path> --auto-port 9420 --trust-project
    ```

    `mp-launch.js` 已经处理好 `cmd.exe /c` 的 Windows .bat 调用，所以日常启动用 `mp-launch.js` 即可；只有当 `automator.launch()` 路径本身出问题（罕见）才需要上面这套手动命令。
15. **`cli.bat open` 不够，必须再跑 `cli.bat auto`** — `open` 只起 IDE 的 HTTP 服务，调试 websocket 不会打开。automator 连上后 `currentPage` / `reLaunch` / `pageStack` 全部 hang。**必须**再跑 `cli.bat auto --project <path> --auto-port 9420 --trust-project` 才能激活 webview debugger。`mp-launch.js` 默认的 `open` 子命令只完成了第一步；要直接走 automator 路径，推荐手动两步（见 #14）。
16. **无 GUI session 的环境跑不动真实 MP 自动化** — DevTools 需要 active Windows desktop session 才能起模拟器 webview。Windows Server / RDP / WSL 等无 console session 环境下，DevTools 进程能跑、HTTP 端口能 listen、websocket 能连，但 webview 不渲染，所有 `currentPage` / `reLaunch` / `pageStack` 操作都会 hang。判定方法：`tasklist /v | findstr wechat` 看进程窗口标题，没有项目窗口标题就是没起来。**这种环境下只能跑**：MP build (`npm run build:mp-weixin`)、`mp-verify-build.js` 构建产物完整性、`mp-verify-appid.js` appid 校验、Vitest/Playwright 等其他层测试。**必须在用户的本地 GUI 机器跑**：31 ops（截图/UI 断言/网络/console）、`mp-ci-debug.js` 场景、真实点击/输入测试。

## Resources

- miniprogram-automator docs: https://developers.weixin.qq.com/miniprogram/dev/devtools/automator.html
- WeChat DevTools CLI docs: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
- WeChat MP admin: https://mp.weixin.qq.com/
- miniprogram-ci: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
- uni-app MP build config: https://uniapp.dcloud.net.cn/tutorial/build.html
- Reference MCP server this skill mirrors: https://github.com/wooter-s/weixin-devtools-mcp

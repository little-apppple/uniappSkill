---
name: uniapp-mp-automation
description: "WeChat Mini Program automated build + debug workflow with version-based auto-selection between official Skills (wechatide CLI) and automator (miniprogram-automator). Covers npm build, appid verify, DevTools launch, 31 automation ops via helper daemon, and enriched E2E methodology requiring console/view/style checks at every step. No MCP server required. Use when the user wants to automate the build→launch→debug cycle, write E2E scripts for mini-programs, or integrate DevTools automation into CI. Do NOT use for manual DevTools debugging (use uniapp-debugging-and-publishing) or Vitest/Playwright unit testing (use uniapp-testing)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

After loading this skill, the agent should be able to:

1. **Build and verify** — run `npm run build:mp-weixin`, confirm appid injection, validate built output
2. **Detect DevTools version and auto-select method** — run `mp-devtools-cli.js --detect-version` to detect the installed DevTools version, then automatically choose between **official Skills** (`wechatide` CLI, preferred for Nightly Electron Build >= 2.02.2607032) and **automator** (`miniprogram-automator`, fallback for older DevTools)
3. **Launch WeChat DevTools** — open the built project in DevTools via CLI or the bundled `mp-launch.js`
4. **Run 31 automation operations** via a local helper daemon (`mp-debug-helper.js`) — the AI sends operations via
   `node mp-debug-helper.js <op> key=value` (or raw `curl` against `http://127.0.0.1:9876/cmd`); state (connection,
   page reference, console/network buffers) persists across calls
5. **Assert and verify with E2E methodology** — at every step, check console errors, view-layer errors, and unexpected rendering styles; confirm each finding before proceeding
6. **CI/CD integration** — `mp-ci-debug.js` runs a scenario config in pure Node.js (no AI agent required); works
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
| **微信开发者工具（Nightly Electron Build >= 2.02.2607032）** | 已安装，并开启 **服务端口**（设置 → 安全 → 服务端口）。官方 Skills 需要此版本以上 |
| **`mp-weixin.appid` 已配置** | 在 `manifest.json` 中设置，或使用测试号 |
| **项目已初始化** | `npm install` 完成 |
| **官方 Skills 路径（优先）** | Nightly Electron Build >= 2.02.2607032 时自动检测 `wechatide` CLI；可通过 `mp-devtools-cli.js --detect-version` 确认版本 |
| **`miniprogram-automator`（备选）** | `npm i -D miniprogram-automator`（helper 通过它连接 DevTools）。DevTools 版本低于 2.02.2607032 或无 `wechatide` 时自动选择此路径 |
| **任何能跑 Bash + curl 的环境** | 不需要 MCP 客户端 |
| **（Windows）有 GUI session** | 31 ops（截图/UI 断言/网络/console）、`mp-ci-debug.js` 场景、真实点击/输入测试都需要 active Windows desktop session（有登录用户 + 窗口管理器）；无 GUI 环境下只能跑 build/verify 类步骤 |

> **自动选择逻辑**：工具会自动检测 DevTools 版本——如果 >= 2.02.2607032 且 `wechatide` 命令可用，优先使用官方 Skills；否则回退到 `miniprogram-automator`。两种路径的操作接口保持一致（参见[Version-based method auto-selection](#version-based-method-auto-selection)）。
>
> 服务端口是连接的关键：微信开发者工具 → 设置 → 安全设置 → **开启服务端口**。开启后需重启 DevTools。
>
> **`miniprogram-automator` 路径**：helper 自身不带 `node_modules`。如果从 skill 目录直接跑，要在用户的 uni-app 项目里装 `miniprogram-automator` 并用 `NODE_PATH=<项目根>/node_modules` 指过去，否则 `connect` 报 `miniprogram_automator_not_installed`。当选择官方 Skills 路径时无需安装此包。
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

## Version-based method auto-selection

本 skill **不再默认使用 `miniprogram-automator`**。每次调试会话开始时，自动检测微信开发者工具版本，根据版本和能力选择合适的调试方式。

### 检测命令

```bash
# 检测 DevTools 版本（不提示，不抛错）
node scripts/mp-devtools-cli.js --detect-version

# 推荐调试方式（综合版本 + 已安装的工具）
node scripts/mp-devtools-cli.js --recommend
# → {
#     "approach": "official_skills",     # official_skills | automator | none
#     "reason": "DevTools 2.02.2607032 supports official Skills...",
#     "versionInfo": { "version": "2.02.2607032", ... },
#     "wechatideAvailable": true,
#     "automatorAvailable": false
#   }
```

### 自动选择决策树

```
┌─────────────────────────────────────────┐
│  Detecting: --detect-version            │
└──────────────────┬──────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   DevTools 版本        无法检测版本
   >= 2.02.2607032?        或版本过低?
          │                 │
      ┌───┴───┐         ┌──┴──┐
      ▼       ▼         ▼     ▼
   wechatide  no       auto-   npm i -D
   可用?     wechatide  mator  miniprogram-
      │         │     可用?   automator
  ┌───┴───┐     │         │
  ▼       ▼     ▼     ┌───┴───┐
官方     automator   automator 请安装
Skills   (已安装)    (已安装)  备选工具
(首选)    可用?       可用?
             │
         ┌───┴───┐
         ▼       ▼
       automator  缺少依赖
       调试可用   请安装
```

### 两种方式对比

| 维度 | 官方 Skills (`wechatide` CLI) | Automator (`miniprogram-automator`) |
|------|------------------------------|-------------------------------------|
| **适用版本** | Nightly Electron Build >= 2.02.2607032 | 所有版本（含旧版） |
| **安装依赖** | DevTools 自带 `wechatide`，无需额外安装 | `npm i -D miniprogram-automator` |
| **连接方式** | `wechatide -c <agent> -t <tool>` 直接调用 | daemon 通过 automator API 连接 DevTools |
| **操作覆盖** | 42+ 操作（含云开发、项目管理、编译等） | 31 操作（UI 交互、断言、console/network） |
| **预览/发布** | 原生支持（`auto_preview`、`miniprogram_upload`） | 不支持 |
| **模拟器刷新** | 原生支持（`simulator_refresh`） | 不支持（需重启 DevTools） |
| **UI 交互断言** | 部分支持 | 完整支持（点击、输入、断言、截图） |
| **console/network** | 部分支持 | 完整支持（列表、过滤、详情） |
| **CI 支持** | 需要 `wechatide` 全局安装 | 纯 Node.js，无额外依赖 |
| **自动化粒度** | 工具级（ops 由 DevTools 执行） | 元素级（精细控制单个组件） |

### 推荐策略

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| Nightly Electron Build >= 2.02.2607032 + `wechatide` 可用 | **官方 Skills** | 功能最完整，无需额外依赖 |
| Nightly Electron Build >= 2.02.2607032 + 无 `wechatide` + automator 已装 | **Automator** | 自动回退，不影响开发 |
| 版本 < 2.02.2607032 + automator 已装 | **Automator** | 官方 Skills 不可用 |
| 首次运行，工具未安装 | 按提示安装 automator | `npm i -D miniprogram-automator` |
| CI 环境 | **根据环境决定** | 有 GUI 用 automator，无 GUI 只做 build/verify |

> 两种方式的切换对用户透明：所有 E2E 步骤的操作接口保持一致（console 检查、view 层检查、样式检查、截图验证），底层自动路由到对应的实现。

## Workflow overview

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  ① 校验 AppID │ ──→ │  ② npm run build: │ ──→ │  ③ 版本检测+方法选择 │ ──→ │  ④ 启动 DevTools      │
│  verify-    │     │  mp-weixin       │     │  --detect-version │     │  mp-launch.js        │
│  appid.js   │     │  verify-build.js │     │  --recommend      │     │  或用 wechatide 启动  │
└─────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────────┘
                                                                                  │
                                                                          ┌───────┴───────┐
                                                                          ▼               ▼
                                                                   ┌────────────┐  ┌──────────────┐
                                                                   │ 官方 Skills  │  │ Helper Daemon│
                                                                   │ wechatide   │  │  automator   │
                                                                   │ 直接调用 ops  │  │  :9876        │
                                                                   └──────┬──────┘  └──────┬─────────┘
                                                                          │               │
                                                                          └───────┬───────┘
                                                                                  │
                                                                                  ▼
                                                                   ┌─────────────────────────────┐
                                                                   │  ⑤ 执行 ops + E2E 检查      │
                                                                   │  每步：console 检查         │
                                                                   │        view 层错误检查      │
                                                                   │        样式异常检查         │
                                                                   │        确认修复             │
                                                                   └──────────┬──────────────────┘
                                                                                  │
                                                                                  ▼
                                                                           screenshots / report
```

整个流程可一键执行（CI 模式），也可拆解为 AI 在对话中逐步调用。**区别在于第③步之后的选择**：自动检测版本后选择官方 Skills 路径或 automator 路径，后续的 E2E 检查流程完全一致。

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

## Step 4: Version detection and method selection

在启动 helper 之前，先检测 DevTools 版本，自动选择合适的调试方式：

```bash
# 检测版本并获取推荐方式
node scripts/mp-devtools-cli.js --recommend
```

输出示例（官方 Skills 可用）：

```json
{
  "ok": true,
  "approach": "official_skills",
  "reason": "DevTools 2.02.2607032 supports official Skills (>= 2.02.2607032) and wechatide CLI is globally available",
  "versionInfo": {
    "version": "2.02.2607032",
    "major": 2, "minor": 2, "build": 2607032,
    "officialSkillsSupported": true,
    "cliPath": "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat"
  },
  "wechatideAvailable": true,
  "automatorAvailable": false
}
```

输出示例（automator 回退）：

```json
{
  "ok": true,
  "approach": "automator",
  "reason": "DevTools 1.05.2204110 predates official Skills (need Nightly Electron Build >= 2.02.2607032); using automator via miniprogram-automator",
  "versionInfo": { "version": "1.05.2204110", "officialSkillsSupported": false, ... },
  "automatorAvailable": true
}
```

根据 `approach` 字段走不同路径：

**路径 A：官方 Skills**（`approach: "official_skills"`）

```bash
# 直接使用 wechatide CLI 执行操作
wechatide -c CodeBuddy -t connect --project ./dist/build/mp-weixin
wechatide -c CodeBuddy -t query_selector --selector ".page-content"
wechatide -c CodeBuddy -t screenshot --path /tmp/page.png
```

**路径 B：Automator Helper**（`approach: "automator"`）

```bash
# 启动 helper daemon
node scripts/mp-debug-helper.js start
node scripts/mp-debug-helper.js connect
```

> 如果 `approach` 为 `none`，按提示安装缺少的依赖：`npm i -D miniprogram-automator` 或更新 DevTools 到最新版。
>
> 对于 CI 环境或无 GUI session 的场景，即使检测到 automator，也只执行 build/verify 类步骤，不执行 UI 自动化操作。

## Step 5: Start the helper daemon（automator 路径）

如果选择了 automator 路径（approach: `"automator"`），启动 helper daemon：

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

---

## E2E Debugging Methodology（必读）

每次 E2E 调试步骤都必须执行一套**系统性检查**，确保页面质量。这是本 skill 的核心方法论，**不是可选步骤**。

### 4-Check 原则

每个自动化操作（页面跳转、点击、输入、等待等）执行后，必须进行以下四项检查，确认无误后再继续下一步：

```
┌─────────────────────────────────────────────┐
│             自动化操作执行完毕                  │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴────────┐          ┌─────────────────────────┐
          ▼                 ▼          │  ✅ 通过 → 继续下一步    │
   ┌────────────┐    ┌────────────┐    │  ❌ 失败 → 分析并修复    │
   │  Check 1   │    │  Check 2   │    └─────────────────────────┘
   │ Console    │    │ View 层    │
   │ 错误检查    │    │ 错误检查    │
   └──────┬─────┘    └──────┬─────┘
          │                 │
          └────────┬────────┘
                   ▼
          ┌────────────────┐
          │   Check 3      │
          │   Rendering    │
          │   Style 检查   │
          └───────┬────────┘
                  │
                  ▼
          ┌────────────────┐
          │   Check 4      │
          │   Confirm      │
          │   & Fix        │
          └────────────────┘
```

### Check 1：Console 错误检查

**目标**：确保页面没有 JavaScript 运行时错误、API 调用失败、资源加载异常。

```bash
# 检查所有 console error
node scripts/mp-debug-helper.js list_console_messages type=error
# → {"ok":true,"data":{"count":0,"messages":[]}}   ← ✅ 无错误

# 如果有错误，获取详细信息
node scripts/mp-debug-helper.js list_console_messages type=error
# → {"ok":true,"data":{"count":2,"messages":[
#     {"id":1,"type":"error","args":["Cannot read property 'xxx' of undefined"]},
#     {"id":2,"type":"error","args":["request:fail url not in domain list"]}
#   ]}}
```

**处理方式**：
| 错误类型 | 常见原因 | 处理方式 |
|---------|---------|---------|
| `TypeError: Cannot read property` | 数据未加载就渲染 | 检查数据源、添加 `v-if` 守卫 |
| `request:fail` | 域名未配置白名单 | 在 `manifest.json` 中配置 `mp-weixin.setting.urlCheck: false`（开发期） |
| `url not in domain list` | 请求域名未在后台配置 | 登录小程序后台配置合法域名，或开发期关闭 urlCheck |
| `渲染层错误` | WXML 模板问题 | 检查条件渲染逻辑 |
| `analyze:fail` | 分包路径错误 | 检查 `subPackages` 配置 |
| `Component is not found` | 组件路径错误 | 检查组件的 `usingComponents` 路径 |

**关键**：console 有 error 就必须**分析根因并修复**，不能跳过继续执行后续步骤。

### Check 2：View 层错误检查

**目标**：检查小程序渲染层（View Layer）是否有 WXML/WXSS 层面的报错。微信小程序的渲染层和逻辑层是分离的，有些错误不会出现在 console 中，而是在渲染层报错。

```bash
# 使用 evaluate_script 检查渲染状态
node scripts/mp-debug-helper.js evaluate_script script="(() => ({
  systemInfo: wx.getSystemInfoSync(),
  isConnected: !!getApp(),
  pageStack: getCurrentPages().length
}))()"
# → 检查返回值是否正常

# 断言系统状态 —— 综合判断
node scripts/mp-debug-helper.js assert_state condition=no_console_errors
# → {"ok":true,"data":{"passed":true,"condition":"no_console_errors","consoleErrors":0}}
```

**需要关注的 View 层异常信号**：
- 页面空白或部分空白（检查是否有 WXML 渲染异常）
- 滚动卡顿（检查是否有无限 `setData` 或复杂 WXML 结构）
- 组件未显示（检查 `usingComponents` 是否正确注册）
- `setData` 数据过大（单次 setData 超过 1MB 会使渲染层卡死）

```bash
# 检查页面元素树（诊断渲染问题）
node scripts/mp-debug-helper.js debug_page_elements selector="page"
# → 查看页面 root 元素下是否有异常结构（空节点、多余嵌套等）
```

### Check 3：Rendering Style 检查

**目标**：检查页面是否有样式异常（非预期呈现风格）。样式问题不会抛 error，但影响用户体验。

**检查手段**：

```bash
# 1. 截图确认视觉呈现
node scripts/mp-debug-helper.js screenshot path=/tmp/page-state.png

# 2. 关键 UI 元素断言（文本、可见性）
node scripts/mp-debug-helper.js query_selector selector=".page-title"
node scripts/mp-debug-helper.js assert_text uid=el-1 textContains="预期标题"
node scripts/mp-debug-helper.js assert_state uid=el-1 condition=visible

# 3. 查询元素属性确认样式
node scripts/mp-debug-helper.js query_selector selector=".nav-bar"
# → 检查 attributes.style 是否存在异常
```

**需要关注的 Style 异常**：
| 异常表现 | 可能原因 |
|---------|---------|
| 文字重叠/溢出 | `flex` 布局未正确适配，或 `text-overflow` 缺失 |
| 元素错位/偏移 | rpx 计算问题，或使用了固定 px |
| 颜色不一致 | 自定义主题色未正确应用，或使用了硬编码颜色 |
| 字体大小异常 | 全局 font-size 被意外覆盖 |
| 图片显示异常 | `mode` 属性设置不当，或图片 CDN 问题 |
| 安全区域不适配 | 未适配 iPhone X 以上机型的安全区域（`safe-area-inset-*`） |
| 深色模式异常 | 未适配 dark mode 或使用了不透明明亮背景色 |

**截图验证清单**：
- 页面是否完整呈现（顶部导航、底部 tabBar、主要内容区）
- 各区块间距是否正常（padding/margin）
- 字体、颜色是否符合设计稿
- 图片是否正常加载并正确裁剪
- 交互元素（按钮、输入框）是否可识别

### Check 4：Confirm & Fix

**目标**：确认上述检查通过，或修复后重新验证。

```bash
# 确认所有检查通过
node scripts/mp-debug-helper.js diagnose_connection
# → 检查 issues 数组是否为空

# 重新截图做最终验证
node scripts/mp-debug-helper.js screenshot path=/tmp/final-verify.png
```

**修复循环**：

```
发现错误 → 分析根因 → 修复代码 → 重新构建(build:mp-weixin)
→ 重启 DevTools(mp-launch.js) → 重新执行步骤 → 重新检查(console/view/style)
→ 确认通过 → 继续下一步
```

**修复后必须重新验证的步骤**：
1. `npm run build:mp-weixin` 重新构建
2. `node scripts/mp-launch.js` 重新打开 DevTools
3. 重新执行操作的导航/交互
4. 重新执行 4-Check（console / view / style / confirm）
5. 确认无问题后再继续

---

## Step 6: Send operations with E2E methodology

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

### 典型完整流程（含 E2E 方法论检查）

```bash
# 1. 连接（自动探测构建产物路径）
node scripts/mp-debug-helper.js connect

# 2. 确认当前页面
node scripts/mp-debug-helper.js current_page
# → {"ok":true,"data":{"path":"pages/index/index","query":{},"uid":"el-1"}}

# ===== Check 1: Console 错误检查 =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → {"ok":true,"data":{"count":0,"messages":[]}}    ← ✅ 无错误

# ===== Check 3: 截图确认样式 =====
node scripts/mp-debug-helper.js screenshot path=/tmp/homepage.png
# → 人工确认样式无误

# 3. 查询页面标题元素（拿到 uid）
node scripts/mp-debug-helper.js query_selector selector=".nav-bar-title"
# → {"ok":true,"data":{"uid":"el-2","tagName":"view","text":"首页","attributes":{"class":"nav-bar-title"}}}

# 4. 断言 UI 文本
node scripts/mp-debug-helper.js assert_text uid=el-2 textContains="首页"
# → {"ok":true,"data":{"passed":true}}               ← ✅ 文本正确

# 5. 导航到详情页
node scripts/mp-debug-helper.js navigate_to url="/pages/detail/detail?id=1"
# ===== Check 1: 导航后检查 Console =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → {"ok":true,"data":{"count":0,"messages":[]}}    ← ✅ 导航无错误

# ===== Check 2: 检查页面元素正常渲染 =====
node scripts/mp-debug-helper.js wait_for selector=".detail-content" timeout=5000
# → {"ok":true,"data":{"found":true,"uid":"el-3"}}  ← ✅ 内容正常加载

# ===== Check 3: 截图确认详情页样式 =====
node scripts/mp-debug-helper.js screenshot path=/tmp/detail-page.png

# ===== Check 4: 确认所有检查通过 =====
node scripts/mp-debug-helper.js assert_state condition=no_console_errors
# → {"ok":true,"data":{"passed":true,"consoleErrors":0}}

# 6. 用完停止
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

## Common debugging scenarios（含 E2E 方法论）

以下每个场景都按照 **4-Check 原则** 编写：操作执行后立即检查 console、view 层、样式，确认通过后再继续。

### 场景 1：验证构建页面正常渲染

```bash
node scripts/mp-debug-helper.js connect

# Navigate 到首页
node scripts/mp-debug-helper.js relaunch url="/pages/index/index"
node scripts/mp-debug-helper.js wait_for     selector=".page-content" timeout=5000

# ===== Check 1: Console 错误检查 =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → count=0 ✅ 无错误

# ===== Check 2: View 层检查 =====
node scripts/mp-debug-helper.js debug_page_elements selector="page"
# → 确认 root 元素有正常子节点，无异常空结构

# ===== Check 3: 样式检查 =====
node scripts/mp-debug-helper.js query_selector selector=".nav-bar-title"
node scripts/mp-debug-helper.js assert_text  uid=el-2 textContains="首页"
node scripts/mp-debug-helper.js assert_state uid=el-2 condition=visible
# → 标题可见 ✅
node scripts/mp-debug-helper.js screenshot   path="$PWD/screenshots/home.png"
# → 人工确认布局、颜色、间距正常

# ===== Check 4: 最终确认 =====
node scripts/mp-debug-helper.js assert_state condition=no_console_errors
```

### 场景 2：检查 API 请求是否正确发出

```bash
node scripts/mp-debug-helper.js navigate_to url="/pages/detail/detail?id=123"

# ===== Check 1: 导航后立即检查 Console =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → count=0 ✅ 无错误（若有 request:fail 错误，需先修复域名配置）

# ===== Check 2: 等待内容加载 =====
node scripts/mp-debug-helper.js wait_for    selector=".detail-content" timeout=5000

# ===== Check 3: 检查网络请求 =====
node scripts/mp-debug-helper.js list_network_requests urlPattern="/api/product/detail" successOnly=true
# → 返回所有匹配的请求列表，确保 status=200
node scripts/mp-debug-helper.js get_network_request reqid=1
# → 返回单条请求的 header/body/response — 确认响应数据格式正确

# ===== Check 3: 样式检查 =====
node scripts/mp-debug-helper.js query_selector selector=".detail-title"
node scripts/mp-debug-helper.js assert_text uid=el-1 textContains="商品详情"
node scripts/mp-debug-helper.js screenshot path="$PWD/screenshots/detail.png"
# → 确认内容区域完整呈现，图片正常加载

# ===== Check 4: 最终确认 =====
node scripts/mp-debug-helper.js diagnose_connection
# → issues 为空
```

### 场景 3：确认分包加载

```bash
node scripts/mp-debug-helper.js navigate_to url="/pagesA/list/list"

# ===== Check 1: Console 错误检查 =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → count=0 ✅ 空数组表示分包加载成功

# ===== Check 2: View 层检查 =====
node scripts/mp-debug-helper.js wait_for selector=".list-content" timeout=8000
# → 分包页面正常加载

# ===== Check 3: 样式检查 =====
node scripts/mp-debug-helper.js query_selector selector=".list-item"
node scripts/mp-debug-helper.js assert_state uid=el-1 condition=visible
node scripts/mp-debug-helper.js screenshot path="$PWD/screenshots/subpackage.png"
# → 确认分包页面样式与主包一致

# ===== Check 4: Assert + 确认 =====
node scripts/mp-debug-helper.js assert_state condition=no_console_errors
```

### 场景 4：表单提交验证

```bash
# 填写表单
node scripts/mp-debug-helper.js query_selector selector="input#name"
node scripts/mp-debug-helper.js input_text    uid=el-1 text="张三"

# ===== Check 1: 输入后查 console =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → count=0 ✅

node scripts/mp-debug-helper.js query_selector selector="input#phone"
node scripts/mp-debug-helper.js input_text    uid=el-2 text="13800138000"

# 提交
node scripts/mp-debug-helper.js query_selector selector="button.submit"
node scripts/mp-debug-helper.js click         uid=el-3

# ===== Check 1: 提交后查 console =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → count=0 ✅ 无接口报错

# ===== Check 2: View 层检查 =====
node scripts/mp-debug-helper.js wait_for      selector=".success-toast" timeout=3000
node scripts/mp-debug-helper.js query_selector selector=".success-toast"
node scripts/mp-debug-helper.js assert_text   uid=el-4 textContains="提交成功"
# → 提交成功 ✅

# ===== Check 3: 样式检查 =====
node scripts/mp-debug-helper.js screenshot path="$PWD/screenshots/form-submit.png"
# → 确认成功提示的样式、位置正常，无布局错乱

# ===== Check 4: 最终确认 =====
node scripts/mp-debug-helper.js assert_state condition=no_console_errors
```

### 场景 5：执行任意 JS（评估）

```bash
node scripts/mp-debug-helper.js evaluate_script script="(() => ({ system: wx.getSystemInfoSync() }))()"

# ===== Check 1: 评估后查 console =====
node scripts/mp-debug-helper.js list_console_messages type=error
# → count=0 ✅ 评估无异常

# ===== Check 3: 确认系统信息完整性 =====
# 检查 evaluate_script 返回结果是否包含预期字段
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

## 能力扩展：接入微信官方 Skills

微信开发者工具官方 `miniprogram-dev-skill` 提供了本 helper daemon 未覆盖的额外能力。如果已安装官方 Skills（`wechatide` 命令可用），可以在自动化流程中直接调用以下操作来扩展调试工作流。

### 预览与发布（调试后的自然延伸）

自动化调试完成后，下一步通常是预览或发布：

| 目标 | 官方 CLI 命令 | 说明 |
|------|-------------|------|
| 推送手机预览 | `wechatide -c <agent> -t auto_preview --project <dist>` | 直接推送到开发者微信，无需二维码 |
| 生成预览二维码 | `wechatide -c <agent> -t create_preview_qrcode --project <dist> --qr-format window` | 在 DevTools 弹窗展示二维码 |
| 上传体验版 | `wechatide -c <agent> -t miniprogram_upload --project <dist> --upload-version 1.0.0 --desc "备注"` | 上传代码包到后台 |

**典型自动化扩展流程**（构建 → 调试 → 预览）：

```bash
# Step 1-3：现有流程（构建 + 调试）
npm run build:mp-weixin
node scripts/mp-debug-helper.js connect
node scripts/mp-debug-helper.js wait_for selector=".page-content" timeout=5000
node scripts/mp-debug-helper.js screenshot path="$PWD/screenshots/verify.png"

# Step 4：推送手机预览（需官方 Skills）
wechatide -c CodeBuddy -t auto_preview --project ./unpackage/dist/build/mp-weixin

# 或生成二维码
wechatide -c CodeBuddy -t create_preview_qrcode \
  --project ./unpackage/dist/build/mp-weixin --qr-format window

# Step 5：上传体验版（需官方 Skills + 用户确认弹窗）
wechatide -c CodeBuddy -t miniprogram_upload \
  --project ./unpackage/dist/build/mp-weixin \
  --upload-version 1.0.0 --desc "CI 构建 #123"
```

> **注意**：`miniprogram_upload` 会触发 DevTools 确认弹窗，需用户在工具中手动确认。

### 模拟器控制

| 目标 | 官方 CLI 命令 | 说明 |
|------|-------------|------|
| 刷新模拟器 | `wechatide -c <agent> -t simulator_refresh --project <dist>` | 强制重编译刷新当前页面 |
| 编译并打开页面 | `wechatide -c <agent> -t simulator_open_page --project <dist> --page pages/index/index` | 直接跳转到指定页面 |

可在调试脚本中插入 `simulator_refresh` 来验证重编译后的页面状态：

```bash
node scripts/mp-debug-helper.js connect
# 强制刷新模拟器
wechatide -c CodeBuddy -t simulator_refresh --project ./unpackage/dist/build/mp-weixin
# 等待新内容渲染
node scripts/mp-debug-helper.js wait_for selector=".updated-content" timeout=5000
node scripts/mp-debug-helper.js screenshot path="$PWD/screenshots/after-refresh.png"
```

### 运行时诊断

| 目标 | 官方 CLI 命令 | 说明 |
|------|-------------|------|
| 检查 DevTools 状态 | `wechatide -c <agent> -t check_devtools_status [--skill-version <ver>]` | 确认登录态、openid、skill 版本 |
| 清理项目缓存 | `wechatide -c <agent> -t debug_clear_cache --project <dist> --action cleanAll` | 清理编译缓存后重新调试 |
| 读取项目设置 | `wechatide -c <agent> -t project_setting_get --project <dist>` | 查看当前编译设置 |
| 更新项目设置 | `wechatide -c <agent> -t project_setting_update --project <dist> --settings-file ./s.json` | 修改编译设置后重新编译 |

### 何时使用官方 Skills vs 本 helper

| 场景 | 推荐方案 |
|------|---------|
| UI 交互（点击、输入、滚动） | 本 helper（31 ops 已覆盖） |
| 页面断言、截图 | 本 helper（assert_* / screenshot） |
| Console/Network 检查 | 本 helper（list_console_messages / list_network_requests） |
| 构建 + appid 校验 | 本 helper（mp-verify-*.js） |
| **推送手机预览** | **官方 Skills**（本 helper 未覆盖） |
| **上传体验版** | **官方 Skills**（本 helper 未覆盖） |
| **刷新模拟器** | **官方 Skills**（本 helper 未覆盖） |
| **清理编译缓存** | **官方 Skills**（本 helper 未覆盖） |
| **云开发操作** | 官方 Skills 或 `uniapp-cloud` skill |
| **项目列表管理** | 官方 Skills（`project_list` / `project_import` / `project_remove`） |

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
2. **DevTools 版本过低** — 旧版 DevTools 可能不支持自动化接口。运行 `node scripts/mp-devtools-cli.js --detect-version` 确认版本，若低于 2.02.2607032 则更新到 Nightly Electron Build 以获得官方 Skills 支持。
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
17. **`wechatide` 命令不可用** — 即使 DevTools >= 2.02.2607032，`wechatide` CLI 也可能未注册到 PATH。运行 `node scripts/mp-devtools-cli.js --recommend` 检查状态，如 `wechatideAvailable` 为 false 则走 automator 回退。
18. **忘记先做版本检测就直接启动 helper** — 新版流程要求 **先做版本检测**（`--detect-version` 或 `--recommend`）再选择调试方法。跳过此步可能导致选择了不适配的方法。
19. **console 出现 error 但未分析直接跳过** — 违反 [4-Check 原则](#e2e-debugging-methodology必读) 的 Check 1。console error 必须分析根因并修复，不能跳过。常见情况：`request:fail` 需要配置域名白名单或设置 `urlCheck: false`。
20. **截图后未人工确认视觉样式** — 违反 Check 3 原则。截图必须打开文件确认布局、颜色、间距等视觉要素正常。
21. **修复后未重新执行完整的 4-Check** — 修复代码后只验证了修复目标，但未重新执行完整的 4-Check 循环（console/view/style），可能引入新的 console error 或样式问题。**修复 → 重建 → 重新验证 → 确认通过**。

## Resources

- miniprogram-automator docs: https://developers.weixin.qq.com/miniprogram/dev/devtools/automator.html
- WeChat DevTools CLI docs: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
- WeChat MP admin: https://mp.weixin.qq.com/
- miniprogram-ci: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
- uni-app MP build config: https://uniapp.dcloud.net.cn/tutorial/build.html
- Reference MCP server this skill mirrors: https://github.com/wooter-s/weixin-devtools-mcp

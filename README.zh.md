# Uni-App Skills — 完整技能集

一套分层完整的 **uni-app** 开发技能包，涵盖从项目脚手架到发布的全部流程，包括测试、国际化（i18n）和 uniCloud 后端。以此作为入口，按需路由到相应的子技能。

## 技能清单

| 技能 | 覆盖内容 | 何时加载 |
|---|---|---|
| [`uniapp-architect`](./uniapp-architect/SKILL.md) | 入口 — 决策路由、框架版本矩阵、工具链选择 | 新项目、跨切面决策、架构评审 |
| [`uniapp-fundamentals`](./uniapp-fundamentals/SKILL.md) | 项目结构、`pages.json` / `manifest.json`、`App.vue` / `main.js`、Vue 2 vs 3 vs uvue、生命周期、`easycom`、`uni.scss`、`uni_modules` | 项目搭建、配置问题、生命周期钩子 |
| [`uniapp-routing-and-tabbar`](./uniapp-routing-and-tabbar/SKILL.md) | 页面导航、`tabBar` 配置、自定义导航栏、页面参数、10 层栈限制、深度链接 | 页面跳转、tab 栏、自定义导航、分享卡片 |
| [`uniapp-state-and-data`](./uniapp-state-and-data/SKILL.md) | Pinia 配置、Store 模式、`uni.storage`、持久化、登录流程 | 跨页面状态、持久化、用户会话、购物车 |
| [`uniapp-network-layer`](./uniapp-network-layer/SKILL.md) | `uni.request` 封装、拦截器、401 处理、上传/下载、重试 | API 调用、文件上传、请求取消 |
| [`uniapp-ui-patterns`](./uniapp-ui-patterns/SKILL.md) | 列表页、表单、骨架屏、空/错误状态、自定义导航、弹窗 | UI 页面、列表/表单页、全局 Toast |
| [`uniapp-platform-config`](./uniapp-platform-config/SKILL.md) | 各平台 `manifest.json`、微信小程序设置、iOS 签名、Android 权限、条件编译 | 多平台配置、"H5 正常但小程序异常" 的 bug |
| [`uniapp-performance`](./uniapp-performance/SKILL.md) | 启动速度、长列表、图片优化、分包、`nvue` / `uvue` 选型 | 应用卡顿、列表不流畅、包体过大 |
| [`uniapp-debugging-and-publishing`](./uniapp-debugging-and-publishing/SKILL.md) | vConsole、微信开发者工具、常见错误、构建命令、小程序上传、App Store / Play、wgt 热更新、CI/CD | Bug 修复、发布上线、CI/CD 搭建 |
| [`uniapp-testing`](./uniapp-testing/SKILL.md) | Vitest 单元测试 + 组件测试、Playwright H5 端、miniprogram-automator 小程序端、真机 App QA、CI 矩阵 | 添加测试、mock `uni.*`、自动化小程序 UI、H5 E2E、接入 CI |
| [`uniapp-mp-automation`](./uniapp-mp-automation/SKILL.md) | 微信小程序自动化构建+调试工作流 — npm build、appid 确认、DevTools 启动、MCP 自动化调试、页面交互断言、网络监控、截图、CI 集成 | 构建后自动化调试、DevTools 自动化操作、MCP 调试脚本、CI 集成 |
| [`uniapp-i18n`](./uniapp-i18n/SKILL.md) | 内置多语言 API、vue-i18n 集成、懒加载、RTL、服务端协调 | 多语言、语言切换、本地化格式、RTL |
| [`uniapp-cloud`](./uniapp-cloud/SKILL.md) | uniCloud 云函数、云数据库（JQL）、云存储、uni-id 认证、uni-cloud-router、schema 权限、部署 | 无服务后端、认证、文件存储、客户端调用云函数 |
| [`uniapp-payments`](./uniapp-payments/SKILL.md) | 微信支付（MP/H5/App）、支付宝、Apple Pay、Google Pay、uni-pay 插件、退款 | 收款、集成支付渠道、处理退款 |
| [`uniapp-uni-push`](./uniapp-uni-push/SKILL.md) | uni-push 离线推送、微信小程序订阅消息、push token 管理、分群推送 | 发送推送通知、微信订阅消息、离线推送 |
| [`uniapp-theming`](./uniapp-theming/SKILL.md) | 亮色/暗色/自动主题切换、颜色 token、系统主题检测、UI 库集成、品牌色覆盖 | 添加暗黑模式、支持品牌色、设计 token 系统 |
| [`uniapp-migration`](./uniapp-migration/SKILL.md) | Taro → uni-app、原生微信小程序 → uni-app、Vue 2 → Vue 3、Vue 3 → uni-app x | 迁移 Taro / 原生小程序项目、Vue 2 升级到 Vue 3 |
| [`uniapp-plugin-authoring`](./uniapp-plugin-authoring/SKILL.md) | uni_modules 插件结构、package.json、easycom.json、多平台支持、UTS 原生插件、发布到 DCloud 市场 | 将可复用代码打包为插件、编写 UTS 原生插件、发布到插件市场 |
| [`uniapp-ui-libraries`](./uniapp-ui-libraries/SKILL.md) | uView Plus / FirstUI / ThorUI / Wot Design Uni / uv-ui / vk-uview-ui / Tuniao / ColorUI / GraceUI 的对比与集成 | 选择 UI 库、安装配置、自定义主题、库间迁移 |
| [`uniapp-scaffolder`](./uniapp-scaffolder/SKILL.md) | 通过 CLI 列出、筛选和拉取项目模板 | Agent/CI：从精选模板库脚手架、无头模板拉取 |

> 另有预置的 **`uniapp-project`** 技能 —— 提供所有 uni-app 内置组件、uni-ui 组件和 API 的参考目录。用于单组件/单 API 的查询。以上技能属于**工作流/模式**层。
>
> **依赖说明：`uniapp-project` 是独立技能，不属于本集合的一部分——需要单独安装。** 它位于本集合同级的 `%USERPROFILE%\.claude\skills\uniapp-project\`（Windows）或 `~/.claude/skills/uniapp-project/`（macOS/Linux）。如果你尚未安装，请参阅下方的 [安装 `uniapp-project`（必需依赖）](#安装-uniappproject必需依赖)；或退回到[官方 uni-app 文档](https://uniapp.dcloud.net.cn/)作为组件/API 参考的备选。

## 安装方式

> **路径约定（本文档中）：**
> - Windows: `%USERPROFILE%\.claude\skills\`（例如 `C:\Users\Administrator\.claude\skills\`）
> - macOS / Linux: `$HOME/.claude/skills/`
>
> 请用你机器上对应的路径替换示例 —— `Administrator` 只是某台开发机的用户名，请根据你的操作系统和用户名调整。

### 方式 A：复制到 Claude skills 目录

每个技能是一个独立的文件夹，根目录下有 `SKILL.md`。将文件夹复制到以下任一位置：

- **全局技能**（所有项目可用）：`%USERPROFILE%\.claude\skills\`（Windows）或 `~/.claude/skills/`（macOS/Linux）
- **项目技能**（按项目）：`<project>/.claude/skills/`
- **Mavis 技能**：`%USERPROFILE%\.mavis\skills\`（Windows）或 `~/.mavis/skills/`（macOS/Linux）

#### Windows（cmd / PowerShell）

```bash
# 示例：将所有技能复制到全局 Claude skills 目录
for /d %s in (d:\workspace\mySkills\uniapp-skills\uniapp-*) do xcopy /E /I "%s" "%USERPROFILE%\.claude\skills\%~nxs"
# 或逐个复制技能：
xcopy /E /I uniapp-skills\uniapp-architect "%USERPROFILE%\.claude\skills\uniapp-architect"
xcopy /E /I uniapp-skills\uniapp-fundamentals "%USERPROFILE%\.claude\skills\uniapp-fundamentals"
xcopy /E /I uniapp-skills\uniapp-routing-and-tabbar "%USERPROFILE%\.claude\skills\uniapp-routing-and-tabbar"
xcopy /E /I uniapp-skills\uniapp-state-and-data "%USERPROFILE%\.claude\skills\uniapp-state-and-data"
xcopy /E /I uniapp-skills\uniapp-network-layer "%USERPROFILE%\.claude\skills\uniapp-network-layer"
xcopy /E /I uniapp-skills\uniapp-ui-patterns "%USERPROFILE%\.claude\skills\uniapp-ui-patterns"
xcopy /E /I uniapp-skills\uniapp-platform-config "%USERPROFILE%\.claude\skills\uniapp-platform-config"
xcopy /E /I uniapp-skills\uniapp-performance "%USERPROFILE%\.claude\skills\uniapp-performance"
xcopy /E /I uniapp-skills\uniapp-debugging-and-publishing "%USERPROFILE%\.claude\skills\uniapp-debugging-and-publishing"
xcopy /E /I uniapp-skills\uniapp-testing "%USERPROFILE%\.claude\skills\uniapp-testing"
xcopy /E /I uniapp-skills\uniapp-mp-automation "%USERPROFILE%\.claude\skills\uniapp-mp-automation"
```

#### macOS / Linux（bash / zsh）

```bash
# 示例：将所有技能复制到全局 Claude skills 目录
for d in /path/to/uniapp-skills/uniapp-*; do
  cp -r "$d" "$HOME/.claude/skills/$(basename "$d")"
done
# 或逐个复制技能：
cp -r uniapp-skills/uniapp-architect        "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-fundamentals     "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-routing-and-tabbar "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-state-and-data   "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-network-layer    "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-ui-patterns      "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-platform-config  "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-performance      "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-debugging-and-publishing "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-testing          "$HOME/.claude/skills/"
cp -r uniapp-skills/uniapp-mp-automation    "$HOME/.claude/skills/"
```

重启 Claude / 客户端即可生效。

### 方式 B：作为项目本地技能集使用

将整个 `uniapp-skills/` 文件夹复制到项目中的 `.claude/skills/`。当在该项目下工作时，agent 会自动加载这些技能。

```bash
# 在您的 uni-app 项目中（macOS/Linux/WSL）
mkdir -p .claude/skills
cp -r uniapp-skills/* .claude/skills/
```

```powershell
# 在您的 uni-app 项目中（Windows PowerShell）
New-Item -ItemType Directory -Force -Path .claude/skills
Copy-Item -Recurse uniapp-skills\* .claude/skills\
```

### 方式 C：接入 `mavis`

```bash
# 一次性注册所有技能
mavis skill add <skill-folder-path>
```

或直接复制到 `mavis` agent 的技能目录：`%USERPROFILE%\.mavis\agents\mavis\skills\`（Windows）或 `~/.mavis/agents/mavis/skills/`（macOS/Linux）。

## 安装 `uniapp-project`（必需依赖）

上面的 20 个技能**不依赖** `uniapp-project` 也能工作 —— 每个子技能都是自包含的。但对于"如何使用组件 X 或 API Y"的查询（日常 uni-app 开发的大头），你还需要把 `uniapp-project` 装到本集合旁边。

`uniapp-project` **不随本仓库发布** —— 它是独立技能，有自己的发布节奏（与官方 uni-app 文档同步）。通过以下任一方式安装：

### 方式 A：从已有的 Claude 安装复制

如果你在别的机器上装过，或本机以前装过：

```bash
# Windows
xcopy /E /I "C:\path\to\uniapp-project" "%USERPROFILE%\.claude\skills\uniapp-project"
# macOS / Linux
cp -r /path/to/uniapp-project "$HOME/.claude/skills/"
```

### 方式 B：从上游仓库克隆

`uniapp-project` 与 [teachingai/full-stack-skills](https://github.com/teachingai/full-stack-skills) 集合一起发布。可在 [skills.sh](https://www.skills.sh/teachingai/full-stack-skills/uniapp-project) 浏览，或通过 `npx` 安装：

```bash
# 推荐（安装到 ~/.claude/skills/uniapp-project）：
npx skills add https://github.com/teachingai/full-stack-skills --skill uniapp-project
```

或者无法跑 `npx` 时直接克隆：

```bash
# Windows
cd %USERPROFILE%\.claude\skills
git clone https://github.com/teachingai/full-stack-skills.git _tmp
robocopy _tmp\skills\uniapp-project uniapp-project /E
rmdir /s /q _tmp
```

```bash
# macOS / Linux
cd "$HOME/.claude/skills"
git clone --depth 1 --filter=blob:none --sparse https://github.com/teachingai/full-stack-skills.git _tmp
cd _tmp
git sparse-checkout set skills/uniapp-project
cp -r skills/uniapp-project ..
cd .. && rm -rf _tmp
```

### 方式 C：通过包管理器 / mavis 安装

```bash
# 如果你的 agent 支持技能包安装
mavis skill install uniapp-project
```

### 验证安装

装好后，`uniapp-architect` 和 `uniapp-project` 都应出现在 Claude 客户端的技能列表中。每当你问及具体组件或 API 时，architect 的 `## When to use` 段会自动路由到 `uniapp-project`。

### 跳过此依赖会怎样

没有 `uniapp-project`，本套件的 20 个技能仍然覆盖所有**工作流、模式和陷阱** —— 这是设计上的职责划分：

- **本套件**（工作流/模式）："列表页怎么实现下拉刷新？""微信小程序登录的最佳姿势是什么？""WXSS 有哪些限制？"
- **`uniapp-project`**（参考目录）："`<scroll-view>` 接受哪些 props？""`uni.scanCode` 的签名？""哪些平台支持 `<live-pusher>`？"

如果跳过 `uniapp-project`，参考类问题请退回到 [官方 uni-app 文档](https://uniapp.dcloud.net.cn/)。

## 其他可选的技能依赖

除 `uniapp-project` 外，本套件还引用了两个其他类别的技能。这两个**都不是使用 20 个 uni-app 技能的必需项**，但各自解锁一条特定工作流：

### `tdd` / `test-driven-development` —— 用于 TDD 风格测试编写

引用位置：
- `uniapp-architect` 食谱 "I want to add tests to my uni-app"
- `uniapp-testing` 的 `## When NOT to use`（"Should I write tests first?"）

`uniapp-testing` 覆盖 **uni-app 特有的**测试问题：mock `uni.*`、跨平台行为、小程序自动化。`tdd` / `test-driven-development` 覆盖 **通用的测试优先流程**：红绿重构、测试命名、何时 mock 与何时不 mock。从零写新测试文件时，建议 `tdd` 与 `uniapp-testing` 同时加载。

`tdd` 和 `test-driven-development` 都来自 [obra/superpowers](https://github.com/obra/superpowers) 集合，可在 [skills.sh/obra/superpowers](https://www.skills.sh/obra/superpowers) 浏览全部 superpowers 技能。

通过 `npx` 安装：

```bash
# 推荐（一次性装所有 superpowers 技能到 ~/.claude/skills/）：
npx skills add obra/superpowers

# 或只装 tdd + test-driven-development 两个（省上下文）：
npx skills add https://github.com/obra/superpowers --skill tdd
npx skills add https://github.com/obra/superpowers --skill test-driven-development
```

装好后技能落在 `%USERPROFILE%\.claude\skills\tdd\` 和 `%USERPROFILE%\.claude\skills\test-driven-development\`（Windows），或 `~/.claude/skills/tdd/` 和 `~/.claude/skills/test-driven-development/`（macOS/Linux）。

### `superpowers:*` 过程技能 —— 用于 code review / 规划工作流

`uniapp-architect` 的 `## Code review mode` 段（v1.4.2 新增）被设计为：当 agent 对 uni-app 项目跑 code review 时自动触发。要获得完整的自动化体验：

- 安装 [obra/superpowers](https://github.com/obra/superpowers) 框架 —— 在 [skills.sh/obra/superpowers](https://www.skills.sh/obra/superpowers) 浏览全部技能。它提供 `superpowers:code-review`、`superpowers:requesting-code-review`、`superpowers:using-superpowers`、`superpowers:brainstorming` 等过程技能
- 当对 uni-app 项目运行 `/code-review`（或 `simplify`）时，agent 应自动加载 `uniapp-architect` 并按 Code review mode 清单执行

通过 `npx` 安装：

```bash
# 一次性装全部 superpowers 技能：
npx skills add obra/superpowers

# 或只装 review 相关的几个：
npx skills add https://github.com/obra/superpowers --skill code-review
npx skills add https://github.com/obra/superpowers --skill requesting-code-review
npx skills add https://github.com/obra/superpowers --skill receiving-code-review
npx skills add https://github.com/obra/superpowers --skill using-superpowers
```

不安装 superpowers 时，`uniapp-architect` 仍然工作 —— 只是没有自动触发的 review 工作流。`## Code review mode` 的 10 步清单可以人工驱动 review 时直接阅读。

### Superpowers 协同（信息性）

少量其他 superpowers 技能被内部计划文档（`docs/superpowers/plans/*.md`）引用，用于 scaffolder 的实现：

- `superpowers:subagent-driven-development` / `superpowers:executing-plans` —— 用来按任务逐步推进 scaffolder 实现计划
- `superpowers:writing-plans` —— 用来创建未来的计划文档

这些**仅在你要读 `docs/superpowers/` 下的计划文档来做实现工作时相关**。日常使用 20 个 uni-app 技能并不需要它们。一次性全部装齐：

```bash
npx skills add obra/superpowers
```

## 使用方式

### 给开发者（手动阅读）

从 **`uniapp-architect`** 开始。它提供了决策树，指导"我应该读哪个子技能来解决这个问题？"。然后深入相应的子技能。

对于"如何使用组件 X 或 API Y"的问题，直接跳到已有的 `uniapp-project` 技能（组件/API 目录）。

### 给 AI Agent（作为技能使用）

当用户提出 uni-app 相关问题时，agent 应按以下步骤操作：

1. 先读 `uniapp-architect/SKILL.md` 了解整体结构。
2. 只加载与当前问题匹配的子技能。
3. 仅当当前技能指向跨层依赖时，才交叉引用其他子技能。

不要一次性加载所有技能——这会消耗过多上下文。按需加载。

## 新 uni-app 开发者推荐阅读顺序

1. `uniapp-architect/SKILL.md` — 整体地图
2. `uniapp-fundamentals/SKILL.md` + `examples/scaffold-vue3-vite.md` — 搭建项目
3. `uniapp-platform-config/SKILL.md` — 配置目标平台
4. `uniapp-routing-and-tabbar/SKILL.md` — 页面导航模式
5. `uniapp-state-and-data/SKILL.md` — Pinia + 持久化
6. `uniapp-network-layer/SKILL.md` — 请求层 + 认证
7. `uniapp-ui-patterns/SKILL.md` — 列表/表单/弹窗模式
8. `uniapp-performance/SKILL.md` — 遇到性能问题时再读
9. `uniapp-debugging-and-publishing/SKILL.md` — 发布上线时

## 设计原则

这套技能遵循三个设计原则：

1. **不与 `uniapp-project` 重叠**——该技能（独立安装）是组件/API 参考。这 19 个技能是工作流/模式层，合起来完整覆盖"如何使用 uni-app"。

2. **每个子技能独立可用**——你可以只加载任意一个，不依赖其他。它们在跨切面问题时相互引用，但不存在硬依赖。

3. **决策驱动，而非参考驱动**——每个技能以"何时使用"和"何时不使用"开头，让 agent（或开发者）无需通读全文即可快速定位。

## 文件结构

```
uniapp-skills/
├── README.md                                    # 本文件
├── README.zh.md                                 # 中文版
├── uniapp-architect/                            # 入口
│   ├── SKILL.md
│   └── references/
│       ├── decision-tree.md
│       └── platform-matrix.md
├── uniapp-fundamentals/
│   ├── SKILL.md
│   ├── references/
│   │   ├── vue2-vs-vue3-vs-uvue.md
│   │   ├── pages-json.md
│   │   ├── manifest-json.md
│   │   ├── lifecycle.md
│   │   └── easycom-uni-scss-uni-modules.md
│   └── examples/
│       ├── scaffold-vue3-vite.md
│       └── scaffold-uvue.md
├── uniapp-routing-and-tabbar/
│   ├── SKILL.md
│   ├── references/
│   │   ├── page-jump-api.md
│   │   ├── custom-nav-bar.md
│   │   ├── tabbar-patterns.md
│   │   └── deep-link-and-share.md
│   └── examples/
│       └── login-redirect.md
├── uniapp-state-and-data/         SKILL.md
├── uniapp-network-layer/          SKILL.md
├── uniapp-ui-patterns/             SKILL.md
├── uniapp-platform-config/        SKILL.md
├── uniapp-performance/            SKILL.md
├── uniapp-debugging-and-publishing/  SKILL.md
├── uniapp-testing/                SKILL.md  (v1.1)
├── uniapp-mp-automation/          SKILL.md  (v1.4)
├── uniapp-i18n/                   SKILL.md  (v1.1)
├── uniapp-cloud/                  SKILL.md  (v1.1)
├── uniapp-payments/               SKILL.md  (v1.2)
├── uniapp-uni-push/               SKILL.md  (v1.2)
├── uniapp-theming/                SKILL.md  (v1.2)
├── uniapp-migration/              SKILL.md  (v1.2)
├── uniapp-plugin-authoring/       SKILL.md  (v1.2)
└── uniapp-ui-libraries/            SKILL.md  (v1.2)
```

## 来源

这些技能源自官方 uni-app 文档（https://uniapp.dcloud.net.cn/）、uni-app x / UTS 文档（https://doc.dcloud.net.cn/uni-app-x/）以及 DCloud 插件市场（https://ext.dcloud.net.cn/）。经过整合优化为 AI agent 技能，重点在于：

- 跨平台差异（不只是"H5 上怎么做"）
- 真实世界模式（登录、购物车、列表分页）而非参考文档
- 常见陷阱及调试方法
- 以 Vue 3 / Pinia / Vite 为默认，在相关处标注 Vue 2 和 uni-app x 的差异

## 许可

每个 `SKILL.md` 头部包含 `license: Complete terms in LICENSE.txt`。如有需要可添加 `LICENSE.txt` 明确条款；否则遵循 MIT 许可，可自由使用、修改和再分发。

## 版本记录

| 版本 | 日期 | 说明 |
|---|---|---|
| 1.0.0 | 2026-06-15 | 初始发布 — 9 个技能，覆盖从脚手架到发布。所有内容内联在 SKILL.md 中。 |
| 1.1.0 | 2026-06-15 | 新增 `uniapp-testing`、`uniapp-i18n`、`uniapp-cloud` — 共 12 个技能。 |
| 1.2.0 | 2026-06-15 | 新增 6 个技能：`uniapp-payments`、`uniapp-uni-push`、`uniapp-theming`、`uniapp-migration`、`uniapp-plugin-authoring`、`uniapp-ui-libraries` — 共 18 个技能。最常见的 uni-app 工作流现已全覆盖。 |
| 1.3.0 | 2026-06-15 | 新增 `uniapp-mp-automation` — 通过 weixin-devtools-mcp MCP 服务器实现自动化构建→启动→调试工作流。共 19 个技能。 |
| 1.4.0 | 2026-06-17 | 新增 `uniapp-scaffolder` — CLI 脚手架工具，带精选模板库、标签过滤和 HBuilderX 插件市场降级方案。共 20 个技能。 |
| 1.4.1 | 2026-06-18 | 增强 `uniapp-mp-automation` — 新增 `mp-devtools-cli.js` 用于微信开发者工具 CLI 路径自动检测（环境变量 / 缓存 / 注册表 / 常见路径 / TTY 交互式输入），并接入 `mp-launch.js` + `mp-debug-helper.js`；新增 3 个 Windows 踩坑记录（`automator.launch()` 直接调 .bat 在 Windows 失败 → 用 `mp-launch.js` + `cli.bat auto` + `automator.connect({ wsEndpoint })` 走 HTTP 路径；`cli.bat open` 单跑不开调试 websocket；无 GUI session 环境只能跑 build/verify，跑不动 31 ops）。 |

## 未来规划

完整的**已知覆盖缺口**列表见 [`uniapp-architect/SKILL.md`](./uniapp-architect/SKILL.md) 的 "Known coverage gaps (v1.0 → v1.2)" 部分。仍在路线图中的项目：

- `references/analytics.md` — 神策、友盟、百度统计、传感器数据、小程序统计
- `references/app-version-update.md` — "首次启动强制更新" 的 UX 模式
- `references/error-reporting.md` — Sentry / Fundebug 深度集成
- `references/uni-ai.md` — DCloud 的 AI SDK（推迟到 uni-ai GA 后）

以及计划从内联内容中拆分出的每个技能的参考文档（见各 SKILL.md 的 "References / Examples" 部分）。

**v1.1 已发布：**
- ✅ `uniapp-testing` — Vitest + Playwright（H5）+ `miniprogram-automator`（小程序）
- ✅ `uniapp-i18n` — 多语言、vue-i18n 集成
- ✅ `uniapp-cloud` — uniCloud 云函数、uni-id 认证、云数据库、云存储

**v1.2 已发布：**
- ✅ `uniapp-payments` — 微信支付 / 支付宝 / Apple Pay / Google Pay / uni-pay 插件
- ✅ `uniapp-uni-push` — uni-push 离线推送 + 微信订阅消息
- ✅ `uniapp-theming` — 暗黑模式、颜色 token、品牌色覆盖
- ✅ `uniapp-migration` — Taro / 原生小程序 / Vue 2 → uni-app，Vue 3 → uvue
- ✅ `uniapp-plugin-authoring` — uni_modules 插件开发 + UTS 原生插件
- ✅ `uniapp-ui-libraries` — uView / FirstUI / ThorUI / Wot / uv-ui 等的对比与集成

**v1.3 已发布：**
- ✅ `uniapp-mp-automation` — 通过 weixin-devtools-mcp MCP 服务器实现自动化构建→启动→调试工作流

**v1.4 已发布：**
- ✅ `uniapp-scaffolder` — CLI 脚手架工具，带精选模板库、标签过滤和 HBuilderX 插件市场降级方案
- ✅ `uniapp-mp-automation` v1.4 — DevTools CLI 路径自动检测 + 3 个 Windows 踩坑记录

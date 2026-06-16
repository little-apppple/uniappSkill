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

> 另有预置的 **`uniapp-project`** 技能（已在你的 Claude skills 目录中）——提供所有 uni-app 内置组件、uni-ui 组件和 API 的参考目录。用于单组件/单 API 的查询。以上技能属于**工作流/模式**层。
>
> **注意：** `uniapp-project` 是独立技能，不属于本集合的一部分——需要单独安装。如果没有它，可使用[官方 uni-app 文档](https://uniapp.dcloud.net.cn/)作为组件/API 参考的备选。

## 安装方式

### 方式 A：复制到 Claude skills 目录

每个技能是一个独立的文件夹，根目录下有 `SKILL.md`。将文件夹复制到以下任一位置：

- **全局技能**（所有项目可用）：`C:\Users\Administrator\.claude\skills\`
- **项目技能**（按项目）：`<project>/.claude/skills/`
- **Mavis 技能**：`C:\Users\Administrator\.mavis\skills\`

```bash
# 示例：将所有技能复制到全局 Claude skills 目录
for /d %s in (d:\workspace\mySkills\uniapp-skills\uniapp-*) do xcopy /E /I "%s" "C:\Users\Administrator\.claude\skills\%~nxs"
# 或逐个复制技能：
xcopy /E /I uniapp-skills\uniapp-architect "C:\Users\Administrator\.claude\skills\uniapp-architect"
xcopy /E /I uniapp-skills\uniapp-fundamentals "C:\Users\Administrator\.claude\skills\uniapp-fundamentals"
# ...
```

重启 Claude / 客户端即可生效。

### 方式 B：作为项目本地技能集使用

将整个 `uniapp-skills/` 文件夹复制到项目中的 `.claude/skills/`。当在该项目下工作时，agent 会自动加载这些技能。

```bash
# 在您的 uni-app 项目中
mkdir -p .claude/skills
cp -r uniapp-skills/* .claude/skills/
```

### 方式 C：接入 `mavis`

```bash
# 一次性注册所有技能
mavis skill add <skill-folder-path>
```

或直接复制到 `mavis` agent 的技能目录：`C:\Users\Administrator\.mavis\agents\mavis\skills\`

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
├── uniapp-mp-automation/          SKILL.md  (v1.3)
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

> **Need a template with specific features (login, payment, i18n, push) or from
> the DCloud plugin marketplace?** See the sibling skill
> `uniapp-scaffolder` — it ships a curated registry, CLI filtering, and
> headless fetching suitable for CI / agent use.

# Scaffold a New uni-app Project — Step by Step

This is the **single command and a half** you need to get from `nothing` to a running
uni-app project. Pick the path that matches your tooling choice (see
`uniapp-architect/SKILL.md` → "Cross-cutting decision: tooling").

## Path A: CLI + Vite (recommended for new projects)

### Vue 3 + JavaScript

```bash
# Prereq: Node.js 18+, npm or pnpm
npx degit dcloudio/uni-preset-vue#vite my-uniapp
cd my-uniapp
npm install
npm run dev:h5          # → opens H5 in browser at localhost:5173
npm run dev:mp-weixin   # → outputs to dist/dev/mp-weixin, open in WeChat DevTools
```

### Vue 3 + TypeScript

```bash
npx degit dcloudio/uni-preset-vue#vite-ts my-uniapp
cd my-uniapp
npm install
npm run dev:h5
```

### Vue 2 (legacy, only if required)

```bash
npx degit dcloudio/uni-preset-vue my-uniapp-vue2
cd my-uniapp-vue2
npm install
npm run dev:h5
```

### uni-app x (uvue + UTS)

```bash
npx degit dcloudio/uni-preset-vue#vite my-uniapp-x
cd my-uniapp-x
npm install
npm run dev:app          # App build — must be opened in HBuilderX alpha for non-H5
```

## Path B: HBuilderX (visual IDE)

1. Download HBuilderX (standard or alpha) from https://www.dcloud.io/hbuilderx.html
2. **File → New → Project → uni-app**
3. Pick a template:
   - **Hello uni-app** — minimal, official
   - **uni-app project** — bare bones
   - **uni-ui project** — pre-configured with `uni-ui` + `easycom`
   - **Hello uni-app x** — only on alpha channel
4. Choose Vue 2 / Vue 3 / uni-app x at the top of the picker
5. Click **Create** — the project is ready to run

To run on a platform:

- **H5**: click "Run" → "Run to Browser"
- **WeChat MP**: "Run" → "Run to Mini Program Simulator" → WeChat Developer Tools opens
- **App (Android)**: "Run" → "Run to Android App-base" (real device or emulator) — needs
  Android Studio + a connected device/emulator
- **App (iOS)**: "Run" → "Run to iOS App-base" — needs Xcode + a Mac

## Path C: Hybrid (best of both)

Many teams use the CLI for daily dev, then open the CLI project in HBuilderX only when
they need to run on a phone or build an App:

1. Scaffold with CLI as in Path A.
2. In HBuilderX: **File → Import → From folder** → select your CLI project.
3. HBuilderX treats it as a uni-app project (it can read `package.json` and the
   uni-app `manifest.json`).
4. Use HBuilderX for "Run to phone" and App build, use VS Code for everything else.

## Post-scaffold checklist

Run through these in order after your first `npm install`:

1. **Set the app name and version** in `manifest.json`:
   ```jsonc
   { "name": "MyApp", "versionName": "0.1.0", "versionCode": "1" }
   ```
2. **Set the WeChat MP appid** (if targeting WeChat):
   ```jsonc
   "mp-weixin": { "appid": "wx1234567890abcdef" }
   ```
3. **Customize `uni.scss`** with your brand color and font scale.
4. **Add `easycom` for `uni-ui`** if not already there:
   ```jsonc
   "easycom": {
     "autoscan": true,
     "custom": { "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue" }
   }
   ```
5. **Create your first page** at `src/pages/index/index.vue` and register in `pages.json`:
   ```jsonc
   "pages": [{ "path": "pages/index/index", "style": {} }]
   ```
6. **Add a tab bar** (if you have multiple top-level pages):
   ```jsonc
   "tabBar": {
     "color": "#7A7E83",
     "selectedColor": "#007AFF",
     "list": [
       { "pagePath": "pages/index/index", "text": "首页" }
     ]
   }
   ```
7. **Set up Pinia** for state management (see `uniapp-state-and-data`).
8. **Set up the request layer** (see `uniapp-network-layer`).

## Common errors at scaffold time

- **`Cannot find module 'vite'`** — `npm install` didn't finish, or you're in the wrong
  directory.
- **H5 runs but blank page** — usually a `pages.json` issue (page not registered) or a
  syntax error in `App.vue`. Open the browser console.
- **WeChat DevTools shows "project.config.json not found"** — open the `dist/dev/mp-weixin`
  directory in WeChat DevTools, not the project root.
- **App build hangs at "正在编译中"** — CLI builds work for H5, but for non-H5 you need
  HBuilderX alpha + a real device. The CLI is limited for App packaging.
- **`tsc` errors everywhere** — install missing types: `npm i -D @types/uni-app @dcloudio/types`.

## HBuilderX vs CLI — practical guidance

| Need | HBuilderX | CLI |
|---|---|---|
| Edit uni-app code in a normal editor (VS Code, WebStorm) | ❌ | ✅ |
| `git` diffs of compiled output | ❌ | ✅ (with proper `.gitignore`) |
| Build APK/IPA without a Mac (cloud build) | ✅ | ❌ (CLI produces wgt only) |
| Real device "Run" in one click | ✅ | ⚠️ requires manual setup |
| CI/CD via GitHub Actions / GitLab | ❌ | ✅ |
| Use TypeScript | ⚠️ editor support lags | ✅ first-class |
| Fast HMR on Vue 3 + Vite | ✅ (alpha) | ✅ (best — Vite native) |
| Inspect runtime via DevTools | ✅ (H5) | ✅ (H5) |

**Recommendation**: start with CLI for editing. Open the project in HBuilderX **only**
when you need to run on a phone or build an App.

## Resources

- Official scaffold guide: https://uniapp.dcloud.net.cn/quickstart-cli.html
- HBuilderX download: https://www.dcloud.io/hbuilderx.html
- Project templates: https://github.com/dcloudio/uni-preset-vue
- Troubleshooting: https://uniapp.dcloud.net.cn/quickstart-ide.html

# `pages.json` — Full Field Reference

This is the **single most important config file** in a uni-app project. It controls page
routing, global appearance, the bottom tab bar, sub-packaging, preload rules, and a few
dev-time conveniences.

`pages.json` is required and lives at the project root (or `src/`, depending on
toolchain — both work; the framework searches up).

## Top-level shape

```jsonc
{
  "pages": [],            // required — list of pages; first one is the launch page
  "globalStyle": {},      // default window + nav bar appearance
  "tabBar": {},           // bottom tab bar (optional)
  "subPackages": [],      // split remaining pages into sub-packages
  "preloadRule": {},      // preload rules for sub-packages
  "condition": {},        // dev-time launch condition overrides (DON'T ship to prod)
  "easycom": {}           // component auto-import rules
}
```

## `pages` — the page list

```jsonc
"pages": [
  { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } },
  { "path": "pages/user/user",   "style": { "navigationBarTitleText": "我的" } }
]
```

Each entry:

| Key | Type | Notes |
|---|---|---|
| `path` | string | Path under `pages/` (no extension). **First entry is the launch page** — don't shuffle casually. |
| `style` | object | Per-page window/nav style; merges with and overrides `globalStyle` |
| `needLogin` | bool | DCloud's first-party auth; if true, redirects to `pages/login/login` when not authed. Use only if you actually use uni-id / uniCloud auth. |
| `usingComponents` | object | Page-scoped component imports (rarely needed; prefer `easycom`) |
| `launchPath` | string | Alternative path; overrides `path` for the first page. Useful for A/B tests. |

## `globalStyle` — defaults for every page

```jsonc
"globalStyle": {
  "navigationBarBackgroundColor": "#FFFFFF",
  "navigationBarTextStyle": "black",  // or "white"
  "navigationBarTitleText": "MyApp",
  "navigationStyle": "default",        // or "custom" — hide native nav bar
  "backgroundColor": "#F5F5F5",
  "backgroundTextStyle": "dark",       // pull-down placeholder text color
  "enablePullDownRefresh": false,
  "onReachBottomDistance": 50
}
```

Per-page `style` can override any of these. Other useful per-page keys:

```jsonc
"style": {
  "navigationBarTitleText": "详情",
  "enablePullDownRefresh": true,        // this page can pull-to-refresh
  "disableScroll": true,                // lock the page (rare; usually bad UX)
  "backgroundColor": "#000000",
  "backgroundColorTop": "#000000",      // iOS safe-area top
  "backgroundColorBottom": "#000000",   // iOS safe-area bottom
  "app-plus": { "titleNView": false }   // App-specific
}
```

## `tabBar` — the bottom bar

```jsonc
"tabBar": {
  "color": "#7A7E83",
  "selectedColor": "#007AFF",
  "backgroundColor": "#FFFFFF",
  "borderStyle": "black",               // or "white"
  "list": [
    {
      "pagePath": "pages/index/index",  // MUST exist in `pages`
      "text": "首页",
      "iconPath": "static/tab/home.png",
      "selectedIconPath": "static/tab/home_active.png"
    }
  ],
  "midButton": {                        // optional center button (e.g. +)
    "width": "80rpx",
    "height": "80rpx",
    "text": "发布",
    "iconPath": "static/tab/plus.png",
    "iconWidth": "50rpx"
  },
  "custom": true                        // use a custom component instead
}
```

Rules:

- **Minimum 2, maximum 5** items in `list`.
- `pagePath` must appear in the top-level `pages` array (not in a subpackage).
- `iconPath` files go in `static/` (not `assets/`) — they need to be resolvable as
  built-in assets.
- For `custom: true`, you must provide a `custom` component via `usingComponents` on
  each tab page or set it globally; uni-app will then render your component instead of
  the native bar. See `uniapp-routing-and-tabbar/references/custom-nav-bar.md` for the
  full implementation pattern.
- `midButton` only shows on App and WeChat MP; some platforms ignore it.

## `subPackages` — split for first-load speed

```jsonc
"subPackages": [
  {
    "root": "pagesA",
    "pages": [
      { "path": "detail/detail", "style": { "navigationBarTitleText": "详情" } }
    ]
  }
]
```

Then the sub-package's pages live under `pagesA/detail/detail.vue`. They're not in the
top-level `pages`, but you can `uni.navigateTo({ url: '/pagesA/detail/detail' })` them
once the subpackage is loaded.

Each subpackage also supports `independent` (independent runtime, no shared JS scope) —
rarely used; skip unless you know why.

See `uniapp-performance` (subpackage section inline) for sizing and naming strategy. A
dedicated `references/subpackage.md` is *planned* for v1.1.

## `preloadRule` — preload sub-packages on entry

```jsonc
"preloadRule": {
  "pages/index/index": {
    "network": "all",         // "all" | "wifi"
    "packages": ["pagesA"]    // sub-package roots to preload
  }
}
```

When the user opens the entry page, uni-app pre-downloads the listed subpackages.
Don't preload too many — it eats bandwidth on first launch.

## `condition` — dev-only launch simulation

```jsonc
"condition": {
  "current": 0,                // index into list
  "list": [
    { "name": "首页", "path": "pages/index/index" },
    { "name": "登录后", "path": "pages/user/user", "query": "?from=dev" }
  ]
}
```

HBuilderX exposes a "Condition" launch option that uses this. It's purely a dev tool —
remove or empty it for production builds. (Most projects just leave it.)

## `easycom` — auto-import

```jsonc
"easycom": {
  "autoscan": true,             // auto-discover components in /components
  "custom": {
    "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
  }
}
```

See `references/easycom-uni-scss-uni-modules.md` for the full pattern.

## Common mistakes

1. **First page in `pages` is wrong** — that's the launch page. Adding a "splash" page to
   the front of the list changes your entry point. Be deliberate.
2. **`tabBar.list[].pagePath` typo** — silently fails. The page is registered but won't
   appear in the tab bar. There's no error, just absence.
3. **Mixing `navigationStyle: "custom"` with a `tabBar`** — works, but the custom nav
   must coexist visually with the tab bar's safe area. Plan the bottom inset.
4. **`subPackages.root` collides with `pages`** — uni-app throws at build time. Use a
   distinct root name.
5. **Per-page `style` not overriding `globalStyle`** — make sure the key path is right
   (e.g. `style.navigationBarTitleText`, not `style.title`).
6. **`enablePullDownRefresh: true` globally** — don't. Enable per-page, then implement
   `onPullDownRefresh` in that page.

## Resources

- Official spec: https://uniapp.dcloud.net.cn/collocation/pages.html
- Pages JSON schema: https://uniapp.dcloud.net.cn/collocation/pages.html
- Tab bar: https://uniapp.dcloud.net.cn/collocation/pages.html#tabbar
- Sub-packages: https://uniapp.dcloud.net.cn/collocation/pages.html#subpackages
- Easycom: https://uniapp.dcloud.net.cn/collocation/pages.html#easycom

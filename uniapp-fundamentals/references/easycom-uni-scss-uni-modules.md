# `easycom`, `uni.scss`, and `uni_modules` — The Three DX Boosters

These three mechanisms together cover most of the "annoying boilerplate" of uni-app
development. If you set them up correctly at project start, you almost never need to
manually `import` components, duplicate SCSS variables, or fight the package manager.

## 1. `easycom` — auto-import components

`easycom` is uni-app's answer to "why do I have to `import` every component in every
page?". When enabled, you can drop a `<my-comp />` tag in any page or component, and
uni-app resolves it to the right file automatically.

### Default behavior (autoscan)

In `pages.json`:

```jsonc
{
  "easycom": {
    "autoscan": true,    // scan src/components for *.vue
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  }
}
```

With this:

- Any `.vue` file under `src/components/` is auto-discoverable
- Any `uni-ui` component (`uni-badge`, `uni-icons`, etc.) is auto-imported
- You write `<uni-badge :text="1" />` in a page — no import needed

### Custom rules

The `custom` key maps a regex to a path template:

```jsonc
"easycom": {
  "autoscan": false,                 // turn off the default scan
  "custom": {
    "^my-(.*)":     "@/components/my-$1.vue",
    "^u-(.*)":      "uview-ui/components/u-$1/u-$1.vue",
    "^lime-(.*)":   "@/uni_modules/lime-$1/components/lime-$1.vue"
  }
}
```

Conventions:

- Regex `^xxx-(.*)` captures the part after the prefix
- Path template `$1` is replaced with the captured part
- The framework looks for `.vue` files matching the path
- Multiple `custom` rules are tried in order; first match wins

### Per-folder rule of thumb

- `components/foo.vue` → `<foo />` (last path segment)
- `components/foo/index.vue` → `<foo />`
- `components/uni-foo/uni-foo.vue` → `<uni-foo />`

For `uni_modules/<plugin>/components/...`, the plugin's own `easycom.json` declares
its rules — you don't need to repeat them.

### When NOT to use easycom

- A component is used in only one place — import it manually, it's clearer
- A component is very large or rarely used — easycom can pull in dead code if the
  bundler can't tree-shake
- A component is conditionally used across many platforms and you want explicit control
  — use `#ifdef` + manual import

## 2. `uni.scss` — global SCSS variables

`uni.scss` is a special SCSS file that is **automatically imported as a global
stylesheet** in every page and component. You don't need to `@import` it.

Default content (provided by uni-app's template):

```scss
/* uni.scss */
$uni-color-primary: #007aff;
$uni-color-success: #4cd964;
$uni-color-warning: #f0ad4e;
$uni-color-error:   #dd524d;

$uni-text-color:        #303133;
$uni-text-color-inverse:#FFFFFF;
$uni-text-color-grey:   #909399;
$uni-text-color-placeholder: #C0C4CC;
$uni-text-color-disable:#C0C4CC;

$uni-bg-color:        #FFFFFF;
$uni-bg-color-grey:   #F8F8F8;
$uni-bg-color-hover:  #F1F1F1;
$uni-bg-color-mask:   rgba(0, 0, 0, 0.4);

$uni-border-color:    #EBEEF5;

$uni-font-size-sm:    24rpx;
$uni-font-size-base:  28rpx;
$uni-font-size-lg:    32rpx;

$uni-spacing-row-sm:  10rpx;
$uni-spacing-row-base:20rpx;
$uni-spacing-row-lg:  30rpx;

$uni-spacing-col-sm:  8rpx;
$uni-spacing-col-base:16rpx;
$uni-spacing-col-lg:  24rpx;
```

### Add your own brand variables

```scss
/* uni.scss */
@import "@/uni_modules/uview-ui/theme.scss";   // if you use uView

$brand-primary:   #007AFF;
$brand-secondary: #5856D6;
$brand-accent:    #FF2D55;

$text-primary:   #1A1A1A;
$text-secondary: #666666;
$text-muted:     #999999;
$divider:        #EBEEF5;

$radius-sm: 8rpx;
$radius-md: 16rpx;
$radius-lg: 24rpx;
```

Then use them anywhere with SCSS:

```vue
<style lang="scss" scoped>
.title {
  color: $text-primary;
  font-size: $uni-font-size-lg;
  border-radius: $radius-md;
}
</style>
```

### Override the built-in variables

If you override `$uni-color-primary` etc. in your `uni.scss`, the change applies
globally — useful for theming. UI libraries (uView, uni-ui) that read these variables
will pick up your override.

### Common gotchas

- **`uni.scss` is processed at compile time, not runtime.** Changing it requires a
  rebuild / HMR. Hot reload usually works, but if values seem stale, do a full
  rebuild.
- **Order matters.** If you `@import` a UI library's theme, put it **before** your
  custom variables so the library's defaults apply first, then your overrides.
- **`uni.scss` only loads SCSS**, not raw CSS. For non-SCSS projects, put pure CSS
  resets in `App.vue`'s `<style>` (which is global).
- **Don't use `!important` here.** If you find yourself reaching for it, you have a
  variable that isn't being applied — fix the variable, not the cascade.

## 3. `uni_modules` — plugin management

`uni_modules/` is uni-app's plugin format. Each plugin lives in its own folder under
`src/uni_modules/<plugin-id>/` with a self-contained `package.json`, components, and
config.

### Canonical structure

```
src/uni_modules/
└── uni-badge/                  # plugin id
    ├── components/
    │   └── uni-badge/
    │       └── uni-badge.vue
    ├── static/                 # assets bundled with the plugin
    ├── package.json
    ├── readme.md
    └── easycom.json            # declares auto-import rules
```

### How to install

**From DCloud plugin market (https://ext.dcloud.net.cn/):**

1. Click the plugin page → "Import Plugin" or download the zip.
2. In HBuilderX, drag the zip into the project, or use **Tools → Import Plugin**.
3. The plugin lands in `src/uni_modules/`. Restart dev server if needed.
4. Components are auto-discovered via `easycom.json`.

**From npm (rare — only for plugins that explicitly publish to npm):**

```bash
npm install my-uni-plugin
```

But you still need to wire `easycom` rules manually. Most plugins don't support this
path.

### When to use uni_modules vs regular npm

| Use uni_modules | Use npm |
|---|---|
| DCloud plugin market plugin | Plain JS library (e.g. lodash, dayjs) |
| Components that need easycom auto-import | Pure functions, utilities |
| UTS plugin | A uni-app-specific TS package |
| Plugin that bundles its own assets | — |

You can use both in the same project. `uni_modules` for UI/native plugins, `npm` for
everything else.

### Updating plugins

In HBuilderX: right-click the plugin folder → "Update Plugin".
In CLI: delete and re-import (most plugins don't have a clean update flow outside
HBuilderX).

### Common mistakes

1. **Editing files inside `uni_modules/<plugin>/`** — your changes are wiped on the next
   plugin update. If you need to customize, fork the plugin or wrap it in your own
   `components/` folder.
2. **Installing a uni_modules plugin via `npm install`** — most plugins don't have an npm
   package. Use the HBuilderX importer.
3. **Forgetting to restart the dev server** after adding a new plugin — components won't
   resolve until the bundler picks up the new files.
4. **Mixing `uni_modules` and `uView 1.x` conventions** — `uView 1.x` is not a uni_modules
   plugin; install it via `npm install uview-ui`. The two systems don't conflict, but
   the docs are different.

## 4. Combined workflow — the standard setup

When you scaffold a new project, do this:

1. **Add `easycom` for `uni-ui`** in `pages.json` (most templates do this already):
   ```jsonc
   "easycom": {
     "autoscan": true,
     "custom": { "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue" }
   }
   ```
2. **Customize `uni.scss`** with your brand color, font sizes, spacing.
3. **Install UI library** (if any) via `uni_modules` (uni-ui, FirstUI) or npm (uView 1.x).
4. **Place your own components in `src/components/`** — they auto-import via `autoscan`.
5. **Never write `import` for a component** unless it lives in a weird place.

After this, component usage in pages becomes:

```vue
<template>
  <view class="page">
    <uni-nav-bar title="首页" />
    <uni-list>
      <uni-list-item v-for="item in list" :key="item.id" :title="item.title" />
    </uni-list>
    <my-empty v-if="list.length === 0" text="暂无数据" />
  </view>
</template>

<script setup>
// no imports — all components are auto-discovered
const list = ref([])
</script>
```

## Resources

- easycom: https://uniapp.dcloud.net.cn/collocation/pages.html#easycom
- uni.scss: https://uniapp.dcloud.net.cn/collocation/uni-scss.html
- uni_modules spec: https://uniapp.dcloud.net.cn/plugin/uni_modules.html
- Plugin market: https://ext.dcloud.net.cn/

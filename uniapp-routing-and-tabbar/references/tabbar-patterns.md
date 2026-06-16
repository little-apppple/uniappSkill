# Tab Bar Patterns

The default tab bar is fine for a 3-tab app. Once you need badges, dynamic show/hide,
custom animations, or a center "+" button, you have to drop into the patterns below.

## Pattern 1: Standard tab bar with icons

The simplest case. Set in `pages.json`:

```jsonc
"tabBar": {
  "color": "#7A7E83",
  "selectedColor": "#007AFF",
  "backgroundColor": "#FFFFFF",
  "borderStyle": "black",
  "list": [
    {
      "pagePath": "pages/home/home",
      "text": "首页",
      "iconPath": "static/tab/home.png",
      "selectedIconPath": "static/tab/home_active.png"
    },
    {
      "pagePath": "pages/category/category",
      "text": "分类",
      "iconPath": "static/tab/category.png",
      "selectedIconPath": "static/tab/category_active.png"
    },
    {
      "pagePath": "pages/cart/cart",
      "text": "购物车",
      "iconPath": "static/tab/cart.png",
      "selectedIconPath": "static/tab/cart_active.png"
    },
    {
      "pagePath": "pages/me/me",
      "text": "我的",
      "iconPath": "static/tab/me.png",
      "selectedIconPath": "static/tab/me_active.png"
    }
  ]
}
```

Icon size conventions:

- 81×81 px is the default design size; render at 60×60 visual
- PNG, no transparency tricks; the system draws a tint for `selectedColor`
- Place in `static/tab/` so they're easy to find

## Pattern 2: Badges (e.g. cart count)

The native tab bar supports a `badge` / `midButtonBadge` property:

```js
// Anywhere in your code
uni.setTabBarBadge({
  index: 2,                // 0-based index in tabBar.list
  text: '5'                // shows red dot with "5"; empty string to hide
})

// Hide
uni.removeTabBarBadge({ index: 2 })
```

For red dot only (no number):

```js
uni.showTabBarRedDot({ index: 2 })
uni.hideTabBarRedDot({ index: 2 })
```

Best place to call: the store that owns the count. When `cart.totalCount` changes,
update the badge:

```ts
// store/cart.ts (or a composable called from App.vue onLaunch)
import { watch } from 'vue'
import { useCartStore } from '@/store/cart'

// Call this from App.vue onLaunch or a composable — NOT at module top level
// (Pinia must be installed before useCartStore() is called)
function syncCartBadge() {
  const cart = useCartStore()
  watch(
    () => cart.totalCount,
    (count) => {
      if (count > 0) uni.setTabBarBadge({ index: 2, text: String(count) })
      else uni.removeTabBarBadge({ index: 2 })
    }
  )
}
```

## Pattern 3: Mid-button (center "+")

```jsonc
"tabBar": {
  "list": [
    { "pagePath": "pages/home/home",     "text": "首页" },
    { "pagePath": "pages/category/...",  "text": "分类" }
  ],
  "midButton": {
    "text": "发布",
    "iconPath": "static/tab/plus.png",
    "iconWidth": "50rpx",
    "width": "80rpx",
    "height": "80rpx"
  }
}
```

Then listen:

```js
// In App.vue or a global module
onLaunch(() => {
  uni.onTabBarMidButtonTap(() => {
    uni.navigateTo({ url: '/pages/publish/publish' })
  })
})
```

**Caveat**: `midButton` only renders on WeChat MP and App. H5 and other MP ignore it.
If your mid button is critical, build a fully custom tab bar instead.

## Pattern 4: Custom tab bar (full control)

For full styling — custom shapes, animations, badges that aren't simple red dots,
mid-button on H5, etc. — set `"custom": true` and provide a component.

`pages.json`:

```jsonc
"tabBar": {
  "custom": true,
  "color": "#7A7E83",
  "selectedColor": "#007AFF",
  "backgroundColor": "#FFFFFF",
  "list": [
    { "pagePath": "pages/home/home",     "text": "首页" },
    { "pagePath": "pages/category/...",  "text": "分类" },
    { "pagePath": "pages/cart/cart",     "text": "购物车" },
    { "pagePath": "pages/me/me",         "text": "我的" }
  ]
}
```

The custom component — `components/CustomTabBar.vue`:

```vue
<template>
  <view class="tab-bar" :style="{ paddingBottom: safeBottom }">
    <view
      v-for="(item, i) in list"
      :key="item.path"
      :class="['tab-item', { active: currentIndex === i }]"
      @click="onTap(item, i)"
    >
      <image :src="currentIndex === i ? item.activeIcon : item.icon" class="icon" />
      <text class="label">{{ item.text }}</text>
      <view v-if="badgeMap[i]" class="badge">
        <text class="badge-text">{{ badgeMap[i] }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/store/cart'

const list = [
  { path: '/pages/home/home',    text: '首页',   icon: '/static/tab/home.png',     activeIcon: '/static/tab/home_active.png' },
  { path: '/pages/category/...', text: '分类',   icon: '/static/tab/category.png', activeIcon: '/static/tab/category_active.png' },
  { path: '/pages/cart/cart',    text: '购物车', icon: '/static/tab/cart.png',     activeIcon: '/static/tab/cart_active.png' },
  { path: '/pages/me/me',        text: '我的',   icon: '/static/tab/me.png',       activeIcon: '/static/tab/me_active.png' }
]

const currentIndex = ref(0)

// Compute current index from current page
onMounted(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]?.route
  currentIndex.value = list.findIndex(i => i.path.endsWith(current))
})

// Badges
const cart = useCartStore()
const badgeMap = computed(() => ({
  2: cart.totalCount > 0 ? String(cart.totalCount) : ''
}))

// Safe area
const safeBottom = ref('0')
onMounted(() => {
  // #ifdef H5 || MP-WEIXIN
  safeBottom.value = 'env(safe-area-inset-bottom)'
  // #endif
})

function onTap(item, i) {
  if (i === currentIndex.value) return  // already on this tab
  currentIndex.value = i
  uni.switchTab({ url: item.path })
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  display: flex;
  background: #fff;
  border-top: 1rpx solid $uni-border-color;
  z-index: 99;
}
.tab-item {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.icon { width: 44rpx; height: 44rpx; }
.label { font-size: 22rpx; color: $text-muted; margin-top: 4rpx; }
.tab-item.active .label { color: $brand-primary; }
.badge {
  position: absolute;
  top: 4rpx;
  right: 50%;
  transform: translateX(20rpx);
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: $uni-color-error;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.badge-text { color: #fff; font-size: 20rpx; line-height: 1; }
</style>
```

Add the custom tab bar to every tab page (or use a global component in `App.vue`):

```vue
<template>
  <view class="page">
    <CustomTabBar />
    <!-- page content; add bottom padding to clear the tab bar -->
  </view>
</template>
```

### Subtle issue: tab bar shows during page transitions

If you navigate from tab A to a non-tab page (e.g. detail), the tab bar should hide.
With the native bar, uni-app handles this. With a custom bar, you need to hide it on
non-tab pages. Two options:

- **Conditional render**: only render `<CustomTabBar />` on tab pages (lots of files to
  touch)
- **Page-stack check**: in `App.vue` or a parent, check if the current page is a tab
  page, render or hide accordingly

```ts
// In App.vue, expose a global ref
const isTabPage = ref(false)

// Watch for page changes
uni.$on('page-changed', (route: string) => {
  isTabPage.value = tabRoutes.includes(route)
})
```

Easier: just have each non-tab page set `isTabPage` to false on `onLoad` and the tab
pages set it to true. (Pinia is the cleanest place for this state.)

## Pattern 5: Hidden tab bar on specific pages

```js
uni.hideTabBar({ animation: true })
uni.showTabBar({ animation: true })
```

Useful when entering a flow that takes over the screen (e.g. checkout, video player).
Restore on `onUnload` of the page that hid it.

## Common mistakes

1. **Forgetting that tab pages must be in the top-level `pages` array** — not in
   `subPackages`.
2. **Tab bar icons missing transparency** — leave them as solid PNG; the system tints
   them with `selectedColor`.
3. **Setting badges before the tab bar is mounted** — the call silently fails on first
   app launch. Wait for `onReady` of the home page, or use `uni.setTabBarBadge` after
   `nextTick`.
4. **Custom tab bar with `position: fixed` and a `<scroll-view>` page** — the
   scroll-view's bottom is hidden by the fixed bar. Add `padding-bottom` equal to the
   bar's height, or use `bottom: 0` with `position: sticky` instead.
5. **Custom tab bar inside a `<page>` wrapper that has `padding-bottom`** — double
   padding. Apply the safe-area at the tab bar level only.

## Resources

- Tab bar config: https://uniapp.dcloud.net.cn/collocation/pages.html#tabbar
- Custom tab bar: https://uniapp.dcloud.net.cn/collocation/pages.html#custom-tabbar
- Badge API: https://uniapp.dcloud.net.cn/api/ui/tabbar.html
- Mid button: https://uniapp.dcloud.net.cn/collocation/pages.html#midbutton

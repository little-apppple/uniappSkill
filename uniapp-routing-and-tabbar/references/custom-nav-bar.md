# Custom Navigation Bar

The native nav bar that ships with uni-app is **serviceable but limited**: no animation,
fixed style, can't show dynamic content (avatars, badges, actions). Most non-trivial
apps hide it and draw their own.

This guide covers the full custom nav bar pattern: per-page, app-wide, with the WeChat
MP capsule button, scroll-driven title, and the safe-area bottom inset.

## When to go custom

- You want a branded nav bar with custom typography and colors
- You want a dynamic right-side action (e.g. "Save" button that toggles enabled state)
- You want scroll-driven title (small at top, full when scrolled)
- You need a search input in the nav bar
- You want an avatar / profile chip on the left instead of a back arrow

If you just want to change the title text and background color, the native bar is fine
— set `navigationBarTitleText` and `navigationBarBackgroundColor` in `pages.json`.

## Enabling the custom bar

### Per-page (recommended — only the pages that need it)

```jsonc
"pages": [
  {
    "path": "pages/detail/detail",
    "style": { "navigationStyle": "custom" }
  }
]
```

### Globally (every page is custom)

```jsonc
"globalStyle": { "navigationStyle": "custom" }
```

Once enabled, the page starts at the very top of the screen — no native bar height, no
status bar inset. **You must add the status bar inset yourself** or content sits under
the notch / camera.

## Full implementation

```vue
<!-- components/AppNavBar.vue -->
<template>
  <view class="nav-wrapper">
    <!-- Status bar (transparent so page bg shows through) -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- The bar itself -->
    <view
      class="nav-bar"
      :style="{
        height: navBarHeight + 'px',
        background: bgColor
      }"
    >
      <!-- Left: back / home -->
      <view v-if="showBack" class="nav-slot left" @click="onBack">
        <view v-if="showHome" class="home-btn">
          <text class="home-icon">⌂</text>
        </view>
        <view v-else class="back-btn">
          <text class="back-icon">‹</text>
        </view>
      </view>
      <view v-else class="nav-slot left" />

      <!-- Center: title (or slot for custom content) -->
      <view class="nav-slot center">
        <slot>
          <text class="title" :style="{ color: textColor }">{{ title }}</text>
        </slot>
      </view>

      <!-- Right: action slot -->
      <view class="nav-slot right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  bgColor: { type: String, default: '#FFFFFF' },
  textColor: { type: String, default: '#1A1A1A' }
})

const statusBarHeight = ref(20)
const navBarHeight = ref(44)
const showHome = ref(false)  // show home button when at root

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  const pages = getCurrentPages()
  showHome.value = pages.length === 1

  // #ifdef MP-WEIXIN
  // WeChat MP: align with the capsule button
  try {
    const menu = uni.getMenuButtonBoundingClientRect()
    navBarHeight.value = (menu.top - statusBarHeight.value) * 2 + menu.height
  } catch (e) {}
  // #endif
})

function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    uni.switchTab({ url: '/pages/home/home' })
  }
}
</script>

<style lang="scss" scoped>
.nav-wrapper {
  position: relative;
  z-index: 100;
}
.status-bar { width: 100%; }
.nav-bar {
  display: flex;
  align-items: center;
  position: relative;
}
.nav-slot {
  display: flex;
  align-items: center;
  height: 100%;
}
.nav-slot.left  { width: 100rpx; padding-left: 20rpx; }
.nav-slot.right { width: 100rpx; padding-right: 20rpx; justify-content: flex-end; }
.nav-slot.center { flex: 1; justify-content: center; padding: 0 20rpx; }

.title {
  font-size: 32rpx;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.back-icon, .home-icon {
  font-size: 48rpx;
  line-height: 1;
  color: $text-primary;
}
</style>
```

## Usage in a page

```vue
<template>
  <view class="page">
    <AppNavBar title="详情">
      <template #right>
        <text @click="onShare">分享</text>
      </template>
    </AppNavBar>

    <view class="content">
      <!-- page content; remember to add top padding for the nav bar's height -->
    </view>
  </view>
</template>

<script setup>
import AppNavBar from '@/components/AppNavBar.vue'
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fff;
}
.content {
  /* Optional: add top padding to clear the nav bar */
  /* padding-top: calc(44px + var(--status-bar-height)); */
}
</style>
```

If you make the nav bar a global component in `App.vue`, you don't need to add it per
page — but you lose per-page customization. The hybrid is: make `AppNavBar` a reusable
component and add it to every page that needs it.

## Scroll-driven title

A common pattern: title is small at the top of the page, grows to full when the user
scrolls down.

```vue
<template>
  <view class="page">
    <AppNavBar :title="title" :bg-color="bgColor">
      <template #center>
        <text class="title" :style="titleStyle">{{ title }}</text>
      </template>
    </AppNavBar>

    <scroll-view
      scroll-y
      :scroll-top="0"
      @scroll="onScroll"
      class="scroll"
    >
      <!-- page content -->
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const scrollTop = ref(0)
const title = ref('详情')

const titleStyle = computed(() => {
  const t = Math.min(scrollTop.value / 100, 1)  // 0 → 1 over 100px scroll
  return {
    fontSize: `${28 + t * 4}rpx`,
    fontWeight: 500 + t * 200
  }
})

const bgColor = computed(() => {
  const t = Math.min(scrollTop.value / 100, 1)
  return `rgba(255, 255, 255, ${0 + t * 1})`
})

function onScroll(e) {
  scrollTop.value = e.detail.scrollTop
}
</script>
```

## Capsule button alignment (WeChat MP)

WeChat MP has a "capsule" (the `···` button) in the top-right corner. Your custom nav
bar must leave room for it. The platform provides the rect:

```js
const menu = uni.getMenuButtonBoundingClientRect()
// menu = { top, right, width, height, bottom, left }
// The space to the right of the capsule is `sys.windowWidth - menu.right`
```

Best practice: compute `navBarHeight` to match the capsule, and reserve `menu.width` on
the right:

```vue
<view class="nav-slot right" :style="{ width: capsuleWidth + 'px' }">
  <slot name="right" />
</view>
```

```js
const capsuleWidth = ref(0)
onMounted(() => {
  // #ifdef MP-WEIXIN
  const menu = uni.getMenuButtonBoundingClientRect()
  capsuleWidth.value = menu.width + (sys.windowWidth - menu.right)
  // #endif
})
```

## Safe-area bottom inset (iPhone X+, custom tab bar)

If you have a custom tab bar at the bottom, account for the home indicator:

```vue
<view
  class="tab-bar"
  :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
>
  <!-- tab bar content -->
</view>
```

`env(safe-area-inset-bottom)` works on H5, iOS MP, and iOS App. On Android there's no
notch home indicator on most devices — the value is 0.

## Common mistakes

1. **Forgetting the status bar height** — content appears under the notch / camera.
2. **Not respecting the WeChat capsule** — the right side of the nav bar overlaps the
   `···` button.
3. **Setting `position: fixed` without considering content offset** — content scrolls
   under the bar. Use `padding-top` on the page content, or sticky positioning.
4. **Using `100vh` for the page** — broken on iOS Safari (URL bar). Use
   `min-height: 100vh` and let content push the height, or set height with `100%` of
   a fixed-positioned parent.
5. **Re-creating the back handler in every page** — share a single component or hook.
6. **Not handling "no back stack" gracefully** — at the first page, there's no "back".
   Show a home icon or no button.

## Resources

- `navigationStyle` config: https://uniapp.dcloud.net.cn/collocation/pages.html#navigationstyle
- WeChat MP capsule: https://developers.weixin.qq.com/miniprogram/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html
- Safe-area-inset: https://developer.mozilla.org/en-US/docs/Web/CSS/env()

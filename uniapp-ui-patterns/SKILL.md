---
name: uniapp-ui-patterns
description: "Reusable UI patterns in uni-app — list pages with pull-to-refresh and infinite scroll, form pages with validation, skeleton screens, empty states, error states, popup/dialog/toast patterns, custom navigation bar. Use when the user is building a list page, a form, a popup, or wants polished empty/loading/error states. Covers components from uni-ui, common UX patterns, and the practical details that the official docs skip (what to do when the list is empty, how to combine pull-refresh and infinite scroll, skeleton timing)."
license: Complete terms in LICENSE.txt
---

## What this skill covers

The **UI patterns** that recur in every app: list, form, loading state, empty state,
error state, popup, custom nav bar. After loading this skill, the agent should be able
to build these pages with consistent UX.

If the user is asking about a specific component spec (`<image>` modes, `<scroll-view>`
properties), that's `uniapp-project` (the existing component catalog). This skill is
about **how to combine components** into a finished screen.

## When to use this skill

- "Build a list page with pull-to-refresh and load-more"
- "Build a form with validation"
- "How do I show a skeleton while loading?"
- "How do I handle empty / error / loading states?"
- "How do I make a global confirm dialog?"
- "How do I make a custom navigation bar?"

## When NOT to use this skill

- "How do I use `<scroll-view>`?" → `uniapp-project` (component spec)
- "How do I navigate to a new page?" → `uniapp-routing-and-tabbar`
- "How do I make the list render 1000 items smoothly?" → `uniapp-performance`
- "Which third-party UI library should I pick? (uView / FirstUI / ThorUI / Wot / etc.)" →
  `uniapp-ui-libraries` (this skill is library-agnostic; the libraries skill is for
  picking + installing)

## The list page pattern

A list page in uni-app has **three concurrent concerns**:

1. **Initial loading** — show skeleton / spinner
2. **Pull-to-refresh** — replace list with new data
3. **Infinite scroll** — append more items when reaching the bottom

Get any of these wrong and the page feels broken.

```vue
<template>
  <view class="page">
    <AppNavBar title="订单" />

    <!-- Skeleton during initial load -->
    <view v-if="state === 'loading' && list.length === 0" class="skeleton-list">
      <view v-for="i in 6" :key="i" class="skeleton-item" />
    </view>

    <!-- Empty state -->
    <EmptyState
      v-else-if="state === 'empty'"
      icon="📭"
      title="暂无订单"
      subtitle="下完第一单就会出现在这里"
    >
      <button @click="goShop">去逛逛</button>
    </EmptyState>

    <!-- Error state -->
    <ErrorState
      v-else-if="state === 'error'"
      :message="errorMessage"
      @retry="fetchList(true)"
    />

    <!-- List -->
    <scroll-view
      v-else
      scroll-y
      class="list"
      @scrolltolower="onReachBottom"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onPullDown"
    >
      <view v-for="item in list" :key="item.id" class="item">
        <!-- item content -->
      </view>

      <view v-if="state === 'loading-more'" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-else-if="state === 'no-more'" class="no-more">
        <text>— 没有更多了 —</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

const list = ref<any[]>([])
const state = ref<'loading' | 'empty' | 'error' | 'ready' | 'loading-more' | 'no-more'>('loading')
const refreshing = ref(false)
const page = ref(1)
const pageSize = 20
const hasMore = ref(true)
const errorMessage = ref('')

async function fetchList(reset = false) {
  if (reset) {
    page.value = 1
    hasMore.value = true
    list.value = []
  }
  state.value = list.value.length === 0 ? 'loading' : 'loading-more'

  try {
    const res = await api.orderList({ page: page.value, pageSize })
    if (reset) list.value = res.items
    else list.value.push(...res.items)

    if (list.value.length === 0) state.value = 'empty'
    else if (res.items.length < pageSize) {
      state.value = 'no-more'
      hasMore.value = false
    } else state.value = 'ready'
  } catch (e: any) {
    errorMessage.value = e.message || '加载失败'
    state.value = list.value.length === 0 ? 'error' : 'ready'
  } finally {
    refreshing.value = false
  }
}

async function onPullDown() {
  refreshing.value = true
  await fetchList(true)
}

async function onReachBottom() {
  if (!hasMore.value || state.value === 'loading-more') return
  page.value += 1
  await fetchList()
}

onLoad(() => fetchList(true))
onShow(() => {
  // Re-fetch if the user came back from an edit page
  // (you can gate this with a "needs refresh" flag if it's expensive)
  if (list.value.length > 0) fetchList(true)
})

function goShop() {
  uni.switchTab({ url: '/pages/home/home' })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-page; }
.list { height: calc(100vh - 88rpx); }
.skeleton-list { padding: 20rpx; }
.skeleton-item {
  height: 200rpx;
  background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 20rpx;
  border-radius: 8rpx;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.loading-more, .no-more { text-align: center; padding: 40rpx 0; color: $text-muted; font-size: 24rpx; }
.item {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 12rpx;
}
</style>
```

Key details people get wrong:

- **State machine**: `loading | empty | error | ready | loading-more | no-more`. Don't
  try to represent this with 3 booleans.
- **Refresher**: use `refresher-enabled` (MP-only) and `refresher-triggered` to control
  the spinner. On H5, fall back to the page-level `onPullDownRefresh` lifecycle (set
  `enablePullDownRefresh: true` in `pages.json`).
- **Loading-more vs no-more**: don't keep showing "加载中" after the last page.

## The form page pattern

A form page needs:

1. **Validation** — client-side, with clear error messages
2. **Submit state** — disabled button while in flight
3. **Error display** — inline (under the field) for validation, toast for submit errors
4. **Dirty tracking** — warn before navigating away with unsaved changes

```vue
<template>
  <view class="form-page">
    <AppNavBar title="编辑收货地址" />

    <view class="form">
      <FormField label="姓名" :error="errors.name">
        <input v-model="form.name" placeholder="收货人姓名" class="input" />
      </FormField>

      <FormField label="手机号" :error="errors.phone">
        <input v-model="form.phone" type="number" maxlength="11" placeholder="11位手机号" class="input" />
      </FormField>

      <FormField label="地区">
        <picker mode="region" :value="form.region" @change="onRegionChange">
          <view class="picker">
            {{ form.region.length ? form.region.join(' ') : '请选择省/市/区' }}
          </view>
        </picker>
      </FormField>

      <FormField label="详细地址" :error="errors.detail">
        <textarea v-model="form.detail" placeholder="街道、楼栋、门牌号" class="textarea" />
      </FormField>

      <button :disabled="submitting" @click="onSubmit" class="submit">
        {{ submitting ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const form = reactive({ name: '', phone: '', region: [] as string[], detail: '' })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

function validate() {
  // Clear previous errors
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = '请输入姓名'
  if (!/^1\d{10}$/.test(form.phone)) errors.phone = '手机号不正确'
  if (form.region.length === 0) errors.region = '请选择地区'
  if (!form.detail.trim()) errors.detail = '请输入详细地址'
  return Object.keys(errors).length === 0
}

function onRegionChange(e: any) {
  form.region = e.detail.value
}

async function onSubmit() {
  if (!validate()) {
    uni.showToast({ title: '请检查表单', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await api.saveAddress({ ...form })
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>
```

The `FormField` wrapper is a small custom component:

```vue
<!-- components/FormField.vue -->
<template>
  <view class="form-field">
    <view v-if="label" class="label">
      <text>{{ label }}</text>
    </view>
    <view class="control">
      <slot />
    </view>
    <view v-if="error" class="error">
      <text>{{ error }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps<{ label?: string; error?: string }>()
</script>

<style lang="scss" scoped>
.form-field { margin-bottom: 24rpx; }
.label { font-size: 26rpx; color: $text-secondary; margin-bottom: 8rpx; }
.control { background: #f8f8f8; border-radius: 8rpx; padding: 0 20rpx; }
.error { color: $uni-color-error; font-size: 22rpx; margin-top: 6rpx; margin-left: 4rpx; }
.input, .textarea, .picker {
  height: 88rpx; line-height: 88rpx; font-size: 28rpx;
}
.textarea { height: 200rpx; line-height: 1.5; padding: 20rpx 0; }
.picker { color: $text-primary; }
</style>
```

## Skeleton screens

A skeleton is a low-fidelity placeholder that mimics the final layout. It reduces
perceived load time vs a spinner.

```vue
<view v-if="loading" class="skeleton">
  <view class="sk-title" />
  <view class="sk-line w-70" />
  <view class="sk-line w-90" />
  <view class="sk-line w-50" />
  <view class="sk-image" />
</view>
```

```scss
.skeleton { padding: 30rpx; }
.sk-title, .sk-line, .sk-image {
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4rpx;
  margin-bottom: 16rpx;
}
.sk-title { height: 36rpx; width: 60%; }
.sk-line { height: 24rpx; }
.sk-line.w-50 { width: 50%; }
.sk-line.w-70 { width: 70%; }
.sk-line.w-90 { width: 90%; }
.sk-image { height: 300rpx; width: 100%; margin-top: 30rpx; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Skeleton should match the **real layout's shape** — not just gray boxes. Users perceive
the page as faster when the skeleton "becomes" the real content.

## Empty / error states

A good empty state has:

- An icon or illustration (large, friendly)
- A short title ("暂无订单")
- A subtitle explaining what to do ("下完第一单就会出现在这里")
- A primary action (button) if relevant

```vue
<!-- components/EmptyState.vue -->
<template>
  <view class="empty-state">
    <text class="icon">{{ icon }}</text>
    <text class="title">{{ title }}</text>
    <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
    <view v-if="$slots.default" class="action">
      <slot />
    </view>
  </view>
</template>

<script setup>
defineProps<{
  icon?: string
  title: string
  subtitle?: string
}>()
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 60rpx;
  text-align: center;
}
.icon { font-size: 120rpx; opacity: 0.5; margin-bottom: 30rpx; }
.title { font-size: 32rpx; color: $text-primary; margin-bottom: 12rpx; }
.subtitle { font-size: 26rpx; color: $text-muted; margin-bottom: 40rpx; }
</style>
```

```vue
<!-- components/ErrorState.vue -->
<template>
  <view class="error-state">
    <text class="icon">⚠️</text>
    <text class="title">加载失败</text>
    <text class="message">{{ message }}</text>
    <button @click="$emit('retry')" class="retry">重试</button>
  </view>
</template>

<script setup>
defineProps<{ message: string }>()
defineEmits<{ (e: 'retry'): void }>()
</script>
```

## Global confirm dialog

For app-wide "are you sure?" dialogs, use a Pinia store + global component (see
`uniapp-state-and-data` for the store). The component:

```vue
<!-- components/GlobalConfirm.vue -->
<template>
  <view v-if="confirmDialog" class="modal-mask" @click.self="close(false)">
    <view class="dialog">
      <view class="title">{{ confirmDialog.title }}</view>
      <view class="message">{{ confirmDialog.message }}</view>
      <view class="actions">
        <view class="btn cancel" @click="close(false)">取消</view>
        <view class="btn confirm" @click="close(true)">确定</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/store/ui'

const ui = useUIStore()
const confirmDialog = computed(() => ui.confirmDialog)

function close(ok: boolean) {
  ui.closeConfirm(ok)
}
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
}
.dialog {
  width: 560rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.title { padding: 40rpx 30rpx 10rpx; font-size: 32rpx; font-weight: 500; text-align: center; }
.message { padding: 10rpx 30rpx 30rpx; font-size: 28rpx; color: $text-secondary; text-align: center; }
.actions { display: flex; border-top: 1rpx solid $uni-border-color; }
.btn {
  flex: 1; text-align: center; padding: 28rpx 0; font-size: 30rpx;
}
.btn.cancel { color: $text-secondary; border-right: 1rpx solid $uni-border-color; }
.btn.confirm { color: $brand-primary; }
</style>
```

Mount in `App.vue` once. Use anywhere:

```ts
const ui = useUIStore()
const ok = await ui.confirm('删除订单', '此操作不可撤销，是否继续？')
if (ok) await api.deleteOrder(id)
```

## Custom navigation bar (full implementation)

See `uniapp-routing-and-tabbar/references/custom-nav-bar.md` for the complete pattern
with status bar handling, scroll-driven title, and WeChat capsule alignment.

## References in this skill

> Some references are listed in the v1.0 plan but not yet shipped as separate files. Their
> content is currently **inline in this SKILL.md** for full coverage. They will be split
> out as the docs grow.

- `references/list-page.md` — *planned*: list page with all the edge cases (inline above)
- `references/form-page.md` — *planned*: validation library choice, error display, dirty
  tracking (inline above)
- `references/skeleton.md` — *planned*: design tips, animation timing (inline)
- `references/empty-state.md` — *planned*: copywriting guide for empty states (inline)
- `references/popup-and-toast.md` — *planned*: global toasts, modals, action sheets
  (inline)

## Examples in this skill

> v1.0 keeps the full implementations inline in SKILL.md. Standalone files are planned for
> v1.1 so they can be reused as copy-paste starting points.

- `examples/list-page.vue` — *planned* (currently inline above)
- `examples/form-page.vue` — *planned* (currently inline above)
- `examples/skeleton-component.vue` — *planned* (currently inline above)

## Resources

- uni-ui (official): https://uniapp.dcloud.net.cn/component/uniui/uni-ui.html
- uView UI: https://www.uviewui.com/
- FirstUI: https://www.firstui.cn/
- ThorUI: https://thorui.cn/

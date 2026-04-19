<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  placeholder?: string
  maxlength?: number
  showSearchBtn?: boolean
}>()

const emit = defineEmits<{
  (e: 'search', keyword: string): void
  (e: 'input', keyword: string): void
}>()

const keyword = ref('')
const focused = ref(false)

function onInput(e: any) {
  keyword.value = e.detail.value
  emit('input', keyword.value)
}

function onSearch() {
  if (keyword.value.trim()) {
    emit('search', keyword.value.trim())
  }
}

function onFocus() {
  focused.value = true
}

function onBlur() {
  focused.value = false
}

function onClear() {
  keyword.value = ''
  emit('input', '')
}
</script>

<template>
  <view :class="['search-input', focused && 'search-input--focused']">
    <text class="search-input__icon">🔍</text>
    <input class="search-input__field"
      v-model="keyword"
      :placeholder="props.placeholder || '搜索亲属'"
      :maxlength="props.maxlength || 50"
      confirm-type="search"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @confirm="onSearch" />
    <text v-if="keyword" class="search-input__clear" @tap="onClear">✕</text>
    <view v-if="props.showSearchBtn" class="search-input__btn" @tap="onSearch">
      搜索
    </view>
  </view>
</template>

<style lang="scss" scoped>
.search-input {
  display: flex; align-items: center; gap: $spacing-sm;
  padding: $spacing-sm $spacing-base; background: $color-bg-card;
  border-radius: $radius-lg; border: 2rpx solid transparent;
  transition: border-color 0.2s;

  &--focused { border-color: $color-primary; }
  &__icon { font-size: 32rpx; color: $color-text-placeholder; }
  &__field { flex: 1; font-size: $font-size-base; }
  &__clear { font-size: $font-size-sm; color: $color-text-placeholder; padding: 8rpx; }
  &__btn {
    padding: 8rpx 24rpx; border-radius: $radius-sm;
    background: $color-primary; color: #fff; font-size: $font-size-sm; white-space: nowrap;
  }
}
</style>
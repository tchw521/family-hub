<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFamilyStore } from '@/store/family'

const familyStore = useFamilyStore()
const viewMode = ref<'simple' | 'full'>('simple')
const familySide = ref<'paternal' | 'maternal' | 'spouse'>('paternal')

const sideOptions = [
  { key: 'paternal', label: '父系' },
  { key: 'maternal', label: '母系' },
  { key: 'spouse', label: '配偶家族' },
]

const currentRelatives = computed(() => familyStore.relativesBySide(familySide.value))
</script>

<template>
  <view class="family-tree">
    <!-- 模式切换 -->
    <view class="mode-switch">
      <view :class="['mode-switch__item', viewMode === 'simple' && 'mode-switch__item--active']" @tap="viewMode = 'simple'">简约</view>
      <view :class="['mode-switch__item', viewMode === 'full' && 'mode-switch__item--active']" @tap="viewMode = 'full'">完整</view>
    </view>

    <!-- 家族切换 -->
    <view class="side-tabs">
      <view v-for="s in sideOptions" :key="s.key"
        :class="['side-tab', familySide === s.key && 'side-tab--active']"
        @tap="familySide = s.key">
        {{ s.label }}
      </view>
    </view>

    <!-- 家族树 -->
    <view class="tree-container card">
      <view v-if="currentRelatives.length === 0" class="empty-state">
        <text class="empty-state__icon">🌳</text>
        <text class="empty-state__text">暂无{{ sideOptions.find(s => s.key === familySide)?.label }}亲属</text>
        <text class="empty-state__hint">添加亲属后，家族树将自动生成</text>
      </view>
      <view v-else class="tree-content">
        <!-- 家族树可视化占位 -->
        <view class="tree-placeholder">
          <text class="tree-placeholder__icon">🌳</text>
          <text class="tree-placeholder__text">家族树可视化开发中</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.family-tree { min-height: 100vh; padding-bottom: 180rpx; }

.mode-switch {
  display: flex; margin: $spacing-base; background: $color-bg-card;
  border-radius: $radius-base; padding: 4rpx;
  &__item {
    flex: 1; text-align: center; padding: 16rpx; border-radius: $radius-sm;
    font-size: $font-size-sm; color: $color-text-secondary; transition: all 0.2s;
    &--active { background: $color-primary; color: #fff; }
  }
}

.side-tabs {
  display: flex; gap: $spacing-sm; padding: 0 $spacing-base; margin-bottom: $spacing-base;
}
.side-tab {
  padding: 12rpx 32rpx; border-radius: $radius-lg; font-size: $font-size-sm;
  background: $color-bg-card; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; font-weight: 500; }
}

.tree-container { margin: 0 $spacing-base; min-height: 400rpx; }
.tree-placeholder {
  display: flex; flex-direction: column; align-items: center; padding: 80rpx 0;
  &__icon { font-size: 80rpx; margin-bottom: $spacing-sm; }
  &__text { color: $color-text-secondary; }
}
</style>

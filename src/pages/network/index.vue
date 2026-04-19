<script setup lang="ts">
import { ref } from 'vue'

// TODO: 从 API 获取人脉数据
const connections = ref<any[]>([])
const filterBy = ref<'all' | 'surname' | 'hometown' | 'distance'>('all')
</script>

<template>
  <view class="network">
    <view class="network-header">
      <text class="network-header__title">全国家族人脉</text>
      <text class="network-header__subtitle">通过婚姻关联，发现远方亲属</text>
    </view>

    <!-- 筛选 -->
    <view class="filters">
      <view :class="['filter-chip', filterBy === 'all' && 'filter-chip--active']" @tap="filterBy = 'all'">全部</view>
      <view :class="['filter-chip', filterBy === 'surname' && 'filter-chip--active']" @tap="filterBy = 'surname'">同姓</view>
      <view :class="['filter-chip', filterBy === 'hometown' && 'filter-chip--active']" @tap="filterBy = 'hometown'">同籍</view>
      <view :class="['filter-chip', filterBy === 'distance' && 'filter-chip--active']" @tap="filterBy = 'distance'">亲缘近</view>
    </view>

    <!-- 路径展示 -->
    <view v-if="connections.length === 0" class="empty-state">
      <text class="empty-state__icon">🌐</text>
      <text class="empty-state__text">添加更多亲属后解锁人脉网络</text>
      <text class="empty-state__hint">婚姻关联将自动延伸你的家族蛛网</text>
    </view>
    <view v-else class="connection-list">
      <!-- TODO: 人脉路径列表 -->
    </view>
  </view>
</template>

<style lang="scss" scoped>
.network { min-height: 100vh; }

.network-header {
  padding: $spacing-lg $spacing-base $spacing-base;
  &__title { display: block; font-size: $font-size-md; font-weight: 600; }
  &__subtitle { font-size: $font-size-sm; color: $color-text-secondary; }
}

.filters { display: flex; gap: $spacing-sm; padding: 0 $spacing-base $spacing-base; }
.filter-chip {
  padding: 12rpx 28rpx; border-radius: $radius-lg; font-size: $font-size-sm;
  background: $color-bg-card; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; }
}
</style>

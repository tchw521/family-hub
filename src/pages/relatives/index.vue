<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFamilyStore } from '@/store/family'

const familyStore = useFamilyStore()
const activeTab = ref<'all' | 'verified' | 'unverified'>('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'verified', label: '已验证' },
  { key: 'unverified', label: '未验证' },
]

const filteredRelatives = computed(() => {
  const list = familyStore.relatives
  if (activeTab.value === 'verified') return list.filter(r => r.verified)
  if (activeTab.value === 'unverified') return list.filter(r => !r.verified)
  return list
})
</script>

<template>
  <view class="relatives">
    <!-- 标签页 -->
    <view class="tabs">
      <view v-for="t in tabs" :key="t.key"
        :class="['tab', activeTab === t.key && 'tab--active']"
        @tap="activeTab = t.key">
        {{ t.label }}
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="actions">
      <view class="btn btn-primary" @tap="uni.navigateTo({ url: '/pages/relatives/add' })">手动添加</view>
      <view class="btn btn-secondary" @tap="uni.navigateTo({ url: '/pages/relatives/search' })">找亲属</view>
      <view class="btn btn-outline" @tap="uni.navigateTo({ url: '/pages/relatives/verify' })">验证管理</view>
    </view>

    <!-- 亲属列表 -->
    <view v-if="filteredRelatives.length === 0" class="empty-state">
      <text class="empty-state__icon">👥</text>
      <text class="empty-state__text">暂无亲属</text>
    </view>
    <view v-else class="relative-list">
      <view v-for="r in filteredRelatives" :key="r.id" class="relative-item">
        <view class="avatar">{{ r.name[0] }}</view>
        <view class="relative-item__info">
          <text class="relative-item__name">{{ r.name }}</text>
          <text class="relative-item__relation">{{ r.relationLabel }}</text>
        </view>
        <view :class="['tag', r.verified ? 'tag-verified' : 'tag-unverified']">
          {{ r.verified ? '已验证' : '未验证' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.relatives { min-height: 100vh; padding-bottom: 180rpx; }

.tabs {
  display: flex; gap: $spacing-sm; padding: $spacing-base;
}
.tab {
  padding: 12rpx 32rpx; border-radius: $radius-lg; font-size: $font-size-sm;
  background: $color-bg-card; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; font-weight: 500; }
}

.actions {
  display: flex; gap: $spacing-sm; padding: 0 $spacing-base $spacing-base;
}

.relative-item {
  display: flex; align-items: center; padding: $spacing-base;
  background: $color-bg-card; border-bottom: 1rpx solid $color-divider;
  margin: 0 $spacing-base;
  &__info { flex: 1; margin-left: $spacing-base; }
  &__name { display: block; font-size: $font-size-base; font-weight: 500; }
  &__relation { font-size: $font-size-sm; color: $color-text-secondary; }
}
</style>

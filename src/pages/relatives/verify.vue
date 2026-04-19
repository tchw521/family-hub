<script setup lang="ts">
import { ref, computed } from 'vue'

const activeTab = ref<'pending' | 'sent'>('pending')

// TODO: 从 API 获取验证数据
const pendingList = ref<any[]>([])
const sentList = ref<any[]>([])

const currentList = computed(() => activeTab.value === 'pending' ? pendingList.value : sentList.value)

function onAccept(item: any) {
  uni.showModal({
    title: '确认通过',
    content: `确认 ${item.fromName} 是你的${item.relation}？`,
    success: (res) => {
      if (res.confirm) {
        // TODO: 调用通过 API
        uni.showToast({ title: '已通过验证', icon: 'success' })
      }
    }
  })
}

function onReject(item: any) {
  uni.showActionSheet({
    itemList: ['无此关系', '信息错误', '不想关联'],
    success: (res) => {
      // TODO: 调用拒绝 API
      uni.showToast({ title: '已拒绝', icon: 'none' })
    }
  })
}
</script>

<template>
  <view class="verify">
    <!-- 标签 -->
    <view class="tabs">
      <view :class="['tab', activeTab === 'pending' && 'tab--active']" @tap="activeTab = 'pending'">
        待我审核 ({{ pendingList.length }})
      </view>
      <view :class="['tab', activeTab === 'sent' && 'tab--active']" @tap="activeTab = 'sent'">
        我发起的 ({{ sentList.length }})
      </view>
    </view>

    <!-- 列表 -->
    <view v-if="currentList.length === 0" class="empty-state">
      <text class="empty-state__icon">✅</text>
      <text class="empty-state__text">{{ activeTab === 'pending' ? '暂无待审核请求' : '暂无已发起请求' }}</text>
    </view>
    <view v-else class="verify-list">
      <view v-for="item in currentList" :key="item.id" class="verify-item card">
        <view class="verify-item__header">
          <view class="avatar">{{ (item.fromName || item.toName)[0] }}</view>
          <view class="verify-item__info">
            <text class="verify-item__name">{{ item.fromName || item.toName }}</text>
            <text class="verify-item__relation">声称关系：{{ item.relation }}</text>
          </view>
        </view>
        <view class="verify-item__msg">{{ item.message }}</view>
        <view v-if="activeTab === 'pending'" class="verify-item__actions">
          <view class="btn btn-primary" @tap="onAccept(item)">通过</view>
          <view class="btn btn-outline" @tap="onReject(item)">拒绝</view>
        </view>
        <view v-else class="verify-item__status">
          <text :class="['tag', `tag-${item.status === 'pending' ? 'unverified' : item.status === 'approved' ? 'verified' : 'unverified'}`]">
            {{ item.status === 'pending' ? '待审核' : item.status === 'approved' ? '已通过' : '已拒绝' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.verify { min-height: 100vh; }

.tabs { display: flex; border-bottom: 1rpx solid $color-divider; background: $color-bg-card; }
.tab {
  flex: 1; text-align: center; padding: 24rpx; font-size: $font-size-base;
  color: $color-text-secondary; position: relative;
  &--active { color: $color-primary; font-weight: 600;
    &::after { content: ''; position: absolute; bottom: 0; left: 30%; right: 30%; height: 4rpx; background: $color-primary; border-radius: 2rpx; }
  }
}

.verify-list { padding: $spacing-base; }
.verify-item {
  &__header { display: flex; align-items: center; margin-bottom: $spacing-sm; }
  &__info { flex: 1; margin-left: $spacing-base; }
  &__name { display: block; font-weight: 500; }
  &__relation { font-size: $font-size-sm; color: $color-text-secondary; }
  &__msg { font-size: $font-size-sm; color: $color-secondary; padding: $spacing-sm 0; background: $color-bg; border-radius: $radius-sm; padding: $spacing-sm $spacing-base; margin-bottom: $spacing-sm; }
  &__actions { display: flex; gap: $spacing-sm; }
}
</style>

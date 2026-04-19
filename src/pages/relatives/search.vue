<script setup lang="ts">
import { ref } from 'vue'

const searchKey = ref('')
const searchType = ref<'name' | 'phone' | 'hometown' | 'surname'>('name')

const searchTypes = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手机号' },
  { key: 'hometown', label: '籍贯' },
  { key: 'surname', label: '姓氏' },
]

const results = ref<any[]>([])
const searched = ref(false)

function onSearch() {
  if (!searchKey.value.trim()) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' })
    return
  }
  searched.value = true
  // TODO: 调用搜索 API
  results.value = []
}

function onVerify(user: any) {
  uni.showModal({
    title: '发起验证',
    editable: true,
    placeholderText: '请输入关系说明，如"我是你的表妹XXX"',
    success: (res) => {
      if (res.confirm && res.content) {
        // TODO: 调用验证 API
        uni.showToast({ title: '验证请求已发送', icon: 'success' })
      }
    }
  })
}
</script>

<template>
  <view class="search-relative">
    <!-- 搜索类型 -->
    <view class="search-types">
      <view v-for="t in searchTypes" :key="t.key"
        :class="['type-chip', searchType === t.key && 'type-chip--active']"
        @tap="searchType = t.key">
        {{ t.label }}
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-bar card">
      <input class="search-bar__input" v-model="searchKey"
        :placeholder="`输入${searchTypes.find(t => t.key === searchType)?.label}搜索`"
        confirm-type="search" @confirm="onSearch" />
      <view class="search-bar__btn" @tap="onSearch">搜索</view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="!searched" class="empty-state">
      <text class="empty-state__icon">🔍</text>
      <text class="empty-state__text">输入信息搜索你的亲属</text>
    </view>
    <view v-else-if="results.length === 0" class="empty-state">
      <text class="empty-state__icon">🤷</text>
      <text class="empty-state__text">未找到匹配的用户</text>
    </view>
    <view v-else class="result-list">
      <view v-for="u in results" :key="u.id" class="result-item card">
        <view class="avatar">{{ u.name[0] }}</view>
        <view class="result-item__info">
          <text class="result-item__name">{{ u.name }}</text>
          <text class="result-item__meta">{{ u.hometown }} · {{ u.relationHint }}</text>
        </view>
        <view class="btn btn-secondary" @tap="onVerify(u)">验证</view>
      </view>
    </view>

    <!-- 提示 -->
    <view class="tip">
      <text class="tip__text">💡 验证通过后，双方家族树将自动同步</text>
      <text class="tip__text">🔒 同一用户每天最多发起2次验证请求</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.search-relative { min-height: 100vh; padding: $spacing-base; }

.search-types { display: flex; gap: $spacing-sm; margin-bottom: $spacing-base; }
.type-chip {
  padding: 12rpx 28rpx; border-radius: $radius-lg; font-size: $font-size-sm;
  background: $color-bg-card; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; }
}

.search-bar {
  display: flex; align-items: center; gap: $spacing-sm; padding: $spacing-sm $spacing-base;
  &__input { flex: 1; font-size: $font-size-base; }
  &__btn {
    padding: 12rpx 32rpx; border-radius: $radius-lg;
    background: $color-primary; color: #fff; font-size: $font-size-sm; white-space: nowrap;
  }
}

.result-item {
  display: flex; align-items: center; padding: $spacing-base;
  &__info { flex: 1; margin-left: $spacing-base; }
  &__name { display: block; font-weight: 500; }
  &__meta { font-size: $font-size-sm; color: $color-text-secondary; }
}

.tip {
  margin-top: $spacing-lg; padding: $spacing-base; background: $color-primary-light;
  border-radius: $radius-base;
  &__text { display: block; font-size: $font-size-sm; color: $color-secondary; line-height: 1.8; }
}
</style>

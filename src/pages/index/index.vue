<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useFamilyStore } from '@/store/family'
import { WebChart } from '@/components'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const showAddSheet = ref(false)
const searchKeyword = ref('')

const addOptions = [
  { icon: '👤', text: '手动添加', desc: '快速添加亲属信息', action: 'manual' },
  { icon: '🔍', text: '找亲属', desc: '搜索并验证关联', action: 'search' },
]

// 检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    uni.redirectTo({ url: '/pages/auth/login' })
  }
  // 加载亲属数据
  familyStore.loadRelatives()
})

const stats = computed(() => familyStore.stats)
const pendingCount = computed(() => familyStore.pendingVerifyCount)

function onAdd() {
  showAddSheet.value = true
}

function onSelectAdd(action: string) {
  showAddSheet.value = false
  if (action === 'manual') {
    uni.navigateTo({ url: '/pages/relatives/add' })
  } else {
    uni.navigateTo({ url: '/pages/relatives/search' })
  }
}

function onViewNotifications() {
  uni.navigateTo({ url: '/pages/relatives/verify' })
}
</script>

<template>
  <view class="home">
    <!-- 顶部自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-bar__title">家族互联</view>
      <view class="nav-bar__actions">
        <view class="nav-bar__btn" @tap="onViewNotifications">
          <text class="nav-bar__icon">🔔</text>
          <view v-if="pendingCount > 0" class="nav-bar__badge">{{ pendingCount }}</view>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="search-bar__icon">🔍</text>
        <input class="search-bar__input" v-model="searchKeyword"
          placeholder="搜索亲属姓名" confirm-type="search"
          @confirm="uni.navigateTo({ url: '/pages/relatives/search' })" />
        <text class="search-bar__link" @tap="uni.navigateTo({ url: '/pages/relatives/search' })">找亲属</text>
      </view>
    </view>

    <!-- 蛛网可视化区域 -->
    <view class="web-section card">
      <view class="web-section__header">
        <text class="web-section__title">我的家族蛛网</text>
        <text class="web-section__subtitle">共 {{ stats.total }} 位亲属</text>
      </view>
      <WebChart v-if="stats.total > 0" />
      <view v-else class="web-placeholder">
        <text class="web-placeholder__icon">🕸️</text>
        <text class="web-placeholder__text">还没有亲属</text>
        <text class="web-placeholder__hint">点击下方按钮添加第一位亲属吧</text>
      </view>
    </view>

    <!-- 快捷统计 -->
    <view class="stats-row">
      <view class="stat-item card" @tap="uni.switchTab({ url: '/pages/family-tree/index' })">
        <text class="stat-item__num">{{ stats.verified }}</text>
        <text class="stat-item__label">已验证</text>
      </view>
      <view class="stat-item card" @tap="uni.navigateTo({ url: '/pages/relatives/verify' })">
        <text class="stat-item__num">{{ stats.unverified }}</text>
        <text class="stat-item__label">待验证</text>
      </view>
      <view class="stat-item card" @tap="uni.switchTab({ url: '/pages/network/index' })">
        <text class="stat-item__num">{{ stats.familyCount }}</text>
        <text class="stat-item__label">家族数</text>
      </view>
    </view>

    <!-- 最近亲属 -->
    <view class="section">
      <view class="section__header">
        <text class="section__title">最近添加</text>
        <text class="section__more" @tap="uni.switchTab({ url: '/pages/relatives/index' })">查看全部 ›</text>
      </view>
      <view v-if="familyStore.recentRelatives.length === 0" class="empty-state">
        <text class="empty-state__icon">🌱</text>
        <text class="empty-state__text">还没有亲属，快去添加吧</text>
      </view>
      <view v-else class="relative-list">
        <view v-for="r in familyStore.recentRelatives" :key="r.id" class="relative-item">
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

    <!-- 添加亲属按钮（浮动） -->
    <view class="fab" @tap="onAdd">
      <text class="fab__icon">＋</text>
    </view>

    <!-- 添加方式弹窗 -->
    <view v-if="showAddSheet" class="sheet-mask" @tap="showAddSheet = false">
      <view class="sheet" @tap.stop>
        <view class="sheet__header">
          <text class="sheet__title">添加亲属</text>
          <text class="sheet__close" @tap="showAddSheet = false">✕</text>
        </view>
        <view v-for="opt in addOptions" :key="opt.action" class="sheet__option" @tap="onSelectAdd(opt.action)">
          <text class="sheet__option-icon">{{ opt.icon }}</text>
          <view class="sheet__option-text">
            <text class="sheet__option-title">{{ opt.text }}</text>
            <text class="sheet__option-desc">{{ opt.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home { min-height: 100vh; padding-bottom: 180rpx; }

.nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 60rpx 32rpx 24rpx;
  background: $color-bg;

  &__title { font-size: $font-size-lg; font-weight: 700; color: $color-text; }
  &__actions { display: flex; gap: 24rpx; }
  &__btn { position: relative; padding: 8rpx; }
  &__icon { font-size: 40rpx; }
  &__badge {
    position: absolute; top: -4rpx; right: -8rpx;
    background: $color-danger; color: #fff; font-size: 18rpx;
    min-width: 28rpx; height: 28rpx; border-radius: 14rpx;
    display: flex; align-items: center; justify-content: center;
    padding: 0 6rpx;
  }
}

.search-section { padding: 0 $spacing-base $spacing-sm; }
.search-bar {
  display: flex; align-items: center; gap: $spacing-sm;
  padding: $spacing-sm $spacing-base; background: $color-bg-card;
  border-radius: $radius-lg;
  &__icon { font-size: 32rpx; color: $color-text-placeholder; }
  &__input { flex: 1; font-size: $font-size-base; }
  &__link { font-size: $font-size-sm; color: $color-primary; white-space: nowrap; }
}

.web-section {
  margin: 0 $spacing-base $spacing-base;
  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-sm; }
  &__title { font-size: $font-size-md; font-weight: 600; }
  &__subtitle { font-size: $font-size-sm; color: $color-text-secondary; }
}

.web-placeholder {
  display: flex; flex-direction: column; align-items: center;
  padding: 60rpx 0;
  &__icon { font-size: 80rpx; margin-bottom: $spacing-sm; }
  &__text { font-size: $font-size-base; color: $color-text-secondary; margin-bottom: $spacing-xs; }
  &__hint { font-size: $font-size-sm; color: $color-text-placeholder; }
}

.stats-row { display: flex; gap: $spacing-sm; padding: 0 $spacing-base; margin-bottom: $spacing-base; }
.stat-item {
  flex: 1; text-align: center; padding: $spacing-base $spacing-sm;
  &__num { display: block; font-size: $font-size-xl; font-weight: 700; color: $color-primary; }
  &__label { font-size: $font-size-xs; color: $color-text-secondary; }
}

.section {
  padding: 0 $spacing-base;
  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-sm; }
  &__title { font-size: $font-size-md; font-weight: 600; }
  &__more { font-size: $font-size-sm; color: $color-primary; }
}

.relative-item {
  display: flex; align-items: center; padding: $spacing-base;
  background: $color-bg-card; border-radius: $radius-base; margin-bottom: $spacing-sm;
  &__info { flex: 1; margin-left: $spacing-base; }
  &__name { display: block; font-size: $font-size-base; font-weight: 500; }
  &__relation { font-size: $font-size-sm; color: $color-text-secondary; }
}

.fab {
  position: fixed; right: 40rpx; bottom: 200rpx;
  width: 100rpx; height: 100rpx; border-radius: $radius-round;
  background: $color-primary; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(242, 140, 56, 0.4);
  &__icon { font-size: 48rpx; color: #fff; font-weight: 300; }
}

.sheet-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 999;
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; background: $color-bg-card; border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-base $spacing-base calc(env(safe-area-inset-bottom) + 32rpx);
  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-base; }
  &__title { font-size: $font-size-md; font-weight: 600; }
  &__close { font-size: $font-size-md; color: $color-text-secondary; padding: 8rpx; }
  &__option {
    display: flex; align-items: center; padding: $spacing-base;
    border-radius: $radius-base; margin-bottom: $spacing-sm;
    background: $color-bg;
    &:active { background: $color-divider; }
  }
  &__option-icon { font-size: 48rpx; margin-right: $spacing-base; }
  &__option-title { display: block; font-size: $font-size-base; font-weight: 500; }
  &__option-desc { display: block; font-size: $font-size-sm; color: $color-text-secondary; }
}
</style>

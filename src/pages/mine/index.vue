<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useFamilyStore } from '@/store/family'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const menuItems = [
  { icon: '📋', label: '个人档案', url: '/pages/mine/profile' },
  { icon: '🔒', label: '隐私设置', url: '/pages/mine/privacy' },
  { icon: '🛡️', label: '权限管理', url: '', tip: '开发中' },
  { icon: '💌', label: '邀请家人', url: '/pages/mine/invite' },
  { icon: '❓', label: '帮助中心', url: '', tip: '开发中' },
  { icon: '⚙️', label: '设置', url: '', tip: '开发中' },
]

const stats = computed(() => familyStore.stats)

function onLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    confirmColor: '#E85D3A',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/auth/login' })
      }
    }
  })
}

function onMenuTap(item: any) {
  if (!item.url) {
    uni.showToast({ title: `${item.label}开发中`, icon: 'none' })
    return
  }
  uni.navigateTo({ url: item.url })
}
</script>

<template>
  <view class="mine">
    <!-- 用户卡片 -->
    <view class="user-card" @tap="uni.navigateTo({ url: '/pages/mine/profile' })">
      <view class="user-card__bg"></view>
      <view class="user-card__content">
        <view class="avatar" style="width:120rpx;height:120rpx;font-size:48rpx;">
          {{ userStore.user?.name?.[0] || '?' }}
        </view>
        <view class="user-card__info">
          <text class="user-card__name">{{ userStore.user?.name || '未登录' }}</text>
          <text class="user-card__id">{{ userStore.user?.phone ? `已绑定手机 ${userStore.user.phone}` : '点击登录' }}</text>
        </view>
        <text class="user-card__arrow">›</text>
      </view>
      <!-- 统计 -->
      <view class="user-card__stats">
        <view class="user-card__stat">
          <text class="user-card__stat-num">{{ stats.total }}</text>
          <text class="user-card__stat-label">亲属</text>
        </view>
        <view class="user-card__stat">
          <text class="user-card__stat-num">{{ stats.verified }}</text>
          <text class="user-card__stat-label">已验证</text>
        </view>
        <view class="user-card__stat">
          <text class="user-card__stat-num">{{ stats.familyCount }}</text>
          <text class="user-card__stat-label">家族</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu card">
      <view v-for="item in menuItems" :key="item.label" class="menu-item" @tap="onMenuTap(item)">
        <text class="menu-item__icon">{{ item.icon }}</text>
        <view class="menu-item__label-wrap">
          <text class="menu-item__label">{{ item.label }}</text>
          <text v-if="item.tip" class="menu-item__tip">{{ item.tip }}</text>
        </view>
        <text class="menu-item__arrow">›</text>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version">
      <text class="version__text">家族互联 v0.1.0</text>
    </view>

    <!-- 退出 -->
    <view class="logout" @tap="onLogout">
      <text class="logout__text">退出登录</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.mine { min-height: 100vh; background: $color-bg; }

.user-card {
  position: relative; padding: $spacing-md;
  &__bg { position: absolute; top: 0; left: 0; right: 0; height: 200rpx; background: linear-gradient(135deg, $color-primary, #F5A623); }
  &__content { position: relative; display: flex; align-items: center; padding-top: 40rpx; }
  &__info { flex: 1; margin-left: $spacing-base; }
  &__name { display: block; font-size: $font-size-lg; font-weight: 700; color: #fff; }
  &__id { display: block; font-size: $font-size-sm; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
  &__arrow { font-size: $font-size-lg; color: rgba(255,255,255,0.6); }
  &__stats {
    position: relative; display: flex; margin-top: $spacing-md;
    padding-top: $spacing-md; border-top: 1rpx solid rgba(255,255,255,0.2);
  }
  &__stat { flex: 1; text-align: center; }
  &__stat-num { display: block; font-size: $font-size-lg; font-weight: 700; color: #fff; }
  &__stat-label { font-size: $font-size-xs; color: rgba(255,255,255,0.7); }
}

.menu { margin: $spacing-base; padding: 0; }
.menu-item {
  display: flex; align-items: center; padding: $spacing-md;
  border-bottom: 1rpx solid $color-divider;
  &:last-child { border-bottom: none; }
  &:active { background: $color-bg; }
  &__icon { font-size: 36rpx; margin-right: $spacing-base; }
  &__label-wrap { flex: 1; }
  &__label { font-size: $font-size-base; }
  &__tip { display: block; font-size: $font-size-xs; color: $color-text-placeholder; margin-top: 4rpx; }
  &__arrow { color: $color-text-placeholder; }
}

.version { text-align: center; padding: $spacing-lg 0 $spacing-sm; }
.version__text { font-size: $font-size-xs; color: $color-text-placeholder; }

.logout {
  margin: 0 $spacing-base $spacing-base; text-align: center; padding: $spacing-md;
  background: $color-bg-card; border-radius: $radius-base;
  &__text { color: $color-danger; font-size: $font-size-base; }
}
</style>
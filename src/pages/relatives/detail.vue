<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFamilyStore } from '@/store/family'
import { calcAge, maskPhone, timeAgo } from '@/utils'

const familyStore = useFamilyStore()
const relativeId = ref('')
const relative = computed(() => familyStore.relatives.find(r => r.id === relativeId.value))

onLoad((options) => {
  if (options?.id) relativeId.value = options.id
})

function onVerify() {
  uni.navigateTo({ url: `/pages/relatives/verify` })
}

function onChat() {
  uni.showToast({ title: '聊天功能开发中', icon: 'none' })
}

function onEdit() {
  uni.navigateTo({ url: `/pages/relatives/edit?id=${relativeId.value}` })
}

function onDelete() {
  uni.showModal({
    title: '确认删除',
    content: `确定删除亲属"${relative.value?.name}"吗？此操作不可撤销。`,
    confirmColor: '#E85D3A',
    success: (res) => {
      if (res.confirm) {
        familyStore.removeRelative(relativeId.value)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    }
  })
}

function onShare() {
  uni.showActionSheet({
    itemList: ['分享到微信', '分享到朋友圈', '生成关系卡片'],
    success: (res) => {
      if (res.tapIndex === 2) {
        uni.showToast({ title: '关系卡片生成中', icon: 'none' })
      } else {
        uni.showToast({ title: '分享功能开发中', icon: 'none' })
      }
    }
  })
}

function onViewPath() {
  uni.navigateTo({ url: '/pages/network/index' })
}

const menuActions = [
  { icon: '✏️', label: '编辑信息', action: 'edit' },
  { icon: '🔗', label: '查看关系路径', action: 'path' },
  { icon: '📤', label: '分享', action: 'share' },
  { icon: '💬', label: '发起聊天', action: 'chat' },
  { icon: '🗑️', label: '删除亲属', action: 'delete', danger: true },
]
</script>

<template>
  <view class="detail" v-if="relative">
    <!-- 头部信息卡 -->
    <view class="profile-card">
      <view class="profile-card__bg"></view>
      <view class="profile-card__content">
        <view :class="['avatar avatar--lg', `avatar--${relative.gender}`]">
          {{ relative.name[0] }}
        </view>
        <view class="profile-card__info">
          <view class="profile-card__name-row">
            <text class="profile-card__name">{{ relative.name }}</text>
            <view :class="['tag', relative.verified ? 'tag-verified' : 'tag-unverified']">
              {{ relative.verified ? '已验证' : '未验证' }}
            </view>
          </view>
          <text class="profile-card__relation">{{ relative.relationLabel }}</text>
          <text class="profile-card__side">
            {{ relative.side === 'paternal' ? '父系家族' : relative.side === 'maternal' ? '母系家族' : '配偶家族' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="section card">
      <text class="section__title">基本信息</text>
      <view class="info-list">
        <view v-if="relative.gender" class="info-item">
          <text class="info-item__label">性别</text>
          <text class="info-item__value">{{ relative.gender === 'male' ? '男' : '女' }}</text>
        </view>
        <view v-if="relative.birthday" class="info-item">
          <text class="info-item__label">生日</text>
          <text class="info-item__value">{{ relative.birthday }}（{{ calcAge(relative.birthday) }}岁）</text>
        </view>
        <view v-if="relative.hometown" class="info-item">
          <text class="info-item__label">籍贯</text>
          <text class="info-item__value">{{ relative.hometown }}</text>
        </view>
        <view v-if="relative.phone" class="info-item">
          <text class="info-item__label">手机号</text>
          <text class="info-item__value">{{ relative.verified ? relative.phone : maskPhone(relative.phone) }}</text>
        </view>
        <view class="info-item">
          <text class="info-item__label">添加时间</text>
          <text class="info-item__value">{{ timeAgo(relative.createdAt) }}</text>
        </view>
      </view>
    </view>

    <!-- 未验证提示 -->
    <view v-if="!relative.verified" class="verify-tip card">
      <view class="verify-tip__header">
        <text class="verify-tip__icon">⚠️</text>
        <text class="verify-tip__title">此亲属尚未验证</text>
      </view>
      <text class="verify-tip__desc">未验证的亲属仅自己可见，不纳入家族蛛网和公开列表。验证后可自动同步双方家族关系。</text>
      <view class="verify-tip__actions">
        <view class="btn btn-primary" @tap="onVerify">发起验证</view>
      </view>
    </view>

    <!-- 操作菜单 -->
    <view class="menu card">
      <view v-for="item in menuActions" :key="item.action"
        :class="['menu-item', item.danger && 'menu-item--danger']"
        @tap="item.action === 'edit' ? onEdit() : item.action === 'path' ? onViewPath() : item.action === 'share' ? onShare() : item.action === 'chat' ? onChat() : onDelete()">
        <text class="menu-item__icon">{{ item.icon }}</text>
        <text class="menu-item__label">{{ item.label }}</text>
        <text class="menu-item__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail { min-height: 100vh; background: $color-bg; }

.profile-card {
  position: relative; padding: 60rpx $spacing-md $spacing-md;
  &__bg {
    position: absolute; top: 0; left: 0; right: 0; height: 240rpx;
    background: linear-gradient(135deg, $color-primary, #F5A623);
  }
  &__content {
    position: relative; display: flex; align-items: center;
  }
  &__info { margin-left: $spacing-md; }
  &__name-row { display: flex; align-items: center; gap: $spacing-sm; }
  &__name { font-size: $font-size-xl; font-weight: 700; color: #fff; }
  &__relation { display: block; font-size: $font-size-md; color: rgba(255,255,255,0.9); margin-top: 8rpx; }
  &__side { display: block; font-size: $font-size-sm; color: rgba(255,255,255,0.7); margin-top: 4rpx; }
}

.avatar--lg { width: 120rpx; height: 120rpx; font-size: 44rpx; }
.avatar--male { background: rgba(255,255,255,0.9); color: #4A4540; }
.avatar--female { background: rgba(255,255,255,0.9); color: $color-primary; }

.section {
  margin: $spacing-base; padding: $spacing-md;
  &__title { font-size: $font-size-md; font-weight: 600; margin-bottom: $spacing-sm; }
}

.info-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: $spacing-sm 0; border-bottom: 1rpx solid $color-divider;
  &:last-child { border-bottom: none; }
  &__label { font-size: $font-size-base; color: $color-text-secondary; }
  &__value { font-size: $font-size-base; color: $color-text; }
}

.verify-tip {
  margin: 0 $spacing-base $spacing-base; padding: $spacing-md;
  background: rgba(242, 140, 56, 0.08); border: 2rpx solid rgba(242, 140, 56, 0.2);
  &__header { display: flex; align-items: center; gap: $spacing-sm; margin-bottom: $spacing-sm; }
  &__icon { font-size: 36rpx; }
  &__title { font-size: $font-size-base; font-weight: 600; color: $color-primary; }
  &__desc { font-size: $font-size-sm; color: $color-text-secondary; line-height: 1.6; }
  &__actions { margin-top: $spacing-base; }
}

.menu { margin: 0 $spacing-base; padding: 0; }
.menu-item {
  display: flex; align-items: center; padding: $spacing-md;
  border-bottom: 1rpx solid $color-divider;
  &:last-child { border-bottom: none; }
  &--danger .menu-item__label { color: $color-danger; }
  &__icon { font-size: 36rpx; margin-right: $spacing-base; }
  &__label { flex: 1; font-size: $font-size-base; }
  &__arrow { color: $color-text-placeholder; }
}
</style>
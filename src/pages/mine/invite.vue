<script setup lang="ts">
import { ref } from 'vue'

const inviteCode = ref('')
const generated = ref(false)

function onGenerate() {
  // TODO: 调用 API 生成邀请码
  inviteCode.value = `FH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  generated.value = true
}

function onCopy() {
  uni.setClipboardData({
    data: `家族互联邀请码：${inviteCode.value}\n下载APP加入我们的家族吧！`,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}

function onShareWeChat() {
  uni.showToast({ title: '分享到微信开发中', icon: 'none' })
}

function onSharePoster() {
  uni.showToast({ title: '生成邀请海报开发中', icon: 'none' })
}

const rewardList = [
  { icon: '🕸️', title: '蛛网皮肤', desc: '邀请3位家人解锁' },
  { icon: '📌', title: '家族圈置顶', desc: '邀请5位家人解锁' },
  { icon: '🎨', title: '专属头像框', desc: '邀请10位家人解锁' },
  { icon: '👑', title: '家族族长称号', desc: '邀请20位家人解锁' },
]
</script>

<template>
  <view class="invite">
    <!-- 邀请码 -->
    <view class="invite-card card">
      <view class="invite-card__header">
        <text class="invite-card__title">💌 邀请家人</text>
        <text class="invite-card__subtitle">邀请家人加入，解锁专属权益</text>
      </view>

      <view v-if="!generated" class="invite-card__generate">
        <view class="btn btn-primary" @tap="onGenerate">生成专属邀请码</view>
      </view>
      <view v-else class="invite-card__code">
        <text class="invite-card__code-text">{{ inviteCode }}</text>
        <view class="invite-card__actions">
          <view class="btn btn-secondary" @tap="onCopy">复制邀请码</view>
          <view class="btn btn-outline" @tap="onShareWeChat">分享到微信</view>
          <view class="btn btn-outline" @tap="onSharePoster">生成海报</view>
        </view>
      </view>
    </view>

    <!-- 邀请奖励 -->
    <view class="section">
      <text class="section__title">邀请奖励</text>
      <view class="reward-list">
        <view v-for="item in rewardList" :key="item.title" class="reward-item card">
          <text class="reward-item__icon">{{ item.icon }}</text>
          <view class="reward-item__info">
            <text class="reward-item__title">{{ item.title }}</text>
            <text class="reward-item__desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 邀请记录 -->
    <view class="section">
      <text class="section__title">邀请记录</text>
      <view class="empty-state">
        <text class="empty-state__icon">📋</text>
        <text class="empty-state__text">暂无邀请记录</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.invite { min-height: 100vh; padding: $spacing-base; }
.invite-card { padding: $spacing-md;
  &__header { text-align: center; margin-bottom: $spacing-md; }
  &__title { display: block; font-size: $font-size-lg; font-weight: 600; }
  &__subtitle { display: block; font-size: $font-size-sm; color: $color-text-secondary; margin-top: 8rpx; }
  &__generate { padding: $spacing-lg 0; }
  &__code { text-align: center; }
  &__code-text {
    display: inline-block; padding: $spacing-sm $spacing-md;
    background: $color-bg; border-radius: $radius-base;
    font-size: $font-size-xl; font-weight: 700; color: $color-primary;
    letter-spacing: 8rpx; margin-bottom: $spacing-base;
  }
  &__actions { display: flex; gap: $spacing-sm; justify-content: center; flex-wrap: wrap; }
}
.section { padding: 0 0 $spacing-md;
  &__title { font-size: $font-size-md; font-weight: 600; margin-bottom: $spacing-sm; }
}
.reward-list { display: flex; gap: $spacing-sm; overflow-x: auto; padding-bottom: $spacing-sm; }
.reward-item {
  min-width: 200rpx; padding: $spacing-base; text-align: center; flex-shrink: 0;
  &__icon { font-size: 48rpx; display: block; margin-bottom: $spacing-sm; }
  &__title { display: block; font-size: $font-size-sm; font-weight: 500; }
  &__desc { display: block; font-size: $font-size-xs; color: $color-text-secondary; margin-top: 4rpx; }
}
</style>
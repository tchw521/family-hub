<script setup lang="ts">
import { ref } from 'vue'

// TODO: 从 API 获取家族圈数据
const posts = ref<any[]>([])
const showPost = ref(false)
const newPost = ref({ content: '', images: [] as string[] })

function onLike(post: any) {
  // TODO: 调用点赞 API
}

function onPublish() {
  if (!newPost.value.content.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  // TODO: 调用发布 API
  uni.showToast({ title: '发布成功', icon: 'success' })
  showPost.value = false
  newPost.value = { content: '', images: [] }
}
</script>

<template>
  <view class="circle">
    <!-- 顶部 -->
    <view class="circle-header">
      <text class="circle-header__title">家族圈</text>
      <view class="btn btn-primary" @tap="showPost = true">发布</view>
    </view>

    <!-- 内容流 -->
    <view v-if="posts.length === 0" class="empty-state">
      <text class="empty-state__icon">💬</text>
      <text class="empty-state__text">家族圈还没有动态</text>
      <text class="empty-state__hint">分享一张家族照片吧</text>
    </view>
    <view v-else class="post-list">
      <!-- TODO: 动态列表 -->
    </view>

    <!-- 发布弹窗 -->
    <view v-if="showPost" class="sheet-mask" @tap="showPost = false">
      <view class="sheet" @tap.stop>
        <view class="sheet__header">
          <text class="sheet__title">发布动态</text>
          <text class="sheet__close" @tap="showPost = false">✕</text>
        </view>
        <textarea class="post-input" v-model="newPost.content" placeholder="分享家族故事..." maxlength="500" />
        <view class="post-actions">
          <view class="post-actions__tool">📷 照片</view>
          <view class="post-actions__tool">🎬 视频</view>
          <view class="post-actions__tool">👤 @亲属</view>
        </view>
        <view class="btn btn-primary" @tap="onPublish">发布</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.circle { min-height: 100vh; }

.circle-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: $spacing-base; background: $color-bg-card;
  &__title { font-size: $font-size-md; font-weight: 600; }
}

.post-input {
  width: 100%; min-height: 200rpx; font-size: $font-size-base;
  padding: $spacing-base; border-radius: $radius-base; background: $color-bg;
}

.post-actions {
  display: flex; gap: $spacing-base; padding: $spacing-sm 0;
  &__tool {
    padding: 12rpx 24rpx; background: $color-bg; border-radius: $radius-lg;
    font-size: $font-size-sm; color: $color-text-secondary;
  }
}

.sheet-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; background: $color-bg-card; border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-base;
  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-base; }
  &__title { font-size: $font-size-md; font-weight: 600; }
  &__close { font-size: $font-size-md; color: $color-text-secondary; }
}
</style>

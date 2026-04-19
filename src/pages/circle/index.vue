<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useFamilyStore } from '@/store/family'
import { circleApi } from '@/api'
import { chooseAndUploadImages, chooseAndUploadVideo, getFileURLs, previewImage } from '@/utils/upload'

const userStore = useUserStore()
const familyStore = useFamilyStore()

const posts = ref<any[]>([])
const showPost = ref(false)
const newPost = ref({ content: '', images: [] as string[], video: '', visibility: 'all' })
const imagePreviewUrls = ref<string[]>([])
const loading = ref(false)

// 加载动态
async function loadPosts() {
  if (!userStore.user) return
  loading.value = true
  try {
    const res = await circleApi.list(userStore.user.id)
    if (res?.code === 0 && res?.data) {
      posts.value = res.data
      // 获取图片临时链接
      const allImages = posts.value.flatMap((p: any) => p.images || [])
      if (allImages.length > 0) {
        imagePreviewUrls.value = await getFileURLs(allImages)
      }
    }
  } catch (e) {
    console.error('加载动态失败', e)
  }
  loading.value = false
}

// 选择图片
async function onChooseImage() {
  const cloudPaths = await chooseAndUploadImages(9 - newPost.value.images.length)
  newPost.value.images.push(...cloudPaths)
}

// 选择视频
async function onChooseVideo() {
  const videoPath = await chooseAndUploadVideo()
  if (videoPath) newPost.value.video = videoPath
}

// 删除图片
function onRemoveImage(index: number) {
  newPost.value.images.splice(index, 1)
}

// 发布
async function onPublish() {
  if (!newPost.value.content.trim() && newPost.value.images.length === 0 && !newPost.value.video) {
    uni.showToast({ title: '请输入内容或添加图片', icon: 'none' })
    return
  }
  if (!userStore.user) return

  try {
    await circleApi.publish(userStore.user.id, {
      content: newPost.value.content,
      images: newPost.value.images,
      video: newPost.value.video,
      visibility: newPost.value.visibility,
    })
    uni.showToast({ title: '发布成功', icon: 'success' })
    showPost.value = false
    newPost.value = { content: '', images: [], video: '', visibility: 'all' }
    loadPosts()
  } catch (e) {
    uni.showToast({ title: '发布失败', icon: 'none' })
  }
}

// 点赞
async function onLike(post: any) {
  if (!userStore.user) return
  try {
    await circleApi.like(userStore.user.id, post._id)
    post.liked = !post.liked
    post.likes += post.liked ? 1 : -1
  } catch (e) {}
}

// 预览图片
function onPreviewImage(urls: string[], index: number) {
  previewImage(urls, index)
}

// 格式化时间
function formatTime(ts: any) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
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
      <view v-for="post in posts" :key="post._id" class="post-card card">
        <!-- 发布者 -->
        <view class="post-header">
          <view class="avatar">{{ (post.userName || '?')[0] }}</view>
          <view class="post-header__info">
            <text class="post-header__name">{{ post.userName || '未知' }}</text>
            <text class="post-header__time">{{ formatTime(post.createdAt) }}</text>
          </view>
        </view>

        <!-- 内容 -->
        <text class="post-content">{{ post.content }}</text>

        <!-- 图片网格 -->
        <view v-if="post.images && post.images.length > 0"
          :class="['post-images', `post-images--${Math.min(post.images.length, 3)}`]">
          <image v-for="(img, idx) in post.images" :key="idx"
            class="post-images__item" :src="img" mode="aspectFill"
            @tap="onPreviewImage(post.images, idx)" />
        </view>

        <!-- 视频 -->
        <video v-if="post.video" :src="post.video" class="post-video"
          controls :show-play-btn="true" :show-center-play-btn="true" />

        <!-- 互动栏 -->
        <view class="post-actions">
          <view class="post-action" @tap="onLike(post)">
            <text class="post-action__icon">{{ post.liked ? '❤️' : '🤍' }}</text>
            <text class="post-action__num">{{ post.likes || 0 }}</text>
          </view>
          <view class="post-action">
            <text class="post-action__icon">💬</text>
            <text class="post-action__num">{{ post.comments || 0 }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 发布弹窗 -->
    <view v-if="showPost" class="sheet-mask" @tap="showPost = false">
      <view class="sheet" @tap.stop>
        <view class="sheet__header">
          <text class="sheet__title">发布动态</text>
          <text class="sheet__close" @tap="showPost = false">✕</text>
        </view>

        <textarea class="post-input" v-model="newPost.content"
          placeholder="分享家族故事..." maxlength="500" />

        <!-- 已选图片预览 -->
        <view v-if="newPost.images.length > 0" class="post-images-preview">
          <view v-for="(img, idx) in newPost.images" :key="idx" class="preview-item">
            <image :src="img" mode="aspectFill" class="preview-item__img" />
            <view class="preview-item__del" @tap="onRemoveImage(idx)">✕</view>
          </view>
        </view>

        <!-- 视频预览 -->
        <view v-if="newPost.video" class="video-preview">
          <video :src="newPost.video" class="video-preview__player" />
          <view class="video-preview__del" @tap="newPost.video = ''">✕ 删除视频</view>
        </view>

        <!-- 工具栏 -->
        <view class="post-toolbar">
          <view class="post-toolbar__tool" @tap="onChooseImage">📷 照片</view>
          <view class="post-toolbar__tool" @tap="onChooseVideo">🎬 视频(15秒)</view>
          <view class="post-toolbar__tool">👤 @亲属</view>
        </view>

        <!-- 可见范围 -->
        <view class="visibility-row">
          <text class="visibility-row__label">可见范围</text>
          <view class="visibility-chips">
            <view :class="['vis-chip', newPost.visibility === 'all' && 'vis-chip--active']"
              @tap="newPost.visibility = 'all'">全部亲属</view>
            <view :class="['vis-chip', newPost.visibility === 'direct' && 'vis-chip--active']"
              @tap="newPost.visibility = 'direct'">仅直系</view>
          </view>
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

.post-card { margin: $spacing-base; padding: $spacing-base; }
.post-header { display: flex; align-items: center; margin-bottom: $spacing-sm; }
.post-header__info { margin-left: $spacing-base; }
.post-header__name { display: block; font-weight: 500; font-size: $font-size-base; }
.post-header__time { font-size: $font-size-xs; color: $color-text-placeholder; }
.post-content { font-size: $font-size-base; line-height: 1.6; margin-bottom: $spacing-sm; }

.post-images { display: flex; flex-wrap: wrap; gap: 8rpx; margin-bottom: $spacing-sm;
  &--1 .post-images__item { width: 400rpx; height: 400rpx; }
  &--2 .post-images__item, &--3 .post-images__item { width: 220rpx; height: 220rpx; }
  &__item { border-radius: $radius-sm; }
}

.post-video { width: 100%; height: 400rpx; border-radius: $radius-sm; margin-bottom: $spacing-sm; }

.post-actions { display: flex; gap: $spacing-md; padding-top: $spacing-sm; border-top: 1rpx solid $color-divider; }
.post-action { display: flex; align-items: center; gap: 4rpx;
  &__icon { font-size: 32rpx; }
  &__num { font-size: $font-size-sm; color: $color-text-secondary; }
}

.sheet-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.sheet {
  width: 100%; background: $color-bg-card; border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-base; max-height: 80vh; overflow-y: auto;
  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-base; }
  &__title { font-size: $font-size-md; font-weight: 600; }
  &__close { font-size: $font-size-md; color: $color-text-secondary; padding: 8rpx; }
}

.post-input {
  width: 100%; min-height: 200rpx; font-size: $font-size-base;
  padding: $spacing-base; border-radius: $radius-base; background: $color-bg;
}

.post-images-preview { display: flex; flex-wrap: wrap; gap: $spacing-sm; margin: $spacing-sm 0; }
.preview-item { position: relative; width: 160rpx; height: 160rpx;
  &__img { width: 100%; height: 100%; border-radius: $radius-sm; }
  &__del { position: absolute; top: -8rpx; right: -8rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; font-size: 20rpx; display: flex; align-items: center; justify-content: center; }
}

.video-preview { margin: $spacing-sm 0;
  &__player { width: 100%; height: 300rpx; border-radius: $radius-sm; }
  &__del { text-align: center; padding: $spacing-sm; color: $color-danger; font-size: $font-size-sm; }
}

.post-toolbar { display: flex; gap: $spacing-base; padding: $spacing-sm 0; }
.post-toolbar__tool { padding: 12rpx 24rpx; background: $color-bg; border-radius: $radius-lg; font-size: $font-size-sm; color: $color-text-secondary; }

.visibility-row { display: flex; align-items: center; gap: $spacing-sm; margin: $spacing-sm 0; padding: $spacing-sm 0; border-top: 1rpx solid $color-divider;
  &__label { font-size: $font-size-sm; color: $color-text-secondary; }
}
.visibility-chips { display: flex; gap: $spacing-sm; }
.vis-chip { padding: 8rpx 20rpx; border-radius: $radius-lg; font-size: $font-size-xs; background: $color-bg; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; }
}
</style>

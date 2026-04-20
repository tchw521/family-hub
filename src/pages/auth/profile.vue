<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { updateUserInfo } from '@/utils/auth'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const nickname = ref('')
const avatarUrl = ref('')
const loading = ref(false)

// 页面加载
onLoad(() => {
  if (userStore.user) {
    nickname.value = userStore.user.nickname || ''
    avatarUrl.value = userStore.user.avatar || ''
  }
})

// 选择头像（微信新版API）
function onChooseAvatar(e: any) {
  const { avatarUrl: url } = e.detail
  avatarUrl.value = url
  console.log('选择的头像:', url)
}

// 保存用户信息
async function handleSave() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  
  loading.value = true
  uni.showLoading({ title: '保存中...' })
  
  try {
    // 上传头像到云存储
    let finalAvatarUrl = avatarUrl.value
    if (avatarUrl.value && avatarUrl.value.startsWith('http://tmp') || avatarUrl.value.startsWith('wxfile://')) {
      finalAvatarUrl = await uploadAvatar(avatarUrl.value)
    }
    
    // 更新用户信息
    const result = await updateUserInfo({
      nickname: nickname.value,
      avatarUrl: finalAvatarUrl
    })
    
    uni.hideLoading()
    
    if (result.success) {
      userStore.setUser({
        ...userStore.user!,
        nickname: nickname.value,
        avatar: finalAvatarUrl
      })
      
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: '保存失败', icon: 'none' })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 上传头像到云存储
async function uploadAvatar(localPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.uploadFile({
      cloudPath: `avatars/${userStore.user?.openid}_${Date.now()}.jpg`,
      filePath: localPath,
      success: (res) => {
        resolve(res.fileID)
      },
      fail: reject
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    resolve(localPath)
    // #endif
  })
}

// 跳过
function handleSkip() {
  uni.navigateBack()
}
</script>

<template>
  <view class="profile-page">
    <view class="profile-header">
      <text class="profile-title">完善个人信息</text>
      <text class="profile-subtitle">让大家更容易认出你</text>
    </view>
    
    <view class="profile-form">
      <!-- 头像 -->
      <view class="profile-avatar">
        <button 
          class="avatar-btn" 
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image 
            v-if="avatarUrl" 
            :src="avatarUrl" 
            class="avatar-image" 
            mode="aspectFill" 
          />
          <view v-else class="avatar-placeholder">
            <text class="avatar-placeholder__icon">📷</text>
            <text class="avatar-placeholder__text">点击选择头像</text>
          </view>
        </button>
      </view>
      
      <!-- 昵称 -->
      <view class="profile-field">
        <text class="profile-field__label">昵称</text>
        <input 
          v-model="nickname"
          class="profile-field__input"
          type="nickname"
          placeholder="请输入昵称"
          :maxlength="20"
        />
      </view>
    </view>
    
    <!-- 按钮 -->
    <view class="profile-actions">
      <button 
        class="save-btn" 
        :disabled="loading"
        @tap="handleSave"
      >
        保存
      </button>
      <button class="skip-btn" @tap="handleSkip">跳过</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: $color-bg;
  padding: $spacing-xl;
}

.profile-header {
  text-align: center;
  padding: $spacing-xl 0;
}

.profile-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: $color-text;
}

.profile-subtitle {
  display: block;
  font-size: $font-size-base;
  color: $color-text-secondary;
  margin-top: $spacing-sm;
}

.profile-form {
  background: #fff;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  margin-top: $spacing-lg;
}

.profile-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: $spacing-xl;
}

.avatar-btn {
  width: 160rpx;
  height: 160rpx;
  padding: 0;
  background: transparent;
  border: none;
  
  &::after {
    border: none;
  }
}

.avatar-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: $color-bg;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed $color-border;
  
  &__icon {
    font-size: 40rpx;
  }
  
  &__text {
    font-size: $font-size-xs;
    color: $color-text-placeholder;
    margin-top: 8rpx;
  }
}

.profile-field {
  display: flex;
  align-items: center;
  padding: $spacing-base 0;
  border-bottom: 1rpx solid $color-border;
  
  &:last-child {
    border-bottom: none;
  }
  
  &__label {
    width: 140rpx;
    font-size: $font-size-base;
    color: $color-text;
  }
  
  &__input {
    flex: 1;
    font-size: $font-size-base;
    color: $color-text;
  }
}

.profile-actions {
  margin-top: $spacing-xl;
}

.save-btn {
  background: $color-primary;
  color: #fff;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: $font-size-base;
  font-weight: 500;
  
  &[disabled] {
    opacity: 0.7;
  }
}

.skip-btn {
  background: transparent;
  color: $color-text-secondary;
  height: 88rpx;
  line-height: 88rpx;
  font-size: $font-size-base;
  margin-top: $spacing-base;
}
</style>

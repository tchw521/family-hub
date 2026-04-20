<script setup lang="ts">
import { ref } from 'vue'
import { wxLogin } from '@/utils/auth'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)

// 微信一键登录
async function handleLogin() {
  loading.value = true
  
  uni.showLoading({ title: '登录中...', mask: true })
  
  try {
    const result = await wxLogin()
    
    uni.hideLoading()
    
    if (result.success && result.user) {
      // 更新 store
      userStore.setUser(result.user)
      
      uni.showToast({ 
        title: '登录成功', 
        icon: 'success',
        duration: 1500
      })
      
      // 延迟跳转
      setTimeout(() => {
        // 返回上一页或跳转首页
        const pages = getCurrentPages()
        if (pages.length > 1) {
          uni.navigateBack()
        } else {
          uni.switchTab({ url: '/pages/index/index' })
        }
      }, 1500)
    } else {
      uni.showToast({
        title: result.error || '登录失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '登录失败，稍后再试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 游客模式
function handleGuest() {
  uni.showToast({
    title: '游客模式功能受限',
    icon: 'none'
  })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/index/index' })
  }, 1000)
}
</script>

<template>
  <view class="login-page">
    <!-- 背景 -->
    <view class="login-bg">
      <image 
        class="login-bg__image" 
        src="/static/images/login-bg.png" 
        mode="aspectFill"
      />
      <view class="login-bg__overlay"></view>
    </view>
    
    <!-- Logo 和标题 -->
    <view class="login-header">
      <image 
        class="login-logo" 
        src="/static/images/logo.png" 
        mode="aspectFit" 
      />
      <text class="login-title">家族互联</text>
      <text class="login-subtitle">织一张家族蛛网 🕸️</text>
    </view>
    
    <!-- 登录按钮 -->
    <view class="login-actions">
      <button 
        class="login-btn login-btn--primary" 
        :disabled="loading"
        @tap="handleLogin"
      >
        <image 
          class="login-btn__icon" 
          src="/static/images/wechat-icon.png" 
          mode="aspectFit" 
        />
        <text>微信一键登录</text>
      </button>
      
      <button 
        class="login-btn login-btn--secondary" 
        @tap="handleGuest"
      >
        <text>先看看再说</text>
      </button>
    </view>
    
    <!-- 提示 -->
    <view class="login-footer">
      <text class="login-hint">
        登录即表示同意
        <text class="login-hint__link">《用户协议》</text>
        和
        <text class="login-hint__link">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

// 背景图层
.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  
  &__image {
    width: 100%;
    height: 100%;
  }
  
  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.95) 100%
    );
  }
}

// 头部
.login-header {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.login-logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 48rpx;
  font-weight: 700;
  color: $color-text;
  margin-top: $spacing-lg;
}

.login-subtitle {
  font-size: $font-size-base;
  color: $color-text-secondary;
  margin-top: $spacing-sm;
}

// 按钮区域
.login-actions {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding: 0 $spacing-xl;
  padding-bottom: 80rpx;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  border-radius: 50rpx;
  font-size: $font-size-lg;
  font-weight: 500;
  margin-bottom: $spacing-base;
  
  &__icon {
    width: 48rpx;
    height: 48rpx;
    margin-right: $spacing-sm;
  }
  
  &--primary {
    background: #07C160;
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
    
    &:active {
      background: #06AD56;
    }
    
    &[disabled] {
      opacity: 0.7;
    }
  }
  
  &--secondary {
    background: $color-bg;
    color: $color-text-secondary;
    border: 1rpx solid $color-border;
    
    &:active {
      background: $color-bg-card;
    }
  }
}

// 底部提示
.login-footer {
  position: relative;
  z-index: 1;
  padding-bottom: $spacing-xl;
  text-align: center;
}

.login-hint {
  font-size: $font-size-xs;
  color: $color-text-placeholder;
  
  &__link {
    color: $color-primary;
  }
}
</style>

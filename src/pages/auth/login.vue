<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function onSendCode() {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  // TODO: 调用发送验证码 API
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) { clearInterval(timer!); timer = null }
  }, 1000)
  uni.showToast({ title: '验证码已发送', icon: 'success' })
}

function onLogin() {
  if (!phone.value || !code.value) {
    uni.showToast({ title: '请输入手机号和验证码', icon: 'none' })
    return
  }
  // TODO: 调用登录 API
  userStore.login({ phone: phone.value, name: '' })
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="login">
    <view class="login__brand">
      <text class="login__icon">🕸️</text>
      <text class="login__title">家族互联</text>
      <text class="login__subtitle">连接每一个家人</text>
    </view>

    <view class="login-form card">
      <view class="form-item">
        <text class="form-item__prefix">+86</text>
        <input class="form-item__input" v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
      </view>
      <view class="form-item">
        <input class="form-item__input" v-model="code" type="number" maxlength="6" placeholder="验证码" />
        <view class="form-item__code" @tap="countdown <= 0 && onSendCode()">
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </view>
      </view>
      <view class="btn btn-primary login__btn" @tap="onLogin">登录</view>
    </view>

    <view class="login__footer">
      <text class="login__agreement">登录即代表同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: $spacing-xl;
}

.login__brand {
  display: flex; flex-direction: column; align-items: center; margin-bottom: $spacing-xl;
  &__icon { font-size: 100rpx; margin-bottom: $spacing-sm; }
}
.login__title { font-size: $font-size-xl; font-weight: 700; color: $color-text; }
.login__subtitle { font-size: $font-size-sm; color: $color-text-secondary; margin-top: 8rpx; }

.login-form { width: 100%; padding: $spacing-md; }
.form-item {
  display: flex; align-items: center; border-bottom: 1rpx solid $color-divider;
  padding: $spacing-sm 0; margin-bottom: $spacing-sm;
  &__prefix { font-size: $font-size-base; color: $color-text; margin-right: $spacing-sm; padding-right: $spacing-sm; border-right: 1rpx solid $color-divider; }
  &__input { flex: 1; font-size: $font-size-base; }
  &__code { font-size: $font-size-sm; color: $color-primary; white-space: nowrap; padding: 8rpx; }
}

.login__btn { width: 100%; margin-top: $spacing-base; }
.login__footer { margin-top: $spacing-lg; }
.login__agreement { font-size: $font-size-xs; color: $color-text-placeholder; }
</style>

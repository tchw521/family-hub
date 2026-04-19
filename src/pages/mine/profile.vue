<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const form = ref({
  name: userStore.user?.name || '',
  gender: userStore.user?.gender || '',
  birthday: userStore.user?.birthday || '',
  hometown: userStore.user?.hometown || '',
})

function onSave() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '姓名不能为空', icon: 'none' })
    return
  }
  // TODO: 调用 API 更新
  if (userStore.user) {
    userStore.user.name = form.value.name
    userStore.user.gender = form.value.gender as any
    userStore.user.birthday = form.value.birthday
    userStore.user.hometown = form.value.hometown
    uni.setStorageSync('user', JSON.stringify(userStore.user))
  }
  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1500)
}
</script>

<template>
  <view class="profile">
    <!-- 头像 -->
    <view class="avatar-section">
      <view class="avatar-wrapper">
        <view class="avatar avatar--lg">{{ form.name[0] || '?' }}</view>
        <view class="avatar-edit">
          <text>📷</text>
        </view>
      </view>
      <text class="avatar-hint">点击更换头像</text>
    </view>

    <view class="form card">
      <view class="form-item">
        <text class="form-item__label">姓名 <text class="required">*</text></text>
        <input class="form-item__input" v-model="form.name" placeholder="请输入姓名" />
      </view>

      <view class="form-item">
        <text class="form-item__label">性别</text>
        <view class="gender-group">
          <view :class="['gender-btn', form.gender === 'male' && 'gender-btn--active']" @tap="form.gender = 'male'">男</view>
          <view :class="['gender-btn', form.gender === 'female' && 'gender-btn--active']" @tap="form.gender = 'female'">女</view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-item__label">生日</text>
        <picker mode="date" @change="e => form.birthday = e.detail.value">
          <view class="form-item__value">
            <text :class="['form-item__text', !form.birthday && 'form-item__placeholder']">
              {{ form.birthday || '选择生日（可跳过）' }}
            </text>
            <text class="form-item__arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-item__label">籍贯</text>
        <input class="form-item__input" v-model="form.hometown" placeholder="选填" />
      </view>
    </view>

    <view class="submit-area">
      <view class="btn btn-primary" @tap="onSave">保存</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile { min-height: 100vh; padding: $spacing-base; }
.avatar-section { display: flex; flex-direction: column; align-items: center; padding: $spacing-md 0; }
.avatar-wrapper { position: relative; }
.avatar--lg { width: 140rpx; height: 140rpx; font-size: 52rpx; }
.avatar-edit { position: absolute; bottom: -4rpx; right: -4rpx; width: 44rpx; height: 44rpx; border-radius: 50%; background: $color-primary; display: flex; align-items: center; justify-content: center; }
.avatar-hint { font-size: $font-size-sm; color: $color-text-secondary; margin-top: $spacing-sm; }
.form { padding: $spacing-md; }
.form-item { padding: $spacing-sm 0; border-bottom: 1rpx solid $color-divider; &:last-child { border-bottom: none; }
  &__label { display: block; font-size: $font-size-sm; color: $color-text-secondary; margin-bottom: 8rpx; }
  &__input { width: 100%; font-size: $font-size-base; }
  &__value { display: flex; justify-content: space-between; align-items: center; }
  &__text { font-size: $font-size-base; }
  &__placeholder { color: $color-text-placeholder; }
  &__arrow { color: $color-text-placeholder; }
}
.required { color: $color-danger; }
.gender-group { display: flex; gap: $spacing-sm; }
.gender-btn { padding: 12rpx 40rpx; border-radius: $radius-lg; font-size: $font-size-sm; background: $color-bg; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; }
}
.submit-area { padding: $spacing-lg $spacing-base; }
</style>
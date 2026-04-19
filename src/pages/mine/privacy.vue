<script setup lang="ts">
import { ref, computed } from 'vue'

const privacy = ref({
  anonymousWeb: false,
  defaultVisibility: 'all' as 'all' | 'direct' | 'custom',
  showPhone: false,
  showBirthday: true,
  showHometown: true,
})

const visibilityOptions = [
  { key: 'all', label: '全部亲属可见', desc: '所有已验证亲属都能看到' },
  { key: 'direct', label: '仅直系亲属', desc: '仅父母、配偶、子女可见' },
  { key: 'custom', label: '自定义', desc: '手动选择可见的亲属' },
]

const currentVisibility = computed(() =>
  visibilityOptions.find(v => v.key === privacy.value.defaultVisibility)
)

function onToggleAnonymous() {
  privacy.value.anonymousWeb = !privacy.value.anonymousWeb
  // TODO: 调用 API 保存
  uni.showToast({
    title: privacy.value.anonymousWeb ? '已开启匿名' : '已关闭匿名',
    icon: 'success'
  })
}

function onSetVisibility(key: string) {
  privacy.value.defaultVisibility = key as any
  // TODO: 调用 API 保存
}

function onToggleField(field: string) {
  (privacy.value as any)[field] = !(privacy.value as any)[field]
  // TODO: 调用 API 保存
}
</script>

<template>
  <view class="privacy">
    <!-- 匿名展示 -->
    <view class="section card">
      <view class="section__header">
        <text class="section__title">蛛网匿名</text>
      </view>
      <view class="toggle-item">
        <view class="toggle-item__info">
          <text class="toggle-item__label">匿名展示</text>
          <text class="toggle-item__desc">家族蛛网中仅显示关系路径，不显示真实姓名</text>
        </view>
        <switch :checked="privacy.anonymousWeb" color="#F28C38" @change="onToggleAnonymous" />
      </view>
    </view>

    <!-- 默认可见范围 -->
    <view class="section card">
      <view class="section__header">
        <text class="section__title">默认可见范围</text>
      </view>
      <view v-for="opt in visibilityOptions" :key="opt.key"
        :class="['visibility-item', privacy.defaultVisibility === opt.key && 'visibility-item--active']"
        @tap="onSetVisibility(opt.key)">
        <view class="visibility-item__radio">
          <view v-if="privacy.defaultVisibility === opt.key" class="visibility-item__dot"></view>
        </view>
        <view class="visibility-item__info">
          <text class="visibility-item__label">{{ opt.label }}</text>
          <text class="visibility-item__desc">{{ opt.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 信息可见性 -->
    <view class="section card">
      <view class="section__header">
        <text class="section__title">信息可见性</text>
      </view>
      <view class="toggle-item">
        <view class="toggle-item__info">
          <text class="toggle-item__label">手机号</text>
          <text class="toggle-item__desc">控制亲属是否能看到你的手机号</text>
        </view>
        <switch :checked="privacy.showPhone" color="#F28C38" @change="onToggleField('showPhone')" />
      </view>
      <view class="toggle-item">
        <view class="toggle-item__info">
          <text class="toggle-item__label">生日</text>
          <text class="toggle-item__desc">控制亲属是否能看到你的生日</text>
        </view>
        <switch :checked="privacy.showBirthday" color="#F28C38" @change="onToggleField('showBirthday')" />
      </view>
      <view class="toggle-item">
        <view class="toggle-item__info">
          <text class="toggle-item__label">籍贯</text>
          <text class="toggle-item__desc">控制亲属是否能看到你的籍贯</text>
        </view>
        <switch :checked="privacy.showHometown" color="#F28C38" @change="onToggleField('showHometown')" />
      </view>
    </view>

    <!-- 防骚扰 -->
    <view class="section card">
      <view class="section__header">
        <text class="section__title">防骚扰</text>
      </view>
      <view class="info-text">
        <text>已拒绝的验证请求发起方将被自动屏蔽后续请求，无需手动设置。</text>
      </view>
      <view class="info-text info-text--tip">
        <text>🔒 同一用户每天最多向你发起 2 次验证请求</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.privacy { min-height: 100vh; padding: $spacing-base; }
.section { padding: $spacing-md; margin-bottom: $spacing-base;
  &__header { margin-bottom: $spacing-sm; }
  &__title { font-size: $font-size-md; font-weight: 600; }
}

.toggle-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: $spacing-sm 0; border-bottom: 1rpx solid $color-divider;
  &:last-child { border-bottom: none; }
  &__info { flex: 1; margin-right: $spacing-base; }
  &__label { display: block; font-size: $font-size-base; font-weight: 500; }
  &__desc { display: block; font-size: $font-size-sm; color: $color-text-secondary; margin-top: 4rpx; }
}

.visibility-item {
  display: flex; align-items: flex-start; padding: $spacing-sm 0;
  border-bottom: 1rpx solid $color-divider;
  &:last-child { border-bottom: none; }
  &:active { background: $color-bg; }
  &__radio {
    width: 36rpx; height: 36rpx; border-radius: 50%; border: 3rpx solid $color-text-placeholder;
    display: flex; align-items: center; justify-content: center; margin-right: $spacing-base; margin-top: 4rpx; flex-shrink: 0;
  }
  &--active .visibility-item__radio { border-color: $color-primary; }
  &__dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: $color-primary; }
  &__info { flex: 1; }
  &__label { display: block; font-size: $font-size-base; font-weight: 500; }
  &__desc { display: block; font-size: $font-size-sm; color: $color-text-secondary; margin-top: 4rpx; }
}

.info-text {
  padding: $spacing-sm; font-size: $font-size-sm; color: $color-text-secondary; line-height: 1.6;
  &--tip { background: $color-primary-light; border-radius: $radius-sm; color: $color-secondary; margin-top: $spacing-sm; }
}
</style>
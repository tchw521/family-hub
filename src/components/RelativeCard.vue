<script setup lang="ts">
import { useFamilyStore } from '@/store/family'

const props = defineProps<{
  relative: {
    id: string
    name: string
    relationLabel: string
    verified: boolean
    avatar?: string
    gender?: string
    side?: string
  }
  showActions?: boolean
}>()

const familyStore = useFamilyStore()

function onTap() {
  uni.navigateTo({ url: `/pages/relatives/detail?id=${props.relative.id}` })
}

function onEdit() {
  uni.navigateTo({ url: `/pages/relatives/edit?id=${props.relative.id}` })
}

function onDelete() {
  uni.showModal({
    title: '确认删除',
    content: `确定删除亲属"${props.relative.name}"？`,
    success: (res) => {
      if (res.confirm) {
        familyStore.removeRelative(props.relative.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}
</script>

<template>
  <view class="relative-card" @tap="onTap">
    <view :class="['avatar', `avatar--${props.relative.gender || 'male'}`]">
      {{ props.relative.name?.[0] || '?' }}
    </view>
    <view class="relative-card__info">
      <view class="relative-card__name-row">
        <text class="relative-card__name">{{ props.relative.name }}</text>
        <view :class="['tag', props.relative.verified ? 'tag-verified' : 'tag-unverified']">
          {{ props.relative.verified ? '已验证' : '未验证' }}
        </view>
      </view>
      <text class="relative-card__relation">{{ props.relative.relationLabel }}</text>
      <text v-if="props.relative.side" class="relative-card__side">
        {{ props.relative.side === 'paternal' ? '父系' : props.relative.side === 'maternal' ? '母系' : '配偶家族' }}
      </text>
    </view>
    <view v-if="props.showActions" class="relative-card__actions">
      <text class="relative-card__action" @tap.stop="onEdit">编辑</text>
      <text class="relative-card__action relative-card__action--danger" @tap.stop="onDelete">删除</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.relative-card {
  display: flex; align-items: center; padding: $spacing-base;
  background: $color-bg-card; border-radius: $radius-base;
  margin-bottom: $spacing-sm; box-shadow: $shadow-sm;
  &:active { background: $color-bg; }

  &__info { flex: 1; margin-left: $spacing-base; }
  &__name-row { display: flex; align-items: center; gap: $spacing-sm; }
  &__name { font-size: $font-size-base; font-weight: 500; }
  &__relation { display: block; font-size: $font-size-sm; color: $color-text-secondary; margin-top: 4rpx; }
  &__side { display: block; font-size: $font-size-xs; color: $color-text-placeholder; margin-top: 4rpx; }
  &__actions { display: flex; gap: $spacing-sm; margin-left: $spacing-base; }
  &__action { font-size: $font-size-sm; color: $color-primary; padding: 8rpx 16rpx;
    &--danger { color: $color-danger; }
  }
}

.avatar--male { background: rgba(74, 69, 64, 0.1); color: #4A4540; }
.avatar--female { background: rgba(242, 140, 56, 0.1); color: $color-primary; }
</style>
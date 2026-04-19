<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFamilyStore } from '@/store/family'

const familyStore = useFamilyStore()
const relativeId = ref('')

const form = ref({
  name: '',
  gender: 'male' as 'male' | 'female',
  relation: '',
  birthday: '',
  hometown: '',
  phone: '',
})

const relationOptions = [
  '父亲', '母亲', '配偶', '哥哥', '姐姐', '弟弟', '妹妹',
  '儿子', '女儿', '祖父', '祖母', '外公', '外婆',
  '叔叔', '伯父', '姑姑', '舅舅', '阿姨', '表兄', '表姐', '堂兄', '堂姐', '其他'
]

const showRelationPicker = ref(false)

onLoad((options) => {
  if (options?.id) {
    relativeId.value = options.id
    const r = familyStore.relatives.find(rel => rel.id === options.id)
    if (r) {
      form.value = {
        name: r.name,
        gender: r.gender || 'male',
        relation: r.relation || '',
        birthday: r.birthday || '',
        hometown: r.hometown || '',
        phone: r.phone || '',
      }
    }
  }
})

function onSave() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  // TODO: 调用 API 更新
  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1500)
}
</script>

<template>
  <view class="edit">
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

      <view class="form-item" @tap="showRelationPicker = true">
        <text class="form-item__label">关系 <text class="required">*</text></text>
        <view class="form-item__value">
          <text :class="['form-item__text', !form.relation && 'form-item__placeholder']">
            {{ form.relation || '请选择关系' }}
          </text>
          <text class="form-item__arrow">›</text>
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

      <view class="form-item">
        <text class="form-item__label">手机号</text>
        <input class="form-item__input" v-model="form.phone" type="number" placeholder="选填" />
      </view>
    </view>

    <view class="submit-area">
      <view class="btn btn-primary" @tap="onSave">保存修改</view>
    </view>

    <view v-if="showRelationPicker" class="sheet-mask" @tap="showRelationPicker = false">
      <view class="sheet" @tap.stop>
        <view class="sheet__header">
          <text class="sheet__title">选择关系</text>
          <text class="sheet__close" @tap="showRelationPicker = false">✕</text>
        </view>
        <view class="relation-grid">
          <view v-for="r in relationOptions" :key="r"
            :class="['relation-chip', form.relation === r && 'relation-chip--active']"
            @tap="form.relation = r; showRelationPicker = false">
            {{ r }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.edit { min-height: 100vh; padding: $spacing-base; }
.form { padding: $spacing-md; }
.form-item { padding: $spacing-sm 0; border-bottom: 1rpx solid $color-divider; &:last-child { border-bottom: none; }
  &__label { display: block; font-size: $font-size-sm; color: $color-text-secondary; margin-bottom: 8rpx; }
  &__input { width: 100%; font-size: $font-size-base; padding: 8rpx 0; }
  &__value { display: flex; justify-content: space-between; align-items: center; }
  &__text { font-size: $font-size-base; }
  &__placeholder { color: $color-text-placeholder; }
  &__arrow { color: $color-text-placeholder; font-size: $font-size-md; }
}
.required { color: $color-danger; }
.gender-group { display: flex; gap: $spacing-sm; }
.gender-btn { padding: 12rpx 40rpx; border-radius: $radius-lg; font-size: $font-size-sm; background: $color-bg; color: $color-text-secondary;
  &--active { background: $color-primary-light; color: $color-primary; }
}
.submit-area { padding: $spacing-lg $spacing-base; }
.sheet-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.sheet { width: 100%; background: $color-bg-card; border-radius: $radius-xl $radius-xl 0 0; padding: $spacing-base;
  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-base; }
  &__title { font-size: $font-size-md; font-weight: 600; }
  &__close { font-size: $font-size-md; color: $color-text-secondary; }
}
.relation-grid { display: flex; flex-wrap: wrap; gap: $spacing-sm; }
.relation-chip { padding: 12rpx 28rpx; border-radius: $radius-lg; font-size: $font-size-sm; background: $color-bg; color: $color-text-secondary;
  &--active { background: $color-primary; color: #fff; }
}
</style>
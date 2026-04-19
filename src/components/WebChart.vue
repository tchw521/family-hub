<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useFamilyStore } from '@/store/family'

const familyStore = useFamilyStore()
const chartRef = ref<any>(null)

// 蛛网数据（模拟，实际从 API 获取）
const webData = computed(() => ({
  nodes: [
    { id: 'me', name: '我', category: 0, symbolSize: 50, x: 300, y: 300 },
    ...familyStore.relatives.map((r, i) => ({
      id: r.id,
      name: r.name,
      category: r.side === 'spouse' ? 2 : 1,
      symbolSize: r.verified ? 35 : 25,
      itemStyle: r.verified ? {} : { opacity: 0.6 },
      x: 300 + (Math.cos(i * 0.5) * 150),
      y: 300 + (Math.sin(i * 0.5) * 150),
    }))
  ],
  links: familyStore.relatives.map(r => ({
    source: 'me',
    target: r.id,
    value: r.relationLabel,
    lineStyle: {
      color: r.side === 'spouse' ? '#F28C38' : '#4A4540',
      width: r.verified ? 2 : 1,
      type: r.verified ? 'solid' : 'dashed',
    }
  })),
  categories: [
    { name: '自己', itemStyle: { color: '#F28C38' } },
    { name: '血缘亲属', itemStyle: { color: '#4A4540' } },
    { name: '配偶家族', itemStyle: { color: '#F28C38' } },
  ]
}))

// 点击节点
function onNodeClick(node: any) {
  if (node.id === 'me') return
  uni.navigateTo({ url: `/pages/relatives/detail?id=${node.id}` })
}

// 初始化图表
onMounted(() => {
  // TODO: 使用 limason-echarts-uniapp 初始化
  console.log('蛛网初始化', webData.value)
})
</script>

<template>
  <view class="web-chart">
    <view class="chart-container">
      <!-- 占位：实际使用 ECharts -->
      <view class="chart-placeholder">
        <view class="node-center">
          <text class="node-center__icon">👤</text>
          <text class="node-center__name">我</text>
        </view>
        <view class="node-orbit">
          <view v-for="r in familyStore.relatives.slice(0, 8)" :key="r.id"
            :class="['node-item', `node-item--${r.side}`, !r.verified && 'node-item--unverified']"
            @tap="onNodeClick(r)">
            <text class="node-item__icon">{{ r.name[0] }}</text>
            <text class="node-item__name">{{ r.name }}</text>
            <text class="node-item__relation">{{ r.relationLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="legend">
      <view class="legend-item">
        <view class="legend-line legend-line--blood"></view>
        <text>血缘</text>
      </view>
      <view class="legend-item">
        <view class="legend-line legend-line--marriage"></view>
        <text>婚姻</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot legend-dot--verified"></view>
        <text>已验证</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot legend-dot--unverified"></view>
        <text>未验证</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.web-chart {
  position: relative; width: 100%; height: 500rpx;
}

.chart-container {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
}

.chart-placeholder {
  position: relative; width: 500rpx; height: 500rpx;
}

.node-center {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: $color-primary; display: flex; flex-direction: column;
  align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(242, 140, 56, 0.4);
  &__icon { font-size: 32rpx; }
  &__name { font-size: $font-size-xs; margin-top: 4rpx; }
}

.node-orbit {
  position: absolute; left: 50%; top: 50%; width: 400rpx; height: 400rpx;
  transform: translate(-50%, -50%);
}

.node-item {
  position: absolute; width: 80rpx; height: 80rpx;
  border-radius: 50%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; cursor: pointer;
  background: $color-bg-card; box-shadow: $shadow-sm;
  transition: transform 0.2s;

  &:active { transform: scale(0.95); }

  &--paternal { background: rgba(74, 69, 64, 0.1); border: 2rpx solid #4A4540; }
  &--maternal { background: rgba(74, 69, 64, 0.1); border: 2rpx solid #4A4540; }
  &--spouse { background: rgba(242, 140, 56, 0.1); border: 2rpx solid $color-primary; }
  &--unverified { opacity: 0.6; border-style: dashed !important; }

  &__icon { font-size: 24rpx; font-weight: 600; color: $color-text; }
  &__name { font-size: $font-size-xs; color: $color-text; margin-top: 4rpx; max-width: 72rpx; overflow: hidden; text-overflow: ellipsis; }
  &__relation { font-size: 18rpx; color: $color-text-secondary; max-width: 72rpx; overflow: hidden; }
}

.legend {
  display: flex; justify-content: center; gap: $spacing-md;
  padding: $spacing-sm; background: rgba(255,255,255,0.8);
  border-radius: $radius-base; margin-top: $spacing-sm;
}
.legend-item { display: flex; align-items: center; gap: 8rpx; font-size: $font-size-xs; color: $color-text-secondary; }
.legend-line { width: 24rpx; height: 4rpx; border-radius: 2rpx;
  &--blood { background: #4A4540; }
  &--marriage { background: $color-primary; }
}
.legend-dot { width: 16rpx; height: 16rpx; border-radius: 50%;
  &--verified { background: $color-success; }
  &--unverified { background: $color-primary; opacity: 0.6; }
}
</style>
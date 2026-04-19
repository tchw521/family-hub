<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFamilyStore } from '@/store/family'
import * as echarts from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([GraphChart, TooltipComponent, CanvasRenderer])

const familyStore = useFamilyStore()
const canvasId = 'web-chart-' + Date.now()
let chartInstance: echarts.ECharts | null = null
let isMoving = false

// 构建蛛网 ECharts 配置
const chartOption = computed(() => {
  const relatives = familyStore.relatives

  // 节点
  const nodes: any[] = [
    {
      id: 'me',
      name: '我',
      symbolSize: 50,
      category: 0,
      itemStyle: { color: '#F28C38', shadowBlur: 12, shadowColor: 'rgba(242,140,56,0.4)' },
      label: { fontSize: 14, fontWeight: 'bold', color: '#2D2A26' },
    },
    ...relatives.map((r) => ({
      id: r.id,
      name: r.name,
      symbolSize: r.verified ? 38 : 26,
      category: r.side === 'spouse' ? 2 : 1,
      itemStyle: {
        color: r.verified ? (r.side === 'spouse' ? '#F5A623' : '#7C6F5B') : '#C5C0BA',
        opacity: r.verified ? 1 : 0.5,
        borderWidth: r.verified ? 0 : 2,
        borderColor: r.side === 'spouse' ? '#F28C38' : '#7C6F5B',
        borderType: 'dashed' as const,
      },
      label: {
        fontSize: r.verified ? 12 : 10,
        color: r.verified ? '#2D2A26' : '#8C8580',
      },
    })),
  ]

  // 连线
  const links: any[] = relatives.map((r) => ({
    source: 'me',
    target: r.id,
    value: r.relationLabel,
    lineStyle: {
      color: r.side === 'spouse' ? '#F28C38' : '#4A4540',
      width: r.verified ? 2.5 : 1,
      type: r.verified ? 'solid' as const : 'dashed' as const,
      curveness: 0.1,
    },
    label: {
      show: true,
      formatter: r.relationLabel,
      fontSize: 10,
      color: '#8C8580',
      backgroundColor: 'rgba(250,248,245,0.85)',
      padding: [2, 4],
      borderRadius: 4,
    },
  }))

  return {
    animation: true,
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      force: {
        repulsion: 200,
        edgeLength: [80, 160],
        gravity: 0.08,
        friction: 0.6,
        layoutAnimation: true,
      },
      categories: [
        { name: '自己', itemStyle: { color: '#F28C38' } },
        { name: '血缘亲属', itemStyle: { color: '#7C6F5B' } },
        { name: '配偶家族', itemStyle: { color: '#F5A623' } },
      ],
      data: nodes,
      links: links,
      label: {
        show: true,
        position: 'bottom',
        distance: 8,
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 4 },
        itemStyle: { shadowBlur: 16, shadowColor: 'rgba(242,140,56,0.5)' },
      },
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') return params.name
          if (params.dataType === 'edge') return params.data.value
          return ''
        },
      },
    }],
  }
})

// 触摸事件转发给 ECharts
function onTouchStart(e: any) {
  isMoving = false
  if (chartInstance) {
    chartInstance.getZr().handler.dispatch('mousedown', e.mp?.detail || e.detail)
  }
}

function onTouchMove(e: any) {
  isMoving = true
  if (chartInstance) {
    chartInstance.getZr().handler.dispatch('mousemove', e.mp?.detail || e.detail)
  }
}

function onTouchEnd(e: any) {
  if (chartInstance) {
    chartInstance.getZr().handler.dispatch('mouseup', e.mp?.detail || e.detail)
    if (!isMoving) {
      chartInstance.getZr().handler.dispatch('click', e.mp?.detail || e.detail)
    }
  }
}

// 点击节点跳转
function onChartClick(params: any) {
  if (params.dataType === 'node' && params.data.id !== 'me') {
    uni.navigateTo({ url: `/pages/relatives/detail?id=${params.data.id}` })
  }
}

onMounted(() => {
  // 使用 uni-app 的 canvas 2d 接口初始化
  const query = uni.createSelectorQuery()
  query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res) => {
    if (!res || !res[0] || !res[0].node) {
      console.warn('Canvas node not found, fallback to CSS layout')
      return
    }
    const canvas = res[0].node
    const ctx = canvas.getContext('2d')
    const dpr = uni.getSystemInfoSync().pixelRatio
    canvas.width = res[0].width * dpr
    canvas.height = res[0].height * dpr

    chartInstance = echarts.init(canvas, null, {
      width: res[0].width,
      height: res[0].height,
      devicePixelRatio: dpr,
    })

    chartInstance.setOption(chartOption.value)
    chartInstance.on('click', onChartClick)
  })
})
</script>

<template>
  <view class="web-chart">
    <!-- ECharts Canvas -->
    <view class="chart-container">
      <canvas
        :id="canvasId"
        :canvas-id="canvasId"
        class="chart-canvas"
        type="2d"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      ></canvas>
    </view>

    <!-- 图例 -->
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

    <!-- 操作提示 -->
    <view class="tip">
      <text class="tip__text">👆 拖拽移动 · 双指缩放 · 点击查看详情</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.web-chart {
  position: relative;
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 500rpx;
  border-radius: $radius-base;
  overflow: hidden;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.legend {
  display: flex;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-sm;
  background: rgba(255, 255, 255, 0.9);
  border-radius: $radius-base;
  margin-top: $spacing-sm;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.legend-line {
  width: 24rpx;
  height: 4rpx;
  border-radius: 2rpx;
  &--blood { background: #4A4540; }
  &--marriage { background: $color-primary; }
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  &--verified { background: $color-success; }
  &--unverified { background: $color-primary; opacity: 0.5; border: 2rpx dashed $color-primary; }
}

.tip {
  text-align: center;
  padding: $spacing-xs;
  &__text { font-size: $font-size-xs; color: $color-text-placeholder; }
}
</style>

<template>
  <view class="echarts-wrap">
    <canvas
      :id="canvasId"
      :canvas-id="canvasId"
      class="echarts-canvas"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    ></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, getCurrentInstance } from 'vue'
import * as echarts from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([GraphChart, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  option: any
  width?: string
  height?: string
}>()

const canvasId = 'echarts-' + Math.random().toString(36).slice(2, 8)
let chart: echarts.ECharts | null = null
let isMoving = false

const instance = getCurrentInstance()

function initChart() {
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance?.proxy)
    query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) return
      const canvas = res[0].node
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      canvas.width = res[0].width * 2
      canvas.height = res[0].height * 2

      // @ts-ignore
      chart = echarts.init(canvas, null, {
        width: res[0].width,
        height: res[0].height,
        renderer: 'canvas',
        devicePixelRatio: 2,
      })

      chart.setOption(props.option)
    })
  })
}

function onTouchStart(e: any) {
  if (chart) {
    isMoving = false
    // @ts-ignore
    chart.getZr().handler.dispatch('mousedown', e.mp)
  }
}

function onTouchMove(e: any) {
  if (chart) {
    isMoving = true
    // @ts-ignore
    chart.getZr().handler.dispatch('mousemove', e.mp)
  }
}

function onTouchEnd(e: any) {
  if (chart) {
    // @ts-ignore
    chart.getZr().handler.dispatch('mouseup', e.mp)
    if (!isMoving) {
      // @ts-ignore
      chart.getZr().handler.dispatch('click', e.mp)
    }
  }
}

onMounted(() => {
  initChart()
})

watch(() => props.option, (val) => {
  if (chart) chart.setOption(val)
}, { deep: true })
</script>

<style lang="scss" scoped>
.echarts-wrap {
  width: 100%;
  height: 500rpx;
  position: relative;
}
.echarts-canvas {
  width: 100%;
  height: 100%;
}
</style>

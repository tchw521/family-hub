<script setup lang="ts">
/**
 * StarNet.vue — 家族星网可视化组件
 * 微信小程序兼容版本：使用 Canvas 2D 原生绘制
 */
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { GraphNode, GraphEdge } from '@/store/family'

const props = defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  centerId: string
  width?: number
  height?: number
}>()

const emit = defineEmits<{
  (e: 'nodeClick', node: GraphNode): void
  (e: 'centerChange', nodeId: string): void
}>()

// Canvas ID 使用固定值
const canvasId = 'starnet-canvas'
const canvasRef = ref<any>(null)

// Canvas 状态
let ctx: UniApp.CanvasContext | null = null
let canvasWidth = 375
let canvasHeight = 500
let dpr = 2
let isReady = false
let animationTimer: any = null

// 物理节点
interface PhysNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  data: GraphNode
}

let physNodes: PhysNode[] = []
let simTick = 0
let simRunning = false

// 交互状态
let lastTouchX = 0
let lastTouchY = 0
let lastTapTime = 0
let touchStartX = 0
let touchStartY = 0

// 视图变换
let viewX = 0
let viewY = 0
let viewScale = 1

// 颜色常量
const COLORS = {
  bg: '#FAF8F5',
  center: '#F28C38',
  me: '#F28C38',
  verified: '#4A90D9',
  unverified: '#C5C0BA',
  text: '#2D2A26',
  textLight: '#8C8580',
  edgeVerified: '#4A90D9',
  edgeUnverified: '#D0CBC4',
  father: '#4A90D9',
  mother: '#E87D7D',
  spouse: '#F28C38',
  sibling: '#7B68EE',
  other: '#8C8580'
}

// 关系颜色映射
function getRelationColor(type: string): string {
  const map: Record<string, string> = {
    father: COLORS.father,
    mother: COLORS.mother,
    son: COLORS.father,
    daughter: COLORS.mother,
    husband: COLORS.spouse,
    wife: COLORS.spouse,
    brother: COLORS.sibling,
    sister: COLORS.sibling,
    grandfather: COLORS.father,
    grandmother: COLORS.mother
  }
  return map[type] || COLORS.other
}

// 初始化 Canvas
async function initCanvas() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    dpr = systemInfo.pixelRatio || 2
    canvasWidth = props.width || systemInfo.windowWidth - 32
    canvasHeight = props.height || 400
    
    // 使用 uni.createCanvasContext 兼容微信小程序
    ctx = uni.createCanvasContext(canvasId)
    
    if (!ctx) {
      console.error('[StarNet] Canvas context 创建失败')
      return
    }
    
    isReady = true
    console.log('[StarNet] Canvas 初始化成功', { width: canvasWidth, height: canvasHeight })
    
    // 构建物理节点并启动模拟
    buildPhysNodes()
    startSimulation()
  } catch (e) {
    console.error('[StarNet] 初始化错误:', e)
  }
}

// 构建物理节点
function buildPhysNodes() {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const count = props.nodes.length
  
  // 保留已有位置
  const existing = new Map(physNodes.map(n => [n.id, { x: n.x, y: n.y }]))
  
  physNodes = props.nodes.map((node, i) => {
    const pos = existing.get(node.id)
    if (pos && !isNaN(pos.x) && !isNaN(pos.y)) {
      return {
        id: node.id,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: getNodeRadius(node),
        data: node
      }
    }
    
    // 新节点：圆形布局
    const isCenter = node.id === props.centerId
    const angle = (i / count) * Math.PI * 2
    const dist = isCenter ? 0 : 80 + Math.random() * 40
    
    return {
      id: node.id,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      radius: getNodeRadius(node),
      data: node
    }
  })
  
  // 重置视图
  viewX = 0
  viewY = 0
  viewScale = 1
}

function getNodeRadius(node: GraphNode): number {
  if (node.isCenter || node.id === props.centerId) return 28
  if (node.isMe) return 24
  if (node.verified) return 20
  return 16
}

// 力导向模拟
function startSimulation() {
  simTick = 0
  simRunning = true
  
  // 使用 setTimeout 代替 requestAnimationFrame（小程序兼容性更好）
  const step = () => {
    if (!simRunning || simTick >= 150) {
      simRunning = false
      draw()
      return
    }
    
    tick()
    draw()
    simTick++
    
    animationTimer = setTimeout(step, 16) // ~60fps
  }
  
  step()
}

function tick() {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const alpha = Math.max(0.1, 1 - simTick / 120)
  
  physNodes.forEach(n => {
    // 中心节点固定
    if (n.id === props.centerId) {
      n.x = cx
      n.y = cy
      n.vx = 0
      n.vy = 0
      return
    }
    
    let fx = 0, fy = 0
    
    // 1. 向心力
    const gravityStrength = 0.08
    fx += (cx - n.x) * gravityStrength
    fy += (cy - n.y) * gravityStrength
    
    // 2. 弹簧力（连接的节点）
    props.edges.forEach(e => {
      if (e.source !== n.id && e.target !== n.id) return
      const otherId = e.source === n.id ? e.target : e.source
      const other = physNodes.find(p => p.id === otherId)
      if (!other) return
      
      const dx = other.x - n.x
      const dy = other.y - n.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = 100
      const force = (dist - targetDist) * 0.03
      
      fx += (dx / dist) * force
      fy += (dy / dist) * force
    })
    
    // 3. 斥力（所有节点互相排斥）
    physNodes.forEach(other => {
      if (other === n) return
      const dx = n.x - other.x
      const dy = n.y - other.y
      const dist2 = dx * dx + dy * dy || 1
      const repulsion = 2000 / dist2
      
      fx += (dx / Math.sqrt(dist2)) * repulsion
      fy += (dy / Math.sqrt(dist2)) * repulsion
    })
    
    // 更新速度和位置
    n.vx = (n.vx + fx) * 0.6 * alpha
    n.vy = (n.vy + fy) * 0.6 * alpha
    n.x += n.vx
    n.y += n.vy
    
    // 边界约束
    const padding = n.radius + 10
    n.x = Math.max(padding, Math.min(canvasWidth - padding, n.x))
    n.y = Math.max(padding, Math.min(canvasHeight - padding, n.y))
  })
}

// 绘制
function draw() {
  if (!ctx || !isReady) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制背景
  ctx.setFillStyle(COLORS.bg)
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 应用变换
  ctx.save()
  ctx.translate(viewX, viewY)
  ctx.scale(viewScale, viewScale)
  
  // 绘制边
  drawEdges()
  
  // 绘制节点
  drawNodes()
  
  ctx.restore()
  
  // 提交绘制
  ctx.draw()
}

function drawEdges() {
  if (!ctx) return
  
  props.edges.forEach(edge => {
    const src = physNodes.find(n => n.id === edge.source)
    const tgt = physNodes.find(n => n.id === edge.target)
    if (!src || !tgt) return
    
    // 线条样式
    ctx!.beginPath()
    ctx!.moveTo(src.x, src.y)
    ctx!.lineTo(tgt.x, tgt.y)
    
    const color = edge.verified ? getRelationColor(edge.type) : COLORS.edgeUnverified
    ctx!.setStrokeStyle(color)
    ctx!.setLineWidth(edge.verified ? 2 : 1.5)
    
    if (!edge.verified) {
      ctx!.setLineDash([6, 4])
    } else {
      ctx!.setLineDash([])
    }
    
    ctx!.setGlobalAlpha(edge.verified ? 0.8 : 0.5)
    ctx!.stroke()
    ctx!.setGlobalAlpha(1)
    ctx!.setLineDash([])
    
    // 关系标签
    const mx = (src.x + tgt.x) / 2
    const my = (src.y + tgt.y) / 2
    
    ctx!.setFillStyle('rgba(250,248,245,0.9)')
    ctx!.fillRect(mx - 20, my - 8, 40, 16)
    
    ctx!.setFillStyle(edge.verified ? color : COLORS.textLight)
    ctx!.setFontSize(10)
    ctx!.setTextAlign('center')
    ctx!.setTextBaseline('middle')
    ctx!.fillText(edge.label, mx, my)
  })
}

function drawNodes() {
  if (!ctx) return
  
  physNodes.forEach(node => {
    const { x, y, radius, data } = node
    const isCenter = data.id === props.centerId
    
    // 外圈光晕（中心节点）
    if (isCenter) {
      ctx!.beginPath()
      ctx!.arc(x, y, radius + 8, 0, Math.PI * 2)
      ctx!.setFillStyle('rgba(242,140,56,0.15)')
      ctx!.fill()
    }
    
    // 节点圆
    ctx!.beginPath()
    ctx!.arc(x, y, radius, 0, Math.PI * 2)
    
    let color = COLORS.unverified
    if (isCenter) color = COLORS.center
    else if (data.isMe) color = COLORS.me
    else if (data.verified) color = COLORS.verified
    
    ctx!.setFillStyle(color)
    ctx!.fill()
    
    // 未验证虚线边框
    if (!data.verified && !isCenter) {
      ctx!.beginPath()
      ctx!.arc(x, y, radius + 2, 0, Math.PI * 2)
      ctx!.setStrokeStyle('#C5C0BA')
      ctx!.setLineWidth(1.5)
      ctx!.setLineDash([4, 3])
      ctx!.stroke()
      ctx!.setLineDash([])
    }
    
    // 头像首字
    ctx!.setFillStyle('#ffffff')
    ctx!.setFontSize(isCenter ? 14 : 12)
    ctx!.setTextAlign('center')
    ctx!.setTextBaseline('middle')
    ctx!.fillText(data.name.slice(0, 1), x, y)
    
    // 名字标签
    ctx!.setFillStyle(isCenter ? COLORS.center : (data.verified ? COLORS.text : COLORS.textLight))
    ctx!.setFontSize(isCenter ? 12 : 10)
    ctx!.setTextAlign('center')
    ctx!.setTextBaseline('top')
    ctx!.fillText(data.name, x, y + radius + 4)
  })
}

// 触摸事件
function onTouchStart(e: any) {
  const touch = e.touches?.[0] || e.mp?.touches?.[0]
  if (!touch) return
  
  touchStartX = touch.x
  touchStartY = touch.y
  lastTouchX = touch.x
  lastTouchY = touch.y
}

function onTouchMove(e: any) {
  const touch = e.touches?.[0] || e.mp?.touches?.[0]
  if (!touch) return
  
  const dx = touch.x - lastTouchX
  const dy = touch.y - lastTouchY
  
  viewX += dx
  viewY += dy
  
  lastTouchX = touch.x
  lastTouchY = touch.y
  
  if (!simRunning) draw()
}

function onTouchEnd(e: any) {
  const touch = e.changedTouches?.[0] || e.mp?.changedTouches?.[0]
  if (!touch) return
  
  const dx = Math.abs(touch.x - touchStartX)
  const dy = Math.abs(touch.y - touchStartY)
  const moved = dx > 10 || dy > 10
  
  // 如果没有移动，视为点击
  if (!moved) {
    handleTap(touch.x, touch.y)
  }
}

function handleTap(sx: number, sy: number) {
  // 转换为画布坐标
  const cx = (sx - viewX) / viewScale
  const cy = (sy - viewY) / viewScale
  
  // 检测点击的节点
  for (let i = physNodes.length - 1; i >= 0; i--) {
    const n = physNodes[i]
    const dx = cx - n.x
    const dy = cy - n.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist <= n.radius + 10) {
      emit('nodeClick', n.data)
      
      // 双击切换中心
      const now = Date.now()
      if (now - lastTapTime < 300 && n.id !== props.centerId) {
        emit('centerChange', n.id)
      }
      lastTapTime = now
      
      return
    }
  }
}

// 监听数据变化
watch(() => [props.nodes, props.edges, props.centerId], () => {
  if (isReady) {
    buildPhysNodes()
    startSimulation()
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    setTimeout(initCanvas, 200)
  })
})

onUnmounted(() => {
  simRunning = false
  if (animationTimer) {
    clearTimeout(animationTimer)
  }
})
</script>

<template>
  <view class="starnet">
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="starnet__canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    
    <!-- 调试信息 -->
    <view v-if="!isReady" class="starnet__loading">
      <text class="starnet__loading-text">正在加载星网...</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.starnet {
  width: 100%;
  height: 100%;
  position: relative;
  background: #FAF8F5;
  border-radius: $radius-base;
  overflow: hidden;

  &__canvas {
    display: block;
    background: #FAF8F5;
  }
  
  &__loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(250, 248, 245, 0.9);
  }
  
  &__loading-text {
    font-size: $font-size-base;
    color: $color-text-secondary;
  }
}
</style>

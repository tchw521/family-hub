<script setup lang="ts">
/**
 * StarNet.vue — 家族星网可视化组件
 * 用 Canvas 2D 原生绘制，支持：
 *  - 力导向布局（简化版弹簧模型）
 *  - 点击节点切换中心
 *  - 拖拽节点
 *  - 双指缩放 + 单指平移
 *  - 关系线标签
 *  - 不同关系颜色
 */
import { ref, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
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

// ─── Canvas 状态 ─────────────────────────────────────────
const canvasId = 'starnet-' + Math.random().toString(36).slice(2, 8)
const instance = getCurrentInstance()

let ctx: any = null
let canvasWidth = 0
let canvasHeight = 0
let dpr = 1
let animFrameId = 0
let isReady = false

// ─── 视图变换 ─────────────────────────────────────────────
let viewX = 0   // 平移 X
let viewY = 0   // 平移 Y
let viewScale = 1

// ─── 节点物理位置 ─────────────────────────────────────────
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
let simRunning = false
let simTick = 0

// ─── 交互状态 ─────────────────────────────────────────────
let draggingNode: PhysNode | null = null
let dragOffX = 0
let dragOffY = 0
let lastTouchX = 0
let lastTouchY = 0
let lastPinchDist = 0
let touchStartTime = 0
let touchMoved = false

// ─── 颜色常量 ─────────────────────────────────────────────
const COLOR_BG = '#FAF8F5'
const COLOR_CENTER = '#F28C38'
const COLOR_ME = '#F28C38'
const COLOR_VERIFIED = '#4A90D9'
const COLOR_UNVERIFIED = '#C5C0BA'
const COLOR_TEXT = '#2D2A26'
const COLOR_TEXT_LIGHT = '#8C8580'
const COLOR_EDGE_UNVERIFIED = '#D0CBC4'

// ─── 初始化 ───────────────────────────────────────────────
function init() {
  const query = uni.createSelectorQuery().in(instance?.proxy)
  query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res: any[]) => {
    if (!res?.[0]?.node) return
    const canvas = res[0].node
    dpr = uni.getSystemInfoSync().pixelRatio || 2
    canvasWidth = res[0].width
    canvasHeight = res[0].height
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    isReady = true
    buildPhysNodes()
    startSim()
  })
}

// ─── 构建物理节点 ─────────────────────────────────────────
function buildPhysNodes() {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const count = props.nodes.length
  const existing = new Map(physNodes.map(n => [n.id, n]))

  physNodes = props.nodes.map((node, i) => {
    if (existing.has(node.id)) {
      const old = existing.get(node.id)!
      old.data = node
      old.radius = nodeRadius(node)
      return old
    }
    // 新节点：以中心为基础随机散布
    const angle = (i / count) * Math.PI * 2
    const dist = node.id === props.centerId ? 0 : 80 + Math.random() * 60
    return {
      id: node.id,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: 0, vy: 0,
      radius: nodeRadius(node),
      data: node,
    }
  })

  // 重置视图到中心
  viewX = 0; viewY = 0; viewScale = 1
}

function nodeRadius(node: GraphNode): number {
  if (node.isCenter) return 28
  if (node.isMe) return 24
  if (node.verified) return 20
  return 16
}

// ─── 力导向模拟 ───────────────────────────────────────────
function startSim() {
  simRunning = true
  simTick = 0
  cancelAnimationFrame(animFrameId)
  loop()
}

function loop() {
  if (!isReady) return
  tick()
  draw()
  if (simRunning && simTick < 200) {
    animFrameId = requestAnimationFrame(loop)
  } else {
    simRunning = false
    draw() // 最后一帧
  }
}

function tick() {
  simTick++
  const alpha = Math.max(0.01, 1 - simTick / 180)
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2

  // 找中心节点
  const center = physNodes.find(n => n.id === props.centerId)

  physNodes.forEach(n => {
    if (n === draggingNode) return

    let fx = 0, fy = 0

    // 1. 引力：拉向画布中心
    const gravityStrength = n.id === props.centerId ? 0.3 : 0.05
    fx += (cx - n.x) * gravityStrength
    fy += (cy - n.y) * gravityStrength

    // 2. 弹簧：连接的节点互相吸引
    props.edges.forEach(e => {
      const isConnected = e.source === n.id || e.target === n.id
      if (!isConnected) return
      const otherId = e.source === n.id ? e.target : e.source
      const other = physNodes.find(p => p.id === otherId)
      if (!other) return
      const dx = other.x - n.x
      const dy = other.y - n.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = n.id === props.centerId || other.id === props.centerId ? 110 : 140
      const force = (dist - targetDist) * 0.04
      fx += (dx / dist) * force
      fy += (dy / dist) * force
    })

    // 3. 斥力：所有节点互相排斥
    physNodes.forEach(other => {
      if (other === n) return
      const dx = n.x - other.x
      const dy = n.y - other.y
      const dist2 = dx * dx + dy * dy || 1
      const repulsion = 2800 / dist2
      fx += (dx / Math.sqrt(dist2)) * repulsion
      fy += (dy / Math.sqrt(dist2)) * repulsion
    })

    // 4. 中心节点固定在画布中心
    if (n.id === props.centerId) {
      n.x += (cx - n.x) * 0.2
      n.y += (cy - n.y) * 0.2
      n.vx = 0; n.vy = 0
      return
    }

    n.vx = (n.vx + fx) * 0.6 * alpha
    n.vy = (n.vy + fy) * 0.6 * alpha
    n.x += n.vx
    n.y += n.vy

    // 边界约束
    const pad = n.radius + 10
    n.x = Math.max(pad, Math.min(canvasWidth - pad, n.x))
    n.y = Math.max(pad, Math.min(canvasHeight - pad, n.y))
  })
}

// ─── 绘制 ─────────────────────────────────────────────────
function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  ctx.save()
  ctx.translate(viewX, viewY)
  ctx.scale(viewScale, viewScale)

  drawEdges()
  drawNodes()

  ctx.restore()
}

function drawEdges() {
  props.edges.forEach(edge => {
    const src = physNodes.find(n => n.id === edge.source)
    const tgt = physNodes.find(n => n.id === edge.target)
    if (!src || !tgt) return

    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1

    // 线条
    ctx.beginPath()
    ctx.moveTo(src.x, src.y)
    ctx.lineTo(tgt.x, tgt.y)
    ctx.strokeStyle = edge.verified ? edge.color : COLOR_EDGE_UNVERIFIED
    ctx.lineWidth = edge.verified ? 2 : 1.5
    ctx.setLineDash(edge.verified ? [] : [6, 4])
    ctx.globalAlpha = edge.verified ? 0.85 : 0.5
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // 关系标签（线段中点）
    const mx = (src.x + tgt.x) / 2
    const my = (src.y + tgt.y) / 2
    const label = edge.label
    const fontSize = 10
    ctx.font = `${fontSize}px sans-serif`
    const tw = ctx.measureText(label).width
    const pad = 4

    // 标签背景
    ctx.fillStyle = 'rgba(250,248,245,0.88)'
    ctx.beginPath()
    roundRect(ctx, mx - tw / 2 - pad, my - fontSize / 2 - pad, tw + pad * 2, fontSize + pad * 2, 4)
    ctx.fill()

    // 标签文字
    ctx.fillStyle = edge.verified ? edge.color : COLOR_TEXT_LIGHT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, mx, my)
  })
}

function drawNodes() {
  physNodes.forEach(node => {
    const { x, y, radius, data } = node
    const isCenter = data.id === props.centerId

    // 外圈光晕（中心节点）
    if (isCenter) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(242,140,56,0.15)'
      ctx.fill()
    }

    // 节点圆
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (isCenter) {
      ctx.fillStyle = COLOR_CENTER
    } else if (data.isMe) {
      ctx.fillStyle = COLOR_ME
    } else if (data.verified) {
      ctx.fillStyle = COLOR_VERIFIED
    } else {
      ctx.fillStyle = COLOR_UNVERIFIED
    }
    ctx.fill()

    // 未验证虚线边框
    if (!data.verified && !isCenter) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2)
      ctx.strokeStyle = '#C5C0BA'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 头像首字
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${isCenter ? 14 : 12}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(data.name.slice(0, 1), x, y)

    // 名字标签（节点下方）
    ctx.fillStyle = isCenter ? COLOR_CENTER : (data.verified ? COLOR_TEXT : COLOR_TEXT_LIGHT)
    ctx.font = `${isCenter ? 13 : 11}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(data.name, x, y + radius + 4)
  })
}

// ─── 圆角矩形辅助 ─────────────────────────────────────────
function roundRect(c: any, x: number, y: number, w: number, h: number, r: number) {
  c.moveTo(x + r, y)
  c.lineTo(x + w - r, y)
  c.quadraticCurveTo(x + w, y, x + w, y + r)
  c.lineTo(x + w, y + h - r)
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  c.lineTo(x + r, y + h)
  c.quadraticCurveTo(x, y + h, x, y + h - r)
  c.lineTo(x, y + r)
  c.quadraticCurveTo(x, y, x + r, y)
  c.closePath()
}

// ─── 坐标转换（屏幕 → 画布） ──────────────────────────────
function screenToCanvas(sx: number, sy: number) {
  return {
    x: (sx - viewX) / viewScale,
    y: (sy - viewY) / viewScale,
  }
}

function hitTest(cx: number, cy: number): PhysNode | null {
  for (let i = physNodes.length - 1; i >= 0; i--) {
    const n = physNodes[i]
    const dx = cx - n.x
    const dy = cy - n.y
    if (dx * dx + dy * dy <= (n.radius + 8) ** 2) return n
  }
  return null
}

// ─── 触摸事件 ─────────────────────────────────────────────
function onTouchStart(e: any) {
  const touches = e.touches || e.mp?.touches || []
  touchStartTime = Date.now()
  touchMoved = false

  if (touches.length === 1) {
    const t = touches[0]
    const { x, y } = screenToCanvas(t.x, t.y)
    const hit = hitTest(x, y)
    if (hit) {
      draggingNode = hit
      dragOffX = hit.x - x
      dragOffY = hit.y - y
    } else {
      lastTouchX = t.x
      lastTouchY = t.y
    }
  } else if (touches.length === 2) {
    draggingNode = null
    const dx = touches[1].x - touches[0].x
    const dy = touches[1].y - touches[0].y
    lastPinchDist = Math.sqrt(dx * dx + dy * dy)
    lastTouchX = (touches[0].x + touches[1].x) / 2
    lastTouchY = (touches[0].y + touches[1].y) / 2
  }
}

function onTouchMove(e: any) {
  const touches = e.touches || e.mp?.touches || []
  touchMoved = true

  if (touches.length === 1) {
    const t = touches[0]
    if (draggingNode) {
      const { x, y } = screenToCanvas(t.x, t.y)
      draggingNode.x = x + dragOffX
      draggingNode.y = y + dragOffY
      draggingNode.vx = 0
      draggingNode.vy = 0
      if (!simRunning) draw()
    } else {
      viewX += t.x - lastTouchX
      viewY += t.y - lastTouchY
      lastTouchX = t.x
      lastTouchY = t.y
      if (!simRunning) draw()
    }
  } else if (touches.length === 2) {
    const dx = touches[1].x - touches[0].x
    const dy = touches[1].y - touches[0].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const midX = (touches[0].x + touches[1].x) / 2
    const midY = (touches[0].y + touches[1].y) / 2

    if (lastPinchDist > 0) {
      const ratio = dist / lastPinchDist
      const newScale = Math.max(0.3, Math.min(3, viewScale * ratio))
      // 以双指中点为缩放中心
      viewX = midX - (midX - viewX) * (newScale / viewScale)
      viewY = midY - (midY - viewY) * (newScale / viewScale)
      viewScale = newScale
    }
    lastPinchDist = dist
    lastTouchX = midX
    lastTouchY = midY
    if (!simRunning) draw()
  }
}

function onTouchEnd(e: any) {
  const elapsed = Date.now() - touchStartTime
  const wasDragging = draggingNode

  if (draggingNode) {
    draggingNode = null
    // 拖拽结束后重新激活模拟
    simTick = 150
    simRunning = true
    loop()
  }

  // 短按 + 未移动 = 点击
  if (!touchMoved && elapsed < 300) {
    const touches = e.changedTouches || e.mp?.changedTouches || []
    if (touches.length === 1) {
      const t = touches[0]
      const { x, y } = screenToCanvas(t.x, t.y)
      const hit = hitTest(x, y)
      if (hit) {
        handleNodeClick(hit)
      }
    }
  }
}

function handleNodeClick(node: PhysNode) {
  emit('nodeClick', node.data)
  // 双击（快速两次点击）切换中心
  if (node.id !== props.centerId) {
    emit('centerChange', node.id)
  }
}

// ─── 监听数据变化 ─────────────────────────────────────────
watch(() => [props.nodes, props.edges, props.centerId], () => {
  buildPhysNodes()
  startSim()
}, { deep: true })

// ─── 生命周期 ─────────────────────────────────────────────
onMounted(() => {
  // 延迟一帧确保 DOM 就绪
  setTimeout(init, 100)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  simRunning = false
})
</script>

<template>
  <view class="starnet">
    <canvas
      :id="canvasId"
      :canvas-id="canvasId"
      class="starnet__canvas"
      type="2d"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
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
    width: 100%;
    height: 100%;
    display: block;
  }
}
</style>

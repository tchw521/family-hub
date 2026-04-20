<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useFamilyStore } from '@/store/family'

const userStore = useUserStore()
const familyStore = useFamilyStore()

// ==================== 星网状态 ====================
const centerId = ref('')
const centerMember = computed(() => 
  familyStore.members.find(m => m.id === centerId.value) || null
)

// 当前中心的关系成员
const centerRelations = computed(() => {
  if (!centerId.value) return []
  return familyStore.getMemberRelations(centerId.value).map(rel => {
    const otherId = rel.fromId === centerId.value ? rel.toId : rel.fromId
    const other = familyStore.members.find(m => m.id === otherId)
    return { rel, other }
  }).filter(x => x.other)
})

// 图数据
const graphData = computed(() => familyStore.buildGraphData(centerId.value))

// ==================== 面板状态 ====================
const showInfoPanel = ref(false)
const selectedNode = ref(null)
const showAddSheet = ref(false)

// 统计
const stats = computed(() => familyStore.stats)
const pendingCount = computed(() => familyStore.pendingVerifyCount)

// ==================== 初始化 ====================
onMounted(async () => {
  await familyStore.loadRelatives()
  centerId.value = familyStore.myMemberId
  initCanvas()
})

onShow(() => {
  if (familyStore.members.length > 0 && !centerId.value) {
    centerId.value = familyStore.myMemberId
  }
})

// ==================== 星网交互 ====================
function onNodeClick(node) {
  selectedNode.value = node
  showInfoPanel.value = true
}

function onCenterChange(nodeId) {
  centerId.value = nodeId
  showInfoPanel.value = false
}

function resetCenter() {
  centerId.value = familyStore.myMemberId
  showInfoPanel.value = false
}

// ==================== 添加成员 ====================
const addOptions = [
  { icon: '✏️', text: '手动添加', desc: '填写亲属信息', action: 'manual' },
  { icon: '🔍', text: '搜索关联', desc: '找到已注册的亲属', action: 'search' },
]

function onSelectAdd(action) {
  showAddSheet.value = false
  if (action === 'manual') {
    uni.navigateTo({ url: '/pages/relatives/add' })
  } else {
    uni.navigateTo({ url: '/pages/relatives/search' })
  }
}

// ==================== 分享 ====================
onShareAppMessage(() => ({
  title: `${userStore.user?.nickname || '我'}的家族星网`,
  path: '/pages/index/index',
}))

// ==================== Canvas 绘制 ====================
let ctx = null
let canvasWidth = 350
let canvasHeight = 450
let isReady = false
let animationTimer = null

// 物理节点
let physNodes = []
let simTick = 0
let simRunning = false

// 视图变换
let viewX = 0
let viewY = 0
let viewScale = 1

// 触摸状态
let lastTouchX = 0
let lastTouchY = 0

// 颜色
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
}

function getRelationColor(type) {
  const map = {
    father: COLORS.father,
    mother: COLORS.mother,
    son: COLORS.father,
    daughter: COLORS.mother,
    husband: COLORS.spouse,
    wife: COLORS.spouse,
    brother: COLORS.sibling,
    sister: '#FF69B4',
  }
  return map[type] || COLORS.unverified
}

function initCanvas() {
  const query = uni.createSelectorQuery()
  query.select('#starnet-canvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        console.log('[StarNet] Canvas 未就绪，延迟重试')
        setTimeout(initCanvas, 300)
        return
      }
      
      const canvas = res[0].node
      const systemInfo = uni.getSystemInfoSync()
      const dpr = systemInfo.pixelRatio || 2
      
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      
      ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      
      canvasWidth = res[0].width
      canvasHeight = res[0].height
      
      isReady = true
      console.log('[StarNet] Canvas 初始化成功', canvasWidth, canvasHeight)
      
      buildPhysNodes()
      startSimulation()
    })
}

function buildPhysNodes() {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const nodes = graphData.value.nodes || []
  const count = nodes.length
  
  const existing = new Map(physNodes.map(n => [n.id, { x: n.x, y: n.y }]))
  
  physNodes = nodes.map((node, i) => {
    const pos = existing.get(node.id)
    if (pos && !isNaN(pos.x)) {
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
    
    const isCenter = node.id === centerId.value
    const angle = (i / count) * Math.PI * 2
    const dist = isCenter ? 0 : 70 + Math.random() * 30
    
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
  
  viewX = 0
  viewY = 0
  viewScale = 1
}

function getNodeRadius(node) {
  if (node.id === centerId.value) return 28
  if (node.isMe) return 24
  if (node.verified) return 20
  return 16
}

function startSimulation() {
  simTick = 0
  simRunning = true
  
  const step = () => {
    if (!simRunning || simTick >= 120) {
      simRunning = false
      draw()
      return
    }
    
    tick()
    draw()
    simTick++
    
    animationTimer = setTimeout(step, 20)
  }
  
  step()
}

function tick() {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const alpha = Math.max(0.1, 1 - simTick / 100)
  
  physNodes.forEach(n => {
    // 中心固定
    if (n.id === centerId.value) {
      n.x = cx
      n.y = cy
      n.vx = 0
      n.vy = 0
      return
    }
    
    let fx = 0, fy = 0
    
    // 向心力
    fx += (cx - n.x) * 0.08
    fy += (cy - n.y) * 0.08
    
    // 弹簧力
    const edges = graphData.value.edges || []
    edges.forEach(e => {
      if (e.source !== n.id && e.target !== n.id) return
      const otherId = e.source === n.id ? e.target : e.source
      const other = physNodes.find(p => p.id === otherId)
      if (!other) return
      
      const dx = other.x - n.x
      const dy = other.y - n.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = 90
      const force = (dist - targetDist) * 0.025
      
      fx += (dx / dist) * force
      fy += (dy / dist) * force
    })
    
    // 斥力
    physNodes.forEach(other => {
      if (other === n) return
      const dx = n.x - other.x
      const dy = n.y - other.y
      const dist2 = dx * dx + dy * dy || 1
      const repulsion = 1500 / dist2
      
      fx += (dx / Math.sqrt(dist2)) * repulsion
      fy += (dy / Math.sqrt(dist2)) * repulsion
    })
    
    // 更新位置
    n.vx = (n.vx + fx) * 0.55 * alpha
    n.vy = (n.vy + fy) * 0.55 * alpha
    n.x += n.vx
    n.y += n.vy
    
    // 边界
    const pad = n.radius + 10
    n.x = Math.max(pad, Math.min(canvasWidth - pad, n.x))
    n.y = Math.max(pad, Math.min(canvasHeight - pad, n.y))
  })
}

function draw() {
  if (!ctx || !isReady) return
  
  // 清空
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 背景
  ctx.fillStyle = COLORS.bg
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
}

function drawEdges() {
  const edges = graphData.value.edges || []
  
  edges.forEach(edge => {
    const src = physNodes.find(n => n.id === edge.source)
    const tgt = physNodes.find(n => n.id === edge.target)
    if (!src || !tgt) return
    
    // 线条
    ctx.beginPath()
    ctx.moveTo(src.x, src.y)
    ctx.lineTo(tgt.x, tgt.y)
    
    const color = edge.verified ? getRelationColor(edge.type) : COLORS.edgeUnverified
    ctx.strokeStyle = color
    ctx.lineWidth = edge.verified ? 2 : 1.5
    
    if (!edge.verified) {
      ctx.setLineDash([5, 3])
    } else {
      ctx.setLineDash([])
    }
    
    ctx.globalAlpha = edge.verified ? 0.8 : 0.5
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.setLineDash([])
    
    // 关系标签
    const mx = (src.x + tgt.x) / 2
    const my = (src.y + tgt.y) / 2
    
    ctx.fillStyle = 'rgba(250,248,245,0.92)'
    ctx.fillRect(mx - 18, my - 8, 36, 16)
    
    ctx.fillStyle = edge.verified ? color : COLORS.textLight
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(edge.label, mx, my)
  })
}

function drawNodes() {
  physNodes.forEach(node => {
    const { x, y, radius, data } = node
    const isCenter = data.id === centerId.value
    
    // 光晕
    if (isCenter) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(242,140,56,0.15)'
      ctx.fill()
    }
    
    // 节点圆
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    
    let color = COLORS.unverified
    if (isCenter) color = COLORS.center
    else if (data.isMe) color = COLORS.me
    else if (data.verified) color = COLORS.verified
    
    ctx.fillStyle = color
    ctx.fill()
    
    // 未验证边框
    if (!data.verified && !isCenter) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2)
      ctx.strokeStyle = '#C5C0BA'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // 首字
    ctx.fillStyle = '#fff'
    ctx.font = isCenter ? 'bold 14px sans-serif' : 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(data.name.slice(0, 1), x, y)
    
    // 名字
    ctx.fillStyle = isCenter ? COLORS.center : (data.verified ? COLORS.text : COLORS.textLight)
    ctx.font = isCenter ? '12px sans-serif' : '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(data.name, x, y + radius + 4)
  })
}

// 触摸事件
function onTouchStart(e) {
  const touch = e.touches?.[0]
  if (!touch) return
  lastTouchX = touch.x
  lastTouchY = touch.y
}

function onTouchMove(e) {
  const touch = e.touches?.[0]
  if (!touch) return
  
  const dx = touch.x - lastTouchX
  const dy = touch.y - lastTouchY
  
  viewX += dx
  viewY += dy
  lastTouchX = touch.x
  lastTouchY = touch.y
  
  if (!simRunning) draw()
}

function onTouchEnd(e) {
  const touch = e.changedTouches?.[0]
  if (!touch) return
  
  const dx = Math.abs(touch.x - lastTouchX)
  const dy = Math.abs(touch.y - lastTouchY)
  
  // 点击检测
  if (dx < 10 && dy < 10) {
    handleTap(touch.x, touch.y)
  }
}

function handleTap(sx, sy) {
  const cx = (sx - viewX) / viewScale
  const cy = (sy - viewY) / viewScale
  
  for (let i = physNodes.length - 1; i >= 0; i--) {
    const n = physNodes[i]
    const dx = cx - n.x
    const dy = cy - n.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist <= n.radius + 8) {
      onNodeClick(n.data)
      return
    }
  }
}

// 监听数据变化
watch(graphData, () => {
  if (isReady) {
    buildPhysNodes()
    startSimulation()
  }
}, { deep: true })

onUnmounted(() => {
  simRunning = false
  if (animationTimer) clearTimeout(animationTimer)
})
</script>

<template>
  <view class="home">
    <!-- 顶部导航 -->
    <view class="nav">
      <view class="nav-left">
        <text class="nav-title">家族星网</text>
        <view v-if="centerId !== familyStore.myMemberId" class="nav-center-tag" @tap="resetCenter">
          <text class="nav-center-name">{{ centerMember?.name }}</text>
          <text class="nav-center-reset">回到我 ×</text>
        </view>
      </view>
      <view class="nav-right">
        <view class="nav-btn" @tap="uni.navigateTo({ url: '/pages/relatives/verify' })">
          <text class="nav-icon">🔔</text>
          <view v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</view>
        </view>
        <view class="nav-btn" @tap="showAddSheet = true">
          <text class="nav-icon">＋</text>
        </view>
      </view>
    </view>

    <!-- 星网画布 -->
    <view class="canvas-wrap">
      <canvas 
        id="starnet-canvas" 
        class="starnet-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      />
      
      <!-- 空状态 -->
      <view v-if="!graphData.nodes || graphData.nodes.length === 0" class="empty-state">
        <text class="empty-icon">🌟</text>
        <text class="empty-title">星网是空的</text>
        <text class="empty-hint">添加第一位家人开始织网</text>
        <view class="empty-btn" @tap="showAddSheet = true">
          <text>＋ 添加家人</text>
        </view>
      </view>
      
      <!-- 底部统计 -->
      <view class="stats-bar">
        <view class="stat-item" @tap="uni.switchTab({ url: '/pages/relatives/index' })">
          <text class="stat-num">{{ stats.total }}</text>
          <text class="stat-label">成员</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @tap="uni.navigateTo({ url: '/pages/relatives/verify' })">
          <text class="stat-num">{{ stats.verified }}</text>
          <text class="stat-label">已验证</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.relationCount }}</text>
          <text class="stat-label">关系线</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.familyCount }}</text>
          <text class="stat-label">家族</text>
        </view>
      </view>
      
      <!-- 操作提示 -->
      <view class="canvas-hint">
        <text>点击成员查看详情 · 再次点击切换中心</text>
      </view>
    </view>

    <!-- 成员信息面板 -->
    <view v-if="showInfoPanel && selectedNode" class="panel-mask" @tap="showInfoPanel = false">
      <view class="panel" @tap.stop>
        <view class="panel-header">
          <view class="panel-avatar" :class="selectedNode.verified ? 'verified' : ''">
            <text class="panel-avatar-text">{{ selectedNode.name.slice(0, 1) }}</text>
          </view>
          <view class="panel-info">
            <text class="panel-name">{{ selectedNode.name }}</text>
            <view class="panel-tags">
              <text v-if="selectedNode.isMe" class="tag tag-me">我</text>
              <text v-if="selectedNode.verified" class="tag tag-verified">已验证</text>
              <text v-else class="tag tag-unverified">未验证</text>
            </view>
          </view>
          <text class="panel-close" @tap="showInfoPanel = false">✕</text>
        </view>
        
        <view class="panel-relations">
          <text class="panel-section-title">关系网络</text>
          <view v-if="centerRelations.length === 0" class="panel-empty">暂无关系记录</view>
          <view 
            v-for="item in centerRelations" 
            :key="item.rel.id"
            class="panel-rel-item"
            @tap="onCenterChange(item.other.id)"
          >
            <view class="panel-rel-dot" :style="{ background: item.rel.verified ? '#4A90D9' : '#C5C0BA' }"></view>
            <text class="panel-rel-label">{{ item.rel.label }}</text>
            <text class="panel-rel-name">{{ item.other?.name }}</text>
            <text class="panel-rel-arrow">›</text>
          </view>
        </view>
        
        <view class="panel-actions">
          <view class="panel-action-btn primary" @tap="onCenterChange(selectedNode.id)">
            <text>以TA为中心</text>
          </view>
          <view class="panel-action-btn" @tap="uni.navigateTo({ url: '/pages/relatives/detail?id=' + selectedNode.id }); showInfoPanel = false">
            <text>查看详情</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加成员弹窗 -->
    <view v-if="showAddSheet" class="sheet-mask" @tap="showAddSheet = false">
      <view class="sheet" @tap.stop>
        <view class="sheet-header">
          <text class="sheet-title">添加家人</text>
          <text class="sheet-close" @tap="showAddSheet = false">✕</text>
        </view>
        <view 
          v-for="opt in addOptions" 
          :key="opt.action"
          class="sheet-option"
          @tap="onSelectAdd(opt.action)"
        >
          <text class="sheet-option-icon">{{ opt.icon }}</text>
          <view class="sheet-option-text">
            <text class="sheet-option-title">{{ opt.text }}</text>
            <text class="sheet-option-desc">{{ opt.desc }}</text>
          </view>
          <text class="sheet-option-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.home {
  min-height: 100vh;
  background: #FAF8F5;
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 16px 10px;
  background: #FAF8F5;
}

.nav-left { display: flex; align-items: center; gap: 8px; }
.nav-title { font-size: 20px; font-weight: 700; color: #2D2A26; }

.nav-center-tag {
  display: flex; align-items: center; gap: 4px;
  background: rgba(242, 140, 56, 0.12);
  border-radius: 12px;
  padding: 3px 8px;
}
.nav-center-name { font-size: 12px; color: #F28C38; font-weight: 500; }
.nav-center-reset { font-size: 10px; color: #8C8580; }

.nav-right { display: flex; align-items: center; gap: 4px; }
.nav-btn {
  position: relative;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.nav-icon { font-size: 18px; }
.nav-badge {
  position: absolute; top: 2px; right: 2px;
  background: #E85D3A; color: #fff; font-size: 9px;
  min-width: 14px; height: 14px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
}

.canvas-wrap {
  flex: 1;
  position: relative;
  margin: 0 8px;
  border-radius: 12px;
  overflow: hidden;
  background: #FAF8F5;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.starnet-canvas { display: block; background: #FAF8F5; }

.empty-state {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.empty-icon { font-size: 50px; margin-bottom: 8px; }
.empty-title { font-size: 16px; font-weight: 600; color: #2D2A26; }
.empty-hint { font-size: 12px; color: #8C8580; margin-top: 4px; }
.empty-btn {
  margin-top: 20px;
  background: #F28C38; color: #fff;
  padding: 8px 24px; border-radius: 20px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(242,140,56,0.3);
}

.stats-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-around;
  padding: 8px 16px;
  background: rgba(255,255,255,0.95);
  border-top: 1px solid #EDE8E2;
}
.stat-item { display: flex; flex-direction: column; align-items: center; padding: 4px 0; }
.stat-num { font-size: 16px; font-weight: 700; color: #F28C38; }
.stat-label { font-size: 10px; color: #8C8580; margin-top: 2px; }
.stat-divider { width: 1px; height: 20px; background: #EDE8E2; }

.canvas-hint {
  position: absolute; bottom: 50px; left: 0; right: 0;
  text-align: center;
  padding: 4px;
  background: rgba(255,255,255,0.7);
}
.canvas-hint text { font-size: 10px; color: #C5C0BA; }

/* 面板 */
.panel-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 100;
  display: flex; align-items: flex-end;
}
.panel {
  width: 100%; background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  max-height: 70vh; overflow-y: auto;
}
.panel-header { display: flex; align-items: center; margin-bottom: 16px; }
.panel-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: #C5C0BA; display: flex; align-items: center; justify-content: center;
  &.verified { background: #4A90D9; }
}
.panel-avatar-text { font-size: 18px; font-weight: 700; color: #fff; }
.panel-info { flex: 1; margin-left: 12px; }
.panel-name { display: block; font-size: 16px; font-weight: 700; color: #2D2A26; }
.panel-tags { display: flex; gap: 4px; margin-top: 4px; }
.panel-close { font-size: 16px; color: #8C8580; padding: 4px; }

.panel-section-title { font-size: 12px; color: #8C8580; font-weight: 500; margin-bottom: 8px; }
.panel-relations { margin-bottom: 16px; }
.panel-empty { text-align: center; padding: 16px; color: #C5C0BA; font-size: 12px; }
.panel-rel-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #EDE8E2; }
.panel-rel-item:last-child { border-bottom: none; }
.panel-rel-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
.panel-rel-label { font-size: 12px; color: #8C8580; width: 50px; }
.panel-rel-name { flex: 1; font-size: 14px; color: #2D2A26; font-weight: 500; }
.panel-rel-arrow { color: #C5C0BA; }

.panel-actions { display: flex; gap: 8px; }
.panel-action-btn {
  flex: 1; height: 40px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 14px; background: #FAF8F5; color: #2D2A26; border: 1px solid #EDE8E2;
  &.primary { background: #F28C38; color: #fff; border-color: #F28C38; }
}

/* 标签 */
.tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; }
.tag-me { background: rgba(242,140,56,0.15); color: #F28C38; }
.tag-verified { background: rgba(74,144,217,0.12); color: #4A90D9; }
.tag-unverified { background: #FAF8F5; color: #8C8580; border: 1px solid #EDE8E2; }

/* 添加弹窗 */
.sheet-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; }
.sheet { width: 100%; background: #fff; border-radius: 16px 16px 0 0; padding: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
.sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.sheet-title { font-size: 16px; font-weight: 600; }
.sheet-close { font-size: 16px; color: #8C8580; padding: 4px; }

.sheet-option { display: flex; align-items: center; padding: 12px; border-radius: 8px; margin-bottom: 8px; background: #FAF8F5; }
.sheet-option:active { background: #EDE8E2; }
.sheet-option-icon { font-size: 24px; margin-right: 12px; }
.sheet-option-text { flex: 1; }
.sheet-option-title { display: block; font-size: 14px; font-weight: 500; }
.sheet-option-desc { display: block; font-size: 12px; color: #8C8580; }
.sheet-option-arrow { color: #C5C0BA; }
</style>

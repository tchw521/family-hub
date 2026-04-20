<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useFamilyStore } from '@/store/family'
import type { GraphNode } from '@/store/family'

const userStore = useUserStore()
const familyStore = useFamilyStore()

// ─── 星网状态 ─────────────────────────────────────────────
const centerId = ref('')
const centerMember = computed(() =>
  familyStore.members.find(m => m.id === centerId.value) || null
)

// 当前中心的关系成员列表（侧边信息面板用）
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

// ─── 面板状态 ─────────────────────────────────────────────
const showInfoPanel = ref(false)   // 成员信息面板
const selectedNode = ref<GraphNode | null>(null)
const showAddSheet = ref(false)    // 添加成员弹窗

// ─── 统计 ─────────────────────────────────────────────────
const stats = computed(() => familyStore.stats)
const pendingCount = computed(() => familyStore.pendingVerifyCount)

// ─── 初始化 ───────────────────────────────────────────────
onMounted(async () => {
  await familyStore.loadRelatives()
  centerId.value = familyStore.myMemberId
})

onShow(() => {
  if (familyStore.members.length > 0 && !centerId.value) {
    centerId.value = familyStore.myMemberId
  }
})

// ─── 星网交互 ─────────────────────────────────────────────
function onNodeClick(node: GraphNode) {
  selectedNode.value = node
  showInfoPanel.value = true
}

function onCenterChange(nodeId: string) {
  centerId.value = nodeId
  showInfoPanel.value = false
}

function resetCenter() {
  centerId.value = familyStore.myMemberId
  showInfoPanel.value = false
}

// ─── 添加成员 ─────────────────────────────────────────────
const addOptions = [
  { icon: '✏️', text: '手动添加', desc: '填写亲属信息', action: 'manual' },
  { icon: '🔍', text: '搜索关联', desc: '找到已注册的亲属', action: 'search' },
]

function onSelectAdd(action: string) {
  showAddSheet.value = false
  if (action === 'manual') {
    uni.navigateTo({ url: '/pages/relatives/add' })
  } else {
    uni.navigateTo({ url: '/pages/relatives/search' })
  }
}

// ─── 分享 ─────────────────────────────────────────────────
onShareAppMessage(() => ({
  title: `${userStore.user?.nickname || '我'}的家族星网`,
  path: '/pages/index/index',
}))
</script>

<template>
  <view class="home">

    <!-- ── 顶部导航栏 ── -->
    <view class="nav">
      <view class="nav__left">
        <text class="nav__title">家族星网</text>
        <view v-if="centerId !== familyStore.myMemberId" class="nav__center-tag" @tap="resetCenter">
          <text class="nav__center-name">{{ centerMember?.name }}</text>
          <text class="nav__center-reset">回到我 ×</text>
        </view>
      </view>
      <view class="nav__right">
        <view class="nav__btn" @tap="uni.navigateTo({ url: '/pages/relatives/verify' })">
          <text class="nav__icon">🔔</text>
          <view v-if="pendingCount > 0" class="nav__badge">{{ pendingCount }}</view>
        </view>
        <view class="nav__btn" @tap="showAddSheet = true">
          <text class="nav__icon">＋</text>
        </view>
      </view>
    </view>

    <!-- ── 星网主体（全屏） ── -->
    <view class="net-wrap">
      <StarNet
        v-if="graphData.nodes.length > 0"
        :nodes="graphData.nodes"
        :edges="graphData.edges"
        :centerId="centerId"
        @nodeClick="onNodeClick"
        @centerChange="onCenterChange"
      />

      <!-- 空状态 -->
      <view v-else class="net-empty">
        <text class="net-empty__icon">🌟</text>
        <text class="net-empty__title">星网还是空的</text>
        <text class="net-empty__hint">添加第一位家人，开始织网</text>
        <view class="net-empty__btn" @tap="showAddSheet = true">
          <text>＋ 添加家人</text>
        </view>
      </view>

      <!-- 底部统计条 -->
      <view class="net-stats">
        <view class="net-stat" @tap="uni.switchTab({ url: '/pages/relatives/index' })">
          <text class="net-stat__num">{{ stats.total }}</text>
          <text class="net-stat__label">成员</text>
        </view>
        <view class="net-stat-divider"></view>
        <view class="net-stat" @tap="uni.navigateTo({ url: '/pages/relatives/verify' })">
          <text class="net-stat__num">{{ stats.verified }}</text>
          <text class="net-stat__label">已验证</text>
        </view>
        <view class="net-stat-divider"></view>
        <view class="net-stat">
          <text class="net-stat__num">{{ stats.relationCount }}</text>
          <text class="net-stat__label">关系线</text>
        </view>
        <view class="net-stat-divider"></view>
        <view class="net-stat">
          <text class="net-stat__num">{{ stats.familyCount }}</text>
          <text class="net-stat__label">家族</text>
        </view>
      </view>

      <!-- 操作提示 -->
      <view class="net-hint">
        <text>点击成员查看详情 · 再次点击切换中心</text>
      </view>
    </view>

    <!-- ── 成员信息面板（底部抽屉） ── -->
    <view v-if="showInfoPanel && selectedNode" class="panel-mask" @tap="showInfoPanel = false">
      <view class="panel" @tap.stop>
        <!-- 面板头部 -->
        <view class="panel__header">
          <view class="panel__avatar" :class="selectedNode.verified ? 'panel__avatar--verified' : ''">
            <text class="panel__avatar-text">{{ selectedNode.name.slice(0, 1) }}</text>
          </view>
          <view class="panel__info">
            <text class="panel__name">{{ selectedNode.name }}</text>
            <view class="panel__tags">
              <view v-if="selectedNode.isMe" class="tag tag--me">我</view>
              <view v-if="selectedNode.verified" class="tag tag--verified">已验证</view>
              <view v-else class="tag tag--unverified">未验证</view>
            </view>
          </view>
          <view class="panel__close" @tap="showInfoPanel = false">✕</view>
        </view>

        <!-- 关系列表 -->
        <view class="panel__relations">
          <text class="panel__section-title">关系网络</text>
          <view v-if="centerRelations.length === 0" class="panel__empty">
            <text>暂无关系记录</text>
          </view>
          <view
            v-for="item in centerRelations"
            :key="item.rel.id"
            class="panel__rel-item"
            @tap="onCenterChange(item.other!.id)"
          >
            <view class="panel__rel-dot" :style="{ background: item.rel.verified ? '#4A90D9' : '#C5C0BA' }"></view>
            <text class="panel__rel-label">{{ item.rel.label }}</text>
            <text class="panel__rel-name">{{ item.other?.name }}</text>
            <text class="panel__rel-arrow">›</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="panel__actions">
          <view
            class="panel__action-btn panel__action-btn--primary"
            @tap="onCenterChange(selectedNode.id)"
          >
            <text>以TA为中心</text>
          </view>
          <view
            class="panel__action-btn"
            @tap="uni.navigateTo({ url: `/pages/relatives/detail?id=${selectedNode.id}` }); showInfoPanel = false"
          >
            <text>查看详情</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ── 添加成员弹窗 ── -->
    <view v-if="showAddSheet" class="sheet-mask" @tap="showAddSheet = false">
      <view class="sheet" @tap.stop>
        <view class="sheet__header">
          <text class="sheet__title">添加家人</text>
          <text class="sheet__close" @tap="showAddSheet = false">✕</text>
        </view>
        <view
          v-for="opt in addOptions"
          :key="opt.action"
          class="sheet__option"
          @tap="onSelectAdd(opt.action)"
        >
          <text class="sheet__option-icon">{{ opt.icon }}</text>
          <view class="sheet__option-text">
            <text class="sheet__option-title">{{ opt.text }}</text>
            <text class="sheet__option-desc">{{ opt.desc }}</text>
          </view>
          <text class="sheet__option-arrow">›</text>
        </view>
      </view>
    </view>

  </view>
</template>

<style lang="scss" scoped>
// ── 整体布局 ──────────────────────────────────────────────
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FAF8F5;
}

// ── 导航栏 ────────────────────────────────────────────────
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 32rpx 20rpx;
  background: #FAF8F5;
  position: relative;
  z-index: 10;

  &__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__title {
    font-size: 40rpx;
    font-weight: 700;
    color: $color-text;
  }

  &__center-tag {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: rgba(242, 140, 56, 0.12);
    border-radius: $radius-lg;
    padding: 6rpx 16rpx;
  }

  &__center-name {
    font-size: $font-size-sm;
    color: $color-primary;
    font-weight: 500;
  }

  &__center-reset {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__btn {
    position: relative;
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg-card;
    border-radius: $radius-round;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);

    &:active { opacity: 0.7; }
  }

  &__icon {
    font-size: 36rpx;
  }

  &__badge {
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    background: $color-danger;
    color: #fff;
    font-size: 18rpx;
    min-width: 28rpx;
    height: 28rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6rpx;
  }
}

// ── 星网区域 ──────────────────────────────────────────────
.net-wrap {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0 $spacing-base;
  border-radius: $radius-lg;
  overflow: hidden;
  background: #FAF8F5;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
  min-height: 600rpx;
}

// StarNet 组件撑满
:deep(.starnet) {
  flex: 1;
  min-height: 520rpx;
}

// 空状态
.net-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;

  &__icon { font-size: 100rpx; margin-bottom: $spacing-base; }
  &__title { font-size: $font-size-lg; font-weight: 600; color: $color-text; }
  &__hint { font-size: $font-size-sm; color: $color-text-secondary; margin-top: $spacing-xs; }

  &__btn {
    margin-top: $spacing-xl;
    background: $color-primary;
    color: #fff;
    padding: $spacing-sm $spacing-xl;
    border-radius: $radius-round;
    font-size: $font-size-base;
    font-weight: 500;
    box-shadow: 0 8rpx 24rpx rgba(242,140,56,0.3);
    &:active { opacity: 0.85; }
  }
}

// 底部统计条
.net-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: $spacing-sm $spacing-base;
  background: rgba(255,255,255,0.9);
  border-top: 1rpx solid $color-divider;
}

.net-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 0;
  &:active { opacity: 0.7; }

  &__num {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-primary;
    line-height: 1.2;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin-top: 4rpx;
  }
}

.net-stat-divider {
  width: 1rpx;
  height: 40rpx;
  background: $color-divider;
}

// 操作提示
.net-hint {
  text-align: center;
  padding: 8rpx;
  background: rgba(255,255,255,0.7);

  text {
    font-size: $font-size-xs;
    color: $color-text-placeholder;
  }
}

// ── 成员信息面板 ──────────────────────────────────────────
.panel-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.panel {
  width: 100%;
  background: #fff;
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg $spacing-base calc(env(safe-area-inset-bottom) + 40rpx);
  max-height: 75vh;
  overflow-y: auto;

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-lg;
  }

  &__avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: $color-text-placeholder;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--verified { background: #4A90D9; }
  }

  &__avatar-text {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
  }

  &__info {
    flex: 1;
    margin-left: $spacing-base;
  }

  &__name {
    display: block;
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-text;
  }

  &__tags {
    display: flex;
    gap: 8rpx;
    margin-top: 8rpx;
  }

  &__close {
    font-size: $font-size-lg;
    color: $color-text-secondary;
    padding: 8rpx;
  }

  &__section-title {
    display: block;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-sm;
    font-weight: 500;
  }

  &__relations {
    margin-bottom: $spacing-lg;
  }

  &__empty {
    text-align: center;
    padding: $spacing-base 0;
    color: $color-text-placeholder;
    font-size: $font-size-sm;
  }

  &__rel-item {
    display: flex;
    align-items: center;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $color-divider;
    &:last-child { border-bottom: none; }
    &:active { opacity: 0.7; }
  }

  &__rel-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    margin-right: $spacing-sm;
    flex-shrink: 0;
  }

  &__rel-label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    width: 100rpx;
  }

  &__rel-name {
    flex: 1;
    font-size: $font-size-base;
    color: $color-text;
    font-weight: 500;
  }

  &__rel-arrow {
    color: $color-text-placeholder;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__action-btn {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-base;
    font-size: $font-size-base;
    background: $color-bg;
    color: $color-text;
    border: 1rpx solid $color-border;
    &:active { opacity: 0.7; }

    &--primary {
      background: $color-primary;
      color: #fff;
      border-color: $color-primary;
      box-shadow: 0 4rpx 16rpx rgba(242,140,56,0.3);
    }
  }
}

// ── 添加弹窗 ──────────────────────────────────────────────
.sheet-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: $color-bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-base $spacing-base calc(env(safe-area-inset-bottom) + 32rpx);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-base;
  }

  &__title { font-size: $font-size-md; font-weight: 600; }
  &__close { font-size: $font-size-md; color: $color-text-secondary; padding: 8rpx; }

  &__option {
    display: flex;
    align-items: center;
    padding: $spacing-base;
    border-radius: $radius-base;
    margin-bottom: $spacing-sm;
    background: $color-bg;
    &:active { background: $color-divider; }
  }

  &__option-icon { font-size: 48rpx; margin-right: $spacing-base; }
  &__option-title { display: block; font-size: $font-size-base; font-weight: 500; }
  &__option-desc { display: block; font-size: $font-size-sm; color: $color-text-secondary; }
  &__option-arrow { color: $color-text-placeholder; margin-left: auto; }
}

// ── 标签 ──────────────────────────────────────────────────
.tag {
  font-size: $font-size-xs;
  padding: 4rpx 12rpx;
  border-radius: $radius-sm;

  &--me { background: rgba(242,140,56,0.15); color: $color-primary; }
  &--verified { background: rgba(74,144,217,0.12); color: #4A90D9; }
  &--unverified { background: $color-bg; color: $color-text-secondary; border: 1rpx solid $color-border; }
}
</style>

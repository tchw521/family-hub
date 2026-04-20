import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ─── 成员 ───────────────────────────────────────────────
export interface Member {
  id: string
  name: string
  gender: 'male' | 'female' | 'unknown'
  avatar?: string
  birthday?: string
  hometown?: string
  phone?: string
  openid?: string          // 已注册用户的 openid
  verified: boolean        // 是否已通过验证关联
  isMe?: boolean           // 是否是当前用户自己
  createdAt: number
}

// ─── 关系边 ──────────────────────────────────────────────
export interface Relation {
  id: string
  fromId: string           // 关系发起方
  toId: string             // 关系目标方
  type: RelationType       // 关系类型
  label: string            // 显示标签（如"父亲"）
  verified: boolean        // 双方都确认了
  createdAt: number
}

// ─── 关系类型 ────────────────────────────────────────────
export type RelationType =
  | 'father' | 'mother' | 'son' | 'daughter'
  | 'brother' | 'sister'
  | 'grandfather_p' | 'grandmother_p'   // 父系祖父母
  | 'grandfather_m' | 'grandmother_m'   // 母系祖父母
  | 'grandson' | 'granddaughter'
  | 'uncle_p' | 'aunt_p'               // 父系叔伯姑
  | 'uncle_m' | 'aunt_m'               // 母系舅姨
  | 'cousin'
  | 'husband' | 'wife'
  | 'son_in_law' | 'daughter_in_law'
  | 'other'

// 关系类型 → 中文标签
export const RELATION_LABELS: Record<RelationType, string> = {
  father: '父亲', mother: '母亲', son: '儿子', daughter: '女儿',
  brother: '兄弟', sister: '姐妹',
  grandfather_p: '爷爷', grandmother_p: '奶奶',
  grandfather_m: '外公', grandmother_m: '外婆',
  grandson: '孙子', granddaughter: '孙女',
  uncle_p: '叔伯', aunt_p: '姑姑',
  uncle_m: '舅舅', aunt_m: '姨妈',
  cousin: '表/堂兄弟姐妹',
  husband: '丈夫', wife: '妻子',
  son_in_law: '女婿', daughter_in_law: '儿媳',
  other: '其他',
}

// 关系类型 → 线条颜色
export const RELATION_COLORS: Record<string, string> = {
  father: '#4A90D9', mother: '#E87D7D',
  son: '#4A90D9', daughter: '#E87D7D',
  brother: '#7B68EE', sister: '#FF69B4',
  grandfather_p: '#2E86AB', grandmother_p: '#A23B72',
  grandfather_m: '#2E86AB', grandmother_m: '#A23B72',
  grandson: '#2E86AB', granddaughter: '#A23B72',
  uncle_p: '#5BA4CF', aunt_p: '#C06C84',
  uncle_m: '#5BA4CF', aunt_m: '#C06C84',
  cousin: '#88B04B',
  husband: '#F28C38', wife: '#F28C38',
  son_in_law: '#E8A838', daughter_in_law: '#E8A838',
  other: '#8C8580',
}

// ─── 验证请求 ────────────────────────────────────────────
export interface VerifyRequest {
  id: string
  fromMemberId: string
  fromName: string
  toMemberId: string
  toName: string
  relationType: RelationType
  message: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  createdAt: number
}

// ─── Store ───────────────────────────────────────────────
export const useFamilyStore = defineStore('family', () => {
  const members = ref<Member[]>([])
  const relations = ref<Relation[]>([])
  const verifyRequests = ref<VerifyRequest[]>([])

  // 当前用户自己的 member id
  const myMemberId = ref<string>('')

  // ── 计算属性 ──────────────────────────────────────────
  const myMember = computed(() =>
    members.value.find(m => m.id === myMemberId.value) || null
  )

  const stats = computed(() => ({
    total: members.value.filter(m => !m.isMe).length,
    verified: members.value.filter(m => m.verified && !m.isMe).length,
    unverified: members.value.filter(m => !m.verified && !m.isMe).length,
    familyCount: new Set(
      relations.value.map(r => r.type.includes('_p') ? 'paternal' : r.type.includes('_m') ? 'maternal' : 'spouse')
    ).size,
    relationCount: relations.value.length,
  }))

  const pendingVerifyCount = computed(() =>
    verifyRequests.value.filter(v => v.status === 'pending').length
  )

  const recentMembers = computed(() =>
    [...members.value]
      .filter(m => !m.isMe)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
  )

  // ── 旧版兼容（relatives 别名）────────────────────────
  const relatives = computed(() => members.value.filter(m => !m.isMe).map(m => {
    const rel = relations.value.find(r =>
      (r.fromId === myMemberId.value && r.toId === m.id) ||
      (r.toId === myMemberId.value && r.fromId === m.id)
    )
    return {
      ...m,
      relation: rel?.type || 'other',
      relationLabel: rel?.label || '亲属',
      side: getSide(rel?.type),
    }
  }))

  function getSide(type?: string): 'paternal' | 'maternal' | 'spouse' {
    if (!type) return 'paternal'
    if (['husband', 'wife', 'son_in_law', 'daughter_in_law'].includes(type)) return 'spouse'
    if (type.endsWith('_m')) return 'maternal'
    return 'paternal'
  }

  function relativesBySide(side: string) {
    return relatives.value.filter(r => r.side === side)
  }

  // ── 星网图数据 ────────────────────────────────────────
  // 以某个成员为中心，构建图数据
  function buildGraphData(centerId?: string) {
    const center = centerId || myMemberId.value
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const addedIds = new Set<string>()

    // 添加所有成员为节点
    members.value.forEach(m => {
      nodes.push({
        id: m.id,
        name: m.name,
        isCenter: m.id === center,
        isMe: !!m.isMe,
        verified: m.verified,
        avatar: m.avatar,
        gender: m.gender,
      })
      addedIds.add(m.id)
    })

    // 添加所有关系为边
    relations.value.forEach(r => {
      edges.push({
        id: r.id,
        source: r.fromId,
        target: r.toId,
        label: r.label,
        type: r.type,
        verified: r.verified,
        color: RELATION_COLORS[r.type] || '#8C8580',
      })
    })

    return { nodes, edges, centerId: center }
  }

  // ── 操作方法 ──────────────────────────────────────────
  function setMyMemberId(id: string) {
    myMemberId.value = id
  }

  function addMember(data: Omit<Member, 'id' | 'createdAt'>): Member {
    const member: Member = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
    }
    members.value.push(member)
    return member
  }

  function updateMember(id: string, data: Partial<Member>) {
    const idx = members.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      members.value[idx] = { ...members.value[idx], ...data }
    }
  }

  function removeMember(id: string) {
    members.value = members.value.filter(m => m.id !== id)
    relations.value = relations.value.filter(r => r.fromId !== id && r.toId !== id)
  }

  function addRelation(data: Omit<Relation, 'id' | 'createdAt'>): Relation {
    const relation: Relation = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
    }
    relations.value.push(relation)
    return relation
  }

  function removeRelation(id: string) {
    relations.value = relations.value.filter(r => r.id !== id)
  }

  // 获取某成员的所有关系
  function getMemberRelations(memberId: string) {
    return relations.value.filter(r => r.fromId === memberId || r.toId === memberId)
  }

  // 获取两个成员之间的关系
  function getRelationBetween(aId: string, bId: string) {
    return relations.value.find(r =>
      (r.fromId === aId && r.toId === bId) ||
      (r.fromId === bId && r.toId === aId)
    )
  }

  // 旧版兼容
  function addRelative(data: any) {
    const member = addMember({
      name: data.name,
      gender: data.gender,
      verified: data.verified ?? false,
      avatar: data.avatar,
      birthday: data.birthday,
      hometown: data.hometown,
      phone: data.phone,
    })
    if (myMemberId.value) {
      addRelation({
        fromId: myMemberId.value,
        toId: member.id,
        type: data.relation || 'other',
        label: data.relationLabel || RELATION_LABELS[data.relation as RelationType] || '亲属',
        verified: data.verified ?? false,
      })
    }
    return member
  }

  function removeRelative(id: string) {
    removeMember(id)
  }

  function addVerifyRequest(data: Omit<VerifyRequest, 'id' | 'createdAt' | 'status'>) {
    verifyRequests.value.push({
      ...data,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: Date.now(),
    })
  }

  function approveVerify(id: string) {
    const req = verifyRequests.value.find(v => v.id === id)
    if (req) req.status = 'approved'
  }

  function rejectVerify(id: string, reason?: string) {
    const req = verifyRequests.value.find(v => v.id === id)
    if (req) { req.status = 'rejected'; req.rejectReason = reason }
  }

  // 加载数据（模拟 + 云端）
  async function loadRelatives() {
    if (members.value.length > 0) return

    // 模拟数据 —— 真实场景从云函数加载
    const meId = 'me'
    myMemberId.value = meId

    members.value = [
      { id: meId, name: '我', gender: 'male', verified: true, isMe: true, createdAt: Date.now() },
      { id: 'm1', name: '张伟', gender: 'male', verified: true, createdAt: Date.now() - 86400000 * 10 },
      { id: 'm2', name: '李芳', gender: 'female', verified: true, createdAt: Date.now() - 86400000 * 9 },
      { id: 'm3', name: '张明', gender: 'male', verified: false, createdAt: Date.now() - 86400000 * 5 },
      { id: 'm4', name: '张爷爷', gender: 'male', verified: true, createdAt: Date.now() - 86400000 * 8 },
      { id: 'm5', name: '张奶奶', gender: 'female', verified: true, createdAt: Date.now() - 86400000 * 8 },
      { id: 'm6', name: '王丽', gender: 'female', verified: false, createdAt: Date.now() - 86400000 * 2 },
    ]

    relations.value = [
      { id: 'r1', fromId: meId, toId: 'm1', type: 'father', label: '父亲', verified: true, createdAt: Date.now() },
      { id: 'r2', fromId: meId, toId: 'm2', type: 'mother', label: '母亲', verified: true, createdAt: Date.now() },
      { id: 'r3', fromId: meId, toId: 'm3', type: 'brother', label: '哥哥', verified: false, createdAt: Date.now() },
      { id: 'r4', fromId: 'm1', toId: 'm4', type: 'father', label: '父亲', verified: true, createdAt: Date.now() },
      { id: 'r5', fromId: 'm1', toId: 'm5', type: 'mother', label: '母亲', verified: true, createdAt: Date.now() },
      { id: 'r6', fromId: meId, toId: 'm6', type: 'wife', label: '妻子', verified: false, createdAt: Date.now() },
    ]
  }

  return {
    members, relations, verifyRequests, myMemberId, myMember,
    stats, pendingVerifyCount, recentMembers,
    // 旧版兼容
    relatives, relativesBySide,
    // 方法
    setMyMemberId,
    addMember, updateMember, removeMember,
    addRelation, removeRelation,
    getMemberRelations, getRelationBetween,
    buildGraphData,
    // 旧版兼容
    addRelative, removeRelative,
    loadRelatives,
    addVerifyRequest, approveVerify, rejectVerify,
  }
})

// ─── 图数据类型 ──────────────────────────────────────────
export interface GraphNode {
  id: string
  name: string
  isCenter: boolean
  isMe: boolean
  verified: boolean
  avatar?: string
  gender: 'male' | 'female' | 'unknown'
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  type: string
  verified: boolean
  color: string
}

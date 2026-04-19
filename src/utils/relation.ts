// 家族关系算法工具

export type RelationType =
  | 'father' | 'mother' | 'spouse'
  | 'brother' | 'sister'
  | 'son' | 'daughter'
  | 'grandfather_p' | 'grandmother_p'  // 父系祖父母
  | 'grandfather_m' | 'grandmother_m'  // 母系祖父母
  | 'uncle_p' | 'aunt_p'               // 父系叔姑
  | 'uncle_m' | 'aunt_m'               // 母系舅姨
  | 'cousin' | 'other'

// 关系中文映射
export const RELATION_LABELS: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  spouse: '配偶',
  brother: '兄弟',
  sister: '姐妹',
  son: '儿子',
  daughter: '女儿',
  grandfather_p: '爷爷',
  grandmother_p: '奶奶',
  grandfather_m: '外公',
  grandmother_m: '外婆',
  uncle_p: '叔叔/伯父',
  aunt_p: '姑姑',
  uncle_m: '舅舅',
  aunt_m: '阿姨',
  cousin: '表/堂兄弟姐妹',
  other: '其他',
}

// 关系所属家族侧
export function getRelationSide(relation: string): 'paternal' | 'maternal' | 'spouse' {
  if (['grandfather_p', 'grandmother_p', 'uncle_p', 'aunt_p'].includes(relation)) return 'paternal'
  if (['grandfather_m', 'grandmother_m', 'uncle_m', 'aunt_m'].includes(relation)) return 'maternal'
  if (relation === 'spouse') return 'spouse'
  return 'paternal' // 默认
}

// 反向关系计算
export function getReverseRelation(relation: string, targetGender: 'male' | 'female'): string {
  const reverseMap: Record<string, Record<string, string>> = {
    father:   { male: 'son', female: 'daughter' },
    mother:   { male: 'son', female: 'daughter' },
    son:      { male: 'father', female: 'mother' },
    daughter: { male: 'father', female: 'mother' },
    brother:  { male: 'brother', female: 'sister' },
    sister:   { male: 'brother', female: 'sister' },
    spouse:   { male: 'spouse', female: 'spouse' },
  }
  return reverseMap[relation]?.[targetGender] || 'other'
}

// 关系路径计算（核心算法）
// 通过递归查询关系表，计算两人之间的最短关系路径
interface RelationEdge {
  from: string
  to: string
  relation: string
}

export function findRelationPath(
  edges: RelationEdge[],
  fromId: string,
  toId: string,
  maxDepth = 10
): string[] | null {
  // BFS 搜索最短路径
  const queue: { id: string; path: string[]; depth: number }[] = [
    { id: fromId, path: [], depth: 0 }
  ]
  const visited = new Set<string>([fromId])

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.id === toId) return current.path

    if (current.depth >= maxDepth) continue

    // 查找所有相邻节点
    const neighbors = edges.filter(e => e.from === current.id || e.to === current.id)
    for (const edge of neighbors) {
      const nextId = edge.from === current.id ? edge.to : edge.from
      if (visited.has(nextId)) continue
      visited.add(nextId)
      queue.push({
        id: nextId,
        path: [...current.path, edge.relation],
        depth: current.depth + 1,
      })
    }
  }

  return null // 未找到路径
}

// 称谓自动识别
export function inferRelation(
  path: string[],
  gender: 'male' | 'female'
): string {
  if (path.length === 0) return '自己'
  if (path.length === 1) return RELATION_LABELS[path[0]] || path[0]

  // 简化称谓：路径深度 > 2 时用"远房亲属" + 路径描述
  if (path.length > 2) {
    const labels = path.map(p => RELATION_LABELS[p] || p)
    return `远房亲属（${labels.join('→')}）`
  }

  // 两人路径的称谓推断
  const [r1, r2] = path
  if (r1 === 'spouse') {
    // 配偶的亲属
    return RELATION_LABELS[r2] ? `配偶的${RELATION_LABELS[r2]}` : '配偶的亲属'
  }

  return `${RELATION_LABELS[r1] || r1}的${RELATION_LABELS[r2] || r2}`
}

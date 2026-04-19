// 云函数入口 - 家族人脉/蛛网路径模块
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'connections': return await getConnections(data)
    case 'path': return await findPath(data)
    case 'webData': return await getWebData(data)
    default: return { code: -1, message: '未知操作' }
  }
}

// 获取人脉连接
async function getConnections(data) {
  const { userId, filter } = data

  // 获取所有亲属关系
  const { data: relations } = await db.collection('relation')
    .where(_.or([{ userId1: userId }, { userId2: userId, verified: true }]))
    .limit(200)
    .get()

  // 获取所有关联用户信息
  const relativeIds = []
  for (const r of relations) {
    if (r.userId1 === userId && r.userId2) relativeIds.push(r.userId2)
    if (r.userId2 === userId && r.userId1) relativeIds.push(r.userId1)
  }

  if (relativeIds.length === 0) {
    return { code: 0, data: [] }
  }

  // 获取二度人脉（亲属的亲属）
  const { data: secondDegree } = await db.collection('relation')
    .where(_.or([
      { userId1: _.in(relativeIds), verified: true },
      { userId2: _.in(relativeIds), verified: true }
    ]))
    .limit(500)
    .get()

  // 构建人脉数据
  const connections = []
  const seen = new Set([userId])

  for (const r of secondDegree) {
    const targetId = relativeIds.includes(r.userId1) ? r.userId2 : r.userId1
    if (!targetId || seen.has(targetId)) continue
    seen.add(targetId)

    // 找到中间人
    const intermediary = relativeIds.includes(r.userId1) ? r.userId1 : r.userId2
    const myRelation = relations.find(
      myR => (myR.userId1 === userId && myR.userId2 === intermediary) ||
             (myR.userId2 === userId && myR.userId1 === intermediary)
    )

    connections.push({
      userId: targetId,
      path: myRelation ? [myRelation.relationFrom1, r.relationFrom1] : [],
      distance: 2,
    })
  }

  // 按筛选条件过滤
  let filtered = connections
  if (filter?.type === 'surname') {
    // TODO: 按姓氏筛选
  } else if (filter?.type === 'hometown') {
    // TODO: 按籍贯筛选
  } else if (filter?.type === 'distance') {
    filtered = filtered.sort((a, b) => a.distance - b.distance)
  }

  return { code: 0, data: filtered.slice(0, 50) }
}

// 计算两人间关系路径（BFS 最短路径）
async function findPath(data) {
  const { fromUserId, toUserId } = data

  // 获取所有关系边
  const { data: allRelations } = await db.collection('relation')
    .where({ verified: true })
    .limit(1000)
    .get()

  // BFS
  const edges = allRelations.map(r => ({
    from: r.userId1,
    to: r.userId2,
    relation: r.relationFrom1,
    reverseRelation: r.relationFrom2,
  }))

  const queue = [{ id: fromUserId, path: [], depth: 0 }]
  const visited = new Set([fromUserId])
  const maxDepth = 6 // 最多6度人脉

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current.id === toUserId) {
      return {
        code: 0,
        data: {
          path: current.path,
          distance: current.depth,
          found: true,
        }
      }
    }

    if (current.depth >= maxDepth) continue

    for (const edge of edges) {
      let nextId = null
      let stepRelation = ''

      if (edge.from === current.id && !visited.has(edge.to)) {
        nextId = edge.to
        stepRelation = edge.relation
      } else if (edge.to === current.id && !visited.has(edge.from)) {
        nextId = edge.from
        stepRelation = edge.reverseRelation
      }

      if (nextId) {
        visited.add(nextId)
        queue.push({
          id: nextId,
          path: [...current.path, { userId: nextId, relation: stepRelation }],
          depth: current.depth + 1,
        })
      }
    }
  }

  return { code: 0, data: { path: [], distance: -1, found: false } }
}

// 获取蛛网可视化数据
async function getWebData(data) {
  const { userId } = data

  const { data: relations } = await db.collection('relation')
    .where(_.or([{ userId1: userId }, { userId2: userId }]))
    .limit(100)
    .get()

  // 构建 ECharts 图数据
  const nodes = [{ id: userId, name: '我', category: 0, symbolSize: 40 }]
  const links = []
  const categories = [
    { name: '自己' },
    { name: '血缘亲属' },
    { name: '配偶家族' },
  ]

  for (const r of relations) {
    const isUser1 = r.userId1 === userId
    const targetId = isUser1 ? r.userId2 : r.userId1
    const targetName = isUser1 ? r.name2 : (r.name1 || '未知')
    const relation = isUser1 ? r.relationFrom1 : r.relationFrom2
    const category = r.side === 'spouse' ? 2 : 1

    if (!targetId) continue // 跳过未注册用户

    nodes.push({
      id: targetId,
      name: targetName,
      category,
      symbolSize: r.verified ? 30 : 20,
      itemStyle: r.verified ? {} : { opacity: 0.5 },
    })

    links.push({
      source: userId,
      target: targetId,
      value: relation,
      lineStyle: {
        color: r.side === 'spouse' ? '#F28C38' : '#4A4540',
        type: r.verified ? 'solid' : 'dashed',
      }
    })
  }

  return {
    code: 0,
    data: { nodes, links, categories }
  }
}

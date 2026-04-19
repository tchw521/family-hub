// 云函数入口 - 验证请求模块
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 防骚扰：同一用户每天最多向同一人发起2次验证
const MAX_DAILY_REQUESTS = 2

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'create': return await createVerify(data)
    case 'pending': return await listPending(data)
    case 'sent': return await listSent(data)
    case 'approve': return await approveVerify(data)
    case 'reject': return await rejectVerify(data)
    default: return { code: -1, message: '未知操作' }
  }
}

// 发起验证
async function createVerify(data) {
  const { fromUserId, toUserId, relation, message } = data

  if (!fromUserId || !toUserId || !relation || !message) {
    return { code: -1, message: '信息不完整' }
  }

  // 防骚扰检测
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: recentRequests } = await db.collection('verify')
    .where({
      fromUserId,
      toUserId,
      createdAt: _.gte(today)
    })
    .count()

  if (recentRequests.total >= MAX_DAILY_REQUESTS) {
    return { code: -1, message: `每天最多向同一人发起${MAX_DAILY_REQUESTS}次验证` }
  }

  // 检查是否已有待审核请求
  const { data: existing } = await db.collection('verify')
    .where({ fromUserId, toUserId, status: 'pending' })
    .limit(1).get()

  if (existing.length > 0) {
    return { code: -1, message: '已有待审核的验证请求' }
  }

  // 获取发起方姓名
  const { data: fromUser } = await db.collection('user').doc(fromUserId).get()

  // 创建验证请求
  const res = await db.collection('verify').add({
    data: {
      fromUserId,
      fromName: fromUser.name,
      toUserId,
      relation,
      message,
      status: 'pending',
      rejectReason: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    }
  })

  // TODO: 向接收方发送通知（订阅消息）

  return { code: 0, data: { id: res._id }, message: '验证请求已发送' }
}

// 待审核列表
async function listPending(data) {
  const { userId } = data
  const { data: list } = await db.collection('verify')
    .where({ toUserId: userId, status: 'pending' })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return { code: 0, data: list }
}

// 已发起列表
async function listSent(data) {
  const { userId } = data
  const { data: list } = await db.collection('verify')
    .where({ fromUserId: userId })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return { code: 0, data: list }
}

// 通过验证（核心：自动同步双方家族树）
async function approveVerify(data) {
  const { verifyId, userId } = data

  const { data: verify } = await db.collection('verify').doc(verifyId).get()
  if (!verify || verify.toUserId !== userId) {
    return { code: -1, message: '无权操作' }
  }
  if (verify.status !== 'pending') {
    return { code: -1, message: '请求已处理' }
  }

  // 更新验证状态
  await db.collection('verify').doc(verifyId).update({
    data: { status: 'approved', updatedAt: db.serverDate() }
  })

  // 获取验证双方信息
  const { data: fromUser } = await db.collection('user').doc(verify.fromUserId).get()
  const { data: toUser } = await db.collection('user').doc(verify.toUserId).get()

  // 确定家族侧
  const sideMap = {
    '父亲': 'paternal', '母亲': 'maternal', '配偶': 'spouse',
    '爷爷': 'paternal', '奶奶': 'paternal', '外公': 'maternal', '外婆': 'maternal',
  }
  const side = sideMap[verify.relation] || 'paternal'

  // 创建双向关系
  await db.collection('relation').add({
    data: {
      userId1: verify.fromUserId,
      name1: fromUser.name,
      gender1: fromUser.gender,
      userId2: verify.toUserId,
      name2: toUser.name,
      gender2: toUser.gender,
      relationFrom1: verify.relation,
      relationFrom2: getReverseRelation(verify.relation, toUser.gender),
      side,
      verified: true,
      verifiedAt: db.serverDate(),
      verifyId: verifyId,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    }
  })

  // TODO: 自动计算与对方家族所有成员的关系并同步
  // TODO: 向发起方发送通过通知

  return { code: 0, message: '验证通过，家族关系已同步' }
}

// 拒绝验证
async function rejectVerify(data) {
  const { verifyId, userId, reason } = data

  const { data: verify } = await db.collection('verify').doc(verifyId).get()
  if (!verify || verify.toUserId !== userId) {
    return { code: -1, message: '无权操作' }
  }

  await db.collection('verify').doc(verifyId).update({
    data: { status: 'rejected', rejectReason: reason || '', updatedAt: db.serverDate() }
  })

  return { code: 0, message: '已拒绝' }
}

function getReverseRelation(relation, gender) {
  const map = {
    '父亲': gender === 'male' ? '儿子' : '女儿',
    '母亲': gender === 'male' ? '儿子' : '女儿',
    '配偶': '配偶',
    '哥哥': gender === 'male' ? '弟弟' : '妹妹',
    '姐姐': gender === 'male' ? '弟弟' : '妹妹',
    '叔叔': gender === 'male' ? '侄子' : '侄女',
    '姑姑': gender === 'male' ? '侄子' : '侄女',
    '舅舅': gender === 'male' ? '外甥' : '外甥女',
    '阿姨': gender === 'male' ? '外甥' : '外甥女',
    '表兄': gender === 'male' ? '表弟' : '表妹',
    '表姐': gender === 'male' ? '表弟' : '表妹',
  }
  return map[relation] || '其他'
}

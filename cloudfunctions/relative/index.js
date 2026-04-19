// 云函数入口 - 亲属关系模块
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'add': return await addRelative(data)
    case 'remove': return await removeRelative(data)
    case 'list': return await listRelatives(data)
    case 'search': return await searchRelatives(data)
    case 'syncSpouse': return await syncSpouseFamily(data)
    default: return { code: -1, message: '未知操作' }
  }
}

// 手动添加亲属
async function addRelative(data) {
  const { userId, name, gender, relation, birthday, hometown, phone, invitePhone } = data

  if (!name || !relation) {
    return { code: -1, message: '姓名和关系为必填项' }
  }

  // 确定家族侧
  const sideMap = {
    '父亲': 'paternal', '母亲': 'maternal', '配偶': 'spouse',
    '爷爷': 'paternal', '奶奶': 'paternal', '外公': 'maternal', '外婆': 'maternal',
    '叔叔': 'paternal', '姑姑': 'paternal', '舅舅': 'maternal', '阿姨': 'maternal',
  }
  const side = sideMap[relation] || 'paternal'

  // 如果是添加配偶且提供了手机号，尝试查找已注册用户
  let linkedUserId = null
  if (phone) {
    const { data: existingUsers } = await db.collection('user')
      .where({ phone }).limit(1).get()
    if (existingUsers.length > 0) {
      linkedUserId = existingUsers[0]._id
    }
  }

  // 创建关系记录
  const relationRecord = {
    userId1: userId,
    userId2: linkedUserId || null, // null 表示对方未注册
    name2: name,
    gender2: gender,
    relationFrom1: relation,
    relationFrom2: getReverseRelation(relation, gender),
    side,
    verified: linkedUserId ? false : false,
    birthday: birthday || '',
    hometown: hometown || '',
    phone: phone || '',
    createdAt: db.serverDate(),
    updatedAt: db.serverDate(),
  }

  const res = await db.collection('relation').add({ data: relationRecord })

  // 如果是添加配偶且对方已注册，自动同步家族
  if (relation === '配偶' && linkedUserId) {
    await syncSpouseFamily({ userId, spouseId: linkedUserId, relationId: res._id })
  }

  // 如果提供了邀请手机号，发送邀请短信
  if (invitePhone) {
    // TODO: 发送邀请短信
  }

  return { code: 0, data: { id: res._id }, message: '添加成功' }
}

// 删除亲属
async function removeRelative(data) {
  const { userId, relationId } = data

  const { data: relation } = await db.collection('relation').doc(relationId).get()
  if (!relation || (relation.userId1 !== userId && relation.userId2 !== userId)) {
    return { code: -1, message: '无权操作' }
  }

  await db.collection('relation').doc(relationId).remove()
  return { code: 0, message: '已删除' }
}

// 获取亲属列表
async function listRelatives(data) {
  const { userId, side, verified } = data

  let query = _.or([
    { userId1: userId },
    { userId2: userId, verified: true }
  ])

  if (side) query = { ...query, side }
  if (verified !== undefined) query = { ...query, verified }

  const { data: relations } = await db.collection('relation')
    .where(query)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get()

  // 格式化返回数据
  const list = relations.map(r => {
    const isUser1 = r.userId1 === userId
    return {
      id: r._id,
      name: isUser1 ? r.name2 : (r.name1 || '未知'),
      relation: isUser1 ? r.relationFrom1 : r.relationFrom2,
      side: r.side,
      verified: r.verified,
      gender: isUser1 ? r.gender2 : (r.gender1 || ''),
      birthday: isUser1 ? r.birthday : '',
      hometown: isUser1 ? r.hometown : '',
    }
  })

  return { code: 0, data: list }
}

// 搜索亲属
async function searchRelatives(data) {
  const { type, keyword, userId } = data

  let query = {}
  switch (type) {
    case 'name':
      query = { name: db.RegExp({ regexp: keyword, options: 'i' }) }
      break
    case 'phone':
      query = { phone: keyword }
      break
    case 'hometown':
      query = { hometown: db.RegExp({ regexp: keyword, options: 'i' }) }
      break
    case 'surname':
      query = { name: db.RegExp({ regexp: `^${keyword}`, options: 'i' }) }
      break
  }

  // 排除自己
  query._id = _.neq(userId)

  const { data: users } = await db.collection('user')
    .where(query)
    .field({ name: true, hometown: true, gender: true })
    .limit(20)
    .get()

  return { code: 0, data: users }
}

// 配偶家族同步（核心算法）
async function syncSpouseFamily(data) {
  const { userId, spouseId, relationId } = data

  // 获取配偶的所有亲属
  const { data: spouseRelations } = await db.collection('relation')
    .where(_.or([{ userId1: spouseId }, { userId2: spouseId }]))
    .get()

  // 为用户创建"配偶家族"侧的亲属关系
  const batchOps = []
  for (const sr of spouseRelations) {
    if (sr._id === relationId) continue // 跳过配偶关系本身

    const isSpouseUser1 = sr.userId1 === spouseId
    const relationToSpouse = isSpouseUser1 ? sr.relationFrom1 : sr.relationFrom2
    const relativeName = isSpouseUser1 ? sr.name2 : (sr.name1 || '未知')

    // 推断与用户的关系（配偶的亲属 → 用户的姻亲）
    const inferredRelation = `配偶的${relationToSpouse}`

    batchOps.push(
      db.collection('relation').add({
        data: {
          userId1: userId,
          userId2: sr.userId2 === spouseId ? sr.userId1 : sr.userId2,
          name2: relativeName,
          gender2: isSpouseUser1 ? sr.gender2 : (sr.gender1 || ''),
          relationFrom1: inferredRelation,
          relationFrom2: `配偶的亲属',
          side: 'spouse',
          verified: false, // 需要验证
          source: 'spouse_sync',
          sourceRelationId: sr._id,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        }
      })
    )
  }

  await Promise.all(batchOps)
  return { code: 0, message: `同步了 ${batchOps.length} 位配偶家族亲属` }
}

// 反向关系计算
function getReverseRelation(relation, gender) {
  const map = {
    '父亲': gender === 'male' ? '儿子' : '女儿',
    '母亲': gender === 'male' ? '儿子' : '女儿',
    '儿子': gender === 'male' ? '父亲' : '母亲',
    '女儿': gender === 'male' ? '父亲' : '母亲',
    '配偶': '配偶',
    '哥哥': gender === 'male' ? '弟弟' : '妹妹',
    '姐姐': gender === 'male' ? '弟弟' : '妹妹',
    '弟弟': gender === 'male' ? '哥哥' : '姐姐',
    '妹妹': gender === 'male' ? '哥哥' : '姐姐',
  }
  return map[relation] || '其他'
}

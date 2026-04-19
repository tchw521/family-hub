// 云函数入口 - 家族圈模块
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list': return await listPosts(data)
    case 'publish': return await publishPost(data)
    case 'like': return await toggleLike(data)
    case 'comment': return await addComment(data)
    default: return { code: -1, message: '未知操作' }
  }
}

// 获取家族圈动态
async function listPosts(data) {
  const { userId, page = 1, pageSize = 10 } = data

  // 获取用户的亲属 ID 列表
  const { data: relations } = await db.collection('relation')
    .where(_.or([{ userId1: userId }, { userId2: userId }]))
    .get()

  const relativeIds = relations.map(r =>
    r.userId1 === userId ? r.userId2 : r.userId1
  ).filter(Boolean)
  relativeIds.push(userId) // 包含自己

  // 查询可见动态
  const { data: posts } = await db.collection('family_circle')
    .where({
      userId: _.in(relativeIds),
      visibility: _.in(['all', 'direct', 'custom']), // 简化权限判断
    })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return { code: 0, data: posts }
}

// 发布动态
async function publishPost(data) {
  const { userId, content, images, video, visibility = 'all' } = data

  if (!content && (!images || images.length === 0) && !video) {
    return { code: -1, message: '请输入内容或添加图片' }
  }

  const { data: user } = await db.collection('user').doc(userId).get()

  const res = await db.collection('family_circle').add({
    data: {
      userId,
      userName: user.name,
      userAvatar: user.avatar || '',
      content,
      images: images || [],
      video: video || '',
      visibility,
      likes: 0,
      comments: 0,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    }
  })

  return { code: 0, data: { id: res._id }, message: '发布成功' }
}

// 点赞/取消点赞
async function toggleLike(data) {
  const { userId, postId } = data

  const { data: existing } = await db.collection('circle_like')
    .where({ userId, postId }).limit(1).get()

  if (existing.length > 0) {
    // 取消点赞
    await db.collection('circle_like').doc(existing[0]._id).remove()
    await db.collection('family_circle').doc(postId).update({
      data: { likes: _.inc(-1) }
    })
    return { code: 0, data: { liked: false } }
  } else {
    // 点赞
    await db.collection('circle_like').add({
      data: { userId, postId, createdAt: db.serverDate() }
    })
    await db.collection('family_circle').doc(postId).update({
      data: { likes: _.inc(1) }
    })
    return { code: 0, data: { liked: true } }
  }
}

// 评论
async function addComment(data) {
  const { userId, postId, content, replyTo } = data

  const { data: user } = await db.collection('user').doc(userId).get()

  await db.collection('circle_comment').add({
    data: {
      postId,
      userId,
      userName: user.name,
      content,
      replyTo: replyTo || '',
      createdAt: db.serverDate(),
    }
  })

  await db.collection('family_circle').doc(postId).update({
    data: { comments: _.inc(1) }
  })

  return { code: 0, message: '评论成功' }
}

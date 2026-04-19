// 云函数 - 订阅消息推送
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'verifyRequest': return await sendNotify(data)
    case 'verifyResult': return await sendNotify(data)
    case 'birthdayRemind': return await sendNotify(data)
    case 'circleNewPost': return await sendNotify(data)
    case 'checkBirthdays': return await checkBirthdays()
    default: return { code: -1, message: '未知操作' }
  }
}

// 发送订阅消息
async function sendNotify(data) {
  const { toUserId, templateId, page, data: templateData } = data

  // 获取用户 openid
  const { data: user } = await db.collection('user').doc(toUserId).get()
  if (!user || !user._openid) {
    return { code: -1, message: '用户未找到' }
  }

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: user._openid,
      templateId,
      page,
      data: templateData,
      miniprogramState: 'developer', // 开发版
    })
    return { code: 0, message: '通知已发送' }
  } catch (e) {
    console.error('发送订阅消息失败:', e)
    return { code: -1, message: '发送失败: ' + e.message }
  }
}

// 检查生日（可配定时触发器每天执行）
async function checkBirthdays() {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const todayStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  // 查找今天生日的亲属
  const { data: relations } = await db.collection('relation')
    .where({ birthday: db.RegExp({ regexp: `\\d{4}-${todayStr}$` }) })
    .get()

  const results = []
  for (const rel of relations) {
    // 通知亲属所属的用户
    const userId = rel.userId1
    const age = today.getFullYear() - parseInt(rel.birthday.slice(0, 4))

    results.push({
      userId,
      relativeName: rel.name2,
      birthday: rel.birthday,
      age,
    })
    // TODO: 调用 sendNotify 发送生日提醒
  }

  return { code: 0, data: results, message: `找到 ${results.length} 位今天生日的亲属` }
}

const db = cloud.database()

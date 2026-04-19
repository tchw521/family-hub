// 云函数入口 - 用户模块
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 验证码临时存储（生产环境应使用 Redis）
const codeStore = new Map()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'sendCode': return await sendCode(data)
    case 'login': return await login(data)
    case 'getProfile': return await getProfile(data)
    case 'updateProfile': return await updateProfile(data)
    default: return { code: -1, message: '未知操作' }
  }
}

// 发送验证码
async function sendCode(data) {
  const { phone } = data
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return { code: -1, message: '手机号格式错误' }
  }

  // 生成6位验证码
  const code = String(Math.floor(100000 + Math.random() * 900000))
  codeStore.set(phone, { code, expireAt: Date.now() + 5 * 60 * 1000 })

  // TODO: 对接短信服务（腾讯云 SMS）
  console.log(`验证码: ${phone} -> ${code}`)

  return { code: 0, message: '验证码已发送' }
}

// 登录/注册
async function login(data) {
  const { phone, smsCode } = data

  // 验证码校验
  const stored = codeStore.get(phone)
  if (!stored || stored.code !== smsCode || Date.now() > stored.expireAt) {
    return { code: -1, message: '验证码错误或已过期' }
  }
  codeStore.delete(phone)

  // 查找或创建用户
  const { data: users } = await db.collection('user')
    .where({ phone }).limit(1).get()

  let user
  if (users.length > 0) {
    user = users[0]
  } else {
    // 自动注册
    const res = await db.collection('user').add({
      data: {
        phone,
        name: `用户${phone.slice(-4)}`,
        gender: '',
        birthday: '',
        hometown: '',
        avatar: '',
        privacy: {
          anonymousWeb: false,
          defaultVisibility: 'all',
        },
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
      }
    })
    const newUser = await db.collection('user').doc(res._id).get()
    user = newUser.data
  }

  // 生成自定义 token（简化版，生产环境应用 JWT）
  const token = `token_${user._id}_${Date.now()}`

  return {
    code: 0,
    data: { token, user: { id: user._id, phone: user.phone, name: user.name } },
    message: '登录成功'
  }
}

// 获取个人资料
async function getProfile(data) {
  const { userId } = data
  const { data: user } = await db.collection('user').doc(userId).get()
  if (!user) return { code: -1, message: '用户不存在' }

  // 脱敏处理
  const safeUser = { ...user }
  delete safeUser._openid

  return { code: 0, data: safeUser }
}

// 更新个人资料
async function updateProfile(data) {
  const { userId, updates } = data
  const allowedFields = ['name', 'gender', 'birthday', 'hometown', 'avatar', 'privacy']

  const safeUpdates = {}
  for (const key of allowedFields) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key]
  }
  safeUpdates.updatedAt = db.serverDate()

  await db.collection('user').doc(userId).update({ data: safeUpdates })
  return { code: 0, message: '更新成功' }
}

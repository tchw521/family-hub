// 微信登录云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, code, userInfo, nickname, avatarUrl } = event

  // 获取 openid 和 unionid
  const openid = wxContext.OPENID
  const unionid = wxContext.UNIONID

  console.log('Login request:', { action, openid, unionid })

  switch (action) {
    case 'login':
      return await handleLogin(openid, unionid, userInfo)
    case 'updateUserInfo':
      return await updateUserInfo(openid, { nickname, avatarUrl })
    case 'checkSession':
      return await checkSession(openid)
    case 'logout':
      return await handleLogout(openid)
    default:
      return { success: false, error: '未知操作' }
  }
}

// 登录处理
async function handleLogin(openid, unionid, userInfo) {
  try {
    // 查找用户
    const userResult = await usersCollection.where({ openid }).get()
    
    let user
    const now = new Date().toISOString()
    
    if (userResult.data.length === 0) {
      // 新用户，自动注册
      user = {
        openid,
        unionid,
        nickname: userInfo?.nickName || '新用户',
        avatar: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        phone: '',
        createTime: now,
        lastLoginTime: now,
        role: 'member',
        inviteCode: generateInviteCode(),
        invitedBy: '',
        familyId: ''
      }
      
      const result = await usersCollection.add({ data: user })
      user._id = result._id
      
      console.log('New user registered:', user._id)
    } else {
      // 老用户，更新登录时间
      user = userResult.data[0]
      await usersCollection.doc(user._id).update({
        data: { lastLoginTime: now }
      })
      console.log('User logged in:', user._id)
    }

    // 生成 token（使用 openid + 时间戳的简单方案，生产环境建议用 JWT）
    const token = generateToken(openid, user._id)
    
    return {
      success: true,
      token,
      user: {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        phone: user.phone,
        inviteCode: user.inviteCode,
        createTime: user.createTime
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}

// 更新用户信息
async function updateUserInfo(openid, data) {
  try {
    const result = await usersCollection.where({ openid }).get()
    if (result.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }
    
    const userId = result.data[0]._id
    const updateData = {
      updateTime: new Date().toISOString()
    }
    
    if (data.nickname) updateData.nickname = data.nickname
    if (data.avatarUrl) updateData.avatar = data.avatarUrl
    
    await usersCollection.doc(userId).update({ data: updateData })
    
    return { success: true, message: '更新成功' }
  } catch (error) {
    console.error('Update user info error:', error)
    return { success: false, error: error.message }
  }
}

// 检查会话
async function checkSession(openid) {
  try {
    const result = await usersCollection.where({ openid }).get()
    if (result.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }
    
    const user = result.data[0]
    return {
      success: true,
      user: {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }
  } catch (error) {
    console.error('Check session error:', error)
    return { success: false, error: error.message }
  }
}

// 登出处理
async function handleLogout(openid) {
  // 小程序端清除 token 即可，服务端无需操作
  return { success: true, message: '已登出' }
}

// 生成邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'FH' // FamilyHub 前缀
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 生成 token
function generateToken(openid, userId) {
  const timestamp = Date.now()
  const data = `${openid}_${userId}_${timestamp}`
  // 简单 token 方案，生产环境建议使用 JWT
  return Buffer.from(data).toString('base64')
}

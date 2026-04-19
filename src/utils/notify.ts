// 订阅消息服务
// 微信小程序订阅消息：验证请求通知、生日提醒

// 订阅消息模板 ID（需在微信公众平台 → 订阅消息 中申请）
// 申请路径：mp.weixin.qq.com → 功能 → 订阅消息 → 添加模板
const TEMPLATES = {
  // 验证请求通知模板
  VERIFY_REQUEST: '',
  // 验证结果通知模板
  VERIFY_RESULT: '',
  // 生日提醒模板
  BIRTHDAY_REMIND: '',
  // 家族圈新动态模板
  CIRCLE_NEW_POST: '',
}

// 请求订阅消息授权（一次最多3个模板）
export async function requestSubscribe(
  templateIds: string[]
): Promise<Record<string, string>> {
  // 过滤掉空模板 ID
  const validIds = templateIds.filter(id => id)
  if (validIds.length === 0) return {}

  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    wx.requestSubscribeMessage({
      tmplIds: validIds,
      success: (res) => {
        console.log('订阅结果:', res)
        resolve(res as any)
      },
      fail: (err) => {
        console.warn('订阅失败:', err)
        resolve({})
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    resolve({})
    // #endif
  })
}

// 发送验证请求通知
export async function sendVerifyNotify(
  toUserId: string,
  fromName: string,
  relation: string
) {
  if (!TEMPLATES.VERIFY_REQUEST) return

  try {
    await wx.cloud.callFunction({
      name: 'notify',
      data: {
        action: 'verifyRequest',
        data: {
          toUserId,
          templateId: TEMPLATES.VERIFY_REQUEST,
          page: 'pages/relatives/verify',
          data: {
            thing1: { value: fromName },
            thing2: { value: relation },
            time3: { value: new Date().toLocaleString('zh-CN') },
          },
        },
      },
    })
  } catch (e) {
    console.error('发送验证通知失败:', e)
  }
}

// 发送验证结果通知
export async function sendVerifyResultNotify(
  toUserId: string,
  relationName: string,
  approved: boolean
) {
  if (!TEMPLATES.VERIFY_RESULT) return

  try {
    await wx.cloud.callFunction({
      name: 'notify',
      data: {
        action: 'verifyResult',
        data: {
          toUserId,
          templateId: TEMPLATES.VERIFY_RESULT,
          page: 'pages/index/index',
          data: {
            thing1: { value: relationName },
            thing2: { value: approved ? '已通过验证' : '验证被拒绝' },
            time3: { value: new Date().toLocaleString('zh-CN') },
          },
        },
      },
    })
  } catch (e) {
    console.error('发送验证结果通知失败:', e)
  }
}

// 发送生日提醒
export async function sendBirthdayNotify(
  userId: string,
  relativeName: string,
  birthday: string,
  age: number
) {
  if (!TEMPLATES.BIRTHDAY_REMIND) return

  try {
    await wx.cloud.callFunction({
      name: 'notify',
      data: {
        action: 'birthdayRemind',
        data: {
          userId,
          templateId: TEMPLATES.BIRTHDAY_REMIND,
          page: 'pages/relatives/detail',
          data: {
            thing1: { value: relativeName },
            time2: { value: birthday },
            thing3: { value: `${age}岁生日` },
          },
        },
      },
    })
  } catch (e) {
    console.error('发送生日提醒失败:', e)
  }
}

// 发送家族圈新动态通知
export async function sendCircleNotify(
  userId: string,
  posterName: string,
  contentPreview: string
) {
  if (!TEMPLATES.CIRCLE_NEW_POST) return

  try {
    await wx.cloud.callFunction({
      name: 'notify',
      data: {
        action: 'circleNewPost',
        data: {
          userId,
          templateId: TEMPLATES.CIRCLE_NEW_POST,
          page: 'pages/circle/index',
          data: {
            thing1: { value: posterName },
            thing2: { value: contentPreview.slice(0, 20) },
            time3: { value: new Date().toLocaleString('zh-CN') },
          },
        },
      },
    })
  } catch (e) {
    console.error('发送动态通知失败:', e)
  }
}

// 在关键操作时请求订阅（用户主动触发时调用）
export async function requestCommonSubscribes() {
  const ids = [
    TEMPLATES.VERIFY_REQUEST,
    TEMPLATES.VERIFY_RESULT,
    TEMPLATES.BIRTHDAY_REMIND,
    TEMPLATES.CIRCLE_NEW_POST,
  ].filter(Boolean)

  if (ids.length > 0) {
    await requestSubscribe(ids.slice(0, 3))
  }
}

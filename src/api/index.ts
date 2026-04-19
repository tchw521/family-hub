import { request } from './request'

// 用户相关 API
export const userApi = {
  // 手机号登录
  login: (phone: string, code: string) =>
    request({ url: '/user/login', method: 'POST', data: { phone, code } }),

  // 发送验证码
  sendCode: (phone: string) =>
    request({ url: '/user/sendCode', method: 'POST', data: { phone } }),

  // 获取个人信息
  getProfile: () =>
    request({ url: '/user/profile' }),

  // 更新个人信息
  updateProfile: (data: any) =>
    request({ url: '/user/profile', method: 'PUT', data }),
}

// 亲属关系 API
export const relativeApi = {
  // 手动添加亲属
  add: (data: { name: string; gender: string; relation: string; birthday?: string; hometown?: string; phone?: string }) =>
    request({ url: '/relative/add', method: 'POST', data }),

  // 删除亲属
  remove: (id: string) =>
    request({ url: `/relative/${id}`, method: 'DELETE' }),

  // 获取亲属列表
  list: () =>
    request({ url: '/relative/list' }),

  // 搜索亲属
  search: (params: { type: string; keyword: string }) =>
    request({ url: '/relative/search', method: 'POST', data: params }),
}

// 验证请求 API
export const verifyApi = {
  // 发起验证
  create: (data: { toUserId: string; relation: string; message: string }) =>
    request({ url: '/verify/create', method: 'POST', data }),

  // 获取待审核列表
  pending: () =>
    request({ url: '/verify/pending' }),

  // 获取已发起列表
  sent: () =>
    request({ url: '/verify/sent' }),

  // 通过验证
  approve: (id: string) =>
    request({ url: `/verify/${id}/approve`, method: 'POST' }),

  // 拒绝验证
  reject: (id: string, reason?: string) =>
    request({ url: `/verify/${id}/reject`, method: 'POST', data: { reason } }),
}

// 家族圈 API
export const circleApi = {
  // 获取动态列表
  list: (page = 1) =>
    request({ url: '/circle/list', data: { page } }),

  // 发布动态
  publish: (data: { content: string; images?: string[]; visibility?: string }) =>
    request({ url: '/circle/publish', method: 'POST', data }),

  // 点赞
  like: (id: string) =>
    request({ url: `/circle/${id}/like`, method: 'POST' }),

  // 评论
  comment: (id: string, content: string) =>
    request({ url: `/circle/${id}/comment`, method: 'POST', data: { content } }),
}

// 家族人脉 API
export const networkApi = {
  // 获取人脉网络
  connections: (filter?: { type: string; value: string }) =>
    request({ url: '/network/connections', data: filter }),

  // 获取关系路径
  path: (targetUserId: string) =>
    request({ url: '/network/path', data: { targetUserId } }),
}

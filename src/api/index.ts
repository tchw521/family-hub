import { callFunction, call } from './request'

// 用户相关 API（云函数调用）
export const userApi = {
  // 手机号登录
  login: (phone: string, code: string) =>
    call('user', { action: 'login', data: { phone, smsCode: code } }),

  // 发送验证码
  sendCode: (phone: string) =>
    call('user', { action: 'sendCode', data: { phone } }),

  // 获取个人信息
  getProfile: (userId: string) =>
    call('user', { action: 'getProfile', data: { userId } }),

  // 更新个人信息
  updateProfile: (userId: string, updates: any) =>
    call('user', { action: 'updateProfile', data: { userId, updates } }),
}

// 亲属关系 API
export const relativeApi = {
  // 手动添加亲属
  add: (userId: string, data: { name: string; gender: string; relation: string; birthday?: string; hometown?: string; phone?: string }) =>
    call('relative', { action: 'add', data: { userId, ...data } }),

  // 删除亲属
  remove: (userId: string, id: string) =>
    call('relative', { action: 'remove', data: { userId, relationId: id } }),

  // 获取亲属列表
  list: (userId: string, side?: string, verified?: boolean) =>
    call('relative', { action: 'list', data: { userId, side, verified } }),

  // 搜索亲属
  search: (userId: string, type: string, keyword: string) =>
    call('relative', { action: 'search', data: { userId, type, keyword } }),
}

// 验证请求 API
export const verifyApi = {
  // 发起验证
  create: (fromUserId: string, toUserId: string, relation: string, message: string) =>
    call('verify', { action: 'create', data: { fromUserId, toUserId, relation, message } }),

  // 获取待审核列表
  pending: (userId: string) =>
    call('verify', { action: 'pending', data: { userId } }),

  // 获取已发起列表
  sent: (userId: string) =>
    call('verify', { action: 'sent', data: { userId } }),

  // 通过验证
  approve: (verifyId: string, userId: string) =>
    call('verify', { action: 'approve', data: { verifyId, userId } }),

  // 拒绝验证
  reject: (verifyId: string, userId: string, reason?: string) =>
    call('verify', { action: 'reject', data: { verifyId, userId, reason } }),
}

// 家族圈 API
export const circleApi = {
  // 获取动态列表
  list: (userId: string, page = 1) =>
    call('circle', { action: 'list', data: { userId, page } }),

  // 发布动态
  publish: (userId: string, data: { content: string; images?: string[]; visibility?: string }) =>
    call('circle', { action: 'publish', data: { userId, ...data } }),

  // 点赞
  like: (userId: string, postId: string) =>
    call('circle', { action: 'like', data: { userId, postId } }),

  // 评论
  comment: (userId: string, postId: string, content: string, replyTo?: string) =>
    call('circle', { action: 'comment', data: { userId, postId, content, replyTo } }),
}

// 家族人脉 API
export const networkApi = {
  // 获取人脉网络
  connections: (userId: string, filter?: { type: string; value: string }) =>
    call('network', { action: 'connections', data: { userId, filter } }),

  // 获取关系路径
  path: (fromUserId: string, toUserId: string) =>
    call('network', { action: 'path', data: { fromUserId, toUserId } }),

  // 获取蛛网可视化数据
  webData: (userId: string) =>
    call('network', { action: 'webData', data: { userId } }),
}

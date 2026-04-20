// 微信登录认证工具
import { callFunction } from '@/api/request'

const TOKEN_KEY = 'familyhub_token'
const USER_KEY = 'familyhub_user'

export interface LoginResult {
  success: boolean
  token?: string
  user?: UserInfo
  error?: string
}

export interface UserInfo {
  id: string
  openid: string
  nickname: string
  avatar: string
  gender: number
  phone?: string
  inviteCode?: string
  createTime?: string
}

// 微信登录
export async function wxLogin(): Promise<LoginResult> {
  try {
    // 1. 获取微信登录 code
    const loginResult = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        success: resolve,
        fail: reject
      })
    })

    console.log('wx.login success:', loginResult.code)

    // 2. 调用云函数进行登录
    const result = await callFunction('auth', {
      action: 'login',
      code: loginResult.code
    })

    if (result.success && result.token) {
      // 3. 保存 token 和用户信息
      uni.setStorageSync(TOKEN_KEY, result.token)
      uni.setStorageSync(USER_KEY, result.user)
      
      console.log('Login success:', result.user)
      return result
    }

    return { success: false, error: result.error || '登录失败' }
  } catch (error: any) {
    console.error('Login error:', error)
    return { success: false, error: error.message || '登录失败' }
  }
}

// 更新用户信息
export async function updateUserInfo(data: { nickname?: string; avatarUrl?: string }) {
  try {
    const result = await callFunction('auth', {
      action: 'updateUserInfo',
      ...data
    })
    
    if (result.success) {
      // 更新本地缓存
      const user = uni.getStorageSync(USER_KEY) || {}
      const updatedUser = { ...user, ...data }
      uni.setStorageSync(USER_KEY, updatedUser)
    }
    
    return result
  } catch (error) {
    console.error('Update user info error:', error)
    return { success: false, error }
  }
}

// 检查登录状态
export async function checkLoginStatus(): Promise<LoginResult> {
  try {
    const token = uni.getStorageSync(TOKEN_KEY)
    if (!token) {
      return { success: false, error: '未登录' }
    }

    const result = await callFunction('auth', { action: 'checkSession' })
    
    if (result.success) {
      uni.setStorageSync(USER_KEY, result.user)
      return result
    }
    
    // token 失效，清除本地缓存
    clearLoginInfo()
    return { success: false, error: '登录已过期' }
  } catch (error) {
    clearLoginInfo()
    return { success: false, error: '检查登录状态失败' }
  }
}

// 登出
export async function logout() {
  try {
    await callFunction('auth', { action: 'logout' })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    clearLoginInfo()
  }
}

// 清除登录信息
export function clearLoginInfo() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(USER_KEY)
}

// 获取当前用户信息
export function getCurrentUser(): UserInfo | null {
  return uni.getStorageSync(USER_KEY) || null
}

// 获取 token
export function getToken(): string | null {
  return uni.getStorageSync(TOKEN_KEY) || null
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return !!getToken() && !!getCurrentUser()
}

// 获取用户 openid（用于云数据库查询）
export function getOpenId(): string | null {
  const user = getCurrentUser()
  return user?.openid || null
}

// 登录拦截器
export function requireLogin(callback: () => void) {
  if (isLoggedIn()) {
    callback()
  } else {
    // 跳转到登录页
    uni.navigateTo({
      url: '/pages/login/index'
    })
  }
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wxLogin, logout as authLogout, getCurrentUser, getToken, isLoggedIn as checkIsLoggedIn } from '@/utils/auth'

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

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref('')

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  
  // 初始化时从本地存储加载
  function init() {
    const savedUser = getCurrentUser()
    const savedToken = getToken()
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = savedUser
    }
  }
  
  // 微信登录
  async function login(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await wxLogin()
      
      if (result.success && result.user) {
        user.value = result.user
        token.value = result.token || ''
        return { success: true }
      }
      
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: error.message || '登录失败' }
    }
  }
  
  // 更新用户信息
  function setUser(userInfo: Partial<UserInfo>) {
    if (user.value) {
      user.value = { ...user.value, ...userInfo }
      uni.setStorageSync('familyhub_user', user.value)
    }
  }
  
  // 登出
  async function logout() {
    await authLogout()
    user.value = null
    token.value = ''
  }
  
  // 初始化
  init()

  return { 
    user, 
    token, 
    isLoggedIn, 
    login, 
    logout,
    setUser,
    init
  }
})

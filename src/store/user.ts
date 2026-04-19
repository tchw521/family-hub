import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: string
  phone: string
  name: string
  gender?: 'male' | 'female'
  birthday?: string
  hometown?: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref('')

  const isLoggedIn = computed(() => !!token.value)

  function login(data: { phone: string; name: string }) {
    // TODO: 调用登录 API
    user.value = {
      id: Date.now().toString(),
      phone: data.phone,
      name: data.name || `用户${data.phone.slice(-4)}`,
    }
    token.value = 'mock_token'
    uni.setStorageSync('token', token.value)
    uni.setStorageSync('user', JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    token.value = ''
    uni.removeStorageSync('token')
    uni.removeStorageSync('user')
  }

  function loadFromStorage() {
    const savedToken = uni.getStorageSync('token')
    const savedUser = uni.getStorageSync('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      try { user.value = JSON.parse(savedUser) } catch {}
    }
  }

  // 初始化
  loadFromStorage()

  return { user, token, isLoggedIn, login, logout }
})

// 路由守卫 - 登录拦截
import { isLoggedIn, getCurrentUser } from './auth'

// 需要登录才能访问的页面
const authRequiredPages = [
  '/pages/relatives/add',
  '/pages/relatives/edit',
  '/pages/mine/profile',
  '/pages/mine/privacy',
  '/pages/mine/invite',
  '/pages/circle/index'
]

// 检查页面是否需要登录
export function requiresAuth(url: string): boolean {
  const path = url.split('?')[0]
  return authRequiredPages.some(page => path.includes(page))
}

// 路由跳转拦截
export function navigateTo(options: UniApp.NavigateToOptions) {
  const url = options.url
  
  if (requiresAuth(url) && !isLoggedIn()) {
    // 需要登录，跳转到登录页
    uni.navigateTo({
      url: `/pages/auth/login?redirect=${encodeURIComponent(url)}`
    })
    return false
  }
  
  // 已登录或不需要登录，正常跳转
  uni.navigateTo(options)
  return true
}

// 检查并跳转登录
export function checkLoginAndNavigate(url: string): boolean {
  if (!isLoggedIn()) {
    uni.navigateTo({
      url: `/pages/auth/login?redirect=${encodeURIComponent(url)}`
    })
    return false
  }
  
  uni.navigateTo({ url })
  return true
}

// 确保已登录（用于按钮点击等场景）
export function ensureLoggedIn(): Promise<boolean> {
  return new Promise((resolve) => {
    if (isLoggedIn()) {
      resolve(true)
      return
    }
    
    uni.showModal({
      title: '提示',
      content: '该功能需要登录后使用，是否立即登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/auth/login'
          })
        }
        resolve(false)
      }
    })
  })
}

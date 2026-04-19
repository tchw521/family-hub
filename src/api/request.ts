// 腾讯云开发 API 封装
// MVP 阶段使用云开发，后续可迁移到自建后端

const CLOUD_BASE = '' // 云开发环境 ID

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

export async function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${CLOUD_BASE}${config.url}`,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'Content-Type': 'application/json',
        ...(config.needAuth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const data = res.data as ApiResponse<T>
        if (data.code === 0) {
          resolve(data)
        } else {
          uni.showToast({ title: data.message || '请求失败', icon: 'none' })
          reject(data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

// 云函数调用封装
export async function callFunction<T = any>(name: string, data?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.callFunction({
      name,
      data,
      success: (res) => resolve(res.result as T),
      fail: (err) => {
        uni.showToast({ title: '服务异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

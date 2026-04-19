// 腾讯云开发 API 封装（微信小程序专用）
// 云开发环境: familyhub-d8gzq4k0ub244086e

const CLOUD_ENV = 'familyhub-d8gzq4k0ub244086e'

// 初始化云开发
function initCloud() {
  if (typeof wx !== 'undefined' && wx.cloud) {
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true,
    })
  }
}

// 云函数统一调用
export async function callFunction<T = any>(
  name: string,
  data?: any
): Promise<{ result?: T; error?: any }> {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data: data || {},
    })
    return { result: res.result as T }
  } catch (err: any) {
    console.error(`云函数 ${name} 调用失败:`, err)
    uni.showToast({ title: `服务异常: ${name}`, icon: 'none' })
    return { error: err }
  }
}

// 简化版：直接返回 result
export async function call<T = any>(name: string, data?: any): Promise<T> {
  const { result, error } = await callFunction<T>(name, data)
  if (error) throw error
  return result as T
}

// 云数据库引用
export function getDatabase() {
  return wx.cloud.database({ env: CLOUD_ENV })
}

// 云存储上传
export async function uploadFile(
  cloudPath: string,
  filePath: string
): Promise<string> {
  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath,
  })
  return res.fileID
}

// 云存储删除
export async function deleteFile(fileIDs: string[]): Promise<void> {
  await wx.cloud.deleteFile({ fileList: fileIDs })
}

// 获取文件临时链接
export async function getTempFileURL(fileIDs: string[]): Promise<string[]> {
  const res = await wx.cloud.getTempFileURL({ fileList: fileIDs })
  return res.fileList.map((f: any) => f.tempFileURL)
}

// 在 App 启动时初始化
initCloud()

// 旧版 request 兼容（用于非云函数 HTTP 请求）
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
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (config.needAuth !== false && token) {
    header['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: config.url,
      method: config.method || 'GET',
      data: config.data,
      header,
      success: (res) => {
        const data = res.data as ApiResponse<T>
        if (data?.code === 0) {
          resolve(data)
        } else {
          uni.showToast({ title: data?.message || '请求失败', icon: 'none' })
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

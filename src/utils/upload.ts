// 云存储上传服务
import { uploadFile, deleteFile, getTempFileURL } from '@/api/request'

// 选择并上传图片
export async function chooseAndUploadImages(maxCount = 9): Promise<string[]> {
  return new Promise((resolve) => {
    uni.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const filePaths = res.tempFilePaths
        const cloudPaths: string[] = []

        uni.showLoading({ title: '上传中...' })

        for (const filePath of filePaths) {
          try {
            const ext = filePath.split('.').pop() || 'jpg'
            const cloudPath = `family-circle/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
            const fileID = await uploadFile(cloudPath, filePath)
            cloudPaths.push(fileID)
          } catch (e) {
            console.error('图片上传失败:', e)
          }
        }

        uni.hideLoading()
        resolve(cloudPaths)
      },
      fail: () => resolve([]),
    })
  })
}

// 选择并上传视频
export async function chooseAndUploadVideo(): Promise<string> {
  return new Promise((resolve) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 15,
      camera: 'back',
      compressed: true,
      success: async (res) => {
        uni.showLoading({ title: '上传视频中...' })
        try {
          const ext = res.tempFilePath.split('.').pop() || 'mp4'
          const cloudPath = `family-circle/video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const fileID = await uploadFile(cloudPath, res.tempFilePath)
          uni.hideLoading()
          resolve(fileID)
        } catch (e) {
          console.error('视频上传失败:', e)
          uni.hideLoading()
          resolve('')
        }
      },
      fail: () => resolve(''),
    })
  })
}

// 上传头像
export async function uploadAvatar(filePath: string): Promise<string> {
  uni.showLoading({ title: '上传头像...' })
  try {
    const ext = filePath.split('.').pop() || 'jpg'
    const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const fileID = await uploadFile(cloudPath, filePath)
    uni.hideLoading()
    return fileID
  } catch (e) {
    console.error('头像上传失败:', e)
    uni.hideLoading()
    return ''
  }
}

// 批量获取文件临时链接
export async function getFileURLs(fileIDs: string[]): Promise<string[]> {
  if (fileIDs.length === 0) return []
  try {
    return await getTempFileURL(fileIDs)
  } catch (e) {
    console.error('获取文件链接失败:', e)
    return []
  }
}

// 预览图片
export function previewImage(urls: string[], current = 0) {
  uni.previewImage({
    urls,
    current: urls[current],
  })
}

// 分享服务 - 一键分享家族树到微信

// 生成家族树分享卡片（Canvas 绘制）
export function generateShareCard(options: {
  userName: string
  relativeCount: number
  verifiedCount: number
  familyCount: number
  avatar?: string
}): Promise<string> {
  return new Promise((resolve) => {
    const canvas = uni.createOffscreenCanvas({
      type: '2d',
      width: 600,
      height: 400,
    })
    const ctx = canvas.getContext('2d')

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 600, 400)
    gradient.addColorStop(0, '#F28C38')
    gradient.addColorStop(1, '#F5A623')
    ctx.fillStyle = gradient
    roundRect(ctx, 0, 0, 600, 400, 24)
    ctx.fill()

    // 装饰圆
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.arc(500, 80, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(80, 350, 80, 0, Math.PI * 2)
    ctx.fill()

    // 标题
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText('🕸️ 我的家族蛛网', 40, 70)

    // 用户名
    ctx.font = '28px sans-serif'
    ctx.fillText(options.userName, 40, 130)

    // 统计
    ctx.font = '22px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText(`亲属 ${options.relativeCount} 位`, 40, 190)
    ctx.fillText(`已验证 ${options.verifiedCount} 位`, 40, 225)
    ctx.fillText(`家族 ${options.familyCount} 个`, 40, 260)

    // 底部提示
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '18px sans-serif'
    ctx.fillText('扫码加入我的家族互联 →', 40, 360)

    // 导出
    const tempFilePath = `${wx.env.USER_DATA_PATH}/share-card-${Date.now()}.png`
    canvas.toTempFilePath({
      filePath: tempFilePath,
      success: () => resolve(tempFilePath),
      fail: () => resolve(''),
    })
  })
}

// 圆角矩形辅助
function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 分享到微信好友
export function shareToFriend(options: {
  title: string
  path: string
  imageUrl?: string
}) {
  // 通过 onShareAppMessage 生命周期自动触发
  return options
}

// 分享到朋友圈（保存图片到相册）
export async function saveShareCard(imagePath: string): Promise<boolean> {
  if (!imagePath) return false

  try {
    await uni.saveImageToPhotosAlbum({ filePath: imagePath })
    uni.showToast({ title: '已保存到相册', icon: 'success' })
    return true
  } catch (e: any) {
    if (e.errMsg?.includes('auth deny')) {
      uni.showModal({
        title: '需要相册权限',
        content: '请在设置中允许访问相册',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) uni.openSetting({})
        },
      })
    }
    return false
  }
}

// 生成邀请分享内容
export function generateInviteShare(inviteCode: string, userName: string) {
  return {
    title: `${userName} 邀请你加入家族互联`,
    path: `/pages/auth/login?inviteCode=${inviteCode}`,
    imageUrl: '',
  }
}

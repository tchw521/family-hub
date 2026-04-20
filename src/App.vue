<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

onLaunch(() => {
  console.log('App Launch')
  
  // 初始化微信云开发
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    wx.cloud.init({
      env: 'familyhub-d8gzq4k0ub244086e',
      traceUser: true,
    })
    console.log('☁️ 云开发初始化成功')
    
    // 检查登录状态
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      console.log('用户未登录')
    } else {
      console.log('用户已登录:', userStore.user?.nickname)
    }
  }
  // #endif
})

onShow(() => {
  console.log('App Show')
  
  // 每次显示时检查更新
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined') {
    const updateManager = wx.getUpdateManager()
    
    updateManager.onCheckForUpdate((res) => {
      console.log('检查更新:', res.hasUpdate)
    })
    
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
    
    updateManager.onUpdateFailed(() => {
      wx.showToast({
        title: '更新失败，请稍后重试',
        icon: 'none'
      })
    })
  }
  // #endif
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import '@/styles/global.scss';
</style>

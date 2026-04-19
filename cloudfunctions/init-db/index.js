// 云函数 - 初始化数据库集合
// 在微信开发者工具中右键此目录 → 上传并部署 → 运行一次即可

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const results = {}

  // 创建集合（如果不存在）
  const collections = ['user', 'relation', 'verify', 'family_circle', 'circle_like', 'circle_comment']

  for (const name of collections) {
    try {
      await db.createCollection(name)
      results[name] = '✅ 创建成功'
    } catch (e) {
      if (e.message.includes('already exists')) {
        results[name] = '⏭️ 已存在，跳过'
      } else {
        results[name] = `❌ ${e.message}`
      }
    }
  }

  return { code: 0, data: results, message: '数据库初始化完成' }
}

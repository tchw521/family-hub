# 家族互联APP 数据库设计

## 数据表结构

### 1. user（用户表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 自动 | 用户ID（云开发自动生成） |
| phone | string | ✓ | 手机号（唯一） |
| name | string | ✓ | 姓名 |
| gender | string | | 性别：male/female |
| birthday | string | | 生日 YYYY-MM-DD |
| hometown | string | | 籍贯 |
| avatar | string | | 头像URL |
| privacy | object | | 隐私设置 |
| privacy.anonymousWeb | boolean | | 蛛网匿名展示 |
| privacy.defaultVisibility | string | | 默认可见范围：all/direct/custom |
| createdAt | date | 自动 | 注册时间 |
| updatedAt | date | 自动 | 更新时间 |

### 2. relation（亲属关系表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 自动 | 关系ID |
| userId1 | string | ✓ | 用户1（发起方） |
| name1 | string | | 用户1姓名（冗余存储） |
| gender1 | string | | 用户1性别 |
| userId2 | string | | 用户2（关联方，null表示未注册） |
| name2 | string | ✓ | 用户2姓名 |
| gender2 | string | | 用户2性别 |
| relationFrom1 | string | ✓ | 从用户1视角的关系（如"父亲"） |
| relationFrom2 | string | ✓ | 从用户2视角的关系（如"儿子"） |
| side | string | ✓ | 家族侧：paternal/maternal/spouse |
| verified | boolean | ✓ | 是否已验证 |
| verifiedAt | date | | 验证时间 |
| verifyId | string | | 关联的验证请求ID |
| birthday | string | | 用户2生日 |
| hometown | string | | 用户2籍贯 |
| phone | string | | 用户2手机号 |
| source | string | | 来源：manual/spouse_sync |
| createdAt | date | 自动 | 创建时间 |
| updatedAt | date | 自动 | 更新时间 |

### 3. verify（验证请求表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 自动 | 请求ID |
| fromUserId | string | ✓ | 发起方用户ID |
| fromName | string | ✓ | 发起方姓名（冗余） |
| toUserId | string | ✓ | 接收方用户ID |
| toName | string | | 接收方姓名 |
| relation | string | ✓ | 声称关系 |
| message | string | ✓ | 关系说明 |
| status | string | ✓ | 状态：pending/approved/rejected |
| rejectReason | string | | 拒绝原因 |
| createdAt | date | 自动 | 创建时间 |
| updatedAt | date | 自动 | 更新时间 |

### 4. family_circle（家族圈动态表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 自动 | 动态ID |
| userId | string | ✓ | 发布者ID |
| userName | string | ✓ | 发布者姓名（冗余） |
| userAvatar | string | | 发布者头像 |
| content | string | | 文字内容 |
| images | array | | 图片URL数组 |
| video | string | | 视频URL |
| visibility | string | ✓ | 可见范围：all/direct/custom |
| customVisible | array | | 自定义可见用户ID列表 |
| likes | number | 自动 | 点赞数 |
| comments | number | 自动 | 评论数 |
| createdAt | date | 自动 | 发布时间 |
| updatedAt | date | 自动 | 更新时间 |

### 5. circle_like（点赞表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 自动 | 点赞ID |
| postId | string | ✓ | 动态ID |
| userId | string | ✓ | 用户ID |
| createdAt | date | 自动 | 点赞时间 |

### 6. circle_comment（评论表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | string | 自动 | 评论ID |
| postId | string | ✓ | 动态ID |
| userId | string | ✓ | 评论者ID |
| userName | string | ✓ | 评论者姓名 |
| content | string | ✓ | 评论内容 |
| replyTo | string | | 回复的用户ID |
| createdAt | date | 自动 | 评论时间 |

## 索引设计

```javascript
// user 表索引
db.collection('user').createIndex({ keys: { phone: 1 }, unique: true })

// relation 表索引
db.collection('relation').createIndex({ keys: { userId1: 1, verified: 1 } })
db.collection('relation').createIndex({ keys: { userId2: 1, verified: 1 } })
db.collection('relation').createIndex({ keys: { side: 1 } })

// verify 表索引
db.collection('verify').createIndex({ keys: { toUserId: 1, status: 1 } })
db.collection('verify').createIndex({ keys: { fromUserId: 1, createdAt: -1 } })

// family_circle 表索引
db.collection('family_circle').createIndex({ keys: { userId: 1, createdAt: -1 } })

// circle_like 表索引
db.collection('circle_like').createIndex({ keys: { postId: 1, userId: 1 }, unique: true })
```

## 数据安全规则

```json
// user 表权限
{
  "read": "auth.uid == doc._id",
  "write": "auth.uid == doc._id"
}

// relation 表权限
{
  "read": "auth.uid == doc.userId1 || auth.uid == doc.userId2",
  "write": "auth.uid == doc.userId1 || auth.uid == doc.userId2"
}

// verify 表权限
{
  "read": "auth.uid == doc.fromUserId || auth.uid == doc.toUserId",
  "write": true  // 云函数控制写入
}

// family_circle 表权限
{
  "read": true,  // 可见范围在云函数中判断
  "write": "auth.uid == doc.userId"
}
```
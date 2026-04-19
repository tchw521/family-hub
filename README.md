# 🕸️ 家族互联 FamilyHub

> 以年轻人为核心，支持手动添加亲属 + 申请验证双模式，通过血缘 + 婚姻关联，织就轻量化、高颜值、易互动的全国家族互联蛛网。

## ✨ 核心特性

### 🎯 双模式亲属添加
- **手动添加** — 快速关联，1 步搞定（姓名+关系即可）
- **申请验证** — 搜索匹配，双向审核，确保真实性
- **配偶同步** — 添加配偶后自动同步双方家族树

### 🕸️ 家族蛛网可视化
- 以自己为中心的关系蛛网图
- 血缘（黑色）与婚姻（橘色）线条区分
- 未验证节点半透明虚线显示
- 支持缩放、点击交互

### 👨‍👩‍👧‍👦 家族树双模式
- **简约模式** — 轻量化展示，父系/母系/配偶家族快速切换
- **完整模式** — 传统族谱样式，支持全展开编辑

### 💬 家族圈
- 图文 + 短视频动态
- 精细化可见范围控制
- @亲属、点赞、评论、转发

### 🌐 全国家族人脉
- BFS 最短路径算法计算关系路径
- 按姓氏、籍贯、亲缘距离筛选
- 婚姻关联自动延伸蛛网

### 🔒 隐私保护
- 精细化信息权限（单独控制手机/生日/籍贯可见性）
- 蛛网匿名展示模式
- 验证防骚扰（每日限 2 次）

## 🛠️ 技术栈

| 层 | 技术 |
|---|------|
| 前端 | UniApp (Vue 3 + TypeScript + Pinia) |
| UI | SCSS，年轻化浅米白+暖橘配色 |
| 可视化 | ECharts（蛛网/家族树） |
| 后端 | 腾讯云开发（Cloud Functions + 云数据库） |
| 平台 | 微信小程序 → H5 → App |

## 📁 项目结构

```
family-hub/
├── src/
│   ├── api/                # API 封装
│   │   ├── request.ts      # 请求基础/云函数调用
│   │   └── index.ts        # 各模块 API
│   ├── components/         # 公共组件
│   │   ├── WebChart.vue    # 蛛网可视化组件
│   │   ├── RelativeCard.vue # 亲属卡片
│   │   └── SearchInput.vue # 搜索输入框
│   ├── pages/              # 页面
│   │   ├── index/          # 首页（蛛网）
│   │   ├── family-tree/    # 家族树
│   │   ├── relatives/      # 亲属管理（添加/验证/搜索/详情/编辑）
│   │   ├── circle/         # 家族圈
│   │   ├── network/        # 家族人脉
│   │   ├── mine/           # 个人中心（档案/隐私/邀请）
│   │   └── auth/           # 登录/注册
│   ├── store/              # Pinia 状态管理
│   │   ├── user.ts         # 用户状态
│   │   └── family.ts       # 家族关系状态
│   ├── utils/              # 工具函数
│   │   ├── relation.ts     # 关系算法（路径计算/称谓推断）
│   │   └── index.ts        # 通用工具
│   ├── styles/             # 全局样式
│   │   ├── variables.scss  # 设计变量（配色/间距/圆角）
│   │   └── global.scss     # 全局样式
│   ├── static/             # 静态资源
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json
│   └── manifest.json
├── cloudfunctions/         # 云函数
│   ├── user/               # 用户模块（登录/注册/资料）
│   ├── relative/           # 亲属关系模块（添加/同步）
│   ├── verify/             # 验证请求模块（发起/审核）
│   ├── circle/             # 家族圈模块（发布/点赞/评论）
│   └── network/            # 人脉模块（路径计算/蛛网数据）
├── database/
│   └── schema.md           # 数据库设计文档
├── docs/                   # 项目文档
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9
- HBuilderX（推荐）或 VS Code + UniApp 插件

### 安装

```bash
git clone https://github.com/tchw521/family-hub.git
cd family-hub
npm install
```

### 开发

```bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5

# App
npm run dev:app
```

### 构建

```bash
npm run build:mp-weixin  # 小程序
npm run build:h5          # H5
npm run build:app         # App
```

## 📋 开发计划

### MVP 阶段（当前）
- [x] 项目骨架搭建
- [x] 页面框架（6 大模块 16 个页面）
- [x] 双模式亲属添加（手动 + 验证）
- [x] 家族蛛网可视化
- [x] 家族树双模式
- [x] 家族圈发布/互动
- [x] 全国家族人脉路径计算
- [x] 隐私设置（精细化权限）
- [x] 邀请家人 + 奖励机制
- [x] 云函数后端（5 个模块）
- [x] 数据库设计
- [ ] 云开发环境接入
- [ ] ECharts 蛛网实际渲染
- [ ] 图片/视频上传
- [ ] 订阅消息通知
- [ ] 小程序真机测试

### 下一步
- [ ] UI 高保真设计稿
- [ ] 动效实现（蛛网辐射、节点点亮）
- [ ] 生日提醒 + 日历同步
- [ ] 一键分享家族树到微信
- [ ] 家族群聊对接
- [ ] APP 打包发布

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

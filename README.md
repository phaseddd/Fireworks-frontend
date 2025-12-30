# Fireworks Frontend

🎆 **烟花商品展示小程序** - 前端应用

## 技术栈

- **框架**: Taro 4.1.9
- **语言**: TypeScript 5.x
- **UI 框架**: React 18 + NutUI 2.6
- **样式**: Sass
- **构建工具**: Webpack 5

## 项目结构

```
src/
├── app.tsx                  # 应用入口
├── app.config.ts            # 应用配置
├── app.scss                 # 全局样式
├── pages/                   # 页面组件
│   ├── index/               # 客户端首页
│   ├── products/            # 商品相关页面
│   │   ├── list.tsx         # 商品列表
│   │   └── detail.tsx       # 商品详情
│   └── admin/               # 管理端（分包）
│       ├── login.tsx        # 登录页
│       ├── dashboard.tsx    # 管理后台
│       └── products/        # 商品管理
├── components/              # 公共组件
├── services/                # API 服务
│   └── api.ts               # 接口定义
├── hooks/                   # 自定义 Hooks
├── stores/                  # 状态管理
├── types/                   # TypeScript 类型定义
│   └── index.ts             # 类型导出
├── utils/                   # 工具函数
└── assets/                  # 静态资源
```

## 本地开发

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5
```

### 构建生产版本

```bash
# 微信小程序
npm run build:weapp

# H5
npm run build:h5
```

## 微信开发者工具

1. 打开微信开发者工具
2. 导入项目，选择 `Fireworks-frontend` 目录（`project.config.json` 已配置 `miniprogramRoot: ./dist`）
3. 填入小程序 AppID（或使用测试号）

## 页面路由

### 主包页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/pages/index/index` | 首页 | 客户端欢迎页 |
| `/pages/products/list` | 商品列表 | 商品浏览 |
| `/pages/products/detail` | 商品详情 | 商品详细信息 |

### 分包页面（管理端）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/pages/admin/login` | 登录 | 店主登录 |
| `/pages/admin/dashboard` | 后台首页 | 管理后台 |
| `/pages/admin/products/list` | 商品管理 | 商品列表管理 |
| `/pages/admin/products/edit` | 编辑商品 | 新增/编辑商品 |

## 相关文档

- [架构文档](../docs/architecture.md)
- [PRD 文档](../docs/prd.md)
- [UI/UX 规范](../docs/front-end-spec.md)

---

> **项目状态**: 🚧 开发中

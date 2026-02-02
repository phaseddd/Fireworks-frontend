# Fireworks Frontend 🎆

<p align="center">
  <strong>面向南澳县烟花店的微信小程序 · 前端应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-WeChat%20Mini%20Program-07C160?style=flat-square&logo=wechat" alt="Platform" />
  <img src="https://img.shields.io/badge/Deploy-WeChat%20Cloud%20Hosting-07C160?style=flat-square" alt="Deploy" />
  <img src="https://img.shields.io/badge/Dev%20Cycle-2025.12--2026.01-blue?style=flat-square" alt="Dev Cycle" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Taro-4.1.9-0969da?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDA5NmZmIi8+PC9zdmc+" alt="Taro" />
  <img src="https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NutUI-2.6-fa2c19?style=flat-square" alt="NutUI" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docs-79-success?style=flat-square" alt="Docs" />
  <img src="https://img.shields.io/badge/Stories-22-success?style=flat-square" alt="Stories" />
  <img src="https://img.shields.io/badge/Commits-50+-blueviolet?style=flat-square" alt="Commits" />
  <img src="https://img.shields.io/badge/Research%20Topics-10+-orange?style=flat-square" alt="Research" />
</p>

---

## TL;DR

```bash
# 安装依赖
npm install

# 启动开发服务器（微信小程序）
npm run dev:weapp

# 打开微信开发者工具，导入本目录即可预览
```

---

## 阅读导航

| 目标 | 入口 |
|------|------|
| 🚀 **想快速了解** | 继续阅读下方「项目概览」和「核心亮点」 |
| 💻 **想本地运行** | 跳转至「本地开发指南」 |
| 🤖 **想看 AI 工程实践** | 跳转至「AI Engineering Story Talk」 |
| 📚 **想看完整文档** | 查看 `../docs/index.md` |

---

## 项目概览

### 业务场景

**Fireworks** 是一款面向南澳县烟花店的微信小程序，解决传统烟花零售的数字化痛点：

- **店主痛点**：手动拍照报价效率低、100-200 SKU 管理困难、中老年人技术门槛高
- **中介痛点**：客户来源追踪困难、业绩统计依赖人工记忆
- **顾客痛点**：旅游期间无法快速了解商品和价格

### 产品定位

```
┌─────────────────────────────────────────────────────┐
│                   Fireworks 小程序                    │
├─────────────────────┬───────────────────────────────┤
│     客户端 (默认)     │         管理端 (登录后)        │
├─────────────────────┼───────────────────────────────┤
│ • 浏览烟花商品        │ • 商品管理 (增删改查)          │
│ • 查看价格和详情      │ • 库存管理 (快速调整)          │
│ • 生成询价单          │ • 代理商管理 (专属码)          │
│ • Canvas 2D 烟花特效  │ • 适老化界面设计              │
└─────────────────────┴───────────────────────────────┘
```

### 关键约束

| 约束 | 说明 |
|------|------|
| 平台限制 | 仅微信小程序，使用 `wx.cloud.callContainer` 调用后端 |
| 用户群体 | 管理端面向 50-65 岁店主，需适老化设计 |
| 性能要求 | 首屏加载 < 3秒，动效需兼顾低端机型 |
| 成本控制 | 个人项目，追求低成本/零成本方案 |

---

## 核心亮点

### 🎨 Canvas 2D 赛博星夜

首页采用自研 Canvas 2D 粒子系统，实现"赛博星夜"视觉效果：

| 特性 | 实现 |
|------|------|
| **粒子系统** | 200 粒子对象池复用，避免 GC 抖动 |
| **视觉元素** | 月亮 + 呼吸星空 + 霓虹烟花 |
| **配色方案** | NEON_PALETTE 赛博霓虹色盘 |
| **性能优化** | `destination-out` 透明背景，分层渲染 |

<details>
<summary>📸 效果截图</summary>

| 首页效果 | 商品列表 | 商品详情 |
|---------|---------|---------|
| Canvas 2D 烟花 | 分类筛选 | 二维码识别 |

</details>

### 🏗️ 前端架构

```
src/
├── app.tsx                  # 应用入口
├── components/              # 组件库
│   ├── FireworksCanvas/     # 🎆 Canvas 2D 烟花粒子系统
│   │   ├── index.tsx        # 主组件
│   │   ├── particle.ts      # 粒子类定义
│   │   └── renderer.ts      # 渲染引擎
│   ├── ui/                  # 通用 UI 组件
│   │   ├── GlassButton/     # 玻璃态按钮
│   │   ├── GlassCard/       # 玻璃态卡片
│   │   └── PageHeader/      # 页面头部
│   └── customer/            # 客户端组件
│       ├── ProductCard/     # 商品卡片
│       ├── CategoryTabs/    # 分类标签
│       └── SearchBar/       # 搜索组件
├── pages/                   # 页面
│   ├── index/               # 🏠 首页 (Canvas 2D 烟花)
│   ├── products/            # 商品浏览
│   │   ├── list/            # 商品列表
│   │   └── detail/          # 商品详情
│   ├── wishlist/            # 意向清单
│   ├── inquiry/             # 询价模块
│   └── admin/               # 📋 管理端 (分包)
├── services/                # API 服务层
├── hooks/                   # 自定义 Hooks
└── types/                   # TypeScript 类型
```

---

## AI Engineering Story Talk

> **这不是"用 AI 写代码"，而是一套可复用、可审计的工程流程。**

### 1. 项目目标与约束

| 维度 | 说明 |
|------|------|
| **业务场景** | 面向南澳县烟花店的微信小程序，真实门店业务驱动 |
| **交付周期** | 2025-12 ~ 2026-01（短周期高密度迭代） |
| **关键约束** | 小程序生态 + 微信云托管 + 适老化 + 低成本 |

### 2. BMad 框架：需求工程化

采用 [BMad](https://github.com/bmad-method) 方法论进行需求管理：

- **产出物**：Brief → PRD → Architecture → Stories
- **验收标准**：每个 Story 都有明确的 Done 定义
- **文档规模**：79 个文档，22 个 Story

```
docs/
├── brief.md           # 项目简报 v1.5
├── prd.md             # 产品需求 v0.8
├── architecture.md    # 架构文档 v1.2
├── front-end-spec.md  # UI/UX 规范 v1.1
└── stories/           # 22 个 Story 文档
```

### 3. 多 AI 方案对比

前端视觉重构经历了 **Claude / Gemini / GPT 三路方案对比**：

| 方案 | 适用任务 | 优点 | 结论 |
|------|----------|------|------|
| **Claude Code** | 主线开发/重构推进 | 上下文保持稳定，适合长链路改造 | ✅ 主力 |
| **Codex** | 工程加速（重构/测试） | 压缩重复劳动，提升交付节奏 | ✅ 辅助 |
| **Gemini** | 视觉探索（Canvas 2D） | 方案发散能力强 | ✅ 专项 |
| **GPT** | 方案对比参考 | 提供多元视角 | 📊 参考 |

<details>
<summary>📋 详细决策过程</summary>

**评估维度**：
- 代码一致性（长期维护）
- 对既有架构的尊重
- 调试效率
- UI 表达力

**最终决策**：
- Claude Code 负责主线开发和重构推进
- Codex 负责工程加速（代码审阅、重复劳动压缩）
- Gemini 的 Canvas 2D 赛博星夜方案被采纳

**完整记录**：`../docs/小程序客户端前端重构调研/`

</details>

### 4. 可验证成果

| 指标 | 数量 |
|------|------|
| Frontend commits | 50+ |
| 文档数量 | 79 |
| Story 数量 | 22 |
| 技术调研专题 | 10+ |

**文档索引**：`../docs/index.md`

### 5. 技术调研沉淀

| 专题 | 结论 | 文档 |
|------|------|------|
| Three.js 方案 | ❌ 放弃（性能/兼容性） | [`../docs/关于在 Taro 小程序中运行 Three.js调研/`](../docs/关于在%20Taro%20小程序中运行%20Three.js调研/) |
| Canvas 2D 方案 | ✅ 采纳（对象池优化） | [`../docs/小程序客户端前端重构调研/gemini/`](../docs/小程序客户端前端重构调研/gemini/) |
| 中介专属码 | ✅ 小程序码方案 | [`../docs/中介交互调研/`](../docs/中介交互调研/) |
| 微信云托管 | ✅ 推荐（年费约400元） | [`../docs/微信云托管调研/`](../docs/微信云托管调研/) |

---

## 本地开发指南

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | 18+ |
| npm | 9+ |
| 微信开发者工具 | 最新稳定版 |

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（微信小程序）
npm run dev:weapp

# 3. 打开微信开发者工具
#    导入项目目录，选择 Fireworks-frontend
#    填入小程序 AppID（或使用测试号）
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:weapp` | 开发模式（微信小程序） |
| `npm run build:weapp` | 生产构建（微信小程序） |
| `npm run dev:h5` | 开发模式（H5） |

### 项目配置

微信开发者工具已配置 `miniprogramRoot: ./dist`，导入项目根目录即可。

---

## 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **框架** | Taro | 4.1.9 | 京东跨端框架 |
| **UI 框架** | React | 18.3 | 组件化开发 |
| **语言** | TypeScript | 5.4 | 类型安全 |
| **组件库** | NutUI | 2.6 | 京东移动端组件库 |
| **样式** | Sass | 1.77 | CSS 预处理器 |
| **构建** | Webpack | 5.x | 模块打包 |

---

## 页面路由

### 主包页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/pages/index/index` | 首页 | Canvas 2D 烟花效果 |
| `/pages/products/list/index` | 商品列表 | 分类筛选、搜索 |
| `/pages/products/detail/index` | 商品详情 | 二维码识别播放视频 |
| `/pages/wishlist/index` | 意向清单 | 商品收藏 |
| `/pages/inquiry/create/index` | 创建询价 | 生成询价单 |

### 分包页面（管理端）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/pages/admin/login` | 登录 | 店主登录（适老化） |
| `/pages/admin/dashboard` | 后台首页 | 管理入口 |
| `/pages/admin/products/list` | 商品管理 | 增删改查 |
| `/pages/admin/agents/list` | 代理商管理 | 专属码生成 |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [项目简报](../docs/brief.md) | 业务背景与目标 |
| [PRD](../docs/prd.md) | 产品需求文档 |
| [架构文档](../docs/architecture.md) | 全栈架构设计 |
| [UI/UX 规范](../docs/front-end-spec.md) | 视觉设计规范 |
| [文档索引](../docs/index.md) | 完整文档导航 |

---

## License

MIT License

---

<p align="center">
  <sub>Built with ❤️ using Claude Code + Codex</sub>
</p>

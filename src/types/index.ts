/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页请求参数
 */
export interface PageParams {
  page: number
  size: number
}

/**
 * 分页响应数据
 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  size: number
}

/**
 * 商品实体
 */
export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: ProductCategory
  images: string[]
  videoUrl?: string  // 燃放效果视频URL
  stock: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

/**
 * 商品分类
 */
export type ProductCategory = 'GIFT' | 'FIREWORK' | 'FIRECRACKER' | 'COMBO' | 'OTHER'

/**
 * 商品状态
 */
export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF'

/**
 * 商品分类中文映射
 */
export const categoryMap: Record<ProductCategory, string> = {
  'GIFT': '礼花类',
  'FIREWORK': '烟花类',
  'FIRECRACKER': '鞭炮类',
  'COMBO': '组合类',
  'OTHER': '其他'
}

/**
 * 代理商实体
 */
export interface Agent {
  id: number
  code: string
  name: string
  phone?: string
  status: AgentStatus
  qrcodeUrl?: string
  createdAt: string
  updatedAt: string
  openidBound?: boolean
}

export type AgentStatus = 'ACTIVE' | 'DISABLED'

/**
 * 生成代理商绑定码响应
 */
export interface AgentBindCode {
  bindCode: string
  bindQrcodeUrl?: string
  expiresAt: string
}

/**
 * 代理商绑定结果
 */
export interface AgentBindResult {
  agentCode: string
  agentName: string
}

/**
 * 代理商业绩统计
 */
export interface AgentStats {
  agentCode: string
  agentName: string
  range: 'week' | 'month' | 'all'
  customerCount: number
  inquiryCount: number
}

/**
 * 询价单实体
 */
export interface Inquiry {
  id: number
  agentCode?: string
  shareCode?: string
  phone: string
  wechat?: string
  openid?: string
  items: InquiryItem[]
  createdAt: string
}

/**
 * 询价列表项（管理端）
 */
export interface InquiryListItem {
  id: number
  phone: string
  wechat?: string
  productCount: number
  agentCode?: string
  agentName?: string
  createdAt: string
}

/**
 * 创建询价响应
 */
export interface InquiryCreateResult {
  id: number
  shareCode: string
  sharePath: string
}

/**
 * 询价分享详情（受控访问 + 联系方式脱敏）
 */
export interface InquiryShareDetail {
  shareCode: string
  agentCode?: string
  agentName?: string
  phoneMasked: string
  wechatMasked?: string
  items: Array<Pick<InquiryItem, 'productId' | 'productName' | 'quantity'>>
  createdAt: string
}

/**
 * 询价单项目
 */
export interface InquiryItem {
  productId: number
  productName?: string
  price?: number
  image?: string
  quantity: number
}

/**
 * 管理员实体
 */
export interface Admin {
  id: number
  username: string
  nickname?: string
  role: AdminRole
  lastLoginAt?: string
}

/**
 * 管理员角色
 */
export enum AdminRole {
  OWNER = 'OWNER',     // 店主
  MANAGER = 'MANAGER'  // 店员
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string
  password: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string
  expiresIn: number
}

/**
 * 创建商品请求
 */
export interface CreateProductRequest {
  name: string
  price: number
  category?: ProductCategory
  stock?: number
  description?: string
  images?: string[]  // [外观图, 细节图, 二维码图]
}

/**
 * 更新商品请求
 */
export interface UpdateProductRequest {
  name: string
  price: number
  category?: ProductCategory
  stock?: number
  description?: string
  status?: ProductStatus
  images: string[]  // [外观图, 细节图, 二维码图]
}

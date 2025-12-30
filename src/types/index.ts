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
  qrcodeUrl?: string
  viewCount: number
  createdAt: string
}

/**
 * 询价单实体
 */
export interface Inquiry {
  id: number
  inquiryNo: string
  customerOpenId: string
  agentId?: number
  agentCode?: string
  items: InquiryItem[]
  totalAmount: number
  status: InquiryStatus
  createdAt: string
}

/**
 * 询价单项目
 */
export interface InquiryItem {
  productId: number
  productName: string
  productImage: string
  price: number
  quantity: number
  subtotal: number
}

/**
 * 询价单状态
 */
export enum InquiryStatus {
  PENDING = 0,    // 待处理
  CONTACTED = 1,  // 已联系
  COMPLETED = 2,  // 已完成
  CANCELLED = 3   // 已取消
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

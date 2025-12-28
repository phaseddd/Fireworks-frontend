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
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * 商品实体
 */
export interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  categoryId: number
  categoryName?: string
  mainImage: string
  detailImage?: string
  qrcodeImage?: string
  stock: number
  status: ProductStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * 商品状态
 */
export enum ProductStatus {
  OFF_SHELF = 0,   // 下架
  ON_SHELF = 1,    // 上架
  OUT_OF_STOCK = 2 // 缺货
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

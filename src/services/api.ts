import Taro from '@tarojs/taro'
import { authUtils } from '../hooks/useAuth'
import type {
  Agent,
  AgentBindCode,
  AgentBindResult,
  AgentStats,
  ApiResponse,
  Category,
  CreateCategoryRequest,
  CreateProductRequest,
  Inquiry,
  InquiryCreateResult,
  InquiryListItem,
  InquiryShareDetail,
  LoginRequest,
  LoginResponse,
  PageResult,
  Product,
  ProductStatus,
  UpdateCategoryRequest,
  UpdateProductRequest
} from '../types'

const CLOUD_ENV = process.env.TARO_APP_CLOUD_ENV || ''
const SERVICE_NAME = process.env.TARO_APP_SERVICE_NAME || 'fireworks-backend'

// API 基础路径
const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080'
  : '' // 生产环境使用 wx.cloud.callContainer

/**
 * 发送请求
 */
async function request<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    data?: any
    header?: Record<string, string>
    silent?: boolean
  } = {}
): Promise<T> {
  const { method = 'GET', data, header = {}, silent = false } = options

  // 获取 token (管理端使用 adminToken)，仅在未过期时注入
  const token = authUtils.getToken()
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  // 本地开发：允许通过 storage 注入 mockOpenid，方便调试无需 JWT 的 OpenID 接口
  if (process.env.NODE_ENV === 'development' && !header['Authorization']) {
    const mockOpenid = Taro.getStorageSync('mockOpenid')
    if (mockOpenid && !header['X-WX-OPENID'] && !header['X-OPENID']) {
      header['X-OPENID'] = String(mockOpenid)
    }
  }

  try {
    // 开发环境使用普通请求
    if (process.env.NODE_ENV === 'development') {
      const res = await Taro.request<ApiResponse<T>>({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...header
        }
      })

      if (res.data.code !== 200) {
        const err: any = new Error(res.data.message || '请求失败')
        err.code = res.data.code
        throw err
      }

      return res.data.data
    }

    // 生产环境使用云调用
    if (!CLOUD_ENV) {
      throw new Error('缺少云托管环境 ID，请配置 TARO_APP_CLOUD_ENV')
    }
    const res = await Taro.cloud.callContainer({
      config: {
        env: CLOUD_ENV
      },
      path: url,
      method,
      data,
      header: {
        'X-WX-SERVICE': SERVICE_NAME,
        'Content-Type': 'application/json',
        ...header
      }
    })

    const result = res.data as ApiResponse<T>
    if (result.code !== 200) {
      const err: any = new Error(result.message || '请求失败')
      err.code = result.code
      throw err
    }

    return result.data
  } catch (error: any) {
    console.error('Request error:', error)
    if (!silent) {
      Taro.showToast({
        title: error.message || '网络错误',
        icon: 'none'
      })
    }
    throw error
  }
}

/**
 * API 服务
 */
export const api = {
  // 健康检查
  health: () => request<{ status: string }>('/api/health'),

  // 认证相关
  auth: {
    login: (data: LoginRequest) =>
      request<LoginResponse>('/api/v1/auth/login', { method: 'POST', data }),
  },

  // 商品相关
  products: {
    list: (params?: { page?: number; size?: number; status?: ProductStatus; sort?: string }) =>
      request<PageResult<Product>>('/api/v1/products', { data: params }),
    publicList: (params?: { page?: number; size?: number; sort?: string; categoryId?: number; category?: string; minPrice?: number; maxPrice?: number; keyword?: string }) =>
      request<PageResult<Product>>('/api/v1/products/public', { data: params }),
    hotKeywords: () =>
      request<string[]>('/api/v1/products/public/hot-keywords'),
    detail: (id: number) =>
      request<Product>(`/api/v1/products/${id}`),
    publicDetail: (id: number) =>
      request<Product>(`/api/v1/products/public/${id}`),
    create: (data: CreateProductRequest) =>
      request<Product>('/api/v1/products', { method: 'POST', data }),
    update: (id: number, data: UpdateProductRequest) =>
      request<Product>(`/api/v1/products/${id}`, { method: 'PUT', data }),
    delete: (id: number) =>
      request<void>(`/api/v1/products/${id}`, { method: 'DELETE' }),
  },

  // 代理商相关
  agents: {
    list: (params?: { page?: number; size?: number }) =>
      request<PageResult<Agent>>('/api/v1/agents', { data: params }),
    detail: (code: string) => request<Agent>(`/api/v1/agents/${encodeURIComponent(code)}`),
    create: (data: { name: string; phone?: string }) =>
      request<Agent>('/api/v1/agents', { method: 'POST', data }),
    update: (code: string, data: { name?: string; phone?: string; status?: string }) =>
      request<Agent>(`/api/v1/agents/${encodeURIComponent(code)}`, { method: 'PUT', data }),
    generateQrcode: (code: string) =>
      request<{ qrcodeUrl: string }>(`/api/v1/agents/${encodeURIComponent(code)}/qrcode`, { method: 'POST' }),
    generateBindCode: (code: string) =>
      request<AgentBindCode>(`/api/v1/agents/${encodeURIComponent(code)}/bind-code`, { method: 'POST' }),
    bind: (data: { bindCode: string }) =>
      request<AgentBindResult>('/api/v1/agents/bind', { method: 'POST', data }),
    unbind: (code: string) =>
      request<void>(`/api/v1/agents/${encodeURIComponent(code)}/unbind`, { method: 'PUT' }),
    stats: (code: string, range: 'week' | 'month' | 'all') =>
      request<AgentStats>(`/api/v1/agents/${encodeURIComponent(code)}/stats`, { data: { range } }),
  },

  // 询价相关
  inquiries: {
    create: (data: { agentCode?: string | null; phone: string; wechat?: string; items: Array<{ productId: number; quantity: number }> }) =>
      request<InquiryCreateResult>('/api/v1/inquiries', { method: 'POST', data }),
    list: (params?: { page?: number; size?: number; agentCode?: string }) =>
      request<PageResult<InquiryListItem>>('/api/v1/inquiries', { data: params }),
    detail: (id: number) => request<Inquiry>(`/api/v1/inquiries/${id}`),
    shareDetail: (shareCode: string) =>
      request<InquiryShareDetail>(`/api/v1/inquiries/share/${encodeURIComponent(shareCode)}`, { silent: true }),
  },

  // 分类相关
  categories: {
    /** 获取所有分类（管理端） */
    list: () => request<Category[]>('/api/v1/categories'),
    /** 获取启用状态的分类（客户端公开接口） */
    activeList: () => request<Category[]>('/api/v1/categories/active'),
    /** 获取分类详情 */
    detail: (id: number) => request<Category>(`/api/v1/categories/${id}`),
    /** 创建分类 */
    create: (data: CreateCategoryRequest) =>
      request<Category>('/api/v1/categories', { method: 'POST', data }),
    /** 更新分类 */
    update: (id: number, data: UpdateCategoryRequest) =>
      request<Category>(`/api/v1/categories/${id}`, { method: 'PUT', data }),
    /** 删除分类 */
    delete: (id: number) =>
      request<void>(`/api/v1/categories/${id}`, { method: 'DELETE' }),
    /** 获取分类下商品数量 */
    productCount: (id: number) =>
      request<number>(`/api/v1/categories/${id}/product-count`),
  },
}

export default api

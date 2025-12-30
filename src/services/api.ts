import Taro from '@tarojs/taro'
import { authUtils } from '../hooks/useAuth'
import type { ApiResponse, CreateProductRequest, LoginRequest, LoginResponse, PageResult, Product, ProductStatus, UpdateProductRequest } from '../types'

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
  } = {}
): Promise<T> {
  const { method = 'GET', data, header = {} } = options

  // 获取 token (管理端使用 adminToken)，仅在未过期时注入
  const token = authUtils.getToken()
  if (token) {
    header['Authorization'] = `Bearer ${token}`
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
        throw new Error(res.data.message || '请求失败')
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
      throw new Error(result.message || '请求失败')
    }

    return result.data
  } catch (error: any) {
    console.error('Request error:', error)
    Taro.showToast({
      title: error.message || '网络错误',
      icon: 'none'
    })
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
    publicList: (params?: { page?: number; size?: number; sort?: string; category?: string; minPrice?: number; maxPrice?: number; keyword?: string }) =>
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
    list: () => request('/api/v1/agents'),
    detail: (id: number) => request(`/api/v1/agents/${id}`),
    create: (data: { name: string; phone?: string }) =>
      request('/api/v1/agents', { method: 'POST', data }),
    generateQrcode: (id: number) =>
      request(`/api/v1/agents/${id}/qrcode`, { method: 'POST' }),
  },

  // 询价相关
  inquiries: {
    create: (data: { items: Array<{ productId: number; quantity: number }> }) =>
      request('/api/v1/inquiries', { method: 'POST', data }),
    detail: (id: number) => request(`/api/v1/inquiries/${id}`),
    list: (params?: { page?: number; size?: number; status?: number }) =>
      request('/api/v1/inquiries', { data: params }),
  },
}

export default api

import Taro from '@tarojs/taro'
import { authUtils } from '../hooks/useAuth'
import type { ApiResponse, CreateProductRequest, LoginRequest, LoginResponse, PageResult, Product, ProductStatus, UpdateProductRequest } from '../types'

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
    const res = await Taro.cloud.callContainer({
      config: {
        env: '' // TODO: 填入云环境 ID
      },
      path: url,
      method,
      data,
      header: {
        'X-WX-SERVICE': 'fireworks-backend',
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
    list: (params?: { page?: number; size?: number; status?: ProductStatus }) =>
      request<PageResult<Product>>('/api/v1/products', { data: params }),
    detail: (id: number) =>
      request<Product>(`/api/v1/products/${id}`),
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

import { useCallback, useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

/**
 * 认证状态 Hook
 * 用于检查用户登录状态和管理 Token
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  /**
   * 检查登录状态
   */
  const checkAuth = useCallback(() => {
    const token = Taro.getStorageSync('adminToken')
    const expiry = Taro.getStorageSync('tokenExpiry')

    const authenticated = !!(token && expiry && Date.now() < expiry)
    setIsAuthenticated(authenticated)
    setLoading(false)

    return authenticated
  }, [])

  /**
   * 获取 Token
   */
  const getToken = useCallback((): string | null => {
    const token = Taro.getStorageSync('adminToken')
    const expiry = Taro.getStorageSync('tokenExpiry')

    if (token && expiry && Date.now() < expiry) {
      return token
    }
    return null
  }, [])

  /**
   * 登出
   */
  const logout = useCallback(() => {
    Taro.removeStorageSync('adminToken')
    Taro.removeStorageSync('tokenExpiry')
    setIsAuthenticated(false)

    Taro.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    })

    // 跳转到登录页
    setTimeout(() => {
      Taro.redirectTo({ url: '/pages/admin/login' })
    }, 1500)
  }, [])

  /**
   * 路由守卫 - 检查登录状态，未登录则跳转到登录页
   */
  const requireAuth = useCallback(() => {
    const authenticated = checkAuth()
    if (!authenticated) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      })

      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/admin/login' })
      }, 1500)

      return false
    }
    return true
  }, [checkAuth])

  // 组件挂载时检查登录状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    isAuthenticated,
    loading,
    checkAuth,
    getToken,
    logout,
    requireAuth
  }
}

/**
 * 认证工具函数
 */
export const authUtils = {
  /**
   * 检查是否已登录（同步方法）
   */
  isLoggedIn(): boolean {
    const token = Taro.getStorageSync('adminToken')
    const expiry = Taro.getStorageSync('tokenExpiry')
    return !!(token && expiry && Date.now() < expiry)
  },

  /**
   * 获取 Token（同步方法）
   */
  getToken(): string | null {
    const token = Taro.getStorageSync('adminToken')
    const expiry = Taro.getStorageSync('tokenExpiry')

    if (token && expiry && Date.now() < expiry) {
      return token
    }
    return null
  },

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    Taro.removeStorageSync('adminToken')
    Taro.removeStorageSync('tokenExpiry')
  }
}

export default useAuth

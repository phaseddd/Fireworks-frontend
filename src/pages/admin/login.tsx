import { View, Text, Input, Image } from '@tarojs/components'
import { useDidShow, useLoad } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import { useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { api } from '../../services/api'
import './login.scss'

// 图标 Base64（简单的眼睛图标）
const EYE_OPEN = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMSAxMnM0LTggMTEtOCAxMSA4IDExIDgtNCA4LTExIDgtMTEtOC0xMS04eiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiPjwvY2lyY2xlPjwvc3ZnPg=='
const EYE_CLOSE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTcuOTQgMTcuOTRBMTAuMDcgMTAuMDcgMCAwIDEgMTIgMjBjLTcgMC0xMS04LTExLThhMTguNDUgMTguNDUgMCAwIDEgNS4wNi01Ljk0TTE0LjEyIDkuODhhMyAzIDAgMCAxLTQuMjQgNC4yNCIvPjxsaW5lIHgxPSIxIiB5MT0iMSIgeDI9IjIzIiB5Mj0iMjMiLz48L3N2Zz4='

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const redirectedRef = useRef(false)

  useLoad(() => {
    console.log('Admin login page loaded')
  })

  useDidShow(() => {
    if (redirectedRef.current) return

    // 检查是否已登录（在页面已展示后再跳转，避免导航冲突/超时）
    const token = Taro.getStorageSync('adminToken')
    const expiry = Taro.getStorageSync('tokenExpiry')
    if (token && expiry && Date.now() < expiry) {
      const redirectUrl = Taro.getStorageSync('postLoginRedirect')
      if (redirectUrl) {
        Taro.removeStorageSync('postLoginRedirect')
      }
      redirectedRef.current = true
      setTimeout(() => {
        const target = redirectUrl || '/pages/admin/products/list'
        Taro.redirectTo({
          url: target,
          fail: () => {
            Taro.reLaunch({ url: target })
          }
        })
      }, 0)
    }
  })

  const handleLogin = async () => {
    // 表单验证
    if (!username.trim()) {
      Taro.showToast({
        title: '请输入用户名',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (!password) {
      Taro.showToast({
        title: '请输入密码',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setLoading(true)

    try {
      // 调用登录 API
      const response = await api.auth.login({
        username: username.trim(),
        password
      })

      // 存储 Token
      Taro.setStorageSync('adminToken', response.token)
      Taro.setStorageSync('tokenExpiry', Date.now() + response.expiresIn * 1000)

      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        const redirectUrl = Taro.getStorageSync('postLoginRedirect')
        if (redirectUrl) {
          Taro.removeStorageSync('postLoginRedirect')
        }
        Taro.redirectTo({ url: redirectUrl || '/pages/admin/products/list' })
      }, 1500)

    } catch (error: any) {
      console.error('Login failed:', error)
      // 错误提示已在 api.ts 中处理
    } finally {
      setLoading(false)
    }
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <View className='admin-login'>
      <View className='login-card'>
        {/* 标题 */}
        <Text className='title'>店主登录</Text>
        <Text className='subtitle'>烟花商品管理系统</Text>

        {/* 登录表单 */}
        <View className='form'>
          {/* 用户名输入框 */}
          <View className='form-item'>
            <Text className='label'>用户名</Text>
            <Input
              className='input'
              type='text'
              placeholder='请输入用户名'
              placeholderClass='placeholder'
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
              maxlength={50}
            />
          </View>

          {/* 密码输入框 */}
          <View className='form-item'>
            <Text className='label'>密码</Text>
            <View className='password-wrapper'>
              <Input
                className='input password-input'
                password={!showPassword}
                placeholder='请输入密码'
                placeholderClass='placeholder'
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
                maxlength={100}
              />
              <View className='eye-btn' onClick={toggleShowPassword}>
                <Image
                  className='eye-icon'
                  src={showPassword ? EYE_OPEN : EYE_CLOSE}
                  mode='aspectFit'
                />
              </View>
            </View>
            <Text className='hint'>点击眼睛图标可显示/隐藏密码</Text>
          </View>

          {/* 登录按钮 */}
          <Button
            type='primary'
            size='large'
            className='btn-login'
            onClick={handleLogin}
            loading={loading}
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录'}
          </Button>
        </View>

        {/* 底部提示 */}
        <View className='footer'>
          <Text className='footer-text'>如忘记密码请联系技术支持</Text>
        </View>
      </View>
    </View>
  )
}

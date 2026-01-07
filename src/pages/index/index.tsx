import { View, Text, Image } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useRef } from 'react'
import { authUtils } from '../../hooks/useAuth'
import logoImg from '../../assets/images/logo.png'
import './index.scss'

const FIREWORKS_EMOJI = String.fromCodePoint(0x1F386)
const COPYRIGHT_SIGN = String.fromCodePoint(0x00A9)

export default function Index() {
  const navigatingRef = useRef(false)

  useLoad(() => {
    console.log(`${FIREWORKS_EMOJI} 南澳烟花首页加载完成`)
  })

  // 跳转到商品列表 (TabBar 页面，使用 switchTab)
  const handleStartBrowsing = () => {
    Taro.switchTab({
      url: '/pages/products/list/index'
    })
  }

  // 店主入口 - 需要预加载分包
  const handleAdminLogin = () => {
    if (navigatingRef.current) return
    navigatingRef.current = true

    const url = authUtils.isLoggedIn()
      ? '/pages/admin/dashboard'
      : '/pages/admin/login'

    const loadSubPackage = (Taro as unknown as {
      loadSubPackage?: (options: {
        name: string
        success?: () => void
        fail?: (err: unknown) => void
      }) => void
    }).loadSubPackage

    if (typeof loadSubPackage === 'function') {
      Taro.showLoading({ title: '加载中...' })
      loadSubPackage({
        name: 'pages/admin',
        success: () => {
          Taro.hideLoading()
          Taro.navigateTo({
            url,
            complete: () => {
              navigatingRef.current = false
            },
          })
        },
        fail: (err) => {
          console.error('loadSubPackage failed:', err)
          Taro.hideLoading()
          Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
          navigatingRef.current = false
        }
      })
      return
    }

    Taro.navigateTo({
      url,
      complete: () => {
        navigatingRef.current = false
      },
    })
  }

  return (
    <View className='index-page'>
      {/* 主内容区 */}
      <View className='content'>
        {/* Logo */}
        <View className='logo-wrapper'>
          <Image
            className='logo'
            src={logoImg}
            mode='aspectFit'
          />
        </View>

        {/* 店铺名称 */}
        <Text className='store-name'>南澳烟花</Text>

        {/* 口号 */}
        <Text className='slogan'>绚烂烟火，点亮美好时刻</Text>

        {/* 开始浏览按钮 */}
        <Button
          className='btn-start'
          onClick={handleStartBrowsing}
        >
          开始浏览
        </Button>

        {/* 店主入口 - 小字链接样式 */}
        <View className='admin-entry' onClick={handleAdminLogin}>
          <Text className='admin-text'>店主入口</Text>
        </View>
      </View>

      {/* 底部版权信息 */}
      <View className='footer'>
        <Text className='copyright'>{COPYRIGHT_SIGN} 2025 南澳烟花</Text>
      </View>
    </View>
  )
}

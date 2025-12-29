import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useRef } from 'react'
import { authUtils } from '../../hooks/useAuth'
import './index.scss'

const FIREWORKS_EMOJI = String.fromCodePoint(0x1F386)
const COPYRIGHT_SIGN = String.fromCodePoint(0x00A9)

export default function Index() {
  const navigatingRef = useRef(false)

  useLoad(() => {
    console.log(`${FIREWORKS_EMOJI} Index page loaded`)
  })

  const handleViewProducts = () => {
    Taro.navigateTo({
      url: '/pages/products/list'
    })
  }

  const handleAdminLogin = () => {
    if (navigatingRef.current) return
    navigatingRef.current = true

    const url = authUtils.isLoggedIn()
      ? '/pages/admin/products/list'
      : '/pages/admin/login'

    const loadSubPackage = (Taro as any).loadSubPackage as
      | ((options: { name: string; success?: () => void; fail?: (err: any) => void }) => void)
      | undefined

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
    <View className='index'>
      {/* 背景动效区域（Three.js/Lottie 预留） */}
      <View className='background-effect'>
        {/* TODO: 添加粒子效果 */}
      </View>

      {/* 主内容区 */}
      <View className='content'>
        {/* Logo 和标题 */}
        <View className='hero'>
          <Text className='title'>{FIREWORKS_EMOJI} Fireworks</Text>
          <Text className='subtitle'>南澳县烟花商品展示</Text>
        </View>

        {/* 操作按钮 */}
        <View className='actions'>
          <Button
            type='primary'
            size='large'
            className='btn-primary'
            onClick={handleViewProducts}
          >
            浏览商品
          </Button>
          <Button
            type='default'
            size='large'
            className='btn-secondary'
            onClick={handleAdminLogin}
          >
            店主入口
          </Button>
        </View>

        {/* 底部信息 */}
        <View className='footer'>
          <Text className='copyright'>{COPYRIGHT_SIGN} 2025 Fireworks</Text>
        </View>
      </View>
    </View>
  )
}

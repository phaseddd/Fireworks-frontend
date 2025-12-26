import { View, Text, Image } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Index() {
  useLoad(() => {
    console.log('🎆 Index page loaded')
  })

  const handleViewProducts = () => {
    Taro.navigateTo({
      url: '/pages/products/list'
    })
  }

  const handleAdminLogin = () => {
    Taro.navigateTo({
      url: '/pages/admin/login'
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
          <Text className='title'>🎆 Fireworks</Text>
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
          <Text className='copyright'>© 2025 Fireworks</Text>
        </View>
      </View>
    </View>
  )
}

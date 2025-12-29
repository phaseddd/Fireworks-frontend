import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

/**
 * 我的/意向清单页面 - TabBar 页面
 * TODO: Story 2.4 实现完整意向清单功能
 */
export default function Wishlist() {
  useLoad(() => {
    console.log('我的页面加载')
  })

  return (
    <View className='wishlist-page'>
      <View className='placeholder'>
        <Text className='icon'>❤️</Text>
        <Text className='title'>我的意向清单</Text>
        <Text className='desc'>收藏心仪的烟花商品</Text>
        <Text className='tip'>功能开发中，敬请期待</Text>
      </View>
    </View>
  )
}

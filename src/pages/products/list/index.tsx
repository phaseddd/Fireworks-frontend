import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

/**
 * 商品列表页面 - TabBar 页面
 * TODO: Story 2.2 实现完整商品列表功能
 */
export default function ProductList() {
  useLoad(() => {
    console.log('商品列表页面加载')
  })

  return (
    <View className='product-list-page'>
      <View className='placeholder'>
        <Text className='icon'>🛍️</Text>
        <Text className='title'>商品列表</Text>
        <Text className='desc'>精选烟花商品，敬请期待</Text>
      </View>
    </View>
  )
}

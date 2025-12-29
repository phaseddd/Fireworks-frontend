import { View, Text } from '@tarojs/components'
import { useLoad, useRouter } from '@tarojs/taro'
import './index.scss'

/**
 * 商品详情页面
 * TODO: Story 2.3 实现完整商品详情功能
 */
export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.params

  useLoad(() => {
    console.log('商品详情页面加载, id:', id)
  })

  return (
    <View className='product-detail-page'>
      <View className='placeholder'>
        <Text className='icon'>🎆</Text>
        <Text className='title'>商品详情</Text>
        <Text className='desc'>商品 ID: {id || '未指定'}</Text>
        <Text className='tip'>详情功能开发中，敬请期待</Text>
      </View>
    </View>
  )
}

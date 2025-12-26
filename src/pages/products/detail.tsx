import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './detail.scss'

export default function ProductDetail() {
  useLoad(() => {
    console.log('Product detail page loaded')
  })

  return (
    <View className='product-detail'>
      <Text>商品详情页面 - 待实现</Text>
    </View>
  )
}

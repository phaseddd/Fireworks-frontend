import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './list.scss'

export default function ProductList() {
  useLoad(() => {
    console.log('Product list page loaded')
  })

  return (
    <View className='product-list'>
      <Text>商品列表页面 - 待实现</Text>
    </View>
  )
}

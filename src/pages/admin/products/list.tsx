import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function AdminProductList() {
  useLoad(() => {
    console.log('Admin product list page loaded')
  })

  return (
    <View style={{ padding: '20px' }}>
      <Text>商品管理列表 - 待实现</Text>
    </View>
  )
}

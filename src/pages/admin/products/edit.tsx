import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function AdminProductEdit() {
  useLoad(() => {
    console.log('Admin product edit page loaded')
  })

  return (
    <View style={{ padding: '20px' }}>
      <Text>编辑商品 - 待实现</Text>
    </View>
  )
}

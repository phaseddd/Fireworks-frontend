import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function AdminDashboard() {
  useLoad(() => {
    console.log('Admin dashboard page loaded')
  })

  return (
    <View style={{ padding: '20px' }}>
      <Text>管理后台 - 待实现</Text>
    </View>
  )
}

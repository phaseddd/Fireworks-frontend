import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import useAuth from '../../../hooks/useAuth'

export default function AdminProductList() {
  const { isAuthenticated, loading, requireAuth } = useAuth()

  useDidShow(() => {
    requireAuth()
  })

  if (loading) {
    return (
      <View style={{ padding: '20px' }}>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!isAuthenticated) {
    return <View />
  }

  return (
    <View style={{ padding: '20px' }}>
      <Text>商品管理列表 - 待实现</Text>
    </View>
  )
}

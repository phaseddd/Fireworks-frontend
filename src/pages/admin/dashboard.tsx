import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import useAuth from '../../hooks/useAuth'
import './dashboard.scss'

export default function AdminDashboard() {
  const { isAuthenticated, loading, requireAuth, logout } = useAuth()

  useDidShow(() => {
    requireAuth()
  })

  if (loading) {
    return (
      <View className='admin-dashboard'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!isAuthenticated) {
    return <View />
  }

  return (
    <View className='admin-dashboard'>
      <View className='top-bar'>
        <Button className='back-btn' onClick={() => Taro.navigateBack()}>
          ← 返回首页
        </Button>
      </View>

      <View className='header'>
        <Text className='title'>管理后台</Text>
        <Text className='subtitle'>选择功能开始操作</Text>
      </View>

      <View className='menu'>
        <Button className='menu-btn' type='primary' onClick={() => Taro.navigateTo({ url: '/pages/admin/products/list' })}>
          商品管理
        </Button>
        <Button className='menu-btn' type='primary' onClick={() => Taro.navigateTo({ url: '/pages/admin/categories/list/index' })}>
          分类管理
        </Button>
        <Button className='menu-btn' type='primary' onClick={() => Taro.navigateTo({ url: '/pages/admin/agents/list/index' })}>
          代理商管理
        </Button>
        <Button className='menu-btn' type='primary' onClick={() => Taro.navigateTo({ url: '/pages/admin/inquiries/list/index' })}>
          询价记录
        </Button>
      </View>

      <View className='footer'>
        <Button className='logout-btn' onClick={logout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}

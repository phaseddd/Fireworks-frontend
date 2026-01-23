import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Button, Input } from '@nutui/nutui-react-taro'
import useAuth from '../../../../hooks/useAuth'
import { api } from '../../../../services/api'
import './index.scss'

export default function AdminCategoryAdd() {
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 验证登录
  if (!authLoading && !isAuthenticated) {
    requireAuth()
    return <View />
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({
        title: '请输入分类名称',
        icon: 'none',
      })
      return
    }

    if (name.trim().length > 50) {
      Taro.showToast({
        title: '分类名称不能超过50个字符',
        icon: 'none',
      })
      return
    }

    setSubmitting(true)
    try {
      await api.categories.create({ name: name.trim() })
      Taro.showToast({
        title: '添加成功',
        icon: 'success',
      })
      // 返回列表页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '添加失败',
        icon: 'none',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 加载中状态
  if (authLoading) {
    return (
      <View className='admin-category-form'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='admin-category-form'>
      {/* 顶部标题栏 */}
      <View className='header'>
        <Button
          size='small'
          className='back-btn'
          onClick={() => Taro.navigateBack()}
        >
          ← 返回
        </Button>
        <Text className='title'>添加分类</Text>
      </View>

      {/* 表单区域 */}
      <View className='form-container'>
        <View className='form-item'>
          <Text className='form-label'>分类名称</Text>
          <Input
            className='form-input'
            placeholder='请输入分类名称'
            value={name}
            onChange={(val) => setName(val)}
            maxLength={50}
          />
        </View>

        <View className='form-tip'>
          <Text className='tip-text'>* 分类名称不能重复，最多50个字符</Text>
        </View>

        <Button
          type='primary'
          className='submit-btn'
          loading={submitting}
          disabled={submitting}
          onClick={handleSubmit}
        >
          确认添加
        </Button>
      </View>
    </View>
  )
}

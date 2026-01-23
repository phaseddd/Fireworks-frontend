import { View, Text } from '@tarojs/components'
import { useDidShow, useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Button, Input, Radio } from '@nutui/nutui-react-taro'
import useAuth from '../../../../hooks/useAuth'
import { api } from '../../../../services/api'
import type { Category, CategoryStatus } from '../../../../types'
import './index.scss'

export default function AdminCategoryEdit() {
  const router = useRouter()
  const categoryId = Number(router.params.id)
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  const [category, setCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<CategoryStatus>('ACTIVE')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 加载分类详情
  const loadCategory = async () => {
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setLoading(false)
      Taro.showToast({
        title: '参数错误',
        icon: 'none',
      })
      // 自动返回上一页，避免页面卡在空状态
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
      return
    }

    setLoading(true)
    try {
      const result = await api.categories.detail(categoryId)
      setCategory(result)
      setName(result.name)
      setStatus(result.status)
    } catch (error) {
      console.error('加载分类详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }

  // 页面显示时加载数据
  useDidShow(() => {
    if (requireAuth()) {
      loadCategory()
    }
  })

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
      await api.categories.update(categoryId, {
        name: name.trim(),
        status,
      })
      Taro.showToast({
        title: '保存成功',
        icon: 'success',
      })
      // 返回列表页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 加载中状态
  if (authLoading || loading) {
    return (
      <View className='admin-category-form'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  // 未登录状态
  if (!isAuthenticated) {
    return <View />
  }

  // 分类不存在
  if (!category) {
    return (
      <View className='admin-category-form'>
        <View className='error-container'>
          <Text className='error-text'>分类不存在</Text>
          <Button onClick={() => Taro.navigateBack()}>返回</Button>
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
        <Text className='title'>编辑分类</Text>
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

        <View className='form-item'>
          <Text className='form-label'>分类状态</Text>
          <Radio.Group
            value={status}
            onChange={(val) => setStatus(val as CategoryStatus)}
            direction='horizontal'
          >
            <Radio value='ACTIVE' className='status-radio'>启用</Radio>
            <Radio value='DISABLED' className='status-radio'>禁用</Radio>
          </Radio.Group>
        </View>

        <View className='form-tip'>
          <Text className='tip-text'>* 禁用的分类将不会在客户端显示</Text>
        </View>

        <Button
          type='primary'
          className='submit-btn'
          loading={submitting}
          disabled={submitting}
          onClick={handleSubmit}
        >
          保存修改
        </Button>
      </View>
    </View>
  )
}

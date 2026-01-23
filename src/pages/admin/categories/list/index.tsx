import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useCallback, useState } from 'react'
import { Button, Empty, Dialog, PullToRefresh, Tag } from '@nutui/nutui-react-taro'
import useAuth from '../../../../hooks/useAuth'
import { api } from '../../../../services/api'
import type { Category } from '../../../../types'
import './index.scss'

export default function AdminCategoryList() {
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  // 分类列表状态
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // 删除确认弹窗
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string>('')

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const result = await api.categories.list()
      setCategories(result)
    } catch (error) {
      console.error('加载分类列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // 页面显示时加载数据
  useDidShow(() => {
    if (requireAuth()) {
      loadCategories()
    }
  })

  // 下拉刷新
  const handleRefresh = async () => {
    await loadCategories()
  }

  // 跳转到添加分类页面
  const handleAddCategory = () => {
    Taro.navigateTo({ url: '/pages/admin/categories/add/index' })
  }

  // 跳转到编辑分类页面
  const handleEditCategory = (category: Category) => {
    Taro.navigateTo({ url: `/pages/admin/categories/edit/index?id=${category.id}` })
  }

  // 显示删除确认弹窗
  const handleDeleteClick = async (category: Category) => {
    setDeleteTarget(category)
    setDeleteError('')

    // 先检查是否有关联商品
    try {
      const count = await api.categories.productCount(category.id)
      if (count > 0) {
        setDeleteError(`该分类下有 ${count} 个商品，请先移除关联商品`)
      }
    } catch (error) {
      console.error('获取商品数量失败:', error)
    }

    setDeleteDialogVisible(true)
  }

  // 确认删除
  const handleDeleteConfirm = async () => {
    // 兜底：没有选中目标时直接关闭
    if (!deleteTarget) {
      setDeleteDialogVisible(false)
      return
    }

    // 有关联商品时，弹窗仅用于提示，点击“知道了”关闭
    if (deleteError) {
      setDeleteDialogVisible(false)
      setDeleteTarget(null)
      setDeleteError('')
      return
    }

    try {
      await api.categories.delete(deleteTarget.id)
      Taro.showToast({
        title: '删除成功',
        icon: 'success',
      })
      // 刷新列表
      loadCategories()
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '删除失败',
        icon: 'none',
      })
    } finally {
      setDeleteDialogVisible(false)
      setDeleteTarget(null)
      setDeleteError('')
    }
  }

  // 取消删除/关闭弹窗
  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false)
    setDeleteTarget(null)
    setDeleteError('')
  }

  // 加载中状态
  if (authLoading) {
    return (
      <View className='admin-category-list'>
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

  return (
    <View className='admin-category-list'>
      {/* 顶部标题栏 */}
      <View className='header'>
        <View className='header-left'>
          <Button
            size='small'
            className='back-btn'
            onClick={() => Taro.navigateBack()}
          >
            ← 返回
          </Button>
          <Text className='title'>分类管理</Text>
        </View>
        <Button
          type='primary'
          size='small'
          className='add-btn'
          onClick={handleAddCategory}
        >
          + 添加分类
        </Button>
      </View>

      {/* 分类列表 */}
      <PullToRefresh onRefresh={handleRefresh}>
        <View className='category-list'>
          {categories.length === 0 && !loading ? (
            <Empty description='暂无分类' />
          ) : (
            categories.map(category => (
              <View key={category.id} className='category-card'>
                {/* 分类信息 */}
                <View className='category-info'>
                  <Text className='category-name'>{category.name}</Text>
                  <Tag
                    type={category.status === 'ACTIVE' ? 'success' : 'warning'}
                    className='status-tag'
                  >
                    {category.status === 'ACTIVE' ? '启用' : '禁用'}
                  </Tag>
                </View>

                {/* 操作按钮 */}
                <View className='category-actions'>
                  <Button
                    size='small'
                    className='action-btn edit-btn'
                    onClick={() => handleEditCategory(category)}
                  >
                    编辑
                  </Button>
                  <Button
                    size='small'
                    className='action-btn delete-btn'
                    onClick={() => handleDeleteClick(category)}
                  >
                    删除
                  </Button>
                </View>
              </View>
            ))
          )}

          {/* 加载状态 */}
          {loading && (
            <View className='loading-more'>
              <Text className='loading-text'>加载中...</Text>
            </View>
          )}
        </View>
      </PullToRefresh>

      {/* 删除确认弹窗 */}
      <Dialog
        title='确认删除'
        visible={deleteDialogVisible}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText={deleteError ? '知道了' : '确认'}
        hideCancelButton={!!deleteError}
      >
        <View className='delete-dialog-content'>
          {deleteError ? (
            <Text className='delete-error'>{deleteError}</Text>
          ) : (
            <>
              <Text className='delete-warning'>确定要删除分类</Text>
              <Text className='delete-category-name'>"{deleteTarget?.name}"</Text>
              <Text className='delete-warning'>吗？</Text>
            </>
          )}
        </View>
      </Dialog>
    </View>
  )
}

import { View, Text, Image } from '@tarojs/components'
import { useDidShow, useReachBottom } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useCallback, useState } from 'react'
import { Button, Empty, Dialog, PullToRefresh } from '@nutui/nutui-react-taro'
import useAuth from '../../../hooks/useAuth'
import { api } from '../../../services/api'
import type { Product, ProductStatus } from '../../../types'
import './list.scss'

const PAGE_SIZE = 20

// 状态筛选选项
const STATUS_OPTIONS: Array<{ label: string; value: ProductStatus | '' }> = [
  { label: '全部', value: '' },
  { label: '上架', value: 'ON_SHELF' },
  { label: '下架', value: 'OFF_SHELF' },
]

// 分类中文映射
const CATEGORY_MAP: Record<string, string> = {
  GIFT: '礼花类',
  FIREWORK: '烟花类',
  FIRECRACKER: '鞭炮类',
  COMBO: '组合类',
  OTHER: '其他',
}

// 状态中文映射
const STATUS_MAP: Record<ProductStatus, string> = {
  ON_SHELF: '上架',
  OFF_SHELF: '下架',
}

export default function AdminProductList() {
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  // 商品列表状态
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ProductStatus | ''>('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // 删除确认弹窗
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  // 加载商品列表
  const loadProducts = useCallback(async (pageNum: number, status: ProductStatus | '', isRefresh = false) => {
    if (loading) return

    setLoading(true)
    try {
      const params: { page: number; size: number; status?: ProductStatus } = {
        page: pageNum,
        size: PAGE_SIZE,
      }
      if (status) {
        params.status = status
      }

      const result = await api.products.list(params)

      if (isRefresh || pageNum === 1) {
        setProducts(result.items)
      } else {
        setProducts(prev => [...prev, ...result.items])
      }

      setTotal(result.total)
      setHasMore(pageNum * PAGE_SIZE < result.total)
      setPage(pageNum)
    } catch (error) {
      console.error('加载商品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // 页面显示时加载数据
  useDidShow(() => {
    if (requireAuth()) {
      loadProducts(1, currentStatus, true)
    }
  })

  const handleReachBottom = useCallback(() => {
    if (authLoading || !isAuthenticated) return
    if (loading || !hasMore) return
    loadProducts(page + 1, currentStatus)
  }, [authLoading, currentStatus, hasMore, isAuthenticated, loadProducts, loading, page])

  // 触底加载更多
  useReachBottom(handleReachBottom)

  // 下拉刷新
  const handleRefresh = async () => {
    await loadProducts(1, currentStatus, true)
  }

  // 状态筛选切换
  const handleStatusChange = (status: ProductStatus | '') => {
    setCurrentStatus(status)
    setPage(1)
    loadProducts(1, status, true)
  }

  // 跳转到添加商品页面
  const handleAddProduct = () => {
    Taro.navigateTo({ url: '/pages/admin/products/add/index' })
  }

  // 跳转到编辑商品页面
  const handleEditProduct = (product: Product) => {
    Taro.navigateTo({ url: `/pages/admin/products/edit/index?id=${product.id}` })
  }

  // 显示删除确认弹窗
  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product)
    setDeleteDialogVisible(true)
  }

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      await api.products.delete(deleteTarget.id)
      Taro.showToast({
        title: '删除成功',
        icon: 'success',
      })
      // 刷新列表
      loadProducts(1, currentStatus, true)
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleteDialogVisible(false)
      setDeleteTarget(null)
    }
  }

  // 加载中状态
  if (authLoading) {
    return (
      <View className='admin-product-list'>
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
    <View className='admin-product-list'>
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
          <Text className='title'>商品管理</Text>
        </View>
        <Button
          type='primary'
          size='small'
          className='add-btn'
          onClick={handleAddProduct}
        >
          ➕ 添加商品
        </Button>
      </View>

      {/* 状态筛选栏 */}
      <View className='filter-bar'>
        {STATUS_OPTIONS.map(option => (
          <View
            key={option.value}
            className={`filter-item ${currentStatus === option.value ? 'active' : ''}`}
            onClick={() => handleStatusChange(option.value)}
          >
            <Text className='filter-text'>{option.label}</Text>
          </View>
        ))}
        <View className='total-count'>
          <Text className='count-text'>共 {total} 件</Text>
        </View>
      </View>

      {/* 商品列表 */}
      <PullToRefresh onRefresh={handleRefresh}>
        <View className='product-list'>
          {products.length === 0 && !loading ? (
            <Empty description='暂无商品' />
          ) : (
            products.map(product => (
              <View key={product.id} className='product-card'>
                {/* 商品图片 */}
                <View className='product-image-wrapper'>
                  {product.images && product.images.length > 0 ? (
                    <Image
                      className='product-image'
                      src={product.images[0]}
                      mode='aspectFill'
                    />
                  ) : (
                    <View className='product-image-placeholder'>
                      <Text className='placeholder-text'>暂无图片</Text>
                    </View>
                  )}
                  {/* 状态标签 */}
                  <View className={`status-tag ${product.status.toLowerCase()}`}>
                    <Text className='status-text'>{STATUS_MAP[product.status]}</Text>
                  </View>
                </View>

                {/* 商品信息 */}
                <View className='product-info'>
                  <Text className='product-name'>{product.name}</Text>
                  <View className='product-meta'>
                    <Text className='product-category'>{product.categoryName || CATEGORY_MAP[product.category] || product.category}</Text>
                    <Text className='product-stock'>库存: {product.stock}</Text>
                  </View>
                  <Text className='product-price'>¥{product.price}</Text>
                </View>

                {/* 操作按钮 */}
                <View className='product-actions'>
                  <Button
                    size='small'
                    className='action-btn edit-btn'
                    onClick={() => handleEditProduct(product)}
                  >
                    编辑
                  </Button>
                  <Button
                    size='small'
                    className='action-btn delete-btn'
                    onClick={() => handleDeleteClick(product)}
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

          {/* 没有更多数据 */}
          {!hasMore && products.length > 0 && (
            <View className='no-more'>
              <Text className='no-more-text'>没有更多了</Text>
            </View>
          )}
        </View>
      </PullToRefresh>

      {/* 删除确认弹窗 */}
      <Dialog
        title='确认删除'
        visible={deleteDialogVisible}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogVisible(false)}
      >
        <View className='delete-dialog-content'>
          <Text className='delete-warning'>确定要删除商品</Text>
          <Text className='delete-product-name'>"{deleteTarget?.name}"</Text>
          <Text className='delete-warning'>吗？</Text>
        </View>
      </Dialog>
    </View>
  )
}

import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { useState } from 'react'
import ProductCard from '@/components/customer/ProductCard'
import { api } from '@/services/api'
import type { Product } from '@/types'
import './index.scss'

/**
 * 商品列表页面 - TabBar 页面
 * Story 2.2: 商品列表页面
 */
const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageSize = 20

  // 加载商品列表
  const loadProducts = async (pageNum: number, refresh = false) => {
    if (loading) return

    setLoading(true)
    try {
      const res = await api.products.publicList({
        page: pageNum,
        size: pageSize,
        sort: 'updatedAt,desc'
      })

      if (refresh) {
        setProducts(res.items)
      } else {
        setProducts(prev => [...prev, ...res.items])
      }

      setPage(pageNum + 1)
      setHasMore(pageNum * pageSize < res.total)
    } catch (error) {
      console.error('加载商品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useDidShow(() => {
    if (products.length === 0) {
      loadProducts(1, true)
    }
  })

  // 下拉刷新 (AC4)
  usePullDownRefresh(async () => {
    await loadProducts(1, true)
    Taro.stopPullDownRefresh()
  })

  // 上拉加载更多 (AC4)
  useReachBottom(() => {
    if (hasMore && !loading) {
      loadProducts(page)
    }
  })

  return (
    <View className='products-page'>
      <View className='product-grid'>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </View>

      {loading && (
        <View className='loading-more'>
          <Text>加载中...</Text>
        </View>
      )}

      {!hasMore && products.length > 0 && (
        <View className='no-more'>
          <Text>没有更多商品了</Text>
        </View>
      )}

      {!loading && products.length === 0 && (
        <View className='empty-state'>
          <Text>暂无商品</Text>
        </View>
      )}
    </View>
  )
}

export default ProductList

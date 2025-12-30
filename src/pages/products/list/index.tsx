import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { useState, useRef } from 'react'
import ProductCard from '@/components/customer/ProductCard'
import CategoryTabs from '@/components/customer/CategoryTabs'
import PriceTabs, { type PriceRange } from '@/components/customer/PriceTabs'
import { api } from '@/services/api'
import type { Product } from '@/types'
import './index.scss'

/**
 * 商品列表页面 - TabBar 页面
 * Story 2.2: 商品列表页面
 * Story 2.4: 商品分类筛选功能（含价格区间筛选）
 */
const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')  // 分类筛选状态
  const [priceRange, setPriceRange] = useState<PriceRange>({ value: '' })  // 价格区间筛选状态
  const pageSize = 20

  type Filters = { category: string; minPrice?: number; maxPrice?: number }

  // 使用 ref 保存最新的筛选条件，避免闭包问题
  const filtersRef = useRef<Filters>({ category: '' })
  const loadingRef = useRef(false)
  const pendingRef = useRef<{ pageNum: number; refresh: boolean; filters: Filters } | null>(null)

  // 加载商品列表
  const loadProducts = async (
    pageNum: number,
    refresh = false,
    filters?: Filters
  ) => {
    if (loadingRef.current) {
      pendingRef.current = { pageNum, refresh, filters: filters || filtersRef.current }
      return
    }

    loadingRef.current = true
    setLoading(true)
    try {
      // 使用传入的 filters 或 ref 中的值
      const currentFilters = filters || filtersRef.current
      const params: { page: number; size: number; sort: string; category?: string; minPrice?: number; maxPrice?: number } = {
        page: pageNum,
        size: pageSize,
        sort: 'updatedAt,desc',
      }
      if (currentFilters.category) {
        params.category = currentFilters.category
      }
      if (Number.isFinite(currentFilters.minPrice)) {
        params.minPrice = currentFilters.minPrice
      }
      if (Number.isFinite(currentFilters.maxPrice)) {
        params.maxPrice = currentFilters.maxPrice
      }

      const res = await api.products.publicList(params)

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
      loadingRef.current = false
      setLoading(false)

      const pending = pendingRef.current
      if (pending) {
        pendingRef.current = null
        void loadProducts(pending.pageNum, pending.refresh, pending.filters)
      }
    }
  }

  // 分类变化处理
  const handleCategoryChange = (newCategory: string) => {
    if (newCategory === category) return
    setCategory(newCategory)
    filtersRef.current = { ...filtersRef.current, category: newCategory }
    setPage(1)
    if (!loadingRef.current) setProducts([])
    loadProducts(1, true, filtersRef.current)
  }

  // 价格区间变化处理
  const handlePriceChange = (range: PriceRange) => {
    if (range.value === priceRange.value) return
    setPriceRange(range)
    filtersRef.current = { ...filtersRef.current, minPrice: range.min, maxPrice: range.max }
    setPage(1)
    if (!loadingRef.current) setProducts([])
    loadProducts(1, true, filtersRef.current)
  }

  // 初始加载
  useDidShow(() => {
    if (products.length === 0) {
      loadProducts(1, true)
    }
  })

  // 下拉刷新 (AC4)
  usePullDownRefresh(async () => {
    await loadProducts(1, true, filtersRef.current)
    Taro.stopPullDownRefresh()
  })

  // 上拉加载更多 (AC4)
  useReachBottom(() => {
    if (hasMore && !loadingRef.current) {
      loadProducts(page)
    }
  })

  return (
    <View className='products-page'>
      <View className='filters-sticky'>
        {/* 分类筛选栏 */}
        <CategoryTabs value={category} onChange={handleCategoryChange} />
        {/* 价格区间筛选栏 */}
        <PriceTabs value={priceRange.value} onChange={handlePriceChange} />
      </View>

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

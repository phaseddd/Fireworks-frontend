import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import ProductCard from '@/components/customer/ProductCard'
import CategoryTabs from '@/components/customer/CategoryTabs'
import PriceTabs, { type PriceRange } from '@/components/customer/PriceTabs'
import SearchBar from '@/components/customer/SearchBar'
import EmptyResult from '@/components/customer/SearchBar/EmptyResult'
import SearchHistory from '@/components/customer/SearchBar/SearchHistory'
import HotKeywords from '@/components/customer/SearchBar/HotKeywords'
import PageHeader from '@/components/ui/PageHeader'
import { useDebounce } from '@/hooks/useDebounce'
import { useNavBarMetrics } from '@/hooks/useNavBarMetrics'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { api } from '@/services/api'
import type { Product } from '@/types'
import './index.scss'

/**
 * 商品列表页面 - TabBar 页面
 * Story 2.2: 商品列表页面
 * Story 2.4: 商品分类筛选功能（含价格区间筛选）
 * Story 2.5: 商品搜索功能
 * BF-1: 支持动态分类筛选（使用 categoryId）
 */
const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)  // 分类ID筛选状态
  const [priceRange, setPriceRange] = useState<PriceRange>({ value: '' })  // 价格区间筛选状态
  const [keyword, setKeyword] = useState('')  // 搜索关键词状态
  const [showSearchPanel, setShowSearchPanel] = useState(false)  // 是否显示搜索面板
  const [hotKeywords, setHotKeywords] = useState<string[]>([])  // 热门搜索关键词
  const debouncedKeyword = useDebounce(keyword, 300)  // 防抖处理
  const { history, addHistory, clearHistory } = useSearchHistory()  // 搜索历史
  const pageSize = 20

  type Filters = { categoryId: number | null; minPrice?: number; maxPrice?: number; keyword?: string }

  // 使用 ref 保存最新的筛选条件，避免闭包问题
  const filtersRef = useRef<Filters>({ categoryId: null })
  const loadingRef = useRef(false)
  const pendingRef = useRef<{ pageNum: number; refresh: boolean; filters: Filters } | null>(null)
  const initialLoadDone = useRef(false)

  const { totalHeight: headerHeight } = useNavBarMetrics()

  // 加载热门搜索关键词
  useEffect(() => {
    api.products.hotKeywords()
      .then(keywords => setHotKeywords(keywords))
      .catch(err => console.error('加载热门搜索失败:', err))
  }, [])

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
      const params: { page: number; size: number; sort: string; categoryId?: number; minPrice?: number; maxPrice?: number; keyword?: string } = {
        page: pageNum,
        size: pageSize,
        sort: 'updatedAt,desc',
      }
      if (currentFilters.categoryId !== null) {
        params.categoryId = currentFilters.categoryId
      }
      if (Number.isFinite(currentFilters.minPrice)) {
        params.minPrice = currentFilters.minPrice
      }
      if (Number.isFinite(currentFilters.maxPrice)) {
        params.maxPrice = currentFilters.maxPrice
      }
      if (currentFilters.keyword) {
        params.keyword = currentFilters.keyword
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

  // 监听防抖后的关键词变化
  useEffect(() => {
    if (!initialLoadDone.current) return  // 跳过初始加载
    filtersRef.current = { ...filtersRef.current, keyword: debouncedKeyword || undefined }
    setPage(1)
    if (!loadingRef.current) setProducts([])
    loadProducts(1, true, filtersRef.current)

    // 添加到搜索历史（仅当有实际搜索时）
    if (debouncedKeyword) {
      addHistory(debouncedKeyword)
      setShowSearchPanel(false)  // 搜索时关闭面板
    }
  }, [debouncedKeyword, addHistory])

  // 分类变化处理
  const handleCategoryChange = (newCategoryId: number | null) => {
    if (newCategoryId === categoryId) return
    setCategoryId(newCategoryId)
    filtersRef.current = { ...filtersRef.current, categoryId: newCategoryId }
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

  // 清除搜索关键词
  const handleClearKeyword = () => {
    setKeyword('')
  }

  // 选择搜索历史/热门关键词
  const handleSelectKeyword = (selectedKeyword: string) => {
    setKeyword(selectedKeyword)
    setShowSearchPanel(false)
  }

  // 搜索框获取焦点
  const handleSearchFocus = () => {
    setShowSearchPanel(true)
  }

  // 关闭搜索面板
  const handleCloseSearchPanel = () => {
    setShowSearchPanel(false)
  }

  // 初始加载
  useDidShow(() => {
    if (products.length === 0) {
      loadProducts(1, true)
      initialLoadDone.current = true
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

  // 是否显示搜索无结果
  const showEmptyResult = !loading && products.length === 0 && keyword && !showSearchPanel
  // 是否显示搜索面板（历史+热门）- 只要 showSearchPanel 为 true 就显示
  const showPanel = showSearchPanel

  return (
    <View className='products-page' style={{ paddingTop: `${headerHeight}px` }}>
      <PageHeader title="商品列表" showBack={false} />

      {/* 搜索栏 - Story 2.5 */}
      <View className='search-full'>
        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onFocus={handleSearchFocus}
        />
      </View>

      {showPanel ? (
        // 搜索面板：显示历史和热门
        <>
          <View className='search-panel' style={{ top: `${headerHeight + 50}px` }}>
            <HotKeywords keywords={hotKeywords} onSelect={handleSelectKeyword} />
            <SearchHistory
              history={history}
              onSelect={handleSelectKeyword}
              onClear={clearHistory}
            />
          </View>
          {/* 遮罩层：点击关闭搜索面板 */}
          <View className='search-overlay' onClick={handleCloseSearchPanel} style={{ top: `${headerHeight}px` }} />
        </>
      ) : (
        <>
           <View className='filters-sticky' style={{ top: `${headerHeight}px` }}>
             <View className='filters-inner'>
               {/* 分类筛选栏 */}
               <CategoryTabs value={categoryId} onChange={handleCategoryChange} />
               {/* 价格区间筛选栏 */}
               <PriceTabs value={priceRange.value} onChange={handlePriceChange} />
             </View>
           </View>

          {showEmptyResult ? (
            <EmptyResult keyword={keyword} onClear={handleClearKeyword} />
          ) : (
            <View className='product-grid'>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}

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

          {!loading && products.length === 0 && !keyword && (
            <View className='empty-state'>
              <Text>暂无商品</Text>
            </View>
          )}
        </>
      )}
    </View>
  )
}

export default ProductList

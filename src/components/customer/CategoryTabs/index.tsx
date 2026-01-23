import { View, Text } from '@tarojs/components'
import { ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import type { Category } from '@/types'
import './index.scss'

interface CategoryTabsProps {
  /** 当前选中的分类ID，null 或 undefined 表示"全部" */
  value: number | null
  /** 分类变化回调 */
  onChange: (categoryId: number | null) => void
}

/**
 * 分类筛选栏组件
 * - 从 API 动态加载启用的分类
 * - 横向滚动显示所有分类选项
 * - 点击分类触发 onChange 回调
 * - 当前选中项有高亮样式
 */
const CategoryTabs: React.FC<CategoryTabsProps> = ({ value, onChange }) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // 加载启用的分类列表
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true)
      try {
        // 使用 activeList 获取启用的分类
        const result = await api.categories.activeList()
        setCategories(result)
      } catch (error) {
        console.error('加载分类失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [])

  if (loading) {
    return (
      <ScrollView className='category-tabs' scrollX>
        <View className='category-tabs-inner'>
          <View className='tab-item active'>全部</View>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView className='category-tabs' scrollX>
      <View className='category-tabs-inner'>
        {/* "全部" 选项 */}
        <View
          className={`tab-item ${value === null ? 'active' : ''}`}
          onClick={() => onChange(null)}
        >
          全部
        </View>
        {/* 动态分类选项 */}
        {categories.map((category) => (
          <View
            key={category.id}
            className={`tab-item ${value === category.id ? 'active' : ''}`}
            onClick={() => onChange(category.id)}
          >
            {category.name}
          </View>
        ))}
      </View>
    </ScrollView>
    )
}

export default CategoryTabs

import Taro from '@tarojs/taro'
import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'SEARCH_HISTORY'
const MAX_HISTORY = 10

/**
 * 搜索历史 Hook
 * Story 2.5: 商品搜索功能
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  // 初始化加载历史记录
  useEffect(() => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.error('加载搜索历史失败:', e)
    }
  }, [])

  // 添加搜索记录
  const addHistory = useCallback((keyword: string) => {
    if (!keyword.trim()) return

    setHistory(prev => {
      // 去重并放到最前面
      const filtered = prev.filter(item => item !== keyword)
      const newHistory = [keyword, ...filtered].slice(0, MAX_HISTORY)
      try {
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(newHistory))
      } catch (e) {
        console.error('保存搜索历史失败:', e)
      }
      return newHistory
    })
  }, [])

  // 删除单条记录
  const removeHistory = useCallback((keyword: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== keyword)
      try {
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(newHistory))
      } catch (e) {
        console.error('删除搜索历史失败:', e)
      }
      return newHistory
    })
  }, [])

  // 清空所有记录
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      Taro.removeStorageSync(STORAGE_KEY)
    } catch (e) {
      console.error('清空搜索历史失败:', e)
    }
  }, [])

  return { history, addHistory, removeHistory, clearHistory }
}

export default useSearchHistory

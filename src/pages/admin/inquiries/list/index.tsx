import { View, Text, Picker } from '@tarojs/components'
import Taro, { useDidShow, useReachBottom } from '@tarojs/taro'
import { useCallback, useMemo, useState } from 'react'
import { Button, Empty, PullToRefresh } from '@nutui/nutui-react-taro'
import useAuth from '@/hooks/useAuth'
import { api } from '@/services/api'
import type { Agent, InquiryListItem } from '@/types'
import './index.scss'

const PAGE_SIZE = 20

export default function AdminInquiryList() {
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  const [agents, setAgents] = useState<Agent[]>([])
  const [agentCode, setAgentCode] = useState<string>('')

  const [items, setItems] = useState<InquiryListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const loadAgents = useCallback(async () => {
    const res = await api.agents.list({ page: 1, size: 200 })
    setAgents(res.items)
  }, [])

  const loadInquiries = useCallback(async (pageNum: number, refresh = false, code?: string) => {
    if (loading) return
    setLoading(true)
    try {
      // 仅在有实际值时才传 agentCode，避免传递 undefined 被序列化成字符串 "undefined"
      const params: { page: number; size: number; agentCode?: string } = { page: pageNum, size: PAGE_SIZE }
      if (code) {
        params.agentCode = code
      }
      const res = await api.inquiries.list(params)
      setTotal(res.total)
      setHasMore(pageNum * PAGE_SIZE < res.total)
      setPage(pageNum)
      if (refresh || pageNum === 1) {
        setItems(res.items)
      } else {
        setItems((prev) => [...prev, ...res.items])
      }
    } finally {
      setLoading(false)
    }
  }, [loading])

  useDidShow(() => {
    if (!requireAuth()) return
    loadAgents()
    loadInquiries(1, true, agentCode)
  })

  useReachBottom(() => {
    if (authLoading || !isAuthenticated) return
    if (loading || !hasMore) return
    loadInquiries(page + 1, false, agentCode)
  })

  const handleRefresh = async () => {
    await loadInquiries(1, true, agentCode)
  }

  const pickerRange = useMemo(() => ['全部', ...agents.map((a) => `${a.code} ${a.name}`)], [agents])

  const handlePickerChange = (e: any) => {
    const idx = Number(e.detail.value)
    if (idx === 0) {
      setAgentCode('')
      loadInquiries(1, true, '')
      return
    }
    const picked = agents[idx - 1]
    if (!picked) return
    setAgentCode(picked.code)
    loadInquiries(1, true, picked.code)
  }

  const totalText = useMemo(() => `共 ${total} 条`, [total])

  if (authLoading) {
    return (
      <View className='admin-inquiries'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }
  if (!isAuthenticated) return <View />

  return (
    <View className='admin-inquiries'>
      <View className='header'>
        <View className='header-left'>
          <Button size='small' className='back-btn' onClick={() => Taro.navigateBack()}>
            ← 返回
          </Button>
          <Text className='title'>询价记录</Text>
        </View>
      </View>

      <View className='filter'>
        <Picker mode='selector' range={pickerRange} onChange={handlePickerChange}>
          <View className='filter-picker'>
            <Text className='filter-text'>代理商筛选：{agentCode || '全部'}</Text>
            <Text className='arrow'>▼</Text>
          </View>
        </Picker>
        <Text className='total'>{totalText}</Text>
      </View>

      <PullToRefresh onRefresh={handleRefresh}>
        <View className='list'>
          {items.length === 0 && !loading ? (
            <Empty description='暂无询价' />
          ) : (
            items.map((i) => (
              <View
                key={i.id}
                className='card'
                onClick={() => Taro.navigateTo({ url: `/pages/admin/inquiries/detail/index?id=${i.id}` })}
              >
                <View className='row'>
                  <Text className='time'>{String(i.createdAt)}</Text>
                  {i.agentName && <Text className='agent'>来源：{i.agentName}</Text>}
                </View>
                <View className='row'>
                  <View className='contact'>
                    <Text className='phone'>{i.phone}</Text>
                    {i.wechat && <Text className='wechat'>补充说明：{i.wechat}</Text>}
                  </View>
                  <View className='count'>
                    <Text className='count-num'>{i.productCount}</Text>
                    <Text className='count-label'>件商品</Text>
                  </View>
                </View>
                <View className='footer'>
                  <Text className='link'>查看详情 &gt;</Text>
                </View>
              </View>
            ))
          )}
          {loading && (
            <View className='loading-more'>
              <Text>加载中...</Text>
            </View>
          )}
          {!hasMore && items.length > 0 && (
            <View className='no-more'>
              <Text>没有更多了</Text>
            </View>
          )}
        </View>
      </PullToRefresh>
    </View>
  )
}


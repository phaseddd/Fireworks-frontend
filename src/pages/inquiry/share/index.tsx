import { View, Text, Button as TaroButton } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro'
import { useMemo } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import PageHeader from '@/components/ui/PageHeader'
import { useNavBarMetrics } from '@/hooks/useNavBarMetrics'
import './index.scss'

type Snapshot = {
  shareCode: string
  phone: string
  wechat?: string
  items: Array<{ name: string; quantity: number }>
}

function buildSummary(snapshot: Snapshot) {
  const lines: string[] = []
  lines.push('烟花询价单')
  lines.push('')
  lines.push('商品清单：')
  snapshot.items.forEach((i) => {
    lines.push(`- ${i.name} x${i.quantity}`)
  })
  lines.push('')
  lines.push(`联系方式：${snapshot.phone}${snapshot.wechat ? `（微信：${snapshot.wechat}）` : ''}`)
  return lines.join('\n')
}

export default function InquiryShare() {
  const router = useRouter()
  const shareCode = String(router.params?.shareCode || '')
  
  const { totalHeight: headerHeight } = useNavBarMetrics()

  useShareAppMessage(() => ({
    title: '我的烟花询价单',
    path: `/pages/inquiry/detail/index?shareCode=${shareCode}`,
  }))

  const snapshot = useMemo(() => {
    const raw = Taro.getStorageSync('lastInquirySnapshot')
    if (!raw) return null
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data?.shareCode || data.shareCode !== shareCode) return null
    return data as Snapshot
  }, [shareCode])

  const handleCopy = () => {
    if (!snapshot) {
      Taro.showToast({ title: '暂无可复制摘要', icon: 'none' })
      return
    }
    const summary = buildSummary(snapshot)
    Taro.setClipboardData({
      data: summary,
      success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
    })
  }

  const handleViewDetail = () => {
    Taro.navigateTo({ url: `/pages/inquiry/detail/index?shareCode=${shareCode}` })
  }

  return (
    <View className='inquiry-share' style={{ paddingTop: `${headerHeight + 24}px` }}>
      <PageHeader title="询价单已生成" transparent={false} />
      
      <GlassCard className='card'>
        <Text className='title'>询价单已生成</Text>
        <Text className='desc'>你可以分享给店主，或复制摘要粘贴发送</Text>

        <View className='actions'>
          {/* TaroButton is needed for openType='share', style it manually to match GlassButton or wrap it */}
          <TaroButton className='share-btn glass-button-style' openType='share'>
            分享给店主
          </TaroButton>

          <GlassButton className='copy-btn' onClick={handleCopy}>
            复制询价摘要
          </GlassButton>

          <GlassButton className='detail-btn' onClick={handleViewDetail} variant='ghost'>
            查看分享页
          </GlassButton>
        </View>

        <View className='meta'>
          <Text className='meta-text'>shareCode：{shareCode}</Text>
        </View>
      </GlassCard>
    </View>
  )
}


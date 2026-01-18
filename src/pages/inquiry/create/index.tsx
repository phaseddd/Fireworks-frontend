import { View, Text, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState, useEffect } from 'react'
import useWishlist from '@/hooks/useWishlist'
import useAgentCode from '@/hooks/useAgentCode'
import { api } from '@/services/api'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import PageHeader from '@/components/ui/PageHeader'
import './index.scss'

const phonePattern = /^1\d{10}$/

export default function InquiryCreate() {
  const { items, total } = useWishlist()
  const { getAgentCode } = useAgentCode()

  const [phone, setPhone] = useState('')
  const [wechat, setWechat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Header height logic
  const [headerHeight, setHeaderHeight] = useState(0)
  useEffect(() => {
    const info = Taro.getSystemInfoSync()
    const sbHeight = info.statusBarHeight || 20
    setHeaderHeight(sbHeight + 44)
  }, [])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  const handleSubmit = async () => {
    if (items.length === 0) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }

    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!phonePattern.test(trimmedPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const agentCode = getAgentCode()
      const result = await api.inquiries.create({
        agentCode,
        phone: trimmedPhone,
        wechat: wechat.trim() || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })

      // 缓存本次询价快照（用于生成成功页复制摘要）
      Taro.setStorageSync('lastInquirySnapshot', {
        shareCode: result.shareCode,
        phone: trimmedPhone,
        wechat: wechat.trim() || '',
        items,
        createdAt: Date.now(),
      })

      Taro.redirectTo({ url: `/pages/inquiry/share/index?shareCode=${result.shareCode}` })
    } catch (e) {
      // toast 已在 api.ts 处理
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='inquiry-create' style={{ paddingTop: `${headerHeight + 16}px` }}>
      <PageHeader title="生成询价单" />
      
      <GlassCard className='section'>
        <View className='section-header'>
          <Text className='section-title'>已选商品</Text>
          <Text className='section-subtitle'>{itemCount} 件</Text>
        </View>
        {items.length === 0 ? (
          <View className='empty'>
            <Text className='empty-text'>意向清单为空</Text>
            <GlassButton variant='primary' onClick={() => Taro.switchTab({ url: '/pages/wishlist/index' })}>
              返回意向清单
            </GlassButton>
          </View>
        ) : (
          <View className='items'>
            {items.map((i) => (
              <View key={i.productId} className='item'>
                <Image className='item-image' src={i.image} mode='aspectFill' />
                <View className='item-info'>
                  <Text className='item-name'>{i.name}</Text>
                  <Text className='item-meta'>数量 x{i.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View className='total'>
          <Text className='total-label'>预估总价</Text>
          <Text className='total-value'>¥{total.toFixed(2)}</Text>
        </View>
      </GlassCard>

      <GlassCard className='section'>
        <View className='section-header'>
          <Text className='section-title'>联系方式</Text>
          <Text className='section-subtitle'>用于店主联系你</Text>
        </View>

        <View className='form'>
          <View className='form-item'>
            <Text className='label'>手机号 *</Text>
            <Input
              className='input'
              type='number'
              placeholder='请输入手机号'
              placeholderClass='input-placeholder'
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
          <View className='form-item'>
            <Text className='label'>微信号（可选）</Text>
            <Input
              className='input'
              type='text'
              placeholder='请输入微信号'
              placeholderClass='input-placeholder'
              value={wechat}
              onInput={(e) => setWechat(e.detail.value)}
            />
          </View>
        </View>
      </GlassCard>

      <View className='bottom-bar'>
        <GlassButton
          variant='primary'
          className='submit-btn'
          onClick={handleSubmit}
        >
          {submitting ? '生成中...' : '生成询价单'}
        </GlassButton>
      </View>
    </View>
  )
}


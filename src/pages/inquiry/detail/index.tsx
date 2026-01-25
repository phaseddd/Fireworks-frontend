import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@nutui/nutui-react-taro'
import { api } from '@/services/api'
import type { InquiryShareDetail } from '@/types'
import './index.scss'

export default function InquiryDetail() {
  const router = useRouter()
  const shareCode = String(router.params?.shareCode || '')

  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)
  const [data, setData] = useState<InquiryShareDetail | null>(null)

  useEffect(() => {
    if (!shareCode) {
      setLoading(false)
      setForbidden(true)
      return
    }

    setLoading(true)
    setForbidden(false)
    setNeedLogin(false)

    api.inquiries
      .shareDetail(shareCode)
      .then((res) => {
        setData(res)
      })
      .catch((e: any) => {
        if (e?.code === 401) {
          setNeedLogin(true)
          return
        }
        setForbidden(true)
      })
      .finally(() => setLoading(false))
  }, [shareCode])

  const createdAtText = useMemo(() => {
    const raw = data?.createdAt
    return raw ? String(raw) : ''
  }, [data?.createdAt])

  const handleGoLogin = () => {
    Taro.setStorageSync('postLoginRedirect', `/pages/inquiry/detail/index?shareCode=${shareCode}`)
    Taro.navigateTo({ url: '/pages/admin/login' })
  }

  if (loading) {
    return (
      <View className='inquiry-detail'>
        <View className='state'>
          <Text className='state-title'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (needLogin) {
    return (
      <View className='inquiry-detail'>
        <View className='state'>
          <Text className='state-title'>需要登录后查看</Text>
          <Text className='state-desc'>店主查看询价单必须处于管理端登录态</Text>
          <Button type='primary' className='state-btn' onClick={handleGoLogin}>
            去登录管理端
          </Button>
        </View>
      </View>
    )
  }

  if (forbidden || !data) {
    return (
      <View className='inquiry-detail'>
        <View className='state'>
          <Text className='state-title'>无权限查看该询价单</Text>
          <Text className='state-desc'>如你是店主，请先登录管理端；如你是客户，可在“我的/意向清单”查看</Text>
          <Button type='primary' className='state-btn' onClick={handleGoLogin}>
            去登录管理端
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='inquiry-detail'>
      <View className='card'>
        <View className='header'>
          <Text className='title'>询价单</Text>
          <Text className='time'>{createdAtText}</Text>
        </View>

        <View className='section'>
          <Text className='section-title'>商品清单</Text>
          <View className='items'>
            {data.items.map((i) => (
              <View key={i.productId} className='item'>
                <Text className='name'>{i.productName || `商品#${i.productId}`}</Text>
                <Text className='qty'>x{i.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='section'>
          <Text className='section-title'>联系方式（脱敏）</Text>
          <Text className='contact'>{data.phoneMasked}</Text>
          {data.wechatMasked && <Text className='contact'>备用联系：{data.wechatMasked}</Text>}
          <Text className='hint'>完整联系方式请在管理端查看</Text>
        </View>
      </View>
    </View>
  )
}


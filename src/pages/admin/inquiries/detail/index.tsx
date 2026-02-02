import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Button, Empty } from '@nutui/nutui-react-taro'
import useAuth from '@/hooks/useAuth'
import { api } from '@/services/api'
import type { Inquiry } from '@/types'
import './index.scss'

export default function AdminInquiryDetail() {
  const { requireAuth } = useAuth()
  const router = useRouter()
  const id = Number(router.params?.id)

  const [data, setData] = useState<Inquiry | null>(null)

  useEffect(() => {
    if (!requireAuth()) return
    if (!Number.isFinite(id)) return
    api.inquiries.detail(id).then(setData)
  }, [id, requireAuth])

  if (!data) {
    return (
      <View className='admin-inquiry-detail'>
        <View className='header'>
          <Button
            size='small'
            className='back-btn'
            onClick={() => Taro.redirectTo({ url: '/pages/admin/inquiries/list/index' })}
          >
            ← 返回
          </Button>
          <Text className='title'>询价详情</Text>
        </View>
        <Empty description='加载中...' />
      </View>
    )
  }

  return (
    <View className='admin-inquiry-detail'>
      <View className='header'>
        <Button
          size='small'
          className='back-btn'
          onClick={() => Taro.redirectTo({ url: '/pages/admin/inquiries/list/index' })}
        >
          ← 返回
        </Button>
        <Text className='title'>询价详情</Text>
      </View>

      <View className='card'>
        <Text className='title'>客户信息</Text>
        <Text className='line'>回访沟通：{data.phone}</Text>
        {data.wechat && <Text className='line'>补充说明：{data.wechat}</Text>}
        {data.agentName && <Text className='line'>来源代理商：{data.agentName}</Text>}
        <Text className='line'>时间：{String(data.createdAt)}</Text>
      </View>

      <View className='card'>
        <Text className='title'>商品清单</Text>
        {data.items?.length ? (
          <View className='items'>
            {data.items.map((i) => (
              <View key={i.productId} className='item'>
                {i.image ? (
                  <Image className='img' src={i.image} mode='aspectFill' />
                ) : (
                  <View className='img placeholder'>
                    <Text>无图</Text>
                  </View>
                )}
                <View className='info'>
                  <Text className='name'>{i.productName || `商品#${i.productId}`}</Text>
                  <Text className='meta'>数量 x{i.quantity}</Text>
                </View>
                {Number.isFinite(i.price) && <Text className='price'>¥{Number(i.price).toFixed(2)}</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Empty description='暂无商品' />
        )}
      </View>
    </View>
  )
}


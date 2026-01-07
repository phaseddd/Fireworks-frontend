import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@nutui/nutui-react-taro'
import useAuth from '@/hooks/useAuth'
import { api } from '@/services/api'
import './index.scss'

export default function AdminAgentAdd() {
  const { requireAuth } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!requireAuth()) return
    if (!name.trim()) {
      Taro.showToast({ title: '请输入代理商名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await api.agents.create({ name: name.trim(), phone: phone.trim() || undefined })
      Taro.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='admin-agent-form'>
      <View className='card'>
        <View className='form-item'>
          <Text className='label'>名称 *</Text>
          <Input className='input' value={name} onInput={(e) => setName(e.detail.value)} placeholder='请输入代理商名称' />
        </View>
        <View className='form-item'>
          <Text className='label'>手机号（可选）</Text>
          <Input className='input' value={phone} onInput={(e) => setPhone(e.detail.value)} placeholder='请输入手机号' type='number' />
        </View>

        <Button type='primary' className='submit-btn' loading={loading} disabled={loading} onClick={handleSubmit}>
          {loading ? '保存中...' : '保存'}
        </Button>
      </View>
    </View>
  )
}


import { View, Text, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Button } from '@nutui/nutui-react-taro'
import useAuth from '@/hooks/useAuth'
import { api } from '@/services/api'
import type { AgentStatus } from '@/types'
import './index.scss'

export default function AdminAgentEdit() {
  const { requireAuth } = useAuth()
  const router = useRouter()
  const code = String(router.params?.code || '')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<AgentStatus>('ACTIVE')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!requireAuth()) return
    if (!code) return
    api.agents.detail(code).then((a) => {
      setName(a.name || '')
      setPhone(a.phone || '')
      setStatus(a.status)
    })
  }, [code, requireAuth])

  const handleSubmit = async () => {
    if (!requireAuth()) return
    if (!code) return
    if (!name.trim()) {
      Taro.showToast({ title: '请输入代理商名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await api.agents.update(code, { name: name.trim(), phone: phone.trim() || undefined, status })
      Taro.showToast({ title: '更新成功', icon: 'success' })
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
          <Text className='label'>联络备注（可选）</Text>
          <Input className='input' value={phone} onInput={(e) => setPhone(e.detail.value)} placeholder='请输入联络备注' />
        </View>
        <View className='form-item'>
          <Text className='label'>状态</Text>
          <View className='status-row'>
            <Button size='small' className={`status-btn ${status === 'ACTIVE' ? 'active' : ''}`} onClick={() => setStatus('ACTIVE')}>
              启用
            </Button>
            <Button size='small' className={`status-btn ${status === 'DISABLED' ? 'active' : ''}`} onClick={() => setStatus('DISABLED')}>
              禁用
            </Button>
          </View>
        </View>

        <Button type='primary' className='submit-btn' loading={loading} disabled={loading} onClick={handleSubmit}>
          {loading ? '保存中...' : '保存'}
        </Button>
      </View>
    </View>
  )
}


import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@nutui/nutui-react-taro'
import { api } from '@/services/api'
import './index.scss'

export default function AgentBind() {
  const [bindCode, setBindCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ agentCode: string; agentName: string } | null>(null)

  const handleSubmit = async () => {
    const code = bindCode.trim()
    if (!code) {
      Taro.showToast({ title: '请输入绑定码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await api.agents.bind({ bindCode: code })
      setResult(res)
      Taro.showToast({ title: '绑定成功', icon: 'success' })
    } catch (e) {
      // toast 已在 api.ts 处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='agent-bind'>
      <View className='card'>
        <Text className='title'>代理商绑定</Text>
        <Text className='desc'>请输入管理员提供的绑定码完成身份绑定</Text>

        {result ? (
          <View className='success'>
            <Text className='success-title'>已绑定</Text>
            <Text className='success-desc'>
              {result.agentName}（{result.agentCode}）
            </Text>
          </View>
        ) : (
          <>
            <View className='form'>
              <Text className='label'>绑定码</Text>
              <Input
                className='input'
                type='text'
                placeholder='例如：FW-AGENT-7H3K9Q'
                value={bindCode}
                onInput={(e) => setBindCode(e.detail.value)}
              />
            </View>

            <Button
              type='primary'
              className='btn'
              loading={loading}
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? '绑定中...' : '确认绑定'}
            </Button>
          </>
        )}
      </View>
    </View>
  )
}


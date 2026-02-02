import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Button, Dialog } from '@nutui/nutui-react-taro'
import useAuth from '@/hooks/useAuth'
import { api } from '@/services/api'
import type { Agent, AgentStats } from '@/types'
import './index.scss'

export default function AdminAgentDetail() {
  const { requireAuth } = useAuth()
  const router = useRouter()
  const code = String(router.params?.code || '')

  const [agent, setAgent] = useState<Agent | null>(null)
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week')
  const [bindDialogVisible, setBindDialogVisible] = useState(false)
  const [bindCode, setBindCode] = useState<{ code: string; qrcodeUrl?: string; expiresAt: string } | null>(null)
  const [qrcodeDialogVisible, setQrcodeDialogVisible] = useState(false)

  const loadAgent = async () => {
    if (!requireAuth()) return
    if (!code) return
    const a = await api.agents.detail(code)
    setAgent(a)
  }

  const loadStats = async () => {
    if (!requireAuth()) return
    if (!code) return
    const s = await api.agents.stats(code, range)
    setStats(s)
  }

  useDidShow(() => {
    loadAgent()
  })

  useEffect(() => {
    loadStats()
  }, [code, range])

  const handleGenerateBindCode = async () => {
    if (!agent) return
    const res = await api.agents.generateBindCode(agent.code)
    setBindCode({ code: res.bindCode, qrcodeUrl: res.bindQrcodeUrl, expiresAt: res.expiresAt })
    setBindDialogVisible(true)
  }

  const handleCopyBindCode = () => {
    if (!bindCode?.code) return
    Taro.setClipboardData({
      data: bindCode.code,
      success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
    })
  }

  const handleUnbind = async () => {
    if (!agent) return
    await api.agents.unbind(agent.code)
    await loadAgent()
  }

  const handleToggleStatus = async () => {
    if (!agent) return
    const next = agent.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    await api.agents.update(agent.code, { status: next })
    await loadAgent()
  }

  const handleGenerateQr = async () => {
    if (!agent) return
    if (!agent.qrcodeUrl) {
      await api.agents.generateQrcode(agent.code)
      await loadAgent()
    }
    setQrcodeDialogVisible(true)
  }

  const saveImageToAlbum = async (url: string) => {
    try {
      const res = await Taro.downloadFile({ url })
      await Taro.saveImageToPhotosAlbum({ filePath: (res as any).tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handleSaveQr = async () => {
    if (!agent?.qrcodeUrl) return
    await saveImageToAlbum(agent.qrcodeUrl)
  }

  const handleSaveBindQr = async () => {
    if (!bindCode?.qrcodeUrl) return
    await saveImageToAlbum(bindCode.qrcodeUrl)
  }

  if (!agent) {
    return (
      <View className='admin-agent-detail'>
        <View className='header'>
          <Button size='small' className='back-btn' onClick={() => Taro.redirectTo({ url: '/pages/admin/agents/list/index' })}>
            ← 返回
          </Button>
          <Text className='title'>代理商详情</Text>
        </View>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='admin-agent-detail'>
      <View className='header'>
        <Button size='small' className='back-btn' onClick={() => Taro.redirectTo({ url: '/pages/admin/agents/list/index' })}>
          ← 返回
        </Button>
        <Text className='title'>代理商详情</Text>
      </View>
      <View className='card'>
        <Text className='code'>{agent.code}</Text>
        <Text className='name'>{agent.name}</Text>
        <Text className='phone'>{agent.phone || '-'}</Text>
        <Text className='bind'>{agent.openidBound ? '已绑定' : '未绑定'}</Text>

        <View className='row'>
          <Button size='small' className='btn' onClick={() => Taro.redirectTo({ url: `/pages/admin/agents/edit/index?code=${encodeURIComponent(agent.code)}` })}>
            编辑
          </Button>
          <Button size='small' className='btn' onClick={handleToggleStatus}>
            {agent.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
          <Button size='small' className='btn' onClick={handleGenerateQr}>
            {agent.qrcodeUrl ? '查看码' : '生成码'}
          </Button>
        </View>

        <View className='row'>
          {!agent.openidBound ? (
            <Button size='small' className='btn primary' onClick={handleGenerateBindCode}>
              生成绑定码
            </Button>
          ) : (
            <Button size='small' className='btn danger' onClick={handleUnbind}>
              解绑
            </Button>
          )}
        </View>
      </View>

      <View className='card'>
        <Text className='section-title'>业绩统计</Text>
        <View className='range'>
          <View className={`range-item ${range === 'week' ? 'active' : ''}`} onClick={() => setRange('week')}>本周</View>
          <View className={`range-item ${range === 'month' ? 'active' : ''}`} onClick={() => setRange('month')}>本月</View>
          <View className={`range-item ${range === 'all' ? 'active' : ''}`} onClick={() => setRange('all')}>全部</View>
        </View>

        <View className='stats'>
          <View className='stat'>
            <Text className='value'>{stats?.customerCount || 0}</Text>
            <Text className='label'>引流客户数</Text>
          </View>
          <View className='stat'>
            <Text className='value'>{stats?.inquiryCount || 0}</Text>
            <Text className='label'>询价总数</Text>
          </View>
        </View>
      </View>

      <Dialog
        title='一次性绑定码'
        visible={bindDialogVisible}
        onConfirm={() => setBindDialogVisible(false)}
        onCancel={() => setBindDialogVisible(false)}
      >
        <ScrollView scrollY className='dialog-scroll'>
          <View className='dialog-content'>
            <Text className='bind-code'>{bindCode?.code}</Text>
            {bindCode?.qrcodeUrl && (
              <View className='qrcode-dialog'>
                <Image className='qrcode-img' src={bindCode.qrcodeUrl} mode='aspectFit' />
                <Button size='small' className='dialog-btn' onClick={handleSaveBindQr}>
                  保存绑定二维码
                </Button>
              </View>
            )}
            <Text className='bind-expire'>有效期至：{bindCode?.expiresAt}</Text>
            <Button size='small' className='dialog-btn' onClick={handleCopyBindCode}>
              复制绑定码
            </Button>
          </View>
        </ScrollView>
      </Dialog>

      <Dialog
        title='代理商小程序码'
        visible={qrcodeDialogVisible}
        onConfirm={() => setQrcodeDialogVisible(false)}
        onCancel={() => setQrcodeDialogVisible(false)}
      >
        <ScrollView scrollY className='dialog-scroll'>
          <View className='qrcode-dialog'>
            {agent.qrcodeUrl ? (
              <Image className='qrcode-img' src={agent.qrcodeUrl} mode='aspectFit' />
            ) : (
              <Text>暂无小程序码</Text>
            )}
            <Text className='qrcode-name'>{agent.name}</Text>
            {agent.qrcodeUrl && (
              <Button size='small' className='dialog-btn' onClick={handleSaveQr}>
                保存到相册
              </Button>
            )}
          </View>
        </ScrollView>
      </Dialog>
    </View>
  )
}

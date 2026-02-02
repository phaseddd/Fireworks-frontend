import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useReachBottom } from '@tarojs/taro'
import { useCallback, useMemo, useState } from 'react'
import { Button, Dialog, Empty, PullToRefresh } from '@nutui/nutui-react-taro'
import useAuth from '@/hooks/useAuth'
import { api } from '@/services/api'
import type { Agent, AgentStatus } from '@/types'
import './index.scss'

const PAGE_SIZE = 50

const STATUS_TEXT: Record<AgentStatus, string> = {
  ACTIVE: '已启用',
  DISABLED: '已禁用',
}

export default function AdminAgentList() {
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const [bindDialogVisible, setBindDialogVisible] = useState(false)
  const [bindCode, setBindCode] = useState<{ code: string; qrcodeUrl?: string; expiresAt: string } | null>(null)

  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('确认操作')
  const [confirmText, setConfirmText] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null)

  const [qrcodeDialogVisible, setQrcodeDialogVisible] = useState(false)
  const [qrcodeTarget, setQrcodeTarget] = useState<{ url: string; name: string } | null>(null)

  const loadAgents = useCallback(async (pageNum: number, refresh = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await api.agents.list({ page: pageNum, size: PAGE_SIZE })
      setTotal(res.total)
      setHasMore(pageNum * PAGE_SIZE < res.total)
      setPage(pageNum)
      if (refresh || pageNum === 1) {
        setAgents(res.items)
      } else {
        setAgents((prev) => [...prev, ...res.items])
      }
    } finally {
      setLoading(false)
    }
  }, [loading])

  useDidShow(() => {
    if (requireAuth()) {
      loadAgents(1, true)
    }
  })

  useReachBottom(() => {
    if (authLoading || !isAuthenticated) return
    if (loading || !hasMore) return
    loadAgents(page + 1)
  })

  const handleRefresh = async () => {
    await loadAgents(1, true)
  }

  const handleAdd = () => Taro.redirectTo({ url: '/pages/admin/agents/add/index' })
  const handleEdit = (code: string) => Taro.redirectTo({ url: `/pages/admin/agents/edit/index?code=${encodeURIComponent(code)}` })
  const handleDetail = (code: string) => Taro.redirectTo({ url: `/pages/admin/agents/detail/index?code=${encodeURIComponent(code)}` })

  const openConfirm = (title: string, text: string, action: () => Promise<void>) => {
    setConfirmTitle(title)
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmVisible(true)
  }

  const handleToggleStatus = (agent: Agent) => {
    const nextStatus: AgentStatus = agent.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    openConfirm(
      '确认切换状态',
      `确定要将“${agent.name}（${agent.code}）”设为${STATUS_TEXT[nextStatus]}吗？`,
      async () => {
        await api.agents.update(agent.code, { status: nextStatus })
        await loadAgents(1, true)
      }
    )
  }

  const handleGenerateBindCode = (agent: Agent) => {
    openConfirm(
      '生成绑定码',
      `为“${agent.name}（${agent.code}）”生成一次性绑定码？`,
      async () => {
        const res = await api.agents.generateBindCode(agent.code)
        setBindCode({ code: res.bindCode, qrcodeUrl: res.bindQrcodeUrl, expiresAt: res.expiresAt })
        setBindDialogVisible(true)
      }
    )
  }

  const handleUnbind = (agent: Agent) => {
    openConfirm(
      '解除绑定',
      `确定要解除“${agent.name}（${agent.code}）”的绑定吗？`,
      async () => {
        await api.agents.unbind(agent.code)
        await loadAgents(1, true)
      }
    )
  }

  const handleGenerateQrCode = (agent: Agent) => {
    openConfirm(
      agent.qrcodeUrl ? '查看小程序码' : '生成小程序码',
      agent.qrcodeUrl ? `查看“${agent.name}（${agent.code}）”的小程序码？` : `生成“${agent.name}（${agent.code}）”的小程序码？`,
      async () => {
        const res = agent.qrcodeUrl ? { qrcodeUrl: agent.qrcodeUrl } : await api.agents.generateQrcode(agent.code)
        setQrcodeTarget({ url: res.qrcodeUrl, name: agent.name })
        setQrcodeDialogVisible(true)
        if (!agent.qrcodeUrl) {
          await loadAgents(1, true)
        }
      }
    )
  }

  const handleCopyBindCode = () => {
    if (!bindCode?.code) return
    Taro.setClipboardData({
      data: bindCode.code,
      success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
    })
  }

  const saveImageToAlbum = async (url: string) => {
    try {
      const res = await Taro.downloadFile({ url })
      await Taro.saveImageToPhotosAlbum({ filePath: (res as any).tempFilePath })
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (e: any) {
      const msg = e?.errMsg || ''
      if (msg.includes('deny')) {
        Taro.showModal({
          title: '提示',
          content: '需要您授权保存图片到相册',
          confirmText: '去授权',
          success: (r) => {
            if (r.confirm) Taro.openSetting()
          },
        })
      } else {
        Taro.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  }

  const handleSaveQr = async () => {
    if (!qrcodeTarget?.url) return
    await saveImageToAlbum(qrcodeTarget.url)
  }

  const handleSaveBindQr = async () => {
    if (!bindCode?.qrcodeUrl) return
    await saveImageToAlbum(bindCode.qrcodeUrl)
  }

  const totalText = useMemo(() => `共 ${total} 个`, [total])

  if (authLoading) {
    return (
      <View className='admin-agents'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!isAuthenticated) return <View />

  return (
    <View className='admin-agents'>
      <View className='header'>
        <View className='header-left'>
          <Button size='small' className='back-btn' onClick={() => Taro.redirectTo({ url: '/pages/admin/dashboard' })}>
            ← 返回
          </Button>
          <Text className='title'>代理商管理</Text>
        </View>
        <Button size='small' type='primary' className='add-btn' onClick={handleAdd}>
          ➕ 添加代理商
        </Button>
      </View>

      <View className='meta'>
        <Text className='meta-text'>{totalText}</Text>
      </View>

      <PullToRefresh onRefresh={handleRefresh}>
        <View className='list'>
          {agents.length === 0 && !loading ? (
            <Empty description='暂无代理商' />
          ) : (
            agents.map((a) => (
              <View key={a.code} className='card'>
                <View className='card-header'>
                  <Text className='code'>{a.code}</Text>
                  <View className={`status ${a.status === 'ACTIVE' ? 'active' : 'disabled'}`}>
                    <Text className='status-text'>{STATUS_TEXT[a.status]}</Text>
                  </View>
                </View>
                <Text className='name'>{a.name}</Text>
                <Text className='phone'>{a.phone || '-'}</Text>
                <Text className='bind'>{a.openidBound ? '已绑定' : '未绑定'}</Text>

                <View className='actions'>
                  <Button size='small' className='action-btn' onClick={() => handleDetail(a.code)}>详情</Button>
                  <Button size='small' className='action-btn' onClick={() => handleEdit(a.code)}>编辑</Button>
                  <Button size='small' className='action-btn' onClick={() => handleGenerateQrCode(a)}>
                    {a.qrcodeUrl ? '查看码' : '生成码'}
                  </Button>
                  <Button size='small' className='action-btn' onClick={() => handleGenerateBindCode(a)}>绑定码</Button>
                  {a.openidBound && (
                    <Button size='small' className='action-btn danger' onClick={() => handleUnbind(a)}>解绑</Button>
                  )}
                  <Button size='small' className='action-btn' onClick={() => handleToggleStatus(a)}>
                    {a.status === 'ACTIVE' ? '禁用' : '启用'}
                  </Button>
                </View>
              </View>
            ))
          )}

          {loading && (
            <View className='loading-more'>
              <Text>加载中...</Text>
            </View>
          )}
          {!hasMore && agents.length > 0 && (
            <View className='no-more'>
              <Text>没有更多了</Text>
            </View>
          )}
        </View>
      </PullToRefresh>

      <Dialog
        title={confirmTitle}
        visible={confirmVisible}
        onConfirm={async () => {
          setConfirmVisible(false)
          const fn = confirmAction
          setConfirmAction(null)
          if (fn) await fn()
        }}
        onCancel={() => setConfirmVisible(false)}
      >
        <View className='dialog-content'>
          <Text>{confirmText}</Text>
        </View>
      </Dialog>

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
            {qrcodeTarget?.url ? (
              <Image className='qrcode-img' src={qrcodeTarget.url} mode='aspectFit' />
            ) : (
              <Text>暂无小程序码</Text>
            )}
            <Text className='qrcode-name'>{qrcodeTarget?.name}</Text>
            <Button size='small' className='dialog-btn' onClick={handleSaveQr}>
              保存到相册
            </Button>
          </View>
        </ScrollView>
      </Dialog>
    </View>
  )
}

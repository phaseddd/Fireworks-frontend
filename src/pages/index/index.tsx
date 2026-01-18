import { View, Text, Image } from '@tarojs/components'
import { useDidHide, useDidShow, useLoad } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/services/api'
import FireworksBackground, { type FireworksBackgroundHandle } from '@/components/customer/FireworksBackground'
import LogoHalo from '@/components/customer/LogoHalo'
import { authUtils } from '../../hooks/useAuth'
import logoImg from '../../assets/images/logo.png'
import './index.scss'

const FIREWORKS_EMOJI = String.fromCodePoint(0x1F386)
const COPYRIGHT_SIGN = String.fromCodePoint(0x00A9)

export default function Index() {
  const [bgActive, setBgActive] = useState(true)
  const [showHint, setShowHint] = useState(true)
  const navigatingRef = useRef(false)
  const bindingRef = useRef(false)
  const fireworksRef = useRef<FireworksBackgroundHandle | null>(null)

  useLoad(() => {
    console.log(`${FIREWORKS_EMOJI} 南澳烟花首页加载完成`)
  })

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3200)
    return () => clearTimeout(t)
  }, [])

  useDidShow(() => {
    // 页面回到前台，恢复背景动效（节能 + 稳定）
    setBgActive(true)

    const raw = Taro.getStorageSync('pendingBindCode')
    const pendingBindCode = raw ? String(raw).trim() : ''
    if (!pendingBindCode) return
    if (bindingRef.current) return

    bindingRef.current = true

    ;(async () => {
      try {
        const res = await Taro.showModal({
          title: '代理商绑定',
          content: '检测到绑定码，是否绑定到当前微信账号？',
          confirmText: '确认绑定',
          cancelText: '暂不',
        })

        if (!res.confirm) {
          Taro.removeStorageSync('pendingBindCode')
          return
        }

        Taro.showLoading({ title: '绑定中...' })
        try {
          await api.agents.bind({ bindCode: pendingBindCode })
          Taro.removeStorageSync('pendingBindCode')
          Taro.showToast({ title: '绑定成功', icon: 'success' })
        } finally {
          Taro.hideLoading()
        }
      } catch {
        // 用户关闭弹窗/系统异常时不打扰
      } finally {
        bindingRef.current = false
      }
    })()
  })

  useDidHide(() => {
    // TabBar 切走/进后台时暂停，避免后台耗电与不必要的绘制
    setBgActive(false)
  })

  // 跳转到商品列表 (TabBar 页面，使用 switchTab)
  const handleStartBrowsing = () => {
    try {
      const { windowWidth, windowHeight } = Taro.getSystemInfoSync()
      // 不阻塞跳转：仅作轻量“点火”反馈（可能看不清也没关系）
      fireworksRef.current?.burstAt(windowWidth / 2, windowHeight * 0.62, 'soft')
    } catch {
      // ignore
    }

    Taro.switchTab({
      url: '/pages/products/list/index'
    })
  }

  // 店主入口 - 需要预加载分包
  const handleAdminLogin = () => {
    if (navigatingRef.current) return
    navigatingRef.current = true

    const url = authUtils.isLoggedIn()
      ? '/pages/admin/dashboard'
      : '/pages/admin/login'

    const loadSubPackage = (Taro as unknown as {
      loadSubPackage?: (options: {
        name: string
        success?: () => void
        fail?: (err: unknown) => void
      }) => void
    }).loadSubPackage

    if (typeof loadSubPackage === 'function') {
      Taro.showLoading({ title: '加载中...' })
      loadSubPackage({
        name: 'pages/admin',
        success: () => {
          Taro.hideLoading()
          Taro.navigateTo({
            url,
            complete: () => {
              navigatingRef.current = false
            },
          })
        },
        fail: (err) => {
          console.error('loadSubPackage failed:', err)
          Taro.hideLoading()
          Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
          navigatingRef.current = false
        }
      })
      return
    }

    Taro.navigateTo({
      url,
      complete: () => {
        navigatingRef.current = false
      },
    })
  }

  return (
    <View className='index-page'>
      <FireworksBackground ref={fireworksRef} active={bgActive} />

      {/* 主内容区 */}
      <View className='content'>
        <View className='hero-card'>
          <View className='brand-row'>
            {/* Logo */}
            <View className='logo-wrapper'>
              <LogoHalo active={bgActive} size={116} />
              <Image
                className='logo'
                src={logoImg}
                mode='aspectFit'
              />
            </View>

            <View className='brand-text'>
              {/* 店铺名称 */}
              <Text className='store-name'>南澳烟花</Text>
              {/* 合规定位/副标题 */}
              <Text className='sub-title'>烟花信息查询助手</Text>
            </View>
          </View>

          {/* 口号（更协调、偏功能价值） */}
          <Text className='slogan'>参考价格 · 燃放视频 · 一键询价</Text>

          {/* 开始浏览按钮 */}
          <Button
            className='btn-start'
            onClick={handleStartBrowsing}
          >
            进入产品库
          </Button>

          {/* 店主入口 - 小字链接样式 */}
          <View className='admin-entry' onClick={handleAdminLogin}>
            <Text className='admin-text'>店主入口</Text>
          </View>
        </View>
      </View>

      {showHint && (
        <View className='hint'>
          <Text className='hint-chip'>点一下放烟花</Text>
        </View>
      )}

      {/* 底部版权信息 */}
      <View className='footer'>
        <Text className='copyright'>{COPYRIGHT_SIGN} 2025 南澳烟花</Text>
      </View>
    </View>
  )
}

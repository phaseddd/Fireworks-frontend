import { View, Text } from '@tarojs/components'
import { useDidShow, useLoad } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useRef } from 'react'
import { api } from '@/services/api'
import { authUtils } from '../../hooks/useAuth'
import FireworksCanvas from '../../components/FireworksCanvas'
import IgniteText from '../../components/IgniteText'
import PageHeader from '@/components/ui/PageHeader'
import './index.scss'

const COPYRIGHT_SIGN = String.fromCodePoint(0x00A9)

export default function Index() {
  const navigatingRef = useRef(false)
  const bindingRef = useRef(false)

  useLoad(() => {
    // 首页使用自定义导航（见 pages/index/index.config.ts）
  })

  useDidShow(() => {
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
        // quiet
      } finally {
        bindingRef.current = false
      }
    })()
  })

  const handleStartBrowsing = () => {
    Taro.switchTab({
      url: '/pages/products/list/index'
    })
  }

  const handleAdminLogin = () => {
    if (navigatingRef.current) return
    navigatingRef.current = true

    const url = authUtils.isLoggedIn()
      ? '/pages/admin/dashboard'
      : '/pages/admin/login'

    // 尝试分包加载逻辑...
    const loadSubPackage = (Taro as any).loadSubPackage
    if (typeof loadSubPackage === 'function') {
      Taro.showLoading({ title: '加载中...' })
      loadSubPackage({
        name: 'pages/admin',
        success: () => {
          Taro.hideLoading()
          // 使用 reLaunch 清栈进入管理端，避免导航栏出现返回箭头
          Taro.reLaunch({
            url,
            complete: () => { navigatingRef.current = false }
          })
        },
        fail: () => {
          Taro.hideLoading()
          Taro.reLaunch({
             url,
             complete: () => { navigatingRef.current = false }
          })
        }
      })
      return
    }

    // 使用 reLaunch 清栈进入管理端，避免导航栏出现返回箭头
    Taro.reLaunch({
      url,
      complete: () => { navigatingRef.current = false }
    })
  }

  return (
    <View className='index-page'>
      <PageHeader title='南澳烟花' showBack={false} />
      {/* 背景层：月亮与繁星 (纯 CSS 实现，不占 Canvas 性能) */}
      <View className='sky-container'>
        <View className='stars' />
        <View className='stars-small' />
        <View 
          className='moon'
          onLongPress={handleAdminLogin}
        />
      </View>

      <FireworksCanvas />

      {/* 沉浸式内容层 */}
      <View className='content'>
        
        {/* 顶部留白区域 (占位 40%)，让烟花在上方尽情绽放 */}
        <View className='spacer' />

        {/* 核心视觉区 */}
        <View className='hero-section'>
          {/* 主标题 - 艺术排版 */}
          <View className='title-wrapper'>
            <Text className='title-cn'>南澳</Text>
            <View className='dot' />
            <Text className='title-cn'>烟花</Text>
          </View>
          
          {/* 渐进式点燃文案 */}
          <View className='ignite-slogan-area'>
            <IgniteText 
              text='海风与花火，都是礼物' 
              fontSize={20} 
              delay={500} 
              interval={180}
              className='slogan-line-1'
            />
            <IgniteText 
              text='把南澳的夜，装进相册' 
              fontSize={20} 
              delay={2800} // 延后，等待第一行充分燃烧
              interval={180} 
              className='slogan-line-2'
            />
          </View>

        </View>

        {/* 操作区 */}
        <View className='action-section'>
          {/* 毛玻璃按钮 */}
          <View 
            className='btn-glass'
            onClick={handleStartBrowsing}
            hoverClass='btn-glass-hover'
          >
            <Text className='btn-text'>便宜批发|送货上门</Text>
            <View className='btn-shine' />
          </View>

          {/* 底部功能链接 - 已移除店主登录显性入口，改为长按月亮 */}
        </View>

        {/* 底部版权 */}
        <View className='footer'>
          <Text className='copyright'>{COPYRIGHT_SIGN} 2026 Nanao Fireworks</Text>
        </View>

      </View>
    </View>
  )
}

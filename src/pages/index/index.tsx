import { View, Text, Image, Canvas } from '@tarojs/components'
import { useDidShow, useLoad, useDidHide } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useRef, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import { authUtils } from '../../hooks/useAuth'
import logoImg from '../../assets/images/logo.png'
// Import Lottie animation data directly (path only supports HTTP protocol)
import fireworkBgData from '../../assets/lottie/firework-bg.json'
import fireworkClickData from '../../assets/lottie/firework-click.json'
import './index.scss'

const FIREWORKS_EMOJI = String.fromCodePoint(0x1F386)
const COPYRIGHT_SIGN = String.fromCodePoint(0x00A9)

// Maximum number of click animations at once
const MAX_CLICK_ANIMATIONS = 5

// Type for lottie-miniprogram
interface LottieInstance {
  play: () => void
  stop: () => void
  pause: () => void
  destroy: () => void
  goToAndPlay: (frame: number, isFrame?: boolean) => void
  setSpeed: (speed: number) => void
}

interface LottieModule {
  setup: (canvas: unknown) => void
  loadAnimation: (options: {
    loop?: boolean
    autoplay?: boolean
    animationData?: unknown
    path?: string
    rendererSettings?: {
      context?: unknown
    }
  }) => LottieInstance
}

export default function Index() {
  const navigatingRef = useRef(false)
  const bindingRef = useRef(false)

  // Lottie animation refs
  const bgCanvasRef = useRef<unknown>(null)
  const bgAnimationRef = useRef<LottieInstance | null>(null)
  const clickAnimationsRef = useRef<LottieInstance[]>([])
  const lottieRef = useRef<LottieModule | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize background Lottie animation
  const initBackgroundAnimation = useCallback(async () => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    try {
      // Dynamically import lottie-miniprogram (only works in WeChat environment)
      const lottie = await import('lottie-miniprogram') as unknown as { default: LottieModule }
      lottieRef.current = lottie.default

      // Get canvas node using Taro's selector query
      const query = Taro.createSelectorQuery()
      query
        .select('#fireworks-bg-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res?.[0]?.node) {
            console.warn('Background canvas node not found')
            return
          }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          // Get system info for pixel ratio
          const systemInfo = Taro.getSystemInfoSync()
          const dpr = systemInfo.pixelRatio || 2

          // Set canvas dimensions
          canvas.width = systemInfo.windowWidth * dpr
          canvas.height = systemInfo.windowHeight * dpr
          ctx.scale(dpr, dpr)

          bgCanvasRef.current = canvas

          // Setup lottie with canvas
          lottieRef.current?.setup(canvas)

          // Load background animation using animationData (path only supports HTTP)
          bgAnimationRef.current = lottieRef.current?.loadAnimation({
            loop: true,
            autoplay: true,
            animationData: fireworkBgData,
            rendererSettings: {
              context: ctx,
            },
          }) ?? null

          console.log(`${FIREWORKS_EMOJI} Background Lottie animation initialized`)
        })
    } catch (err) {
      console.error('Failed to initialize Lottie:', err)
    }
  }, [])

  // Handle touch event to create click firework
  const handleCanvasTouch = useCallback((e: { touches: Array<{ x: number; y: number }> }) => {
    if (!lottieRef.current || !e.touches?.[0]) return

    // Limit concurrent animations
    if (clickAnimationsRef.current.length >= MAX_CLICK_ANIMATIONS) {
      // Remove the oldest animation
      const oldAnim = clickAnimationsRef.current.shift()
      oldAnim?.destroy()
    }

    const { x, y } = e.touches[0]

    // Create a temporary canvas for click animation
    const query = Taro.createSelectorQuery()
    query
      .select('#fireworks-click-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res?.[0]?.node) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // Clear previous drawings at this position (basic approach)
        // For a more sophisticated approach, we'd need multiple canvas layers

        lottieRef.current?.setup(canvas)

        // Load click animation using animationData (path only supports HTTP)
        const clickAnim = lottieRef.current?.loadAnimation({
          loop: false,
          autoplay: true,
          animationData: fireworkClickData,
          rendererSettings: {
            context: ctx,
          },
        })

        if (clickAnim) {
          clickAnimationsRef.current.push(clickAnim)

          // Auto-cleanup after animation completes (assuming ~5 second animation)
          setTimeout(() => {
            const idx = clickAnimationsRef.current.indexOf(clickAnim)
            if (idx > -1) {
              clickAnim.destroy()
              clickAnimationsRef.current.splice(idx, 1)
            }
          }, 5000)
        }

        console.log(`${FIREWORKS_EMOJI} Click firework at (${x.toFixed(0)}, ${y.toFixed(0)})`)
      })
  }, [])

  // Cleanup animations
  const destroyAnimations = useCallback(() => {
    bgAnimationRef.current?.destroy()
    bgAnimationRef.current = null

    clickAnimationsRef.current.forEach((anim) => anim.destroy())
    clickAnimationsRef.current = []
  }, [])

  useLoad(() => {
    console.log(`${FIREWORKS_EMOJI} 南澳烟花首页加载完成`)
  })

  useEffect(() => {
    // Initialize after component mount
    const timer = setTimeout(() => {
      initBackgroundAnimation()
    }, 100)

    return () => {
      clearTimeout(timer)
      destroyAnimations()
    }
  }, [initBackgroundAnimation, destroyAnimations])

  useDidShow(() => {
    // Resume animation when page shows
    bgAnimationRef.current?.play()

    // Handle pending bind code
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
        // Silent fail for modal dismissal
      } finally {
        bindingRef.current = false
      }
    })()
  })

  useDidHide(() => {
    // Pause animation when page hides
    bgAnimationRef.current?.pause()
  })

  // Navigate to product list (TabBar page)
  const handleStartBrowsing = () => {
    Taro.switchTab({
      url: '/pages/products/list/index'
    })
  }

  // Admin entry - requires subpackage preload
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
      {/* Layer 1: CSS stars decoration */}
      <View className='stars-layer'>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            className={`star star-${(i % 3) + 1}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </View>

      {/* Layer 2: Background Lottie Canvas */}
      <Canvas
        type='2d'
        id='fireworks-bg-canvas'
        className='fireworks-canvas fireworks-bg-canvas'
        disableScroll
      />

      {/* Layer 3: Click Lottie Canvas (interactive) */}
      <Canvas
        type='2d'
        id='fireworks-click-canvas'
        className='fireworks-canvas fireworks-click-canvas'
        onTouchStart={handleCanvasTouch}
        disableScroll
      />

      {/* Layer 4: UI Content */}
      <View className='content'>
        {/* Logo */}
        <View className='logo-wrapper'>
          <Image
            className='logo'
            src={logoImg}
            mode='aspectFit'
          />
        </View>

        {/* Store name */}
        <Text className='store-name'>南澳烟花</Text>

        {/* Slogan */}
        <Text className='slogan'>绚烂烟火，点亮美好时刻</Text>

        {/* Start browsing button */}
        <Button
          className='btn-start'
          onClick={handleStartBrowsing}
        >
          开始浏览
        </Button>

        {/* Admin entry - subtle text link */}
        <View className='admin-entry' onClick={handleAdminLogin}>
          <Text className='admin-text'>店主入口</Text>
        </View>
      </View>

      {/* Footer */}
      <View className='footer'>
        <Text className='copyright'>{COPYRIGHT_SIGN} 2025 南澳烟花</Text>
      </View>
    </View>
  )
}

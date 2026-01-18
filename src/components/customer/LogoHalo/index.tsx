import { Canvas, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useMemo, useRef } from 'react'
import lottie from 'lottie-miniprogram'
import haloAnimation from '@/assets/lottie/logo-halo.json'
import './index.scss'

interface LogoHaloProps {
  active?: boolean
  size?: number
  className?: string
}

/**
 * Logo 周围的微光/粒子环（Lottie）
 * - 只做“细节增强”：低干扰、低频、不可抢主 CTA
 * - 失败应静默降级（不影响首页主流程）
 */
const LogoHalo: React.FC<LogoHaloProps> = ({ active = true, size = 116, className }) => {
  const canvasId = useMemo(
    () => `logo-halo-canvas-${Math.random().toString(36).slice(2)}`,
    []
  )
  const animationRef = useRef<any>(null)

  useEffect(() => {
    let destroyed = false

    try {
      Taro.createSelectorQuery()
        .select(`#${canvasId}`)
        .node()
        .exec((res) => {
          if (destroyed) return

          const canvas = res?.[0]?.node
          if (!canvas) return

          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const { pixelRatio } = Taro.getSystemInfoSync()
          const dpr = Math.min(Number(pixelRatio || 1), 2)

          canvas.width = Math.floor(size * dpr)
          canvas.height = Math.floor(size * dpr)
          ctx.scale(dpr, dpr)

          lottie.setup(canvas)
          const animation = lottie.loadAnimation({
            loop: true,
            autoplay: true,
            animationData: haloAnimation as any,
            rendererSettings: {
              context: ctx,
              clearCanvas: true,
            },
          })

          animationRef.current = animation
        })
    } catch {
      // 静默降级：Lottie 初始化失败不影响首页
    }

    return () => {
      destroyed = true
      try {
        animationRef.current?.destroy?.()
      } catch {
        // ignore
      } finally {
        animationRef.current = null
      }
    }
  }, [canvasId, size])

  useEffect(() => {
    const anim = animationRef.current
    if (!anim) return

    try {
      if (active) anim.play?.()
      else anim.pause?.()
    } catch {
      // ignore
    }
  }, [active])

  return (
    <View
      className={`logo-halo ${className || ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <Canvas
        id={canvasId}
        type='2d'
        className='logo-halo__canvas'
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </View>
  )
}

export default LogoHalo

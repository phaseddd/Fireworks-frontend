import { Canvas, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import './index.scss'

type QualityLevel = 'low' | 'medium' | 'high'

export type FireworksBackgroundHandle = {
  /**
   * 在指定位置触发一次烟花（坐标单位：px，基于屏幕可视区域）
   */
  burstAt: (x: number, y: number, strength?: 'soft' | 'normal') => void
}

interface FireworksBackgroundProps {
  active?: boolean
  className?: string
}

type ParticleKind = 'rocket' | 'spark' | 'bloom' | 'trail' | 'ring'

type Particle = {
  active: boolean
  kind: ParticleKind
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  size: number
  alpha: number
  lifeMs: number
  maxLifeMs: number
  color: string
  // 用于 rocket / ring 的额外参数（保持 KISS，不引入复杂 class）
  targetY?: number
  ringRadius?: number
  ringRadiusSpeed?: number
  ringLineWidth?: number
}

type Engine = {
  canvas: any
  ctx: any
  width: number
  height: number
  dpr: number
  running: boolean
  rafId: number | null
  lastTs: number
  fpsAvg: number
  lowFpsStreak: number
  quality: QualityLevel
  particles: Particle[]
  pool: Particle[]
  nextAutoLaunchAt: number
  // 触摸跟手拖尾节流
  lastTrailAt: number
  lastTouchX: number | null
  lastTouchY: number | null
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]

const pickWeighted = (items: Array<{ value: string; weight: number }>): string => {
  const total = items.reduce((sum, it) => sum + it.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it.value
  }
  return items[items.length - 1]?.value || '#ffffff'
}

// 春节红金主导：爆炸烟花色板（克制高级：限定组合，避免“脏随机”）
const BURST_PALETTES: ReadonlyArray<ReadonlyArray<string>> = [
  ['#ff2d2d', '#ffd700', '#ffffff'],
  ['#ff4800', '#ffd700', '#fff1c1'],
  ['#ff2d2d', '#ff8c00', '#ffd700'],
  ['#ffd700', '#ffffff', '#ff8c00'],
]

const TOUCH_COLORS = [
  { value: '#ffffff', weight: 55 },
  { value: '#fff1c1', weight: 22 },
  { value: '#ffd700', weight: 18 },
  { value: '#ff2d2d', weight: 5 },
]

const QUALITY_CONFIG: Record<
  QualityLevel,
  {
    autoIntervalMs: readonly [number, number]
    burstCount: readonly [number, number]
    trailEmitIntervalMs: number
    maxParticles: number
    fadeAlpha: number
    gravity: number
    friction: number
  }
> = {
  low: {
    autoIntervalMs: [1900, 2600],
    burstCount: [14, 22],
    trailEmitIntervalMs: 33,
    maxParticles: 220,
    fadeAlpha: 0.18,
    gravity: 0.085,
    friction: 0.965,
  },
  medium: {
    autoIntervalMs: [1600, 2400],
    burstCount: [18, 32],
    trailEmitIntervalMs: 22,
    maxParticles: 320,
    fadeAlpha: 0.14,
    gravity: 0.075,
    friction: 0.972,
  },
  high: {
    // “克制高级”风格下，高端机也不需要更频繁，只需要更细腻
    autoIntervalMs: [1600, 2400],
    burstCount: [20, 34],
    trailEmitIntervalMs: 16,
    maxParticles: 420,
    fadeAlpha: 0.12,
    gravity: 0.07,
    friction: 0.976,
  },
}

function detectInitialQuality(): QualityLevel {
  try {
    const sys = Taro.getSystemInfoSync() as any
    const level = Number(sys?.benchmarkLevel || 0)
    if (Number.isFinite(level) && level > 0) {
      if (level >= 60) return 'high'
      if (level <= 20) return 'low'
      return 'medium'
    }
  } catch {
    // ignore
  }
  return 'medium'
}

function getPointFromEvent(e: any): { x: number; y: number } | null {
  const detail = e?.detail
  if (detail && Number.isFinite(detail.x) && Number.isFinite(detail.y)) {
    return { x: Number(detail.x), y: Number(detail.y) }
  }

  const t = e?.touches?.[0] || e?.changedTouches?.[0]
  if (!t) return null

  const x =
    Number.isFinite(t.x) ? Number(t.x) :
      Number.isFinite(t.clientX) ? Number(t.clientX) :
        Number.isFinite(t.pageX) ? Number(t.pageX) : NaN
  const y =
    Number.isFinite(t.y) ? Number(t.y) :
      Number.isFinite(t.clientY) ? Number(t.clientY) :
        Number.isFinite(t.pageY) ? Number(t.pageY) : NaN

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function createPool(size: number): Particle[] {
  const pool: Particle[] = []
  for (let i = 0; i < size; i++) {
    pool.push({
      active: false,
      kind: 'bloom',
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vx: 0,
      vy: 0,
      size: 1,
      alpha: 0,
      lifeMs: 0,
      maxLifeMs: 0,
      color: '#ffffff',
    })
  }
  return pool
}

function acquireParticle(engine: Engine): Particle | null {
  if (engine.particles.length >= QUALITY_CONFIG[engine.quality].maxParticles) return null
  const p = engine.pool.pop()
  if (!p) return null
  p.active = true
  p.targetY = undefined
  p.ringRadius = undefined
  p.ringRadiusSpeed = undefined
  p.ringLineWidth = undefined
  engine.particles.push(p)
  return p
}

function recycleParticle(engine: Engine, index: number) {
  const last = engine.particles.length - 1
  const p = engine.particles[index]
  p.active = false
  if (index !== last) {
    engine.particles[index] = engine.particles[last]
  }
  engine.particles.pop()
  engine.pool.push(p)
}

function scheduleNextAutoLaunch(engine: Engine, now: number) {
  const cfg = QUALITY_CONFIG[engine.quality]
  engine.nextAutoLaunchAt = now + rand(cfg.autoIntervalMs[0], cfg.autoIntervalMs[1])
}

function spawnRocket(engine: Engine) {
  const p = acquireParticle(engine)
  if (!p) return

  // 提升“视觉直觉”：烟花应更常在上半屏绽放；水平位置保持自然分布
  const startX = rand(engine.width * 0.12, engine.width * 0.88)
  const startY = engine.height + rand(10, 40)
  const targetY = rand(engine.height * 0.16, engine.height * 0.44)

  p.kind = 'rocket'
  p.x = startX
  p.y = startY
  p.prevX = startX
  p.prevY = startY
  p.vx = rand(-0.42, 0.42)
  p.vy = -rand(9.4, 11.6)
  p.size = rand(1.4, 2.2)
  p.alpha = 1
  p.lifeMs = rand(1100, 1650)
  p.maxLifeMs = p.lifeMs
  p.color = pick(['#ffffff', '#fff1c1', '#ffd700'])
  p.targetY = targetY
}

function spawnSpark(engine: Engine, x: number, y: number) {
  const p = acquireParticle(engine)
  if (!p) return

  p.kind = 'spark'
  p.x = x
  p.y = y
  p.prevX = x
  p.prevY = y
  p.vx = rand(-1.2, 1.2)
  p.vy = rand(0.8, 2.6)
  p.size = rand(0.6, 1.2)
  p.alpha = rand(0.65, 0.95)
  p.lifeMs = rand(220, 420)
  p.maxLifeMs = p.lifeMs
  p.color = pick(['#ffd700', '#fff1c1', '#ffffff'])
}

function spawnRing(engine: Engine, x: number, y: number, color: string) {
  const p = acquireParticle(engine)
  if (!p) return

  p.kind = 'ring'
  p.x = x
  p.y = y
  p.prevX = x
  p.prevY = y
  p.vx = 0
  p.vy = 0
  p.size = 1
  p.alpha = 1
  p.lifeMs = 360
  p.maxLifeMs = 360
  p.color = color
  p.ringRadius = 6
  p.ringRadiusSpeed = 2.8
  p.ringLineWidth = 1.4
}

function burstAt(engine: Engine, x: number, y: number, strength: 'soft' | 'normal') {
  const cfg = QUALITY_CONFIG[engine.quality]
  const palette = pick(BURST_PALETTES)

  // 点击反馈：仅在“软触发”（用户点按/按钮触发）时给 shockwave（科技感 + 不喧宾夺主）
  if (strength === 'soft') {
    spawnRing(engine, x, y, '#fff1c1')
  }

  const baseCount = rand(cfg.burstCount[0], cfg.burstCount[1])
  const count = Math.round(strength === 'soft' ? baseCount * 0.65 : baseCount)

  for (let i = 0; i < count; i++) {
    const p = acquireParticle(engine)
    if (!p) break

    const angle = rand(0, Math.PI * 2)
    // 放大爆炸的“半径感”（用户反馈：烟花有点小），不增加数量，只增加速度与线宽上限
    const speedBase = strength === 'soft' ? rand(2.0, 4.6) : rand(2.6, 5.8)
    const speed = speedBase * (0.85 + Math.random() * 0.3)

    p.kind = 'bloom'
    p.x = x
    p.y = y
    p.prevX = x
    p.prevY = y
    p.vx = Math.cos(angle) * speed
    p.vy = Math.sin(angle) * speed
    p.size = rand(1.15, 2.35)
    p.alpha = rand(0.75, 1)
    p.lifeMs = rand(560, 980)
    p.maxLifeMs = p.lifeMs
    p.color = pick(palette)
  }
}

function spawnTouchTrail(engine: Engine, x: number, y: number) {
  const p = acquireParticle(engine)
  if (!p) return

  const angle = rand(0, Math.PI * 2)
  const speed = rand(0.25, 1.05)

  p.kind = 'trail'
  p.x = x
  p.y = y
  p.prevX = x
  p.prevY = y
  p.vx = Math.cos(angle) * speed
  p.vy = Math.sin(angle) * speed
  p.size = rand(0.6, 1.25)
  p.alpha = rand(0.35, 0.65)
  p.lifeMs = rand(180, 360)
  p.maxLifeMs = p.lifeMs
  p.color = pickWeighted(TOUCH_COLORS)
}

function updateAndRender(engine: Engine, now: number) {
  const ctx = engine.ctx
  const cfg = QUALITY_CONFIG[engine.quality]

  // 统一时间基准：nextAutoLaunchAt 使用与 requestAnimationFrame 一致的时间戳
  if (!engine.nextAutoLaunchAt) {
    engine.nextAutoLaunchAt = now + rand(420, 980)
  }

  const dt = engine.lastTs ? clamp(now - engine.lastTs, 8, 40) : 16
  engine.lastTs = now

  // 平滑 fps，若持续偏低则降档（不做静态/视频兜底的前提下，靠内部质量分档保稳）
  const fps = 1000 / dt
  engine.fpsAvg = engine.fpsAvg ? engine.fpsAvg * 0.9 + fps * 0.1 : fps
  if (engine.fpsAvg < 42) {
    engine.lowFpsStreak += dt
  } else {
    engine.lowFpsStreak = Math.max(0, engine.lowFpsStreak - dt)
  }
  if (engine.lowFpsStreak > 1800) {
    if (engine.quality === 'high') engine.quality = 'medium'
    else if (engine.quality === 'medium') engine.quality = 'low'
    engine.lowFpsStreak = 0
  }

  // 通过 destination-out 衰减上一帧（形成拖尾），不会把底层渐变“涂黑”
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = `rgba(0,0,0,${cfg.fadeAlpha})`
  ctx.fillRect(0, 0, engine.width, engine.height)

  // 发光叠加
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 自动烟花（克制高级：频率低、粒子少，但持续）
  if (now >= engine.nextAutoLaunchAt) {
    spawnRocket(engine)
    scheduleNextAutoLaunch(engine, now)
  }

  const step = dt / 16.67

  for (let i = engine.particles.length - 1; i >= 0; i--) {
    const p = engine.particles[i]
    if (!p.active) {
      recycleParticle(engine, i)
      continue
    }

    p.lifeMs -= dt
    if (p.lifeMs <= 0) {
      // rocket 兜底：寿命耗尽也要爆（避免偶发“无爆炸”）
      if (p.kind === 'rocket') {
        burstAt(engine, p.x, p.y, 'normal')
      }
      recycleParticle(engine, i)
      continue
    }

    const t = clamp(p.lifeMs / p.maxLifeMs, 0, 1)
    p.alpha = clamp(Math.pow(t, 1.2), 0, 1)

    // 更新
    p.prevX = p.x
    p.prevY = p.y

    if (p.kind === 'ring') {
      p.ringRadius = (p.ringRadius || 0) + (p.ringRadiusSpeed || 0) * step
      if (p.ringLineWidth) p.ringLineWidth = Math.max(0.8, p.ringLineWidth - 0.02 * step)

      // 绘制 ring
      ctx.globalAlpha = p.alpha
      const r = p.ringRadius || 0
      if (r > 0) {
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.ringLineWidth || 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      continue
    }

    // 位置更新
    p.x += p.vx * step
    p.y += p.vy * step

    if (p.kind === 'rocket') {
      // rocket：轻微抖动火星，提升真实感（但保持克制）
      const sparkProb = engine.quality === 'high' ? 0.45 : engine.quality === 'medium' ? 0.35 : 0.25
      if (Math.random() < sparkProb) spawnSpark(engine, p.x, p.y)

      // 触顶条件：到达目标高度
      if (typeof p.targetY === 'number' && p.y <= p.targetY) {
        burstAt(engine, p.x, p.y, 'normal')
        recycleParticle(engine, i)
        continue
      }

      // 兜底：避免“低空爆炸”（用户反馈：只在下方绽放不符合直觉）
      if (p.lifeMs < 60) {
        const minY = engine.height * 0.62
        if (p.y > minY) {
          // 让它再飞一会儿再爆（不改变整体频率，只修正爆点高度）
          p.lifeMs = 220
          p.maxLifeMs += 220
        } else {
          burstAt(engine, p.x, p.y, 'normal')
          recycleParticle(engine, i)
          continue
        }
      }

      // rocket 更像“推进上升”，让爆点更容易到达上半屏（符合视觉直觉）
      const rocketFriction = 0.992
      p.vy += cfg.gravity * 0.18 * step
      p.vx *= Math.pow(rocketFriction, step)
      p.vy *= Math.pow(rocketFriction, step)

      // 越界回收
      if (p.x < -80 || p.x > engine.width + 80 || p.y < -160 || p.y > engine.height + 140) {
        recycleParticle(engine, i)
        continue
      }

      // 绘制 rocket
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 1.25, 0, Math.PI * 2)
      ctx.fill()
      continue
    }

    // 普通粒子：重力与阻力（写意自然）
    p.vy += cfg.gravity * step
    p.vx *= Math.pow(cfg.friction, step)
    p.vy *= Math.pow(cfg.friction, step)

    // 越界回收（避免无意义绘制）
    if (p.x < -80 || p.x > engine.width + 80 || p.y < -120 || p.y > engine.height + 140) {
      recycleParticle(engine, i)
      continue
    }

    // 绘制（线段拖尾 + 终点亮点）
    ctx.globalAlpha = p.alpha
    ctx.strokeStyle = p.color
    ctx.lineWidth = p.size
    ctx.beginPath()
    ctx.moveTo(p.prevX, p.prevY)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()

    if (p.kind === 'bloom' || p.kind === 'trail') {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }

    if (p.kind === 'spark' && Math.random() < 0.3) {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
}

const FireworksBackground = forwardRef<FireworksBackgroundHandle, FireworksBackgroundProps>(
  ({ active = true, className }, ref) => {
    const engineRef = useRef<Engine | null>(null)
    const activeRef = useRef(active)
    activeRef.current = active

    const init = async () => {
      if (engineRef.current) return

      const { windowWidth, windowHeight, pixelRatio } = Taro.getSystemInfoSync()
      const dpr = Math.min(Number(pixelRatio || 1), 2)

      Taro.createSelectorQuery()
        .select('#fireworks-canvas')
        .node()
        .exec((res) => {
          const canvas = res?.[0]?.node
          if (!canvas) return

          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // 物理像素尺寸（保持清晰），绘制坐标仍使用 CSS 像素
          canvas.width = Math.floor(windowWidth * dpr)
          canvas.height = Math.floor(windowHeight * dpr)
          ctx.scale(dpr, dpr)

          const quality = detectInitialQuality()
          const poolSize = QUALITY_CONFIG[quality].maxParticles

          const engine: Engine = {
            canvas,
            ctx,
            width: windowWidth,
            height: windowHeight,
            dpr,
            running: false,
            rafId: null,
            lastTs: 0,
            fpsAvg: 60,
            lowFpsStreak: 0,
            quality,
            particles: [],
            pool: createPool(poolSize),
            nextAutoLaunchAt: 0, // 首帧内会用 rAF 的时间戳初始化
            lastTrailAt: 0,
            lastTouchX: null,
            lastTouchY: null,
          }

          engineRef.current = engine

          if (activeRef.current) start()
        })
    }

    const stop = () => {
      const engine = engineRef.current
      if (!engine) return
      engine.running = false
      if (engine.rafId && typeof engine.canvas?.cancelAnimationFrame === 'function') {
        engine.canvas.cancelAnimationFrame(engine.rafId)
      }
      engine.rafId = null
    }

    const loop = (ts: number) => {
      const engine = engineRef.current
      if (!engine || !engine.running) return

      updateAndRender(engine, ts || Date.now())
      engine.rafId = engine.canvas.requestAnimationFrame(loop)
    }

    const start = () => {
      const engine = engineRef.current
      if (!engine) return
      if (engine.running) return
      engine.running = true
      engine.rafId = engine.canvas.requestAnimationFrame(loop)
    }

    useImperativeHandle(ref, () => ({
      burstAt: (x: number, y: number, strength = 'normal') => {
        const engine = engineRef.current
        if (!engine) return
        burstAt(engine, x, y, strength)
      },
    }))

    useEffect(() => {
      void init()
      return () => {
        stop()
        engineRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      const engine = engineRef.current
      if (!engine) return
      if (active) start()
      else stop()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active])

    const handleTap = (e: any) => {
      const engine = engineRef.current
      if (!engine) return
      const point = getPointFromEvent(e)
      if (!point) return
      burstAt(engine, point.x, point.y, 'soft')
    }

    const handleTouchStart = (e: any) => {
      const engine = engineRef.current
      if (!engine) return
      const point = getPointFromEvent(e)
      if (!point) return
      engine.lastTouchX = point.x
      engine.lastTouchY = point.y
      engine.lastTrailAt = Date.now()
      // 触摸起点给一点微弱星尘（科技感）
      spawnTouchTrail(engine, point.x, point.y)
    }

    const handleTouchEnd = () => {
      const engine = engineRef.current
      if (!engine) return
      engine.lastTouchX = null
      engine.lastTouchY = null
    }

    const handleTouchMove = (e: any) => {
      const engine = engineRef.current
      if (!engine) return
      const point = getPointFromEvent(e)
      if (!point) return

      const cfg = QUALITY_CONFIG[engine.quality]
      const now = Date.now()
      if (now - engine.lastTrailAt < cfg.trailEmitIntervalMs) return

      // 插值：快速滑动时也要连续（但限制每次最多 3 个点，避免爆量）
      const lastX = engine.lastTouchX ?? point.x
      const lastY = engine.lastTouchY ?? point.y
      engine.lastTouchX = point.x
      engine.lastTouchY = point.y
      engine.lastTrailAt = now

      const dx = point.x - lastX
      const dy = point.y - lastY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxSteps = 3
      const stepDist = 14
      const steps = Math.max(1, Math.min(maxSteps, Math.floor(dist / stepDist)))

      for (let i = 0; i < steps; i++) {
        const t = steps === 1 ? 1 : (i + 1) / steps
        spawnTouchTrail(engine, lastX + dx * t, lastY + dy * t)
      }
    }

    return (
      <View className={`fireworks-bg ${className || ''}`}>
        <View
          className='fireworks-bg__touch'
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Canvas
            id='fireworks-canvas'
            type='2d'
            className='fireworks-bg__canvas'
          />
          {/* 暗角 + 中心柔光：保证文字可读（不遮挡点击） */}
          <View className='fireworks-bg__vignette' />
        </View>
      </View>
    )
  }
)

FireworksBackground.displayName = 'FireworksBackground'

export default FireworksBackground

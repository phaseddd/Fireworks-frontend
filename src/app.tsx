import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import './app.scss'

function ensureDomGlobals() {
  const globalObject = globalThis as unknown as Record<string, unknown>

  const createSafeDomConstructor = () => {
    const SafeConstructor = function () {}
    Object.defineProperty(SafeConstructor, Symbol.hasInstance, {
      value: () => false,
    })
    return SafeConstructor
  }

  if (typeof globalObject.Element === 'undefined') {
    globalObject.Element = createSafeDomConstructor()
  }

  if (typeof globalObject.HTMLElement === 'undefined') {
    globalObject.HTMLElement = createSafeDomConstructor()
  }
}

ensureDomGlobals()

function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

function extractAgentCodeFromScene(scene: string): string | null {
  const decoded = safeDecodeURIComponent(scene)
  const match = decoded.match(/(?:^|&)a=([A-Z]\d{3})(?:&|$)/)
  return match?.[1] || null
}

function extractBindCodeFromScene(scene: string): string | null {
  const decoded = safeDecodeURIComponent(scene || '')
  const match = decoded.match(/(?:^|&)b=([^&]+)(?:&|$)/)
  if (match?.[1]) return match[1]
  if (/^FW-AGENT-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(decoded)) return decoded
  return null
}

/**
 * 处理 scene 参数：提取代理商码和绑定码
 *
 * 重要：App 级别（onLaunch/onShow/getLaunchOptionsSync）中，
 *   options.scene 是数字场景值（如 1047 = 扫描小程序码），
 *   options.query.scene 才是 wxacode.getUnlimited 传入的自定义 scene 字符串。
 *
 * agentCode: 永久有效，用于追踪客户来源
 * bindCode: 一次性使用，用于代理商绑定微信号
 */
function handleScene(options: Record<string, any> | undefined) {
  const rawScene = options?.query?.scene
  if (!rawScene) return

  const scene = safeDecodeURIComponent(String(rawScene))

  const agentCode = extractAgentCodeFromScene(scene)
  if (agentCode) {
    // 永久有效（直到再次扫码覆盖或用户清除缓存）
    Taro.setStorageSync('agentCode', agentCode)
  }

  const bindCode = extractBindCodeFromScene(scene)
  if (bindCode) {
    // 临时态：用于代理商扫码绑定二维码进入时触发绑定流程
    Taro.setStorageSync('pendingBindCode', bindCode)
  }
}

/**
 * 冷启动同步解析 scene（模块顶层执行）
 *
 * 重要：这段代码必须在 App 组件渲染之前执行，
 * 以确保首页的 useDidShow 能检测到 pendingBindCode
 */
try {
  handleScene(Taro.getLaunchOptionsSync())
} catch {
  // 非微信环境（如 H5 开发）可能抛出异常，静默忽略
}

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('Fireworks App launched!')

    // 热启动解析（从后台回到前台也可能携带 scene）
    Taro.onAppShow(handleScene)

    // 只在生产环境的微信小程序中初始化云调用
    if (process.env.TARO_ENV === 'weapp' && process.env.NODE_ENV === 'production') {
      const cloudEnv = process.env.TARO_APP_CLOUD_ENV
      if (cloudEnv) {
        Taro.cloud.init({ env: cloudEnv })
      } else {
        console.warn('[cloud] Missing TARO_APP_CLOUD_ENV, cloud APIs may fail in production')
      }
    }
  })

  // children 是将要会渲染的页面
  return children
}

export default App

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

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('Fireworks App launched!')

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

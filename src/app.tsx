import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
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
    console.log('🎆 Fireworks App launched!')
  })

  // children 是将要会渲染的页面
  return children
}

export default App

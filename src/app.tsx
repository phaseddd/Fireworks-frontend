import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import './app.scss'

function ensureDomGlobals() {
  const globalObject = globalThis as unknown as Record<string, unknown>

  if (typeof globalObject.Element === 'undefined') {
    globalObject.Element = function Element() {}
  }
  if (typeof globalObject.HTMLElement === 'undefined') {
    globalObject.HTMLElement = function HTMLElement() {}
  }
  if (typeof globalObject.Node === 'undefined') {
    globalObject.Node = function Node() {}
  }
}

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    ensureDomGlobals()
    console.log('🎆 Fireworks App launched!')
  })

  // children 是将要会渲染的页面
  return children
}

export default App

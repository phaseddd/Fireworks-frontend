import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

export type NavBarMetrics = {
  statusBarHeight: number
  navBarHeight: number
  totalHeight: number
}

export function getNavBarMetrics(): NavBarMetrics {
  let statusBarHeight = 20

  try {
    const wxAny =
      // eslint-disable-next-line no-undef
      (typeof wx !== 'undefined' ? wx : undefined) ||
      (typeof globalThis !== 'undefined' ? (globalThis as any).wx : undefined)
    if (wxAny && typeof wxAny.getWindowInfo === 'function') {
      const windowInfo = wxAny.getWindowInfo()
      const sbh = windowInfo?.statusBarHeight
      if (typeof sbh === 'number' && Number.isFinite(sbh)) {
        statusBarHeight = sbh || 20
      }
    }
  } catch {
    // ignore
  }

  let navBarHeight = 44
  try {
    const getMenuButtonBoundingClientRect = (Taro as any).getMenuButtonBoundingClientRect
    if (typeof getMenuButtonBoundingClientRect === 'function') {
      const rect = getMenuButtonBoundingClientRect()
      const top = rect?.top
      const height = rect?.height
      if (typeof top === 'number' && typeof height === 'number') {
        const gap = top - statusBarHeight
        const computed = gap * 2 + height
        if (Number.isFinite(computed) && computed > 0) {
          navBarHeight = computed
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    statusBarHeight,
    navBarHeight,
    totalHeight: statusBarHeight + navBarHeight,
  }
}

export function useNavBarMetrics(): NavBarMetrics {
  const [metrics, setMetrics] = useState<NavBarMetrics>(() => {
    try {
      return getNavBarMetrics()
    } catch {
      return { statusBarHeight: 20, navBarHeight: 44, totalHeight: 64 }
    }
  })

  useEffect(() => {
    try {
      setMetrics(getNavBarMetrics())
    } catch {
      // ignore
    }
  }, [])

  return metrics
}

import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import type { Product } from '@/types'

export interface WishlistItem {
  productId: number
  name: string
  price: number
  image: string
  quantity: number
  addedAt: number
}

const STORAGE_KEY = 'wishlist'
const WISHLIST_EVENT = 'wishlist:changed'

function getEventCenter():
  | { on: (eventName: string, callback: (data: any) => void) => void; off: (eventName: string, callback: (data: any) => void) => void; trigger: (eventName: string, data?: any) => void }
  | null {
  const eventCenter = (Taro as any).eventCenter
  if (!eventCenter) return null
  if (typeof eventCenter.on !== 'function') return null
  if (typeof eventCenter.off !== 'function') return null
  if (typeof eventCenter.trigger !== 'function') return null
  return eventCenter
}

function loadWishlistFromStorage(): WishlistItem[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        productId: Number(item?.productId),
        name: String(item?.name ?? ''),
        price: Number(item?.price ?? 0),
        image: String(item?.image ?? ''),
        quantity: Number(item?.quantity ?? 1),
        addedAt: Number(item?.addedAt ?? Date.now()),
      }))
      .filter((item) => Number.isFinite(item.productId) && item.productId > 0)
  } catch {
    return []
  }
}

function persistWishlist(items: WishlistItem[]) {
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(items))
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>(() => loadWishlistFromStorage())
  const itemsRef = useRef(items)
  itemsRef.current = items

  const reload = () => {
    setItems(loadWishlistFromStorage())
  }

  useEffect(() => {
    const eventCenter = getEventCenter()
    if (!eventCenter) return

    const handleExternalChange = (nextItems: WishlistItem[]) => {
      if (!Array.isArray(nextItems)) return
      if (nextItems === itemsRef.current) return
      setItems(nextItems)
    }

    eventCenter.on(WISHLIST_EVENT, handleExternalChange)
    return () => {
      eventCenter.off(WISHLIST_EVENT, handleExternalChange)
    }
  }, [])

  const syncWishlist = (nextItems: WishlistItem[]) => {
    persistWishlist(nextItems)
    setItems(nextItems)

    const eventCenter = getEventCenter()
    eventCenter?.trigger(WISHLIST_EVENT, nextItems)
  }

  const addItem = (product: Product) => {
    if (!product?.id) return

    const currentItems = loadWishlistFromStorage()
    const existing = currentItems.find((i) => i.productId === product.id)
    const nextItems = existing
      ? currentItems.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [
          ...currentItems,
          {
            productId: product.id,
            name: product.name,
            price: Number(product.price || 0),
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
            quantity: 1,
            addedAt: Date.now(),
          },
        ]

    syncWishlist(nextItems)

    Taro.showToast({ title: '已加入清单', icon: 'success', duration: 1200 })
  }

  const removeItem = (productId: number) => {
    const currentItems = loadWishlistFromStorage()
    syncWishlist(currentItems.filter((i) => i.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) return
    const currentItems = loadWishlistFromStorage()
    syncWishlist(currentItems.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }

  const clearAll = () => syncWishlist([])

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  return { items, addItem, removeItem, updateQuantity, clearAll, total, count, reload }
}

export default useWishlist

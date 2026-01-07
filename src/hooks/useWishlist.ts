import { useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    persistWishlist(items)
  }, [items])

  const addItem = (product: Product) => {
    if (!product?.id) return

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }

      const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ''
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price || 0),
          image: firstImage,
          quantity: 1,
          addedAt: Date.now(),
        },
      ]
    })

    Taro.showToast({ title: '已加入清单', icon: 'success', duration: 1200 })
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) return
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }

  const clearAll = () => setItems([])

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  return { items, addItem, removeItem, updateQuantity, clearAll, total, count }
}

export default useWishlist


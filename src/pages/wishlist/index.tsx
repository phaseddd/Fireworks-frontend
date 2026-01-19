import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { Dialog } from '@nutui/nutui-react-taro'
import useWishlist, { type WishlistItem } from '@/hooks/useWishlist'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import PageHeader from '@/components/ui/PageHeader'
import { useNavBarMetrics } from '@/hooks/useNavBarMetrics'
import './index.scss'

/**
 * 我的/意向清单页面 - TabBar 页面
 * Story 3.1: 意向清单功能
 * Story 3.2: 生成询价单入口
 */
export default function Wishlist() {
  const { items, updateQuantity, removeItem, clearAll, total, count, reload } = useWishlist()
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [clearDialogVisible, setClearDialogVisible] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WishlistItem | null>(null)
  
  const { totalHeight: headerHeight } = useNavBarMetrics()
  const hasItems = items.length > 0

  useDidShow(() => {
    reload()
  })

  const itemCountText = useMemo(() => (count > 99 ? '99+' : String(count)), [count])

  const handleDelete = (item: WishlistItem) => {
    setDeleteTarget(item)
    setDeleteDialogVisible(true)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    removeItem(deleteTarget.productId)
    setDeleteDialogVisible(false)
    setDeleteTarget(null)
  }

  const handleClearAll = () => {
    setClearDialogVisible(true)
  }

  const handleConfirmClear = () => {
    clearAll()
    setClearDialogVisible(false)
  }

  const handleGoProducts = () => {
    Taro.switchTab({ url: '/pages/products/list/index' })
  }

  const handleCreateInquiry = () => {
    if (items.length === 0) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/pages/inquiry/create/index' })
  }

  return (
    <View
      className='wishlist-page'
      style={{ paddingTop: `${headerHeight}px`, paddingBottom: hasItems ? '240rpx' : '0' }}
    >
      <PageHeader title="意向清单" showBack={false} />

      {hasItems && (
        <View className='header-stats'>
          <View className='title-row'>
            <Text className='title'>已选商品</Text>
            <View className='badge'>
              <Text className='badge-text'>{itemCountText}</Text>
            </View>
          </View>
          <GlassButton
            className='clear-btn'
            onClick={handleClearAll}
            variant='ghost'
            style={{ width: '80px', height: '32px', fontSize: '12px' }}
          >
            清空
          </GlassButton>
        </View>
      )}

      {items.length === 0 ? (
        <View className='empty'>
          <Text className='empty-icon'>❤️</Text>
          <Text className='empty-title'>还没有收藏商品哦</Text>
          <Text className='empty-desc'>去商品页挑选心仪的烟花吧</Text>
          <GlassButton className='go-btn' variant='primary' onClick={handleGoProducts}>
            去逛逛
          </GlassButton>
        </View>
      ) : (
        <View className='list'>
          {items.map((item) => (
            <GlassCard key={item.productId} className='item' padding={0}>
              <View className='item-content'>
                <Image className='item-image' src={item.image} mode='aspectFill' />
                <View className='item-info'>
                  <Text className='item-name'>{item.name}</Text>
                  <Text className='item-price'>¥{Number(item.price || 0).toFixed(2)}</Text>
                </View>
                <View className='item-actions'>
                  <View className='delete' onClick={() => handleDelete(item)}>
                    <Text className='delete-text'>删除</Text>
                  </View>
                  <View className='qty'>
                    <View className='qty-btn' onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      <Text className='qty-btn-text'>-</Text>
                    </View>
                    <Text className='qty-value'>{item.quantity}</Text>
                    <View className='qty-btn' onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      <Text className='qty-btn-text'>+</Text>
                    </View>
                  </View>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {hasItems && (
        <View className='bottom-bar'>
        <View className='summary'>
          <Text className='summary-text'>共 {count} 件</Text>
          <Text className='summary-total'>预估总价 ¥{total.toFixed(2)}</Text>
        </View>
        <GlassButton className='create-btn' variant='primary' onClick={handleCreateInquiry}>
          生成询价单
        </GlassButton>
        </View>
      )}

      <Dialog
        title='确认删除'
        visible={deleteDialogVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      >
        <View className='dialog-content'>
          <Text>确定要删除“{deleteTarget?.name}”吗？</Text>
        </View>
      </Dialog>

      <Dialog
        title='确认清空'
        visible={clearDialogVisible}
        onConfirm={handleConfirmClear}
        onCancel={() => setClearDialogVisible(false)}
      >
        <View className='dialog-content'>
          <Text>确定要清空所有意向清单商品吗？</Text>
        </View>
      </Dialog>
    </View>
  )
}

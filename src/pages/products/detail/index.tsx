import { useState, useEffect } from 'react'
import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { api } from '@/services/api'
import { categoryMap } from '@/types'
import type { Product } from '@/types'
import './index.scss'

/**
 * 商品详情页面
 * Story 2.3 - 展示商品详细信息，支持图片轮播和二维码识别
 */
export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.params

  // 状态管理
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 加载商品数据
  useEffect(() => {
    if (!id) {
      setError('商品 ID 无效')
      setLoading(false)
      return
    }

    const loadProduct = async () => {
      try {
        const data = await api.products.publicDetail(Number(id))
        setProduct(data)
        setCurrentImageIndex(0)
      } catch (err) {
        console.error('加载商品详情失败:', err)
        setError('商品加载失败')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  // 处理轮播切换
  const handleSwiperChange = (e: { detail: { current: number } }) => {
    setCurrentImageIndex(e.detail.current)
  }

  // 处理图片预览
  const handlePreviewImage = (index: number, options?: { showMenu?: boolean }) => {
    if (!product?.images?.length) return

    Taro.previewImage({
      current: product.images[index],
      urls: product.images,
      // 微信小程序：预览页右上角菜单（用于“识别图中二维码”等）
      showmenu: options?.showMenu ?? false
    } as any)
  }

  // 处理长按（第三张图提示二维码）
  const handleLongPress = (index: number) => {
    if (index === 2 && product?.images?.[2]) {
      handlePreviewImage(index, { showMenu: true })
    }
  }

  // 添加到意向清单（暂时禁用）
  const handleAddToWishlist = () => {
    Taro.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none',
      duration: 2000
    })
  }

  // 返回上一页
  const handleGoBack = () => {
    Taro.navigateBack()
  }

  // 加载状态
  if (loading) {
    return (
      <View className='detail-page'>
        <View className='loading-state'>
          <Text className='loading-icon'>🎆</Text>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  // 错误状态
  if (error) {
    return (
      <View className='detail-page'>
        <View className='error-state'>
          <Text className='error-icon'>😿</Text>
          <Text className='error-text'>{error}</Text>
          <Button className='retry-btn' onClick={handleGoBack}>
            返回上一页
          </Button>
        </View>
      </View>
    )
  }

  // 商品不存在
  if (!product) {
    return (
      <View className='detail-page'>
        <View className='error-state'>
          <Text className='error-icon'>🔍</Text>
          <Text className='error-text'>商品不存在</Text>
          <Button className='retry-btn' onClick={handleGoBack}>
            返回上一页
          </Button>
        </View>
      </View>
    )
  }

  const images = product.images || []
  const hasImages = images.length > 0
  const priceNumber = Number(product.price)
  const priceText = Number.isFinite(priceNumber) ? priceNumber.toFixed(2) : String(product.price ?? '')

  return (
    <View className='detail-page'>
      {/* 图片轮播区域 */}
      <View className='image-section'>
        {hasImages ? (
          <Swiper
            className='image-swiper'
            circular
            indicatorDots={false}
            current={currentImageIndex}
            touchable
            onChange={handleSwiperChange}
          >
            {images.map((img, index) => (
              <SwiperItem key={`${index}-${img}`} className='swiper-item'>
                <Image
                  className='product-image'
                  src={img}
                  mode='aspectFill'
                  onClick={() => handlePreviewImage(index, { showMenu: index === 2 })}
                  onLongPress={index === 2 ? () => handleLongPress(index) : undefined}
                />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className='no-image'>
            <Text className='no-image-icon'>🎆</Text>
            <Text className='no-image-text'>暂无图片</Text>
          </View>
        )}

        {/* 图片指示器 */}
        {hasImages && images.length > 1 && (
          <View className='image-indicator'>
            <Text className='indicator-text'>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {/* 二维码提示 */}
        {currentImageIndex === 2 && images.length > 2 && (
          <View className='qrcode-hint'>
            <Text className='hint-icon'>💡</Text>
            <Text className='hint-text'>预览后长按识别二维码查看燃放效果</Text>
          </View>
        )}

        {/* 返回按钮 */}
        <View className='back-button' onClick={handleGoBack}>
          <Text className='back-icon'>←</Text>
        </View>
      </View>

      {/* 商品信息卡片 - 毛玻璃效果 */}
      <View className='product-info-card'>
        {/* 商品名称 */}
        <Text className='product-name'>{product.name}</Text>

        {/* 商品价格 */}
        <View className='price-row'>
          <Text className='product-price'>{priceText}</Text>
        </View>

        {/* 分类标签 */}
        <View className='category-tag'>
          <Text className='category-text'>
            {categoryMap[product.category] || '其他'}
          </Text>
        </View>

        {/* 商品描述 */}
        {product.description && (
          <View className='description-section'>
            <Text className='section-title'>商品描述</Text>
            <Text className='product-desc'>{product.description}</Text>
          </View>
        )}
      </View>

      {/* 底部操作栏 - 毛玻璃效果 */}
      <View className='bottom-bar'>
        <Button
          className='add-btn disabled'
          onClick={handleAddToWishlist}
        >
          加入意向清单
        </Button>
      </View>
    </View>
  )
}

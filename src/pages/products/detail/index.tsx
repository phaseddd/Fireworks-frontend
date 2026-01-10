import { useState, useEffect } from 'react'
import { View, Text, Swiper, SwiperItem, Image, Video } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { api } from '@/services/api'
import { categoryMap } from '@/types'
import type { Product } from '@/types'
import { useWishlist } from '@/hooks/useWishlist'
import './index.scss'

/**
 * 商品详情页面
 * Story 2.3 - 展示商品详细信息，支持图片轮播和二维码识别
 */
export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.params
  const { addItem } = useWishlist()

  // 状态管理
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [qrcodeViewerUrl, setQrcodeViewerUrl] = useState<string | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)

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
  const handlePreviewImage = (index: number) => {
    if (!product?.images?.length) return

    Taro.previewImage({
      current: product.images[index],
      urls: product.images,
      showmenu: false
    } as any)
  }

  const openQrcodeViewer = (url: string) => setQrcodeViewerUrl(url)
  const closeQrcodeViewer = () => setQrcodeViewerUrl(null)

  // 添加到意向清单
  const handleAddToWishlist = () => {
    if (!product) return
    addItem(product)
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
  const hasQrCodeImage = images.length > 2
  const hasVideo = Boolean(product.videoUrl)
  const priceNumber = Number(product.price)
  const priceText = Number.isFinite(priceNumber) ? priceNumber.toFixed(2) : String(product.price ?? '')
  const qrHintText = hasVideo
    ? '视频在下方可直接播放；二维码用于跳转厂家页面'
    : '暂未获取燃放视频，可点开二维码后在弹窗内长按识别'
  const qrViewerTipTitle = hasVideo ? '视频已在详情页提供播放' : '暂无法获取燃放视频'
  const qrViewerTipDesc = hasVideo
    ? '此二维码用于跳转厂家页面/小程序，长按即可识别'
    : '请长按识别二维码；若无识别入口，可转发到微信聊天后长按识别'

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
            onChange={handleSwiperChange}
          >
            {images.map((img, index) => (
              <SwiperItem key={`${index}-${img}`} className='swiper-item'>
                <Image
                  className='product-image'
                  src={img}
                  mode={index === 2 ? 'aspectFit' : 'aspectFill'}
                  onClick={() => (index === 2 ? openQrcodeViewer(img) : handlePreviewImage(index))}
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
        {currentImageIndex === 2 && hasQrCodeImage && (
          <View className='qrcode-hint'>
            <View className='hint-icon'>i</View>
            <Text className='hint-text'>{qrHintText}</Text>
          </View>
        )}

        {/* 二维码大图（使用 Image 长按菜单能力，避免 wx.previewImage 行为差异） */}
        {qrcodeViewerUrl && (
          <View className='qrcode-viewer-mask' onClick={closeQrcodeViewer}>
            <View className='qrcode-viewer' onClick={(e) => e.stopPropagation()}>
              <View className='qrcode-viewer-header'>
                <Text className='qrcode-viewer-title'>二维码</Text>
                <View className='qrcode-viewer-close' onClick={closeQrcodeViewer}>
                  <Text className='qrcode-viewer-close-icon'>×</Text>
                </View>
              </View>
              <Image
                className='qrcode-viewer-img'
                src={qrcodeViewerUrl}
                mode='widthFix'
                showMenuByLongpress
              />
              <View className='qrcode-viewer-tip'>
                <View className='tip-icon'>i</View>
                <View className='tip-content'>
                  <View className='tip-title'>{qrViewerTipTitle}</View>
                  <View className='tip-desc'>{qrViewerTipDesc}</View>
                </View>
              </View>
            </View>
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

        {/* 燃放效果视频 */}
        {product.videoUrl && (
          <View className='video-section'>
            <Text className='section-title'>燃放效果预览</Text>
            {showVideoPlayer ? (
              <Video
                className='video-player'
                src={product.videoUrl}
                controls
                autoplay
                showFullscreenBtn
                showPlayBtn
                showCenterPlayBtn
                objectFit='contain'
              />
            ) : (
              <View className='video-placeholder' onClick={() => setShowVideoPlayer(true)}>
                <Text className='play-icon'>▶</Text>
                <Text className='play-text'>点击播放燃放效果视频</Text>
              </View>
            )}
          </View>
        )}

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
          className='add-btn'
          onClick={handleAddToWishlist}
        >
          加入意向清单
        </Button>
      </View>
    </View>
  )
}

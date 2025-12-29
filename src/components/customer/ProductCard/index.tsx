import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Product } from '@/types'
import './index.scss'

interface ProductCardProps {
  product: Product
}

/**
 * 商品卡片组件
 * - 显示商品主图、名称、价格
 * - 点击跳转到商品详情页
 */
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // 从 images 数组获取主图（索引 0 为外观图）
  const mainImage = product.images?.[0] || ''

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/products/detail/index?id=${product.id}`
    })
  }

  return (
    <View className='product-card' onClick={handleClick}>
      <View className='product-image'>
        {mainImage ? (
          <Image
            src={mainImage}
            mode='aspectFill'
            lazyLoad
          />
        ) : (
          <View className='product-image-placeholder'>
            <Text className='placeholder-text'>暂无图片</Text>
          </View>
        )}
      </View>
      <View className='product-info'>
        <Text className='product-name'>{product.name}</Text>
        <Text className='product-price'>{product.price}</Text>
      </View>
    </View>
  )
}

export default ProductCard

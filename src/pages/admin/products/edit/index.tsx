/**
 * 商品编辑页面
 * Story 1.7: 商品编辑与状态管理
 * BF-1: 支持动态分类管理
 */
import { View, Text, Input, Textarea } from '@tarojs/components'
import { useDidShow, useRouter } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Button, Picker, Switch } from '@nutui/nutui-react-taro'
import useAuth from '../../../../hooks/useAuth'
import { api } from '../../../../services/api'
import type { ProductStatus, Product, Category } from '../../../../types'
import ProductImageUploader, {
  validateProductImages,
  type ProductImages
} from '../../../../components/admin/ProductImageUploader'
import './index.scss'

// Form data interface
interface FormData {
  name: string
  price: string
  categoryId: number | null
  stock: string
  description: string
  status: ProductStatus
}

// Form errors interface
interface FormErrors {
  name?: string
  price?: string
  categoryId?: string
}

// Image errors interface
interface ImageErrors {
  main?: string
  qrcode?: string
}

// Array to ProductImages conversion
const arrayToImages = (arr: string[]): ProductImages => ({
  main: arr[0] || '',
  detail: arr[1] || '',
  qrcode: arr[2] || ''
})

// ProductImages to array conversion
const imagesToArray = (img: ProductImages): string[] => [
  img.main,
  img.detail,
  img.qrcode
]

export default function AdminProductEdit() {
  const router = useRouter()
  const productId = router.params.id
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  // Loading state
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)

  // Category options from API
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: number; text: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    categoryId: null,
    stock: '0',
    description: '',
    status: 'ON_SHELF'
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)

  // Images state
  const [images, setImages] = useState<ProductImages>({
    main: '',
    detail: '',
    qrcode: ''
  })
  const [imageErrors, setImageErrors] = useState<ImageErrors>({})

  // Load categories from API
  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const result = await api.categories.list()
      // Only show active categories
      const activeCategories = result.filter(c => c.status === 'ACTIVE')
      setCategories(activeCategories)
      setCategoryOptions(activeCategories.map(c => ({ value: c.id, text: c.name })))
    } catch (error) {
      console.error('加载分类失败:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Page show hook - check auth
  useDidShow(() => {
    requireAuth()
  })

  // Load categories on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadCategories()
    }
  }, [isAuthenticated])

  // Load product data after categories are loaded
  useEffect(() => {
    if (isAuthenticated && productId && !loadingCategories) {
      loadProduct()
    }
  }, [isAuthenticated, productId, loadingCategories])

  const loadProduct = async () => {
    if (!productId) {
      Taro.showToast({ title: '商品ID不存在', icon: 'error' })
      return
    }

    try {
      setLoading(true)
      const data = await api.products.detail(parseInt(productId, 10))
      setProduct(data)

      // Fill form with product data
      setFormData({
        name: data.name,
        price: data.price.toString(),
        categoryId: data.categoryId || null,
        stock: data.stock.toString(),
        description: data.description || '',
        status: data.status
      })

      // Convert images array to ProductImages object
      setImages(arrayToImages(data.images || []))
    } catch (error) {
      console.error('加载商品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get category display text
  const getCategoryText = (categoryId: number | null): string => {
    if (!categoryId) return '请选择分类'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || '请选择分类'
  }

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle category select
  const handleCategoryConfirm = (_options: unknown[], values: Array<string | number>) => {
    const rawValue = values?.[0]
    const selectedCategoryId = typeof rawValue === 'string' ? Number(rawValue) : rawValue
    if (typeof selectedCategoryId === 'number' && Number.isFinite(selectedCategoryId)) {
      setFormData(prev => ({ ...prev, categoryId: selectedCategoryId }))
      // Clear category error
      if (errors.categoryId) {
        setErrors(prev => ({ ...prev, categoryId: undefined }))
      }
    }
    setPickerVisible(false)
  }

  // Handle status change
  const handleStatusChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      status: checked ? 'ON_SHELF' : 'OFF_SHELF'
    }))
  }

  // Handle images change
  const handleImagesChange = (newImages: ProductImages) => {
    setImages(newImages)
    // Clear image errors when user uploads
    setImageErrors({})
  }

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = '请输入商品名称'
      isValid = false
    }

    // Price validation
    const priceNum = parseFloat(formData.price)
    if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = '请输入有效价格'
      isValid = false
    }

    // Category validation
    if (!formData.categoryId) {
      newErrors.categoryId = '请选择分类'
      isValid = false
    }

    setErrors(newErrors)

    // Image validation
    const imageValidation = validateProductImages(images)
    if (!imageValidation.valid) {
      setImageErrors(imageValidation.errors)
      isValid = false
    }

    return isValid
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm() || !productId) {
      return
    }

    setSubmitting(true)
    try {
      const categoryId = formData.categoryId
      if (categoryId == null) {
        throw new Error('请选择分类')
      }

      const requestData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        categoryId,
        stock: parseInt(formData.stock, 10) || 0,
        description: formData.description.trim(),
        status: formData.status,
        images: imagesToArray(images),
      }

      await api.products.update(parseInt(productId, 10), requestData)

      Taro.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500,
      })

      // Navigate back to list page after success
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('更新商品失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    Taro.navigateBack()
  }

  // Loading state
  if (authLoading || loadingCategories || loading) {
    return (
      <View className='admin-product-edit'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <View />
  }

  // Product not found
  if (!product) {
    return (
      <View className='admin-product-edit'>
        <View className='loading-container'>
          <Text className='loading-text'>商品不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='admin-product-edit'>
      {/* Header */}
      <View className='header'>
        <Text className='title'>编辑商品</Text>
      </View>

      {/* Form */}
      <View className='edit-form'>
        {/* Product name */}
        <View className='form-item'>
          <Text className='label'>
            商品名称 <Text className='required'>*</Text>
          </Text>
          <Input
            className={`input ${errors.name ? 'input-error' : ''}`}
            type='text'
            placeholder='请输入商品名称'
            value={formData.name}
            onInput={(e) => handleInputChange('name', e.detail.value)}
          />
          {errors.name && <Text className='error-text'>{errors.name}</Text>}
        </View>

        {/* Price */}
        <View className='form-item'>
          <Text className='label'>
            商品价格 <Text className='required'>*</Text>
          </Text>
          <Input
            className={`input ${errors.price ? 'input-error' : ''}`}
            type='digit'
            placeholder='请输入商品价格'
            value={formData.price}
            onInput={(e) => handleInputChange('price', e.detail.value)}
          />
          {errors.price && <Text className='error-text'>{errors.price}</Text>}
        </View>

        {/* Category */}
        <View className='form-item'>
          <Text className='label'>
            商品分类 <Text className='required'>*</Text>
          </Text>
          <View
            className={`picker-trigger ${errors.categoryId ? 'picker-error' : ''}`}
            onClick={() => setPickerVisible(true)}
          >
            <Text className='picker-text'>{getCategoryText(formData.categoryId)}</Text>
            <Text className='picker-arrow'>▼</Text>
          </View>
          {errors.categoryId && <Text className='error-text'>{errors.categoryId}</Text>}
        </View>

        {/* Stock */}
        <View className='form-item'>
          <Text className='label'>库存数量</Text>
          <Input
            className='input'
            type='number'
            placeholder='请输入库存数量'
            value={formData.stock}
            onInput={(e) => handleInputChange('stock', e.detail.value)}
          />
        </View>

        {/* Description */}
        <View className='form-item'>
          <Text className='label'>商品描述</Text>
          <Textarea
            className='textarea'
            placeholder='请输入商品描述（选填）'
            value={formData.description}
            onInput={(e) => handleInputChange('description', e.detail.value)}
            maxlength={500}
          />
        </View>

        {/* Status Switch */}
        <View className='form-item'>
          <Text className='label'>商品状态</Text>
          <View className='status-row'>
            <Text className={`status-text ${formData.status === 'OFF_SHELF' ? 'active' : ''}`}>
              下架
            </Text>
            <Switch
              checked={formData.status === 'ON_SHELF'}
              onChange={handleStatusChange}
              disabled={submitting}
            />
            <Text className={`status-text ${formData.status === 'ON_SHELF' ? 'active' : ''}`}>
              上架
            </Text>
          </View>
          <Text className='status-hint'>
            {formData.status === 'ON_SHELF' ? '商品将在客户端展示' : '商品将从客户端隐藏'}
          </Text>
        </View>

        {/* Image upload */}
        <View className='form-item'>
          <Text className='label'>商品图片</Text>
          <ProductImageUploader
            images={images}
            onChange={handleImagesChange}
            productId={productId ? Number(productId) : undefined}
            errors={imageErrors}
            disabled={submitting}
          />
        </View>

        {/* Button group */}
        <View className='button-group'>
          <Button
            className='cancel-btn'
            onClick={handleCancel}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            type='primary'
            className='submit-btn'
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? '保存中...' : '保存'}
          </Button>
        </View>
      </View>

      {/* Category Picker */}
      <Picker
        visible={pickerVisible}
        options={categoryOptions}
        onConfirm={handleCategoryConfirm}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  )
}

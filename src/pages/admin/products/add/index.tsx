import { View, Text, Input, Textarea } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Button, Picker } from '@nutui/nutui-react-taro'
import useAuth from '../../../../hooks/useAuth'
import { api } from '../../../../services/api'
import type { ProductCategory } from '../../../../types'
import './index.scss'

// Category options
const CATEGORY_OPTIONS = [
  { value: 'GIFT', text: '礼花类' },
  { value: 'FIREWORK', text: '烟花类' },
  { value: 'FIRECRACKER', text: '鞭炮类' },
  { value: 'COMBO', text: '组合类' },
  { value: 'OTHER', text: '其他' },
]

// Form data interface
interface FormData {
  name: string
  price: string
  category: ProductCategory
  stock: string
  description: string
}

// Form errors interface
interface FormErrors {
  name?: string
  price?: string
}

// Initial form data
const initialFormData: FormData = {
  name: '',
  price: '',
  category: 'GIFT',
  stock: '0',
  description: '',
}

export default function AdminProductAdd() {
  const { isAuthenticated, loading: authLoading, requireAuth } = useAuth()

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)

  // Page show hook - check auth
  useDidShow(() => {
    requireAuth()
  })

  // Get category display text
  const getCategoryText = (value: ProductCategory): string => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === value)
    return option?.text || '请选择分类'
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
  const handleCategoryConfirm = (_options: any[], values: (string | number)[]) => {
    if (values && values.length > 0) {
      setFormData(prev => ({ ...prev, category: values[0] as ProductCategory }))
    }
    setPickerVisible(false)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = '请输入商品名称'
    }

    // Price validation
    const priceNum = parseFloat(formData.price)
    if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = '请输入有效价格'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const requestData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10) || 0,
        description: formData.description.trim(),
      }

      await api.products.create(requestData)

      Taro.showToast({
        title: '创建成功',
        icon: 'success',
        duration: 1500,
      })

      // Navigate back to list page after success
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('创建商品失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <View className='admin-product-add'>
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

  return (
    <View className='admin-product-add'>
      {/* Header */}
      <View className='header'>
        <Text className='title'>添加商品</Text>
      </View>

      {/* Form */}
      <View className='add-form'>
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
          <Text className='label'>商品分类</Text>
          <View className='picker-trigger' onClick={() => setPickerVisible(true)}>
            <Text className='picker-text'>{getCategoryText(formData.category)}</Text>
            <Text className='picker-arrow'>▼</Text>
          </View>
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

        {/* Image upload hint */}
        <View className='form-item'>
          <Text className='label'>商品图片</Text>
          <View className='image-hint'>
            <Text className='hint-text'>图片上传功能将在后续版本中提供</Text>
          </View>
        </View>

        {/* Submit button */}
        <Button
          type='primary'
          className='submit-btn'
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '保存商品'}
        </Button>
      </View>

      {/* Category Picker */}
      <Picker
        visible={pickerVisible}
        options={CATEGORY_OPTIONS}
        onConfirm={handleCategoryConfirm}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  )
}

/**
 * 商品图片上传组件 - 分槽位设计
 * 槽位1: 商品外观图 (必填)
 * 槽位2: 商品细节图 (可选)
 * 槽位3: 二维码图 (必填)
 */
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { chooseAndUploadImage, type ImageSlot } from '../../../services/storage'
import './index.scss'

// 商品图片数据结构
export interface ProductImages {
  main: string      // 商品外观图 (必填)
  detail: string    // 商品细节图 (可选)
  qrcode: string    // 二维码图 (必填)
}

// 槽位配置
interface SlotConfig {
  key: ImageSlot
  title: string
  required: boolean
  hint: string
}

const SLOT_CONFIGS: SlotConfig[] = [
  {
    key: 'main',
    title: '商品外观图',
    required: true,
    hint: '请上传商品正面外观照片'
  },
  {
    key: 'detail',
    title: '商品细节图',
    required: false,
    hint: '可选：上传商品细节或包装照片'
  },
  {
    key: 'qrcode',
    title: '二维码图',
    required: true,
    hint: '请拍摄包装上的燃放效果二维码'
  }
]

// 组件属性
interface ProductImageUploaderProps {
  images: ProductImages
  onChange: (images: ProductImages) => void
  /**
   * 商品 ID（可选）
   * - 编辑页已存在商品：传入 productId，文件存储到 products/{productId}/...
   * - 新增页未创建商品：不传，文件存储到 products/temp/...
   */
  productId?: number
  errors?: {
    main?: string
    qrcode?: string
  }
  disabled?: boolean
}

export default function ProductImageUploader({
  images,
  onChange,
  productId,
  errors = {},
  disabled = false
}: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState<Record<ImageSlot, boolean>>({
    main: false,
    detail: false,
    qrcode: false,
  })

  const [progress, setProgress] = useState<Record<ImageSlot, number>>({
    main: 0,
    detail: 0,
    qrcode: 0,
  })

  const [uploadErrors, setUploadErrors] = useState<Record<ImageSlot, string | undefined>>({
    main: undefined,
    detail: undefined,
    qrcode: undefined,
  })

  const setSlotUploading = (slot: ImageSlot, value: boolean) => {
    setUploading(prev => ({ ...prev, [slot]: value }))
  }

  const setSlotProgress = (slot: ImageSlot, value: number) => {
    const safe = Math.max(0, Math.min(100, Math.round(value)))
    setProgress(prev => ({ ...prev, [slot]: safe }))
  }

  const setSlotError = (slot: ImageSlot, value?: string) => {
    setUploadErrors(prev => ({ ...prev, [slot]: value }))
  }

  const getUploadErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) {
        return message
      }
    }
    return '上传失败，请重试'
  }

  // 处理上传
  const handleUpload = async (slot: ImageSlot) => {
    if (disabled || uploading[slot]) return

    try {
      setSlotError(slot, undefined)
      setSlotProgress(slot, 0)
      setSlotUploading(slot, true)

      const url = await chooseAndUploadImage(slot, productId, {
        onProgress: (p) => setSlotProgress(slot, p),
      })
      onChange({ ...images, [slot]: url })
    } catch (error) {
      console.error('Upload failed:', error)
      setSlotError(slot, getUploadErrorMessage(error))
    } finally {
      setSlotUploading(slot, false)
    }
  }

  // 处理删除
  const handleDelete = (slot: ImageSlot) => {
    if (disabled || uploading[slot]) return

    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          onChange({ ...images, [slot]: '' })
        }
      }
    })
  }

  // 处理预览
  const handlePreview = (url: string) => {
    if (!url) return

    Taro.previewImage({
      current: url,
      urls: [images.main, images.detail, images.qrcode].filter(Boolean)
    })
  }

  return (
    <View className='product-image-uploader'>
      {SLOT_CONFIGS.map((slot) => {
        const imageUrl = images[slot.key]
        const validateError = errors[slot.key as keyof typeof errors]
        const uploadError = uploadErrors[slot.key]
        const errorText = uploadError || validateError
        const hasError = !!errorText
        const isUploading = uploading[slot.key]
        const slotProgress = progress[slot.key]

        return (
          <View
            key={slot.key}
            className={`image-slot ${hasError ? 'error' : ''}`}
          >
            {/* 标题 */}
            <View className='slot-header'>
              <Text className='slot-title'>{slot.title}</Text>
              {slot.required && <Text className='required-mark'>*</Text>}
            </View>

            {/* 提示 */}
            <Text className='slot-hint'>{slot.hint}</Text>

            {/* 图片区域 */}
            {imageUrl ? (
              <View className='image-preview'>
                <Image
                  className='preview-img'
                  src={imageUrl}
                  mode='aspectFill'
                  onClick={() => handlePreview(imageUrl)}
                />
                {!disabled && !isUploading && (
                  <View
                    className='delete-btn'
                    onClick={() => handleDelete(slot.key)}
                  >
                    ×
                  </View>
                )}
              </View>
            ) : (
              <View
                className='upload-btn'
                onClick={() => handleUpload(slot.key)}
              >
                {isUploading ? (
                  <View className='uploading'>
                    <Text className='uploading-text'>上传中 {slotProgress}%</Text>
                    <View className='progress-bar'>
                      <View
                        className='progress-inner'
                        style={{ width: `${slotProgress}%` }}
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <Text className='plus'>+</Text>
                    <Text className='upload-text'>点击上传</Text>
                  </>
                )}
              </View>
            )}

            {/* 错误提示 */}
            {hasError && <Text className='error-text'>{errorText}</Text>}

            {/* 重试按钮 */}
            {!imageUrl && !disabled && !isUploading && uploadError && (
              <View
                className='retry-btn'
                onClick={() => handleUpload(slot.key)}
              >
                重试
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

/**
 * 验证图片
 */
export function validateProductImages(images: ProductImages): {
  valid: boolean
  errors: { main?: string; qrcode?: string }
} {
  const errors: { main?: string; qrcode?: string } = {}

  if (!images.main) {
    errors.main = '请上传商品外观图'
  }

  if (!images.qrcode) {
    errors.qrcode = '请上传燃放效果二维码图'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

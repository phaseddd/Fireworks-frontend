/**
 * 图片存储服务 - 双环境支持
 * 本地开发: 使用后端接口上传
 * 生产环境: 使用微信云托管对象存储
 */
import Taro from '@tarojs/taro'
import { authUtils } from '../hooks/useAuth'

// 图片槽位类型
export type ImageSlot = 'main' | 'detail' | 'qrcode'

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

// API 基础路径
const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080'
  : ''

/**
 * 判断是否为云环境
 */
const isCloudEnv = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

/**
 * 压缩图片
 * @param filePath 图片临时路径
 * @param quality 压缩质量 (0-100)
 * @returns 压缩后的图片路径
 */
export async function compressImage(filePath: string, quality: number = 80): Promise<string> {
  try {
    const res = await Taro.compressImage({
      src: filePath,
      quality
    })
    return res.tempFilePath
  } catch (error) {
    console.warn('Image compression failed, using original:', error)
    return filePath
  }
}

async function getFileSize(filePath: string): Promise<number | null> {
  try {
    const fs = Taro.getFileSystemManager()
    const res = await new Promise<{ size: number }>((resolve, reject) => {
      fs.getFileInfo({
        filePath,
        success: resolve,
        fail: reject
      })
    })
    return typeof res?.size === 'number' ? res.size : null
  } catch (error) {
    console.warn('Get file size failed:', error)
    return null
  }
}

async function compressToUnderLimit(filePath: string, slot: ImageSlot): Promise<string> {
  // 二维码图对清晰度更敏感：尽量少做有损压缩，降低“长按识别/扫码”失败概率
  const qualities = slot === 'qrcode'
    ? [100, 95, 90, 85]
    : [80, 60, 40]

  for (const quality of qualities) {
    const compressed = await compressImage(filePath, quality)
    const size = await getFileSize(compressed)
    if (size !== null && size <= MAX_IMAGE_SIZE_BYTES) {
      return compressed
    }
  }

  const fallbackSize = await getFileSize(filePath)
  if (fallbackSize !== null && fallbackSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('图片压缩后仍超过 2MB，请更换图片')
  }

  return filePath
}

export interface UploadOptions {
  onProgress?: (progress: number) => void
}

/**
 * 上传图片到云存储 (生产环境)
 */
async function uploadToCloud(
  filePath: string,
  slot: ImageSlot,
  productId?: number,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(0)
  const ext = filePath.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const cloudPath = productId
    ? `products/${productId}/${slot}_${timestamp}.${ext}`
    : `products/temp/${slot}_${timestamp}.${ext}`

  const res = await Taro.cloud.uploadFile({
    cloudPath,
    filePath
  })

  onProgress?.(100)
  return res.fileID
}

/**
 * 上传图片到本地服务器 (开发环境)
 */
async function uploadToLocal(
  filePath: string,
  slot: ImageSlot,
  onProgress?: (progress: number) => void
): Promise<string> {
  const token = authUtils.getToken()

  const res = await new Promise<any>((resolve, reject) => {
    const task = Taro.uploadFile({
      url: `${BASE_URL}/api/v1/upload/image`,
      filePath,
      name: 'file',
      formData: { slot },
      header: token ? { 'Authorization': `Bearer ${token}` } : {},
      success: resolve,
      fail: reject,
    }) as any

    if (task && typeof task.onProgressUpdate === 'function') {
      task.onProgressUpdate((progressEvent: { progress?: number }) => {
        if (typeof progressEvent?.progress === 'number') {
          onProgress?.(progressEvent.progress)
        }
      })
    }
  })

  if (res.statusCode !== 200) {
    throw new Error('上传失败')
  }

  const data = JSON.parse(res.data)
  if (data.code !== 200) {
    throw new Error(data.message || '上传失败')
  }

  // 返回完整 URL (本地开发需要加上 BASE_URL)
  return `${BASE_URL}${data.data.url}`
}

/**
 * 统一上传接口
 * @param filePath 图片临时路径
 * @param slot 图片槽位
 * @param productId 商品ID (可选，用于云存储路径)
 * @param options 上传选项
 * @returns 图片访问URL
 */
export async function uploadImage(
  filePath: string,
  slot: ImageSlot,
  productId?: number,
  options: UploadOptions = {}
): Promise<string> {
  const shouldUseGlobalLoading = !options.onProgress
  if (shouldUseGlobalLoading) {
    Taro.showLoading({ title: '上传中...' })
  }

  try {
    // 先压缩图片并校验大小 <= 2MB
    const compressed = await compressToUnderLimit(filePath, slot)

    let result: string

    if (isCloudEnv()) {
      result = await uploadToCloud(compressed, slot, productId, options.onProgress)
    } else {
      result = await uploadToLocal(compressed, slot, options.onProgress)
    }

    if (shouldUseGlobalLoading) {
      Taro.hideLoading()
      Taro.showToast({ title: '上传成功', icon: 'success', duration: 1500 })
    } else {
      options.onProgress?.(100)
    }
    return result
  } catch (error) {
    if (shouldUseGlobalLoading) {
      Taro.hideLoading()
    }
    Taro.showToast({ title: '上传失败', icon: 'error', duration: 1500 })
    console.error('Upload failed:', error)
    throw error
  }
}

/**
 * 选择并上传图片
 * @param slot 图片槽位
 * @param productId 商品ID (可选)
 * @returns 图片访问URL
 */
export async function chooseAndUploadImage(
  slot: ImageSlot,
  productId?: number,
  options: UploadOptions = {}
): Promise<string> {
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: slot === 'qrcode' ? ['original', 'compressed'] : ['compressed'],
    sourceType: ['album', 'camera']
  })

  if (res.tempFilePaths.length === 0) {
    throw new Error('未选择图片')
  }

  return uploadImage(res.tempFilePaths[0], slot, productId, options)
}

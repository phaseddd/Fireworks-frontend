import Taro from '@tarojs/taro'

/**
 * Download an image and save it to the user's photo album.
 *
 * Supports three URL protocols:
 *  - `cloud://`  → WeChat cloud storage (uses Taro.cloud.downloadFile)
 *  - `wxfile://` / `http://tmpfiles.*` → local temp file (use directly)
 *  - `http(s)://` → standard HTTP download (uses Taro.downloadFile)
 */
export async function saveImageToAlbum(url: string): Promise<void> {
  if (!url) return

  try {
    let tempFilePath: string

    if (url.startsWith('cloud://')) {
      // WeChat cloud storage file
      const res = await Taro.cloud.downloadFile({ fileID: url })
      tempFilePath = res.tempFilePath
    } else if (url.startsWith('wxfile://') || url.startsWith('http://tmp')) {
      // Already a local temp file path
      tempFilePath = url
    } else {
      // Standard HTTP(S) URL
      const res = await Taro.downloadFile({ url })
      if (res.statusCode !== 200) {
        throw new Error(`downloadFile failed with status ${res.statusCode}`)
      }
      tempFilePath = res.tempFilePath
    }

    await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
    Taro.showToast({ title: '已保存到相册', icon: 'success' })
  } catch (e: any) {
    const msg = e?.errMsg || ''
    if (msg.includes('deny') || msg.includes('auth')) {
      Taro.showModal({
        title: '提示',
        content: '需要您授权保存图片到相册',
        confirmText: '去授权',
        success: (r) => {
          if (r.confirm) Taro.openSetting()
        },
      })
    } else {
      console.error('[saveImageToAlbum] error:', url, e)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }
}

import { API_BASE } from '../api/request'
import type { Post } from '../types/admin'

export function getFullImageUrl(imageUrl: string) {
  const safeUrl = imageUrl.trim()
  if (!safeUrl) return ''
  if (safeUrl.startsWith('blob:') || safeUrl.startsWith('data:')) return safeUrl
  if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) return safeUrl
  if (safeUrl.startsWith('/')) return `${API_BASE}${safeUrl}`
  return `${API_BASE}/${safeUrl}`
}

export function splitImageUrls(raw: string) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getPostImageUrls(post: Post) {
  const rawUrls = post.imageUrls || post.imageUrl || ''
  return splitImageUrls(rawUrls)
    .map((item) => getFullImageUrl(item))
    .filter(Boolean)
    .slice(0, 9)
}

export function cropImageFile(
  file: File,
  aspectRatio: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      const naturalWidth = image.naturalWidth
      const naturalHeight = image.naturalHeight
      let cropWidth = Math.min(naturalWidth, naturalHeight * aspectRatio) / zoom
      let cropHeight = cropWidth / aspectRatio
      if (cropHeight > naturalHeight) {
        cropHeight = naturalHeight / zoom
        cropWidth = cropHeight * aspectRatio
      }
      const sourceX = (naturalWidth - cropWidth) * offsetX
      const sourceY = (naturalHeight - cropHeight) * offsetY
      const outputWidth = aspectRatio >= 1 ? 1200 : 1000
      const outputHeight = Math.round(outputWidth / aspectRatio)
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('裁剪画布创建失败'))
        return
      }
      context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('裁剪图片生成失败'))
          return
        }
        resolve(new File([blob], `cropped-${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    image.src = url
  })
}

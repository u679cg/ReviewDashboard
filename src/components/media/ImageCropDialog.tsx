import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Slider } from 'antd'
import type { CropRequest } from '../../types/admin'
import { cropImageFile } from '../../utils/image'

export function ImageCropDialog({
  request,
  onClose,
}: {
  request: CropRequest
  onClose: () => void
}) {
  const [offsetX, setOffsetX] = useState(50)
  const [offsetY, setOffsetY] = useState(50)
  const [zoom, setZoom] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const imageUrl = useMemo(() => URL.createObjectURL(request.file), [request.file])

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  const confirmCrop = async () => {
    setIsProcessing(true)
    try {
      const cropped = await cropImageFile(request.file, request.aspectRatio, offsetX / 100, offsetY / 100, zoom)
      request.onDone(cropped)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal
      open
      title={request.title}
      onCancel={onClose}
      footer={<Button type="primary" loading={isProcessing} onClick={() => void confirmCrop()}>确认裁剪并上传</Button>}
      width={720}
    >
      <div className="crop-dialog inline-crop-dialog">
        <div className="crop-preview" style={{ aspectRatio: String(request.aspectRatio) }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              style={{
                width: `${zoom * 100}%`,
                height: `${zoom * 100}%`,
                left: `${50 - offsetX * zoom}%`,
                top: `${50 - offsetY * zoom}%`,
              }}
            />
          )}
        </div>
        <div className="crop-controls">
          <label>
            横向位置
            <Slider min={0} max={100} value={offsetX} onChange={setOffsetX} />
          </label>
          <label>
            纵向位置
            <Slider min={0} max={100} value={offsetY} onChange={setOffsetY} />
          </label>
          <label>
            缩放
            <Slider min={1} max={3} step={0.05} value={zoom} onChange={setZoom} />
          </label>
        </div>
      </div>
    </Modal>
  )
}

import { Button, Upload } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { getFullImageUrl } from '../../utils/image'

export function VideoUploadField({
  label,
  videoUrl,
  isUploading,
  onChooseFile,
  onRemove,
}: {
  label: string
  videoUrl: string
  isUploading: boolean
  onChooseFile: (file: File) => void
  onRemove: () => void
}) {
  const safeUrl = videoUrl.trim()
  const fileList: UploadFile[] = safeUrl
    ? [{
        uid: safeUrl,
        name: safeUrl.split('/').pop() || safeUrl,
        status: 'done',
        url: getFullImageUrl(safeUrl),
      }]
    : []

  return (
    <div className="video-upload-field span-2">
      <Upload
        accept="video/*"
        maxCount={1}
        listType="picture-card"
        fileList={fileList}
        showUploadList={false}
        disabled={isUploading}
        beforeUpload={(file) => {
          onChooseFile(file as File)
          return Upload.LIST_IGNORE
        }}
        onRemove={() => {
          onRemove()
          return true
        }}
      >
        <div className={`image-upload-trigger${isUploading ? ' is-uploading' : ''}`}>
          <UploadOutlined />
          <span>{isUploading ? '上传中...' : label}</span>
        </div>
      </Upload>
      {safeUrl && (
        <div className="video-upload-preview">
          <video src={getFullImageUrl(safeUrl)} controls preload="metadata" />
          <Button icon={<DeleteOutlined />} onClick={onRemove}>移除视频</Button>
        </div>
      )}
    </div>
  )
}

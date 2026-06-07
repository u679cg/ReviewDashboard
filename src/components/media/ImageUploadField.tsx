import { Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { getFullImageUrl, splitImageUrls } from '../../utils/image'

export function ImageUploadField({
  label,
  imageUrls,
  multiple = false,
  isUploading,
  onChooseFile,
  onChooseFiles,
  onRemove,
}: {
  label: string
  imageUrls: string
  multiple?: boolean
  isUploading: boolean
  onChooseFile?: (file: File) => void
  onChooseFiles?: (files: File[]) => void
  onRemove: (url: string) => void
}) {
  const urls = splitImageUrls(imageUrls)
  const fileList: UploadFile[] = urls.map((url) => ({
    uid: url,
    name: url.split('/').pop() || url,
    status: 'done',
    url: getFullImageUrl(url),
  }))

  return (
    <div className="image-upload-field span-2">
      <Upload
        accept="image/*"
        multiple={multiple}
        listType="picture-card"
        fileList={fileList}
        beforeUpload={(file, files) => {
          if (multiple) {
            const currentFile = file as File & { uid?: string }
            const firstFile = files[0] as File & { uid?: string }
            if (!firstFile?.uid || currentFile.uid === firstFile.uid) {
              onChooseFiles?.(files as File[])
            }
          } else {
            onChooseFile?.(file as File)
          }
          return Upload.LIST_IGNORE
        }}
        onRemove={(file) => {
          onRemove(String(file.uid))
          return true
        }}
      >
        <Button icon={<UploadOutlined />} loading={isUploading}>{label}</Button>
      </Upload>
    </div>
  )
}

import { Button, Card, Empty, Form, InputNumber, Segmented, Select, Switch, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { deleteBanner, fetchBanners, saveBanner, updateBannerEnabled, uploadAdminImage } from '../../api/admin'
import { bannerPlacements } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { ImageCropDialog } from '../../components/media/ImageCropDialog'
import { ImageUploadField } from '../../components/media/ImageUploadField'
import { BannerCard } from '../../components/operations/OperationCards'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import type { BannerPlacement, CropRequest, OperationBanner, OperationBannerFormValue } from '../../types/admin'
import { emptyBannerForm, operationBannerToForm } from '../../utils/forms'

export function BannersPage() {
  const [form] = Form.useForm<OperationBannerFormValue>()
  const [messageApi, contextHolder] = message.useMessage()
  const [placement, setPlacement] = useState<'all' | BannerPlacement>('all')
  const [editing, setEditing] = useState<OperationBanner | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [cropRequest, setCropRequest] = useState<CropRequest | null>(null)
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const loader = useCallback((page: number) => fetchBanners({ placement, page }), [placement])
  const { state, load } = useAdminPage(loader, 'Banner管理')
  const formValue = Form.useWatch([], form) ?? emptyBannerForm()
  const selectedPlacement = bannerPlacements.find((item) => item.key === formValue.placement) ?? bannerPlacements[0]

  useEffect(() => {
    form.setFieldsValue(emptyBannerForm())
  }, [form])

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const resetForm = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
    setEditing(null)
    form.setFieldsValue(emptyBannerForm())
  }

  const startEdit = (item: OperationBanner) => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
    setEditing(item)
    form.setFieldsValue(operationBannerToForm(item))
  }

  const uploadCroppedBanner = (file: File) => {
    setCropRequest({
      file,
      aspectRatio: selectedPlacement.aspectRatio,
      title: `${selectedPlacement.label} · ${selectedPlacement.ratioLabel}`,
      onDone: (croppedFile) => {
        if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
        const previewUrl = URL.createObjectURL(croppedFile)
        setPendingImage({ file: croppedFile, previewUrl })
        form.setFieldsValue({ imageUrl: previewUrl })
      },
    })
  }

  const submit = async (values: OperationBannerFormValue) => {
    setIsSaving(true)
    try {
      let imageUrl = values.imageUrl
      if (pendingImage && values.imageUrl === pendingImage.previewUrl) {
        setIsUploading(true)
        imageUrl = await uploadAdminImage(pendingImage.file)
      }
      await saveBanner({ ...values, imageUrl }, editing?.id)
      messageApi.success(editing ? 'Banner已保存' : 'Banner已新增')
      resetForm()
      await load(0)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : 'Banner保存失败')
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  const toggleEnabled = async (bannerId: number, enabled: boolean) => {
    try {
      await updateBannerEnabled(bannerId, enabled)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : 'Banner状态更新失败')
    }
  }

  const removeBanner = async (bannerId: number) => {
    try {
      await deleteBanner(bannerId)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : 'Banner删除失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword=""
        keywordPlaceholder="Banner按位置筛选，无需搜索"
        onKeywordChange={() => undefined}
        onSearch={() => void load(0)}
        onPageChange={(page) => void load(page)}
        extraFilters={<Segmented options={[{ label: '全部位置', value: 'all' }, ...bannerPlacements.map((item) => ({ label: item.label, value: item.key }))]} value={placement} onChange={(value) => setPlacement(value as 'all' | BannerPlacement)} />}
      >
        <div className="banner-workspace">
          <Card className="banner-editor" title={editing ? '编辑 Banner' : '新增 Banner'} extra={editing && <Button onClick={resetForm}>取消编辑</Button>}>
            <Form form={form} layout="vertical" initialValues={emptyBannerForm()} onFinish={(values) => void submit(values)}>
              <div className="form-grid">
                <Form.Item name="placement" label="展示位置">
                  <Select options={bannerPlacements.map((item) => ({ value: item.key, label: `${item.label} · ${item.ratioLabel}` }))} />
                </Form.Item>
                <Form.Item name="sortOrder" label="排序值">
                  <InputNumber min={0} />
                </Form.Item>
                <Form.Item name="enabled" label="启用展示" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="imageUrl" className="span-2">
                  <ImageUploadField
                    label={`Banner图片（${selectedPlacement.ratioLabel}）`}
                    imageUrls={formValue.imageUrl || ''}
                    isUploading={isUploading}
                    onChooseFile={uploadCroppedBanner}
                    onRemove={() => {
                      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
                      setPendingImage(null)
                      form.setFieldsValue({ imageUrl: '' })
                    }}
                  />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" loading={isSaving} disabled={isUploading || !formValue.imageUrl}>
                {editing ? '保存修改' : '新增 Banner'}
              </Button>
            </Form>
          </Card>
          <div className="banner-list">
            {state.items.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={() => startEdit(banner)}
                onToggleEnabled={() => void toggleEnabled(banner.id, !banner.enabled)}
                onDelete={() => void removeBanner(banner.id)}
              />
            ))}
          </div>
          {state.items.length === 0 && <Empty description="当前筛选下没有 Banner" />}
          {cropRequest && <ImageCropDialog request={cropRequest} onClose={() => setCropRequest(null)} />}
        </div>
      </ModuleFrame>
    </>
  )
}

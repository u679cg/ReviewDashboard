import { Button, Card, DatePicker, Empty, Form, Input, InputNumber, Segmented, Select, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { deleteOfficialInfoItem, fetchOfficialInfoItems, saveOfficialInfoItem, updateOfficialInfoStatus, uploadAdminImage, uploadAdminVideo } from '../../api/admin'
import { officialInfoCategories, officialInfoFilters } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { ImageUploadField } from '../../components/media/ImageUploadField'
import { VideoUploadField } from '../../components/media/VideoUploadField'
import { OfficialInfoAdminCard } from '../../components/operations/OperationCards'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { OfficialInfoCategory, OfficialInfoFilter, OfficialInfoFormValue, OfficialInfoItem, OfficialInfoStatus } from '../../types/admin'
import { emptyOfficialInfoForm, officialInfoToForm } from '../../utils/forms'
import { nextOfficialInfoStatus, officialInfoCategoryLabel } from '../../utils/status'

type OfficialInfoEditorValue = Omit<OfficialInfoFormValue, 'publishDate'> & {
  publishDate: dayjs.Dayjs
}

export function OfficialInfoPage() {
  const [form] = Form.useForm<OfficialInfoEditorValue>()
  const [messageApi, contextHolder] = message.useMessage()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [status, setStatus] = useState<OfficialInfoFilter>('all')
  const [category, setCategory] = useState<'全部' | OfficialInfoCategory>('全部')
  const [editing, setEditing] = useState<OfficialInfoItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingCover, setPendingCover] = useState<{ file: File; previewUrl: string } | null>(null)
  const [pendingVideo, setPendingVideo] = useState<{ file: File; previewUrl: string } | null>(null)
  const loader = useCallback((page: number) => fetchOfficialInfoItems({ status, category, keyword, page }), [category, keyword, status])
  const { state, load } = useAdminPage(loader, '官方资讯')
  const coverImageUrl = Form.useWatch('coverImageUrl', form) || ''
  const videoUrl = Form.useWatch('videoUrl', form) || ''

  useEffect(() => {
    form.setFieldsValue(officialInfoFormToEditor(emptyOfficialInfoForm()))
  }, [form])

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const resetForm = () => {
    if (pendingCover) URL.revokeObjectURL(pendingCover.previewUrl)
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
    setPendingCover(null)
    setPendingVideo(null)
    setEditing(null)
    form.setFieldsValue(officialInfoFormToEditor(emptyOfficialInfoForm()))
  }

  const startEdit = (item: OfficialInfoItem) => {
    if (pendingCover) URL.revokeObjectURL(pendingCover.previewUrl)
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
    setPendingCover(null)
    setPendingVideo(null)
    setEditing(item)
    form.setFieldsValue(officialInfoFormToEditor(officialInfoToForm(item)))
  }

  const chooseCover = (file: File) => {
    if (pendingCover) URL.revokeObjectURL(pendingCover.previewUrl)
    const previewUrl = URL.createObjectURL(file)
    setPendingCover({ file, previewUrl })
    form.setFieldsValue({ coverImageUrl: previewUrl })
  }

  const chooseVideo = (file: File) => {
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
    const previewUrl = URL.createObjectURL(file)
    setPendingVideo({ file, previewUrl })
    form.setFieldsValue({ videoUrl: previewUrl })
  }

  const submit = async (values: OfficialInfoEditorValue) => {
    setIsSaving(true)
    try {
      let coverImageUrl = values.coverImageUrl
      let finalVideoUrl = values.videoUrl
      if (pendingCover && values.coverImageUrl === pendingCover.previewUrl) {
        setIsUploading(true)
        coverImageUrl = await uploadAdminImage(pendingCover.file)
      }
      if (pendingVideo && values.videoUrl === pendingVideo.previewUrl) {
        setIsUploading(true)
        finalVideoUrl = await uploadAdminVideo(pendingVideo.file)
      }
      await saveOfficialInfoItem({
        ...values,
        coverImageUrl,
        videoUrl: finalVideoUrl,
        publishDate: values.publishDate.format('YYYY-MM-DD'),
      }, editing?.id)
      messageApi.success(editing ? '官方资讯已保存' : '官方资讯已新增')
      resetForm()
      await load(0)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '官方资讯保存失败')
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  const changeStatus = async (id: number, nextStatus: OfficialInfoStatus) => {
    try {
      await updateOfficialInfoStatus(id, nextStatus)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '官方资讯状态更新失败')
    }
  }

  const removeItem = async (id: number) => {
    try {
      await deleteOfficialInfoItem(id)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '官方资讯删除失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索标题、摘要、正文"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={(
          <>
            <Segmented options={officialInfoFilters.map((item) => ({ label: item.label, value: item.key }))} value={status} onChange={(value) => setStatus(value as OfficialInfoFilter)} />
            <Select
              value={category}
              onChange={(value) => setCategory(value as '全部' | OfficialInfoCategory)}
              options={['全部', ...officialInfoCategories.map((item) => item.key)].map((item) => ({ value: item, label: item === '全部' ? '全部分类' : officialInfoCategoryLabel(item as OfficialInfoCategory) }))}
            />
          </>
        )}
      >
        <div className="knowledge-workspace">
          <Card className="knowledge-editor" title={editing ? '编辑官方资讯' : '新增官方资讯'} extra={editing && <Button onClick={resetForm}>取消编辑</Button>}>
            <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
              <div className="form-grid">
                <Form.Item name="category" label="分类">
                  <Select options={officialInfoCategories.map((item) => ({ value: item.key, label: item.label }))} />
                </Form.Item>
                <Form.Item name="status" label="状态">
                  <Select options={[{ value: 'PUBLISHED', label: '展示中' }, { value: 'ARCHIVED', label: '已下架' }]} />
                </Form.Item>
                <Form.Item name="publishDate" label="发布日期"><DatePicker /></Form.Item>
                <Form.Item name="sortOrder" label="排序值"><InputNumber min={0} /></Form.Item>
                <Form.Item name="title" label="标题" className="span-2"><Input placeholder="非遗剪纸添乐趣，安心守护夕阳红" /></Form.Item>
                <Form.Item name="summary" label="摘要" className="span-2"><Input.TextArea rows={3} /></Form.Item>
                <Form.Item name="content" label="正文" className="span-2"><Input.TextArea rows={6} /></Form.Item>
                <Form.Item name="coverImageUrl" className="span-2">
                  <ImageUploadField
                    label="封面图"
                    imageUrls={coverImageUrl}
                    isUploading={isUploading}
                    onChooseFile={chooseCover}
                    onRemove={() => {
                      if (pendingCover) URL.revokeObjectURL(pendingCover.previewUrl)
                      setPendingCover(null)
                      form.setFieldsValue({ coverImageUrl: '' })
                    }}
                  />
                </Form.Item>
                <Form.Item name="videoUrl" className="span-2">
                  <VideoUploadField
                    label="上传视频"
                    videoUrl={videoUrl}
                    isUploading={isUploading}
                    onChooseFile={chooseVideo}
                    onRemove={() => {
                      if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
                      setPendingVideo(null)
                      form.setFieldsValue({ videoUrl: '' })
                    }}
                  />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" loading={isSaving} disabled={isUploading}>{editing ? '保存修改' : '新增资讯'}</Button>
            </Form>
          </Card>
          <div className="knowledge-list-pane">
            <div className="knowledge-list">
              {state.items.map((item) => (
                <OfficialInfoAdminCard
                  key={item.id}
                  item={item}
                  onEdit={() => startEdit(item)}
                  onToggleStatus={() => void changeStatus(item.id, nextOfficialInfoStatus(item.status))}
                  onDelete={() => void removeItem(item.id)}
                />
              ))}
            </div>
            {state.items.length === 0 && <Empty description="当前筛选下没有官方资讯" />}
          </div>
        </div>
      </ModuleFrame>
    </>
  )
}

function officialInfoFormToEditor(value: OfficialInfoFormValue): OfficialInfoEditorValue {
  return { ...value, publishDate: dayjs(value.publishDate) }
}

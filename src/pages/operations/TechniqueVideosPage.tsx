import { Button, Card, Empty, Form, Input, InputNumber, Segmented, Switch, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { deleteTechniqueVideo, fetchTechniqueVideos, saveTechniqueVideo, updateTechniqueVideoEnabled, uploadAdminVideo } from '../../api/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { VideoUploadField } from '../../components/media/VideoUploadField'
import { techniqueVideoFilters } from '../../constants/admin'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { TechniqueVideo, TechniqueVideoFilter, TechniqueVideoFormValue } from '../../types/admin'
import { emptyTechniqueVideoForm, techniqueVideoToForm } from '../../utils/forms'
import { getFullImageUrl } from '../../utils/image'
import { Popconfirm } from 'antd'

export function TechniqueVideosPage() {
  const [form] = Form.useForm<TechniqueVideoFormValue>()
  const [messageApi, contextHolder] = message.useMessage()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [status, setStatus] = useState<TechniqueVideoFilter>('all')
  const [editing, setEditing] = useState<TechniqueVideo | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingVideo, setPendingVideo] = useState<{ file: File; previewUrl: string } | null>(null)
  const loader = useCallback((page: number) => fetchTechniqueVideos({ status, keyword, page }), [keyword, status])
  const { state, load } = useAdminPage(loader, '技法视频')
  const videoUrl = Form.useWatch('videoUrl', form) || ''

  useEffect(() => {
    form.setFieldsValue(emptyTechniqueVideoForm())
  }, [form])

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const resetForm = () => {
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
    setPendingVideo(null)
    setEditing(null)
    form.setFieldsValue(emptyTechniqueVideoForm())
  }

  const startEdit = (item: TechniqueVideo) => {
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
    setPendingVideo(null)
    setEditing(item)
    form.setFieldsValue(techniqueVideoToForm(item))
  }

  const chooseVideo = (file: File) => {
    if (pendingVideo) URL.revokeObjectURL(pendingVideo.previewUrl)
    const previewUrl = URL.createObjectURL(file)
    setPendingVideo({ file, previewUrl })
    form.setFieldsValue({ videoUrl: previewUrl })
  }

  const submit = async (values: TechniqueVideoFormValue) => {
    setIsSaving(true)
    try {
      let finalVideoUrl = values.videoUrl
      if (pendingVideo && values.videoUrl === pendingVideo.previewUrl) {
        setIsUploading(true)
        finalVideoUrl = await uploadAdminVideo(pendingVideo.file)
      }
      await saveTechniqueVideo({ ...values, videoUrl: finalVideoUrl }, editing?.id)
      messageApi.success(editing ? '技法视频已保存' : '技法视频已新增，Android 端将多展示一条')
      resetForm()
      await load(0)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '技法视频保存失败')
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  const toggleEnabled = async (item: TechniqueVideo) => {
    try {
      await updateTechniqueVideoEnabled(item.id, !item.enabled)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '技法视频状态更新失败')
    }
  }

  const removeItem = async (id: number) => {
    try {
      await deleteTechniqueVideo(id)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '技法视频删除失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索标题、描述"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={<Segmented options={techniqueVideoFilters.map((item) => ({ label: item.label, value: item.key }))} value={status} onChange={(value) => setStatus(value as TechniqueVideoFilter)} />}
      >
        <div className="knowledge-workspace">
          <Card className="knowledge-editor" title={editing ? '编辑技法视频' : '新增技法视频'} extra={editing && <Button onClick={resetForm}>取消编辑</Button>}>
            <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
              <div className="form-grid">
                <Form.Item name="title" label="技法标题" className="span-2" rules={[{ required: true, message: '请输入技法标题' }]}>
                  <Input placeholder="基础阳刻：保留线条轮廓" />
                </Form.Item>
                <Form.Item name="sortOrder" label="排序值"><InputNumber min={0} /></Form.Item>
                <Form.Item name="enabled" label="Android端展示" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="description" label="文字描述" className="span-2">
                  <Input.TextArea rows={4} placeholder="说明技法特点、适合题材或练习要点" />
                </Form.Item>
                <Form.Item name="videoUrl" className="span-2" rules={[{ required: true, message: '请上传技法视频' }]}>
                  <VideoUploadField
                    label="上传技法视频"
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
              <Button type="primary" htmlType="submit" loading={isSaving} disabled={isUploading}>{editing ? '保存修改' : '新增视频'}</Button>
            </Form>
          </Card>
          <div className="knowledge-list-pane">
            <div className="knowledge-list">
              {state.items.map((item) => (
                <TechniqueVideoCard
                  key={item.id}
                  item={item}
                  onEdit={() => startEdit(item)}
                  onToggleEnabled={() => void toggleEnabled(item)}
                  onDelete={() => void removeItem(item.id)}
                />
              ))}
            </div>
            {state.items.length === 0 && <Empty description="当前筛选下没有技法视频" />}
          </div>
        </div>
      </ModuleFrame>
    </>
  )
}

function TechniqueVideoCard({
  item,
  onEdit,
  onToggleEnabled,
  onDelete,
}: {
  item: TechniqueVideo
  onEdit: () => void
  onToggleEnabled: () => void
  onDelete: () => void
}) {
  return (
    <article className="knowledge-admin-card">
      <div className="card-topline">
        <span className={`status-badge ${item.enabled ? 'approved' : 'rejected'}`}>{item.enabled ? '展示中' : '已停用'}</span>
        <time>排序 {item.sortOrder}</time>
      </div>
      <div className="technique-video-preview">
        <video src={getFullImageUrl(item.videoUrl)} controls preload="metadata" />
      </div>
      <p className="eyebrow">剪纸技法</p>
      <h3>{item.title}</h3>
      <p>{item.description || '暂无文字描述'}</p>
      <div className="knowledge-admin-actions">
        <Button className="ghost-button" onClick={onEdit}>编辑</Button>
        <Button className="ghost-button" onClick={onToggleEnabled}>{item.enabled ? '停用' : '启用'}</Button>
        <Popconfirm title="确认删除这个技法视频？Android 端会立即不再展示。" okText="删除" cancelText="取消" onConfirm={onDelete}>
          <Button className="ghost-button danger">删除</Button>
        </Popconfirm>
      </div>
    </article>
  )
}

import { Button, Card, Empty, Form, Input, Segmented, Select, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { deleteKnowledgeItem, fetchKnowledgeItems, saveKnowledgeItem, updateKnowledgeStatus, uploadAdminImage } from '../../api/admin'
import { knowledgeCategories, knowledgeFilters, knowledgeSourceFilters } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { ImageUploadField } from '../../components/media/ImageUploadField'
import { KnowledgeAdminCard } from '../../components/operations/OperationCards'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { KnowledgeFilter, KnowledgeFormValue, KnowledgeItem, KnowledgeSourceFilter, KnowledgeStatus } from '../../types/admin'
import { emptyKnowledgeForm, knowledgeToForm } from '../../utils/forms'
import { splitImageUrls } from '../../utils/image'
import { nextKnowledgeStatus } from '../../utils/status'

export function KnowledgePage() {
  const [form] = Form.useForm<KnowledgeFormValue>()
  const [messageApi, contextHolder] = message.useMessage()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [status, setStatus] = useState<KnowledgeFilter>('all')
  const [category, setCategory] = useState('全部')
  const [sourceType, setSourceType] = useState<KnowledgeSourceFilter>('all')
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ file: File; previewUrl: string }>>([])
  const loader = useCallback((page: number) => fetchKnowledgeItems({ status, category, sourceType, keyword, page }), [category, keyword, sourceType, status])
  const { state, load } = useAdminPage(loader, '科普页管理')
  const questionType = Form.useWatch('questionType', form)
  const imageUrls = Form.useWatch('imageUrls', form) || ''

  useEffect(() => {
    form.setFieldsValue(emptyKnowledgeForm())
  }, [form])

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const resetForm = () => {
    pendingImages.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setPendingImages([])
    setEditing(null)
    form.setFieldsValue(emptyKnowledgeForm())
  }

  const startEdit = (item: KnowledgeItem) => {
    pendingImages.forEach((pending) => URL.revokeObjectURL(pending.previewUrl))
    setPendingImages([])
    setEditing(item)
    form.setFieldsValue(knowledgeToForm(item))
  }

  const chooseImages = (files: File[]) => {
    const existingUrls = splitImageUrls(imageUrls)
    const remaining = 9 - existingUrls.length
    if (remaining <= 0) return
    const nextPending = files.slice(0, remaining).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPendingImages((current) => [...current, ...nextPending])
    form.setFieldsValue({ imageUrls: [...existingUrls, ...nextPending.map((item) => item.previewUrl)].slice(0, 9).join(',') })
  }

  const removeImage = (url: string) => {
    const removedPending = pendingImages.find((item) => item.previewUrl === url)
    if (removedPending) URL.revokeObjectURL(removedPending.previewUrl)
    setPendingImages((current) => current.filter((item) => item.previewUrl !== url))
    form.setFieldsValue({ imageUrls: splitImageUrls(imageUrls).filter((item) => item !== url).join(',') })
  }

  const submit = async (values: KnowledgeFormValue) => {
    setIsSaving(true)
    try {
      const pendingByPreview = new Map(pendingImages.map((item) => [item.previewUrl, item.file]))
      const finalImageUrls: string[] = []
      for (const url of splitImageUrls(values.imageUrls)) {
        const pendingFile = pendingByPreview.get(url)
        if (pendingFile) {
          setIsUploading(true)
          finalImageUrls.push(await uploadAdminImage(pendingFile))
        } else {
          finalImageUrls.push(url)
        }
      }
      await saveKnowledgeItem({ ...values, imageUrls: finalImageUrls.filter(Boolean).join(',') }, editing?.id)
      messageApi.success(editing ? '科普内容已保存' : '科普内容已新增')
      resetForm()
      await load(0)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '科普内容保存失败')
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  const changeStatus = async (id: number, nextStatus: KnowledgeStatus) => {
    try {
      await updateKnowledgeStatus(id, nextStatus)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '科普内容状态更新失败')
    }
  }

  const removeItem = async (id: number) => {
    try {
      await deleteKnowledgeItem(id)
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '科普内容删除失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索标题、正文、题目"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={(
          <>
            <Segmented options={knowledgeFilters.map((item) => ({ label: item.label, value: item.key }))} value={status} onChange={(value) => setStatus(value as KnowledgeFilter)} />
            <Select value={category} onChange={setCategory} options={['全部', ...knowledgeCategories].map((item) => ({ value: item, label: item }))} />
            <Segmented options={knowledgeSourceFilters.map((item) => ({ label: item.label, value: item.key }))} value={sourceType} onChange={(value) => setSourceType(value as KnowledgeSourceFilter)} />
          </>
        )}
      >
        <div className="knowledge-workspace">
          <Card className="knowledge-editor" title={editing ? '编辑科普内容' : '新增官方科普'} extra={editing && <Button onClick={resetForm}>取消编辑</Button>}>
            <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
              <div className="form-grid">
                <Form.Item name="category" label="分类"><Select options={knowledgeCategories.map((item) => ({ value: item, label: item }))} /></Form.Item>
                <Form.Item name="status" label="状态">
                  <Select options={[{ value: 'PUBLISHED', label: '展示中' }, { value: 'ARCHIVED', label: '已下架' }]} />
                </Form.Item>
                <Form.Item name="title" label="标题" className="span-2"><Input placeholder="什么是中国民间剪纸" /></Form.Item>
                <Form.Item name="content" label="内容" className="span-2"><Input.TextArea rows={5} /></Form.Item>
                <Form.Item name="questionType" label="题型">
                  <Select
                    onChange={(value) => {
                      if (value === 'TRUE_FALSE') form.setFieldsValue({ optionsJson: '["正确","错误"]' })
                    }}
                    options={[{ value: 'TRUE_FALSE', label: '判断题' }, { value: 'SINGLE_CHOICE', label: '单选题' }]}
                  />
                </Form.Item>
                <Form.Item name="answer" label="答案"><Input placeholder={questionType === 'TRUE_FALSE' ? 'true 或 false' : '填写完整选项文本'} /></Form.Item>
                <Form.Item name="questionText" label="题目" className="span-2"><Input.TextArea rows={3} /></Form.Item>
                <Form.Item name="optionsJson" label="选项 JSON" className="span-2"><Input placeholder='["A","B","C"]' /></Form.Item>
                <Form.Item name="answerExplanation" label="答案解析" className="span-2"><Input.TextArea rows={3} /></Form.Item>
                <Form.Item name="imageUrls" className="span-2">
                  <ImageUploadField
                    label="小知识图片"
                    imageUrls={imageUrls}
                    multiple
                    isUploading={isUploading}
                    onChooseFiles={chooseImages}
                    onRemove={removeImage}
                  />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" loading={isSaving} disabled={isUploading}>{editing ? '保存修改' : '新增内容'}</Button>
            </Form>
          </Card>
          <div className="knowledge-list-pane">
            <div className="knowledge-list">
              {state.items.map((item) => (
                <KnowledgeAdminCard
                  key={item.id}
                  item={item}
                  onEdit={() => startEdit(item)}
                  onToggleStatus={() => void changeStatus(item.id, nextKnowledgeStatus(item.status))}
                  onDelete={() => void removeItem(item.id)}
                />
              ))}
            </div>
            {state.items.length === 0 && <Empty description="当前筛选下没有科普内容" />}
          </div>
        </div>
      </ModuleFrame>
    </>
  )
}

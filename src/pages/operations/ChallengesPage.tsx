import { Button, Card, DatePicker, Empty, Form, Input, Segmented, Select, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { deleteChallenge, fetchChallenges, saveChallenge, updateChallengeStatus, uploadAdminImage } from '../../api/admin'
import { challengeFilters } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { ImageUploadField } from '../../components/media/ImageUploadField'
import { ChallengeCard } from '../../components/operations/OperationCards'
import { useAdminOverviewContext } from '../../contexts/AdminOverviewContext'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { AdminChallenge, ChallengeFilter, ChallengeFormValue } from '../../types/admin'
import { challengeToForm, emptyChallengeForm } from '../../utils/forms'
import { splitImageUrls } from '../../utils/image'

type ChallengeEditorValue = Omit<ChallengeFormValue, 'startTime' | 'deadline'> & {
  startTime: dayjs.Dayjs
  deadline: dayjs.Dayjs
}

export function ChallengesPage() {
  const [form] = Form.useForm<ChallengeEditorValue>()
  const [messageApi, contextHolder] = message.useMessage()
  const { refreshOverview } = useAdminOverviewContext()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [status, setStatus] = useState<ChallengeFilter>('all')
  const [editing, setEditing] = useState<AdminChallenge | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ file: File; previewUrl: string }>>([])
  const loader = useCallback((page: number) => fetchChallenges({ status, keyword, page }), [keyword, status])
  const { state, load } = useAdminPage(loader, '挑战管理')
  const imageUrls = Form.useWatch('inspirationImageUrls', form) || ''

  useEffect(() => {
    form.setFieldsValue(challengeFormToEditor(emptyChallengeForm()))
  }, [form])

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const resetForm = () => {
    pendingImages.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setPendingImages([])
    setEditing(null)
    form.setFieldsValue(challengeFormToEditor(emptyChallengeForm()))
  }

  const startEdit = (item: AdminChallenge) => {
    pendingImages.forEach((pending) => URL.revokeObjectURL(pending.previewUrl))
    setPendingImages([])
    setEditing(item)
    form.setFieldsValue(challengeFormToEditor(challengeToForm(item.challenge)))
  }

  const chooseImages = (files: File[]) => {
    const existingUrls = splitImageUrls(imageUrls)
    const remaining = 6 - existingUrls.length
    const fileArray = files.slice(0, Math.max(remaining, 0))
    if (fileArray.length === 0) return
    const nextPending = fileArray.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    setPendingImages((current) => [...current, ...nextPending])
    form.setFieldsValue({ inspirationImageUrls: [...existingUrls, ...nextPending.map((item) => item.previewUrl)].slice(0, 6).join(',') })
  }

  const removeImage = (url: string) => {
    const removedPending = pendingImages.find((item) => item.previewUrl === url)
    if (removedPending) URL.revokeObjectURL(removedPending.previewUrl)
    setPendingImages((current) => current.filter((item) => item.previewUrl !== url))
    form.setFieldsValue({ inspirationImageUrls: splitImageUrls(imageUrls).filter((item) => item !== url).join(',') })
  }

  const submit = async (values: ChallengeEditorValue) => {
    setIsSaving(true)
    try {
      const pendingByPreview = new Map(pendingImages.map((item) => [item.previewUrl, item.file]))
      const finalImageUrls: string[] = []
      for (const url of splitImageUrls(values.inspirationImageUrls)) {
        const pendingFile = pendingByPreview.get(url)
        if (pendingFile) {
          setIsUploading(true)
          finalImageUrls.push(await uploadAdminImage(pendingFile))
        } else {
          finalImageUrls.push(url)
        }
      }
      await saveChallenge({
        ...values,
        inspirationImageUrls: finalImageUrls.filter(Boolean).join(','),
        startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
        deadline: values.deadline.format('YYYY-MM-DDTHH:mm:ss'),
      }, editing?.challenge.id)
      messageApi.success(editing ? '挑战已保存' : '挑战已创建')
      resetForm()
      await Promise.all([load(0), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '挑战保存失败')
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  const archiveChallenge = async (item: AdminChallenge) => {
    try {
      await updateChallengeStatus(item.challenge.id, 'ARCHIVED')
      messageApi.success('挑战活动已下架，Android 端将不再同步展示')
      await Promise.all([load(state.page), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '挑战下架失败')
    }
  }

  const removeChallenge = async (item: AdminChallenge) => {
    try {
      await deleteChallenge(item.challenge.id)
      messageApi.success('挑战活动已删除')
      await Promise.all([load(state.page), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '挑战删除失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索标题、标签、描述"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={<Segmented options={challengeFilters.map((item) => ({ label: item.label, value: item.key }))} value={status} onChange={(value) => setStatus(value as ChallengeFilter)} />}
      >
        <div className="challenge-workspace">
          <Card className="challenge-editor" title={editing ? '编辑挑战活动' : '创建挑战活动'} extra={editing && <Button onClick={resetForm}>取消编辑</Button>}>
            <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
              <div className="form-grid">
                <Form.Item name="title" label="主题名"><Input placeholder="春分 · 剪燕" /></Form.Item>
                <Form.Item name="activityLabel" label="活动标签"><Input placeholder="限时挑战 · 节气篇" /></Form.Item>
                <Form.Item name="challengeTag" label="社区标签"><Input placeholder="限时挑战 · 节气篇" /></Form.Item>
                <Form.Item name="status" label="状态">
                  <Select options={[
                    { value: 'DRAFT', label: '草稿' },
                    { value: 'PUBLISHED', label: '发布' },
                    { value: 'ARCHIVED', label: '归档' },
                  ]} />
                </Form.Item>
                <Form.Item name="startTime" label="开始时间"><DatePicker showTime /></Form.Item>
                <Form.Item name="deadline" label="截止时间"><DatePicker showTime /></Form.Item>
                <Form.Item name="inspirationImageUrls" className="span-2">
                  <ImageUploadField
                    label="素材图"
                    imageUrls={imageUrls}
                    multiple
                    isUploading={isUploading}
                    onChooseFiles={chooseImages}
                    onRemove={removeImage}
                  />
                </Form.Item>
                <Form.Item name="description" label="主题介绍" className="span-2"><Input.TextArea rows={4} /></Form.Item>
              </div>
              <Button type="primary" htmlType="submit" loading={isSaving} disabled={isUploading}>{editing ? '保存修改' : '创建挑战'}</Button>
            </Form>
          </Card>
          <div className="challenge-list">
            {state.items.map((item) => (
              <ChallengeCard
                key={item.challenge.id}
                item={item}
                onEdit={() => startEdit(item)}
                onArchive={() => void archiveChallenge(item)}
                onDelete={() => void removeChallenge(item)}
              />
            ))}
          </div>
          {state.items.length === 0 && <Empty description="暂无挑战活动" />}
        </div>
      </ModuleFrame>
    </>
  )
}

function challengeFormToEditor(value: ChallengeFormValue): ChallengeEditorValue {
  return {
    ...value,
    startTime: dayjs(value.startTime),
    deadline: dayjs(value.deadline),
  }
}

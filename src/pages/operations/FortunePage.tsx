import { Button, Card, DatePicker, Empty, Form, Input, Segmented, Select, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { deleteFortuneCard, fetchFortuneCards, saveFortuneCard, updateFortuneCardStatus, uploadAdminImage } from '../../api/admin'
import { fortuneFilters } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { ImageUploadField } from '../../components/media/ImageUploadField'
import { FortuneCardItem } from '../../components/operations/OperationCards'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { FortuneCard, FortuneCardFormValue, FortuneCardStatus } from '../../types/admin'
import { emptyFortuneCardForm, fortuneCardToForm } from '../../utils/forms'

type FortuneEditorValue = Omit<FortuneCardFormValue, 'displayDate'> & {
  displayDate: dayjs.Dayjs
}

export function FortunePage() {
  const [form] = Form.useForm<FortuneEditorValue>()
  const [messageApi, contextHolder] = message.useMessage()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [status, setStatus] = useState<'all' | FortuneCardStatus>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [editing, setEditing] = useState<FortuneCard | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const loader = useCallback((page: number) => fetchFortuneCards({ status, keyword, fromDate, toDate, page }), [fromDate, keyword, status, toDate])
  const { state, load } = useAdminPage(loader, '福运卡管理')
  const patternImageUrl = Form.useWatch('patternImageUrl', form) || ''

  useEffect(() => {
    form.setFieldsValue(fortuneFormToEditor(emptyFortuneCardForm()))
  }, [form])

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const resetForm = () => {
    setEditing(null)
    form.setFieldsValue(fortuneFormToEditor(emptyFortuneCardForm()))
  }

  const startEdit = (item: FortuneCard) => {
    setEditing(item)
    form.setFieldsValue(fortuneFormToEditor(fortuneCardToForm(item)))
  }

  const uploadPatternImage = async (file: File) => {
    setIsUploading(true)
    try {
      const url = await uploadAdminImage(file)
      if (url) form.setFieldsValue({ patternImageUrl: url })
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const submit = async (values: FortuneEditorValue) => {
    setIsSaving(true)
    try {
      await saveFortuneCard({ ...values, displayDate: values.displayDate.format('YYYY-MM-DD') }, editing?.id)
      messageApi.success(editing ? '福运卡已保存' : '福运卡已创建')
      resetForm()
      await load(0)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '福运卡保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const changeStatus = async (item: FortuneCard, nextStatus: FortuneCardStatus) => {
    try {
      await updateFortuneCardStatus(item.id, nextStatus)
      messageApi.success(nextStatus === 'ARCHIVED' ? '福运卡已下架，Android 端将不再同步展示' : '福运卡已发布')
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '福运卡状态更新失败')
    }
  }

  const removeItem = async (item: FortuneCard) => {
    try {
      await deleteFortuneCard(item.id)
      messageApi.success('福运卡已删除')
      await load(state.page)
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '福运卡删除失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索节气、农历、宜做事项"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={(
          <>
            <Segmented options={fortuneFilters.map((item) => ({ label: item.label, value: item.key }))} value={status} onChange={(value) => setStatus(value as 'all' | FortuneCardStatus)} />
            <DatePicker placeholder="开始日期" onChange={(_, value) => setFromDate(Array.isArray(value) ? value[0] : value)} />
            <DatePicker placeholder="结束日期" onChange={(_, value) => setToDate(Array.isArray(value) ? value[0] : value)} />
          </>
        )}
      >
        <div className="fortune-workspace">
          <Card className="fortune-editor" title={editing ? '编辑福运卡' : '创建福运卡'} extra={editing && <Button onClick={resetForm}>取消编辑</Button>}>
            <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
              <div className="form-grid">
                <Form.Item name="displayDate" label="展示日期"><DatePicker /></Form.Item>
                <Form.Item name="solarTerm" label="节气"><Input placeholder="谷雨 · 喜鹊登梅" /></Form.Item>
                <Form.Item name="lunarDate" label="农历日期"><Input placeholder="庚子年 · 腊月初八" /></Form.Item>
                <Form.Item name="status" label="状态">
                  <Select options={[{ value: 'PUBLISHED', label: '展示中' }, { value: 'ARCHIVED', label: '已下架' }]} />
                </Form.Item>
                <Form.Item name="suitableEvents" label="宜做事件"><Input placeholder="祈福、纳财" /></Form.Item>
                <Form.Item name="patternImageUrl" className="span-2">
                  <ImageUploadField
                    label="图案图片"
                    imageUrls={patternImageUrl}
                    isUploading={isUploading}
                    onChooseFile={(file) => void uploadPatternImage(file)}
                    onRemove={() => form.setFieldsValue({ patternImageUrl: '' })}
                  />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" loading={isSaving} disabled={isUploading}>{editing ? '保存修改' : '创建福运卡'}</Button>
            </Form>
          </Card>
          <div className="fortune-list">
            {state.items.map((item) => (
              <FortuneCardItem
                key={item.id}
                item={item}
                onEdit={() => startEdit(item)}
                onToggleStatus={(nextStatus) => void changeStatus(item, nextStatus)}
                onDelete={() => void removeItem(item)}
              />
            ))}
          </div>
          {state.items.length === 0 && <Empty description="暂无福运卡" />}
        </div>
      </ModuleFrame>
    </>
  )
}

function fortuneFormToEditor(value: FortuneCardFormValue): FortuneEditorValue {
  return { ...value, displayDate: dayjs(value.displayDate) }
}

import { Empty, Segmented, Select, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { fetchKnowledgeSubmissions, reviewKnowledgeSubmission } from '../../api/admin'
import { knowledgeCategories, knowledgeSubmissionFilters } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { KnowledgeSubmissionCard } from '../../components/audit/AuditCards'
import { useAdminOverviewContext } from '../../contexts/AdminOverviewContext'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { KnowledgeSubmissionFilter } from '../../types/admin'

export function AuditKnowledgePage() {
  const [messageApi, contextHolder] = message.useMessage()
  const { refreshOverview } = useAdminOverviewContext()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [status, setStatus] = useState<KnowledgeSubmissionFilter>('all')
  const [category, setCategory] = useState('全部')
  const loader = useCallback((page: number) => fetchKnowledgeSubmissions({ status, category, keyword, page }), [category, keyword, status])
  const { state, load } = useAdminPage(loader, '科普投稿')

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const handleReview = async (submissionId: number, action: 'adopt' | 'reject') => {
    try {
      await reviewKnowledgeSubmission(submissionId, action)
      messageApi.success(action === 'adopt' ? '投稿已采纳' : '投稿已拒绝')
      await Promise.all([load(state.page), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '科普投稿审核操作失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索标题、正文、题目、作者"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={(
          <>
            <Segmented options={knowledgeSubmissionFilters.map((item) => ({ label: item.label, value: item.key }))} value={status} onChange={(value) => setStatus(value as KnowledgeSubmissionFilter)} />
            <Select value={category} onChange={setCategory} options={['全部', ...knowledgeCategories].map((item) => ({ value: item, label: item }))} />
          </>
        )}
      >
        <div className="post-grid">
          {state.items.map((submission) => (
            <KnowledgeSubmissionCard key={submission.id} submission={submission} onReview={handleReview} />
          ))}
        </div>
        {state.items.length === 0 && <Empty description="暂无科普投稿" />}
      </ModuleFrame>
    </>
  )
}

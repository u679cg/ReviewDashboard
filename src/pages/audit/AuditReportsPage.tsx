import { Empty, Segmented, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { fetchCommentReports, fetchPostReports, reviewCommentReport, reviewPostReport } from '../../api/admin'
import { reportFilters, reportKinds } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { CommentReportCard, ReportCard } from '../../components/audit/AuditCards'
import { useAdminOverviewContext } from '../../contexts/AdminOverviewContext'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { CommentAction, PostAction, ReportFilter, ReportKind, ReportResult } from '../../types/admin'

export function AuditReportsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const { refreshOverview } = useAdminOverviewContext()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all')
  const [reportKind, setReportKind] = useState<ReportKind>('posts')
  const postLoader = useCallback((page: number) => fetchPostReports({ reviewStatus: reportFilter, keyword, page }), [keyword, reportFilter])
  const commentLoader = useCallback((page: number) => fetchCommentReports({ reviewStatus: reportFilter, keyword, page }), [keyword, reportFilter])
  const { state: postReportsState, load: loadPostReports } = useAdminPage(postLoader, '动态举报复审')
  const { state: commentReportsState, load: loadCommentReports } = useAdminPage(commentLoader, '评论举报复审')
  const currentState = reportKind === 'comments' ? commentReportsState : postReportsState
  const loadCurrent = useCallback((page = 0) => {
    return reportKind === 'comments' ? loadCommentReports(page) : loadPostReports(page)
  }, [loadCommentReports, loadPostReports, reportKind])

  useEffect(() => {
    void loadCurrent(0)
  }, [loadCurrent])

  useRegisterModuleRefresh(useCallback(() => loadCurrent(0), [loadCurrent]))

  const handlePostReview = async (reportId: number, reportResult: ReportResult, postAction: PostAction) => {
    try {
      await reviewPostReport(reportId, reportResult, postAction)
      messageApi.success('举报复审已提交')
      await Promise.all([loadPostReports(postReportsState.page), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '举报复审操作失败')
    }
  }

  const handleCommentReview = async (reportId: number, reportResult: ReportResult, commentAction: CommentAction) => {
    try {
      await reviewCommentReport(reportId, reportResult, commentAction)
      messageApi.success('评论举报复审已提交')
      await Promise.all([loadCommentReports(commentReportsState.page), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '评论举报复审操作失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={currentState}
        keyword={searchInput}
        keywordPlaceholder={reportKind === 'comments' ? '搜索举报原因、评论、用户、动态' : '搜索举报原因、描述、用户、动态'}
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(loadCurrent)}
        onPageChange={(page) => void loadCurrent(page)}
        extraFilters={(
          <>
            <Segmented options={reportKinds.map((item) => ({ label: item.label, value: item.key }))} value={reportKind} onChange={(value) => setReportKind(value as ReportKind)} />
            <Segmented options={reportFilters.map((item) => ({ label: item.label, value: item.key }))} value={reportFilter} onChange={(value) => setReportFilter(value as ReportFilter)} />
          </>
        )}
      >
        {reportKind === 'comments' ? (
          <>
            <div className="report-grid">
              {commentReportsState.items.map((report) => (
                <CommentReportCard key={report.id} report={report} onReview={handleCommentReview} />
              ))}
            </div>
            {commentReportsState.items.length === 0 && <Empty description="当前筛选下没有评论举报记录" />}
          </>
        ) : (
          <>
            <div className="report-grid">
              {postReportsState.items.map((report) => (
                <ReportCard key={report.id} report={report} onReview={handlePostReview} />
              ))}
            </div>
            {postReportsState.items.length === 0 && <Empty description="当前筛选下没有动态举报记录" />}
          </>
        )}
      </ModuleFrame>
    </>
  )
}

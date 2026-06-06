import { Empty, Segmented, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { fetchPosts, reviewPost } from '../../api/admin'
import { postFilters } from '../../constants/admin'
import { ModuleFrame } from '../../components/ModuleFrame'
import { PostCard } from '../../components/audit/AuditCards'
import { useAdminOverviewContext } from '../../contexts/AdminOverviewContext'
import { useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { PostFilter } from '../../types/admin'

export function AuditPostsPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const { refreshOverview } = useAdminOverviewContext()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const loader = useCallback((page: number) => fetchPosts({ status: postFilter, keyword, page }), [keyword, postFilter])
  const { state, load } = useAdminPage(loader, '动态审核')

  useEffect(() => {
    void load(0)
  }, [load])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const handleReview = async (postId: number, action: 'pass' | 'reject') => {
    try {
      await reviewPost(postId, action)
      messageApi.success('动态审核已提交')
      await Promise.all([load(state.page), refreshOverview()])
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '动态审核操作失败')
    }
  }

  return (
    <>
      {contextHolder}
      <ModuleFrame
        state={state}
        keyword={searchInput}
        keywordPlaceholder="搜索内容、分类、位置、作者"
        onKeywordChange={setSearchInput}
        onSearch={() => applySearch(load)}
        onPageChange={(page) => void load(page)}
        extraFilters={<Segmented options={postFilters.map((item) => ({ label: item.label, value: item.key }))} value={postFilter} onChange={(value) => setPostFilter(value as PostFilter)} />}
      >
        <div className="post-grid">
          {state.items.map((post) => (
            <PostCard key={post.id} post={post} onReview={handleReview} />
          ))}
        </div>
        {state.items.length === 0 && <Empty description="当前筛选下没有动态" />}
      </ModuleFrame>
    </>
  )
}

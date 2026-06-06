import { Alert, Empty, Segmented } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { fetchUserGroupPosts, fetchUserGroups, reviewPost } from '../../api/admin'
import { postFilters } from '../../constants/admin'
import { ModuleFrame, PageControls } from '../../components/ModuleFrame'
import { PostCard } from '../../components/audit/AuditCards'
import { Avatar } from '../../components/media/ImageGrid'
import { useAdminOverviewContext } from '../../contexts/AdminOverviewContext'
import { emptyModuleState, useAdminPage } from '../../hooks/useAdminPage'
import { useRegisterModuleRefresh } from '../../hooks/useRegisterModuleRefresh'
import { useSearchKeyword } from '../../hooks/useSearchKeyword'
import type { ModuleState, Post, PostFilter } from '../../types/admin'
import { formatTime } from '../../utils/date'
import { displayName } from '../../utils/user'

export function AuditUsersPage() {
  const { refreshOverview } = useAdminOverviewContext()
  const { keyword, searchInput, setSearchInput, applySearch } = useSearchKeyword()
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const [groupPosts, setGroupPosts] = useState<Record<number, ModuleState<Post>>>({})
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(() => new Set())
  const loader = useCallback((page: number) => fetchUserGroups({ status: postFilter, keyword, page }), [keyword, postFilter])
  const { state, load } = useAdminPage(loader, '用户分组')

  useEffect(() => {
    void load(0)
  }, [load])

  useEffect(() => {
    setExpandedUsers(new Set())
    setGroupPosts({})
  }, [keyword, postFilter])

  useRegisterModuleRefresh(useCallback(() => load(0), [load]))

  const loadGroupPosts = useCallback(async (userId: number, page = 0) => {
    setGroupPosts((current) => {
      const previous = current[userId] ?? emptyModuleState<Post>()
      return {
        ...current,
        [userId]: {
          ...previous,
          isLoading: !previous.loaded,
          isRefreshing: previous.loaded && page === 0,
          error: '',
        },
      }
    })

    try {
      const data = await fetchUserGroupPosts(userId, { status: postFilter, keyword, page })
      setGroupPosts((current) => ({
        ...current,
        [userId]: {
          ...data,
          isLoading: false,
          isRefreshing: false,
          error: '',
          loaded: true,
          lastUpdated: new Date().toISOString(),
        },
      }))
    } catch (err) {
      setGroupPosts((current) => {
        const previous = current[userId] ?? emptyModuleState<Post>()
        return {
          ...current,
          [userId]: {
            ...previous,
            isLoading: false,
            isRefreshing: false,
            error: err instanceof Error ? err.message : '用户动态加载失败',
            loaded: true,
          },
        }
      })
    }
  }, [keyword, postFilter])

  const toggleUser = (userId: number) => {
    setExpandedUsers((current) => {
      const next = new Set(current)
      if (next.has(userId)) next.delete(userId)
      else {
        next.add(userId)
        if (!groupPosts[userId]?.loaded) void loadGroupPosts(userId, 0)
      }
      return next
    })
  }

  const handleReview = async (postId: number, action: 'pass' | 'reject') => {
    await reviewPost(postId, action)
    await Promise.all([load(state.page), refreshOverview()])
  }

  return (
    <ModuleFrame
      state={state}
      keyword={searchInput}
      keywordPlaceholder="搜索作者或动态内容"
      onKeywordChange={setSearchInput}
      onSearch={() => applySearch(load)}
      onPageChange={(page) => void load(page)}
      extraFilters={<Segmented options={postFilters.map((item) => ({ label: item.label, value: item.key }))} value={postFilter} onChange={(value) => setPostFilter(value as PostFilter)} />}
    >
      <div className="audit-pane user-stack">
        {state.items.map((group) => {
          const userId = group.author?.id ?? 0
          const expanded = expandedUsers.has(userId)
          const postsForUser = groupPosts[userId] ?? emptyModuleState<Post>()
          return (
            <article className="user-bento" key={userId}>
              <button className="user-head" onClick={() => toggleUser(userId)}>
                <Avatar user={group.author} />
                <div>
                  <strong>{displayName(group.author)}</strong>
                  <span>{group.totalCount} 条动态 · {group.pendingCount} 条未审核 · 最近 {formatTime(group.latestPostTime)}</span>
                </div>
                <i>{expanded ? '收起' : '展开'}</i>
              </button>
              <div className="mini-stats">
                <span>未审核 {group.pendingCount}</span>
                <span>已通过 {group.approvedCount}</span>
                <span>已拒绝 {group.rejectedCount}</span>
              </div>
              {expanded && (
                <>
                  {postsForUser.error && <Alert type="error" message={postsForUser.error} showIcon />}
                  <div className="post-grid compact">
                    {postsForUser.items.map((post) => (
                      <PostCard key={post.id} post={post} onReview={handleReview} compact />
                    ))}
                  </div>
                  <PageControls state={postsForUser} onPageChange={(page) => void loadGroupPosts(userId, page)} />
                </>
              )}
            </article>
          )
        })}
        {state.items.length === 0 && <Empty description="暂无用户动态" />}
      </div>
    </ModuleFrame>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = 'http://43.143.241.204:8080'
const REFRESH_INTERVAL_MS = 30_000

type ReviewStatus = 0 | 1 | 2
type ReportReviewStatus = 'pending' | 'reviewed'
type ReportResult = 'valid' | 'invalid'
type PostAction = 'keep' | 'reject' | 'approve'

type User = {
  id: number
  username?: string
  nickname?: string
  avatarUrl?: string | null
  region?: string
}

type Post = {
  id: number
  author?: User | null
  content?: string
  title?: string
  category?: string
  imageUrl?: string | null
  imageUrls?: string | null
  showLocation?: boolean
  locationName?: string
  likeCount?: number
  commentCount?: number
  createTime?: string
  status: ReviewStatus
}

type UserGroup = {
  author?: User | null
  totalCount: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  posts: Post[]
}

type PostReport = {
  id: number
  post?: Post | null
  reporter?: User | null
  reason: string
  description?: string
  reviewStatus: ReportReviewStatus
  reportResult?: ReportResult | null
  postAction?: PostAction | null
  createTime?: string
  reviewTime?: string | null
}

type DashboardTab = 'posts' | 'users' | 'reports'
type PostFilter = 'all' | 'pending' | 'approved' | 'rejected'
type ReportFilter = 'all' | 'pending' | 'reviewed'

const postFilters: Array<{ key: PostFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '未审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
]

const reportFilters: Array<{ key: ReportFilter; label: string }> = [
  { key: 'all', label: '全部举报' },
  { key: 'pending', label: '未复审' },
  { key: 'reviewed', label: '已复审' },
]

function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('posts')
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [reports, setReports] = useState<PostReport[]>([])
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [postRes, groupRes, reportRes] = await Promise.all([
        fetch(`${API_BASE}/api/posts/admin/review-list`),
        fetch(`${API_BASE}/api/posts/admin/grouped-by-user`),
        fetch(`${API_BASE}/api/reports/posts/admin`),
      ])

      if (!postRes.ok) throw new Error(`动态审核加载失败：HTTP ${postRes.status}`)
      if (!groupRes.ok) throw new Error(`用户分组加载失败：HTTP ${groupRes.status}`)
      if (!reportRes.ok) throw new Error(`举报复审加载失败：HTTP ${reportRes.status}`)

      setPosts(await postRes.json())
      setGroups(await groupRes.json())
      setReports(await reportRes.json())
      setError('')
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadData(), 0)
    const timer = window.setInterval(() => void loadData(), REFRESH_INTERVAL_MS)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [loadData])

  const reviewPost = async (postId: number, action: 'pass' | 'reject') => {
    const response = await fetch(`${API_BASE}/api/posts/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action }),
    })

    if (!response.ok) {
      setError('动态审核操作失败')
      return
    }
    await loadData()
  }

  const reviewReport = async (
    reportId: number,
    reportResult: ReportResult,
    postAction: PostAction,
  ) => {
    const response = await fetch(`${API_BASE}/api/reports/posts/${reportId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportResult, postAction }),
    })

    if (!response.ok) {
      setError('举报复审操作失败')
      return
    }
    await loadData()
  }

  const filteredPosts = useMemo(() => posts.filter((post) => matchPostFilter(post, postFilter)), [posts, postFilter])
  const filteredReports = useMemo(
    () => reports.filter((report) => reportFilter === 'all' || report.reviewStatus === reportFilter),
    [reports, reportFilter],
  )
  const stats = useMemo(() => {
    const pendingPosts = posts.filter((post) => post.status === 0).length
    const pendingReports = reports.filter((report) => report.reviewStatus === 'pending').length
    return {
      totalPosts: posts.length,
      pendingPosts,
      reviewedPosts: posts.length - pendingPosts,
      pendingReports,
    }
  }, [posts, reports])

  const toggleUser = (userId: number) => {
    setExpandedUsers((current) => {
      const next = new Set(current)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <span className="brand-mark">审</span>
          <div>
            <p className="eyebrow">PaperCut Review</p>
            <h1>剪纸审核台</h1>
          </div>
        </div>
        <nav className="nav-stack" aria-label="审核后台导航">
          <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>动态审核</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>按用户审核</button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>举报复审</button>
        </nav>
        <section className="refresh-box">
          <p>自动刷新</p>
          <strong>每 30 秒</strong>
          <span>{lastUpdated ? `上次：${formatTime(lastUpdated.toISOString())}` : '等待首次刷新'}</span>
          <button onClick={() => void loadData()} disabled={isLoading}>{isLoading ? '刷新中...' : '手动刷新'}</button>
        </section>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">内容安全工作台</p>
            <h2>{tabTitle(activeTab)}</h2>
          </div>
          <div className="stat-grid" aria-label="审核统计">
            <StatCard label="动态总数" value={stats.totalPosts} tone="rice" />
            <StatCard label="未审核动态" value={stats.pendingPosts} tone="red" />
            <StatCard label="已审核动态" value={stats.reviewedPosts} tone="green" />
            <StatCard label="未复审举报" value={stats.pendingReports} tone="orange" />
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {activeTab === 'posts' && (
          <section className="workspace">
            <SegmentedControl items={postFilters} value={postFilter} onChange={setPostFilter} />
            <div className="post-grid">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onReview={reviewPost} />
              ))}
            </div>
            <EmptyState visible={!isLoading && filteredPosts.length === 0} text="当前筛选下没有动态" />
          </section>
        )}

        {activeTab === 'users' && (
          <section className="workspace user-stack">
            {groups.map((group) => {
              const userId = group.author?.id ?? 0
              const expanded = expandedUsers.has(userId)
              return (
                <article className="user-bento" key={userId}>
                  <button className="user-head" onClick={() => toggleUser(userId)}>
                    <Avatar user={group.author} />
                    <div>
                      <strong>{displayName(group.author)}</strong>
                      <span>{group.totalCount} 条动态 · {group.pendingCount} 条未审核</span>
                    </div>
                    <i>{expanded ? '收起' : '展开'}</i>
                  </button>
                  <div className="mini-stats">
                    <span>未审核 {group.pendingCount}</span>
                    <span>已通过 {group.approvedCount}</span>
                    <span>已拒绝 {group.rejectedCount}</span>
                  </div>
                  {expanded && (
                    <div className="post-grid compact">
                      {group.posts.map((post) => (
                        <PostCard key={post.id} post={post} onReview={reviewPost} compact />
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
            <EmptyState visible={!isLoading && groups.length === 0} text="暂无用户动态" />
          </section>
        )}

        {activeTab === 'reports' && (
          <section className="workspace">
            <SegmentedControl items={reportFilters} value={reportFilter} onChange={setReportFilter} />
            <div className="report-grid">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} onReview={reviewReport} />
              ))}
            </div>
            <EmptyState visible={!isLoading && filteredReports.length === 0} text="当前筛选下没有举报记录" />
          </section>
        )}
      </section>
    </main>
  )
}

function PostCard({
  post,
  onReview,
  compact = false,
}: {
  post: Post
  onReview: (postId: number, action: 'pass' | 'reject') => Promise<void>
  compact?: boolean
}) {
  return (
    <article className={`post-card ${compact ? 'is-compact' : ''}`}>
      <div className="card-topline">
        <StatusBadge status={post.status} />
        <time>{formatTime(post.createTime)}</time>
      </div>
      <ImageGrid post={post} />
      <div className="post-copy">
        <div className="author-line">
          <Avatar user={post.author} />
          <div>
            <strong>{displayName(post.author)}</strong>
            <span>{post.category || '无分类'} · {post.showLocation && post.locationName ? post.locationName : '不显示定位'}</span>
          </div>
        </div>
        <p>{post.content || '该动态暂无文字内容'}</p>
      </div>
      <div className="card-actions">
        <button className="approve" onClick={() => void onReview(post.id, 'pass')}>通过</button>
        <button className="reject" onClick={() => void onReview(post.id, 'reject')}>拒绝</button>
      </div>
    </article>
  )
}

function ReportCard({
  report,
  onReview,
}: {
  report: PostReport
  onReview: (reportId: number, reportResult: ReportResult, postAction: PostAction) => Promise<void>
}) {
  const [result, setResult] = useState<ReportResult>('valid')
  const [action, setAction] = useState<PostAction>('keep')
  const reviewed = report.reviewStatus === 'reviewed'

  return (
    <article className={`report-card ${reviewed ? 'is-reviewed' : ''}`}>
      <div className="card-topline">
        <span className={`status-badge ${reviewed ? 'approved' : 'pending'}`}>{reviewed ? '已复审' : '未复审'}</span>
        <time>{formatTime(report.createTime)}</time>
      </div>
      <div className="report-reason">
        <strong>{report.reason}</strong>
        <p>{report.description || '举报人未填写补充说明'}</p>
      </div>
      <div className="report-meta">
        <span>举报人：{displayName(report.reporter)}</span>
        <span>作者：{displayName(report.post?.author)}</span>
      </div>
      {report.post && <PostMini post={report.post} />}
      <div className="review-controls">
        <label>
          举报结果
          <select value={reviewed ? report.reportResult ?? result : result} onChange={(event) => setResult(event.target.value as ReportResult)} disabled={reviewed}>
            <option value="valid">举报成立</option>
            <option value="invalid">举报不成立</option>
          </select>
        </label>
        <label>
          动态处理
          <select value={reviewed ? report.postAction ?? action : action} onChange={(event) => setAction(event.target.value as PostAction)} disabled={reviewed}>
            <option value="keep">保持原状态</option>
            <option value="reject">下架拒绝</option>
            <option value="approve">通过展示</option>
          </select>
        </label>
      </div>
      <button className="review-submit" disabled={reviewed} onClick={() => void onReview(report.id, result, action)}>
        {reviewed ? '已完成复审' : '提交复审'}
      </button>
    </article>
  )
}

function PostMini({ post }: { post: Post }) {
  return (
    <div className="post-mini">
      <StatusBadge status={post.status} />
      <p>{post.content || '该动态暂无文字内容'}</p>
    </div>
  )
}

function ImageGrid({ post }: { post: Post }) {
  const urls = getPostImageUrls(post)
  if (urls.length === 0) {
    return <div className="image-grid empty-image">无图片</div>
  }

  return (
    <div className="image-grid">
      {urls.map((url) => (
        <img key={url} src={url} alt="动态图片" referrerPolicy="no-referrer" onError={(event) => {
          event.currentTarget.style.display = 'none'
        }} />
      ))}
    </div>
  )
}

function Avatar({ user }: { user?: User | null }) {
  const avatarUrl = getFullImageUrl(user?.avatarUrl || '')
  if (avatarUrl) {
    return <img className="avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
  }
  return <span className="avatar fallback">{displayName(user).slice(0, 1)}</span>
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const meta = {
    0: ['pending', '未审核'],
    1: ['approved', '已通过'],
    2: ['rejected', '已拒绝'],
  }[status]
  return <span className={`status-badge ${meta[0]}`}>{meta[1]}</span>
}

function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ key: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented">
      {items.map((item) => (
        <button key={item.key} className={item.key === value ? 'active' : ''} onClick={() => onChange(item.key)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function EmptyState({ visible, text }: { visible: boolean; text: string }) {
  if (!visible) return null
  return <div className="empty-state">{text}</div>
}

function getPostImageUrls(post: Post) {
  const rawUrls = post.imageUrls || post.imageUrl || ''
  return rawUrls
    .split(',')
    .map((item) => getFullImageUrl(item))
    .filter(Boolean)
    .slice(0, 9)
}

function getFullImageUrl(imageUrl: string) {
  const safeUrl = imageUrl.trim()
  if (!safeUrl) return ''
  if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) return safeUrl
  if (safeUrl.startsWith('/')) return `${API_BASE}${safeUrl}`
  return `${API_BASE}/${safeUrl}`
}

function matchPostFilter(post: Post, filter: PostFilter) {
  if (filter === 'pending') return post.status === 0
  if (filter === 'approved') return post.status === 1
  if (filter === 'rejected') return post.status === 2
  return true
}

function displayName(user?: User | null) {
  return user?.nickname || user?.username || '未知用户'
}

function formatTime(raw?: string | null) {
  if (!raw) return '时间未知'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.replace('T', ' ').slice(0, 16)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function tabTitle(tab: DashboardTab) {
  if (tab === 'users') return '按用户分组审核'
  if (tab === 'reports') return '举报复审'
  return '动态审核'
}

export default App

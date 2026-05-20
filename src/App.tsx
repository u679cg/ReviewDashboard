import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = 'http://43.143.241.204:8080'
const REFRESH_INTERVAL_MS = 30_000

type ReviewStatus = 0 | 1 | 2
type ReportReviewStatus = 'pending' | 'reviewed'
type ReportResult = 'valid' | 'invalid'
type PostAction = 'keep' | 'reject' | 'approve'
type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

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

type Challenge = {
  id: number
  title: string
  activityLabel: string
  challengeTag: string
  description: string
  inspirationImageUrls: string
  startTime: string
  deadline: string
  status: ChallengeStatus
}

type AdminChallenge = {
  challenge: Challenge
  isExpired: boolean
  participantCount: number
}

type AdminSection = 'audit' | 'operations'
type AuditView = 'posts' | 'users' | 'reports'
type PostFilter = 'all' | 'pending' | 'approved' | 'rejected'
type ReportFilter = 'all' | 'pending' | 'reviewed'

type ChallengeFormValue = {
  title: string
  activityLabel: string
  challengeTag: string
  description: string
  inspirationImageUrls: string
  startTime: string
  deadline: string
  status: ChallengeStatus
}

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
  const [activeSection, setActiveSection] = useState<AdminSection>('audit')
  const [auditView, setAuditView] = useState<AuditView>('posts')
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [reports, setReports] = useState<PostReport[]>([])
  const [challenges, setChallenges] = useState<AdminChallenge[]>([])
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [postRes, groupRes, reportRes, challengeRes] = await Promise.all([
        fetch(`${API_BASE}/api/posts/admin/review-list`),
        fetch(`${API_BASE}/api/posts/admin/grouped-by-user`),
        fetch(`${API_BASE}/api/reports/posts/admin`),
        fetch(`${API_BASE}/api/challenges/admin`),
      ])

      if (!postRes.ok) throw new Error(`动态审核加载失败：HTTP ${postRes.status}`)
      if (!groupRes.ok) throw new Error(`用户分组加载失败：HTTP ${groupRes.status}`)
      if (!reportRes.ok) throw new Error(`举报复审加载失败：HTTP ${reportRes.status}`)
      if (!challengeRes.ok) throw new Error(`挑战管理加载失败：HTTP ${challengeRes.status}`)

      setPosts(await postRes.json())
      setGroups(await groupRes.json())
      setReports(await reportRes.json())
      setChallenges(await challengeRes.json())
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

  const saveChallenge = async (challenge: ChallengeFormValue, challengeId?: number) => {
    const response = await fetch(
      challengeId ? `${API_BASE}/api/challenges/admin/${challengeId}` : `${API_BASE}/api/challenges/admin`,
      {
        method: challengeId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...challenge,
          startTime: toApiDateTime(challenge.startTime),
          deadline: toApiDateTime(challenge.deadline),
        }),
      },
    )

    if (!response.ok) {
      const message = await response.text()
      setError(message || '挑战保存失败')
      return false
    }
    await loadData()
    return true
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
      activeChallenges: challenges.filter((item) => item.challenge.status === 'PUBLISHED' && !item.isExpired).length,
    }
  }, [posts, reports, challenges])

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
          <span className="brand-mark">管</span>
          <div>
            <p className="eyebrow">PaperCut Admin</p>
            <h1>剪纸后台管理</h1>
          </div>
        </div>
        <nav className="nav-stack" aria-label="后台管理导航">
          <button className={activeSection === 'audit' ? 'active' : ''} onClick={() => setActiveSection('audit')}>审核中心</button>
          <button className={activeSection === 'operations' ? 'active' : ''} onClick={() => setActiveSection('operations')}>运营管理</button>
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
            <p className="eyebrow">后台管理工作台</p>
            <h2>{sectionTitle(activeSection, auditView)}</h2>
          </div>
          <div className="stat-grid" aria-label="审核统计">
            <StatCard label="动态总数" value={stats.totalPosts} tone="rice" />
            <StatCard label="未审核动态" value={stats.pendingPosts} tone="red" />
            <StatCard label="已审核动态" value={stats.reviewedPosts} tone="green" />
            <StatCard label="未复审举报" value={stats.pendingReports} tone="orange" />
            <StatCard label="进行中挑战" value={stats.activeChallenges} tone="red" />
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {activeSection === 'audit' && (
          <AuditCenter
            auditView={auditView}
            setAuditView={setAuditView}
            postFilter={postFilter}
            setPostFilter={setPostFilter}
            reportFilter={reportFilter}
            setReportFilter={setReportFilter}
            filteredPosts={filteredPosts}
            groups={groups}
            filteredReports={filteredReports}
            expandedUsers={expandedUsers}
            toggleUser={toggleUser}
            isLoading={isLoading}
            reviewPost={reviewPost}
            reviewReport={reviewReport}
          />
        )}

        {activeSection === 'operations' && (
          <section className="workspace">
            <ChallengeWorkspace challenges={challenges} onSave={saveChallenge} />
          </section>
        )}
      </section>
    </main>
  )
}

function AuditCenter({
  auditView,
  setAuditView,
  postFilter,
  setPostFilter,
  reportFilter,
  setReportFilter,
  filteredPosts,
  groups,
  filteredReports,
  expandedUsers,
  toggleUser,
  isLoading,
  reviewPost,
  reviewReport,
}: {
  auditView: AuditView
  setAuditView: (value: AuditView) => void
  postFilter: PostFilter
  setPostFilter: (value: PostFilter) => void
  reportFilter: ReportFilter
  setReportFilter: (value: ReportFilter) => void
  filteredPosts: Post[]
  groups: UserGroup[]
  filteredReports: PostReport[]
  expandedUsers: Set<number>
  toggleUser: (userId: number) => void
  isLoading: boolean
  reviewPost: (postId: number, action: 'pass' | 'reject') => Promise<void>
  reviewReport: (reportId: number, reportResult: ReportResult, postAction: PostAction) => Promise<void>
}) {
  const auditViews: Array<{ key: AuditView; label: string }> = [
    { key: 'posts', label: '动态审核' },
    { key: 'users', label: '按用户审核' },
    { key: 'reports', label: '举报复审' },
  ]

  return (
    <section className="workspace audit-center">
      <SegmentedControl items={auditViews} value={auditView} onChange={setAuditView} />

      {auditView === 'posts' && (
        <div className="audit-pane">
          <SegmentedControl items={postFilters} value={postFilter} onChange={setPostFilter} />
          <div className="post-grid">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onReview={reviewPost} />
            ))}
          </div>
          <EmptyState visible={!isLoading && filteredPosts.length === 0} text="当前筛选下没有动态" />
        </div>
      )}

      {auditView === 'users' && (
        <div className="audit-pane user-stack">
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
        </div>
      )}

      {auditView === 'reports' && (
        <div className="audit-pane">
          <SegmentedControl items={reportFilters} value={reportFilter} onChange={setReportFilter} />
          <div className="report-grid">
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} onReview={reviewReport} />
            ))}
          </div>
          <EmptyState visible={!isLoading && filteredReports.length === 0} text="当前筛选下没有举报记录" />
        </div>
      )}
    </section>
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

function ChallengeWorkspace({
  challenges,
  onSave,
}: {
  challenges: AdminChallenge[]
  onSave: (challenge: ChallengeFormValue, challengeId?: number) => Promise<boolean>
}) {
  const [editing, setEditing] = useState<AdminChallenge | null>(null)
  const [form, setForm] = useState<ChallengeFormValue>(() => emptyChallengeForm())
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = (item: AdminChallenge) => {
    setEditing(item)
    setForm(challengeToForm(item.challenge))
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyChallengeForm())
  }

  const submit = async () => {
    setIsSaving(true)
    const ok = await onSave(form, editing?.challenge.id)
    setIsSaving(false)
    if (ok) resetForm()
  }

  return (
    <div className="challenge-workspace">
      <div className="challenge-editor">
        <div className="editor-head">
          <div>
            <p className="eyebrow">活动运营</p>
            <h3>{editing ? '编辑挑战活动' : '创建挑战活动'}</h3>
          </div>
          {editing && <button className="ghost-button" onClick={resetForm}>取消编辑</button>}
        </div>
        <div className="form-grid">
          <label>
            主题名
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="春分 · 剪燕" />
          </label>
          <label>
            活动标签
            <input value={form.activityLabel} onChange={(event) => setForm({ ...form, activityLabel: event.target.value })} placeholder="限时挑战 · 节气篇" />
          </label>
          <label>
            社区标签
            <input value={form.challengeTag} onChange={(event) => setForm({ ...form, challengeTag: event.target.value })} placeholder="限时挑战 · 节气篇" />
          </label>
          <label>
            状态
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ChallengeStatus })}>
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </label>
          <label>
            开始时间
            <input type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
          </label>
          <label>
            截止时间
            <input type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          </label>
          <label className="span-2">
            素材图 URL
            <input value={form.inspirationImageUrls} onChange={(event) => setForm({ ...form, inspirationImageUrls: event.target.value })} placeholder="/images/a.jpg,/images/b.jpg" />
          </label>
          <label className="span-2">
            主题介绍
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} />
          </label>
        </div>
        <button className="review-submit" disabled={isSaving} onClick={() => void submit()}>
          {isSaving ? '保存中...' : editing ? '保存修改' : '创建挑战'}
        </button>
      </div>

      <div className="challenge-list">
        {challenges.map((item) => (
          <ChallengeCard key={item.challenge.id} item={item} onEdit={() => startEdit(item)} />
        ))}
      </div>
      <EmptyState visible={challenges.length === 0} text="暂无挑战活动" />
    </div>
  )
}

function ChallengeCard({ item, onEdit }: { item: AdminChallenge; onEdit: () => void }) {
  const challenge = item.challenge
  const images = challenge.inspirationImageUrls
    .split(',')
    .map((url) => getFullImageUrl(url))
    .filter(Boolean)
    .slice(0, 2)

  return (
    <article className="challenge-card">
      <div className="card-topline">
        <span className={`status-badge ${challengeStatusClass(challenge.status, item.isExpired)}`}>
          {challengeStatusLabel(challenge.status, item.isExpired)}
        </span>
        <time>{formatTime(challenge.deadline)} 截止</time>
      </div>
      <div className="challenge-card-body">
        <div>
          <p className="eyebrow">{challenge.activityLabel}</p>
          <h3>{challenge.title}</h3>
          <p>{challenge.description || '暂无主题介绍'}</p>
          <div className="challenge-meta">
            <span>#{challenge.challengeTag}</span>
            <span>{item.participantCount} 人参与成功</span>
          </div>
        </div>
        <div className="challenge-images">
          {images.length > 0 ? images.map((url) => <img key={url} src={url} alt="" referrerPolicy="no-referrer" />) : <span>无素材</span>}
        </div>
      </div>
      <button className="ghost-button" onClick={onEdit}>编辑</button>
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

function emptyChallengeForm(): ChallengeFormValue {
  const now = new Date()
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return {
    title: '',
    activityLabel: '限时挑战 · 节气篇',
    challengeTag: '限时挑战 · 节气篇',
    description: '',
    inspirationImageUrls: '',
    startTime: toDatetimeLocal(now.toISOString()),
    deadline: toDatetimeLocal(deadline.toISOString()),
    status: 'DRAFT',
  }
}

function challengeToForm(challenge: Challenge): ChallengeFormValue {
  return {
    title: challenge.title,
    activityLabel: challenge.activityLabel,
    challengeTag: challenge.challengeTag,
    description: challenge.description,
    inspirationImageUrls: challenge.inspirationImageUrls,
    startTime: toDatetimeLocal(challenge.startTime),
    deadline: toDatetimeLocal(challenge.deadline),
    status: challenge.status,
  }
}

function toDatetimeLocal(raw: string) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.replace('T', ' ').slice(0, 16).replace(' ', 'T')
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function challengeStatusLabel(status: ChallengeStatus, isExpired: boolean) {
  if (status === 'PUBLISHED' && isExpired) return '已截止'
  if (status === 'PUBLISHED') return '进行中'
  if (status === 'ARCHIVED') return '已归档'
  return '草稿'
}

function challengeStatusClass(status: ChallengeStatus, isExpired: boolean) {
  if (status === 'PUBLISHED' && !isExpired) return 'approved'
  if (status === 'ARCHIVED') return 'rejected'
  return 'pending'
}

function sectionTitle(section: AdminSection, auditView: AuditView) {
  if (section === 'operations') return '运营管理'
  if (auditView === 'users') return '审核中心 · 按用户审核'
  if (auditView === 'reports') return '审核中心 · 举报复审'
  return '审核中心 · 动态审核'
}

export default App

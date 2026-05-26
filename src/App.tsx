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
type AuditView = 'posts' | 'users' | 'reports' | 'knowledge'
type OperationView = 'challenges' | 'fortune' | 'knowledge'
type KnowledgeSubmissionStatus = 'PENDING' | 'ADOPTED' | 'REJECTED'
type KnowledgeStatus = 'PUBLISHED' | 'ARCHIVED'
type KnowledgeFilter = 'all' | KnowledgeStatus
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

type FortuneCard = {
  id: number
  displayDate: string
  patternImageUrl: string
  lunarDate: string
  solarTerm: string
  suitableEvents: string
}

type FortuneCardFormValue = {
  displayDate: string
  patternImageUrl: string
  lunarDate: string
  solarTerm: string
  suitableEvents: string
}

type KnowledgeSubmission = {
  id: number
  userId: number
  author?: User | null
  category: string
  title: string
  content: string
  questionType: string
  questionText: string
  optionsJson: string
  answer: string
  answerExplanation: string
  imageUrls: string
  status: KnowledgeSubmissionStatus
  reviewNote: string
  createTime?: string
  reviewTime?: string | null
}

type KnowledgeItem = {
  id: number
  category: string
  title: string
  content: string
  questionType: string
  questionText: string
  optionsJson: string
  answer: string
  answerExplanation: string
  sourceType: string
  status: KnowledgeStatus
  authorSubmissionId?: number | null
  createTime?: string
}

type KnowledgeFormValue = {
  category: string
  title: string
  content: string
  questionType: string
  questionText: string
  optionsJson: string
  answer: string
  answerExplanation: string
  status: KnowledgeStatus
}

const knowledgeCategories = ['定义', '历史', '技艺', '信仰', '风格', '民俗', '符号', '民族', '传承', '现代']

const knowledgeFilters: Array<{ key: KnowledgeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'PUBLISHED', label: '展示中' },
  { key: 'ARCHIVED', label: '已下架' },
]

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
  const [operationView, setOperationView] = useState<OperationView>('challenges')
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [reports, setReports] = useState<PostReport[]>([])
  const [challenges, setChallenges] = useState<AdminChallenge[]>([])
  const [fortuneCards, setFortuneCards] = useState<FortuneCard[]>([])
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [knowledgeSubmissions, setKnowledgeSubmissions] = useState<KnowledgeSubmission[]>([])
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [postRes, groupRes, reportRes, challengeRes, fortuneRes, knowledgeRes, knowledgeSubmissionRes] = await Promise.all([
        fetch(`${API_BASE}/api/posts/admin/review-list`),
        fetch(`${API_BASE}/api/posts/admin/grouped-by-user`),
        fetch(`${API_BASE}/api/reports/posts/admin`),
        fetch(`${API_BASE}/api/challenges/admin`),
        fetch(`${API_BASE}/api/fortune/admin`),
        fetch(`${API_BASE}/api/knowledge/admin`),
        fetch(`${API_BASE}/api/knowledge/admin/submissions`),
      ])

      if (!postRes.ok) throw new Error(`动态审核加载失败：HTTP ${postRes.status}`)
      if (!groupRes.ok) throw new Error(`用户分组加载失败：HTTP ${groupRes.status}`)
      if (!reportRes.ok) throw new Error(`举报复审加载失败：HTTP ${reportRes.status}`)
      if (!challengeRes.ok) throw new Error(`挑战管理加载失败：HTTP ${challengeRes.status}`)
      if (!fortuneRes.ok) throw new Error(`福运卡管理加载失败：HTTP ${fortuneRes.status}`)
      if (!knowledgeRes.ok) throw new Error(`科普页管理加载失败：HTTP ${knowledgeRes.status}`)
      if (!knowledgeSubmissionRes.ok) throw new Error(`科普投稿加载失败：HTTP ${knowledgeSubmissionRes.status}`)

      setPosts(await postRes.json())
      setGroups(await groupRes.json())
      setReports(await reportRes.json())
      setChallenges(await challengeRes.json())
      setFortuneCards(await fortuneRes.json())
      setKnowledgeItems(await knowledgeRes.json())
      setKnowledgeSubmissions(await knowledgeSubmissionRes.json())
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

  const saveFortuneCard = async (fortuneCard: FortuneCardFormValue, fortuneCardId?: number) => {
    const response = await fetch(
      fortuneCardId ? `${API_BASE}/api/fortune/admin/${fortuneCardId}` : `${API_BASE}/api/fortune/admin`,
      {
        method: fortuneCardId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fortuneCard),
      },
    )

    if (!response.ok) {
      const message = await response.text()
      setError(message || '福运卡保存失败')
      return false
    }
    await loadData()
    return true
  }

  const reviewKnowledgeSubmission = async (submissionId: number, action: 'adopt' | 'reject') => {
    const response = await fetch(`${API_BASE}/api/knowledge/admin/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reviewNote: action === 'adopt' ? '已采纳至科普页' : '暂未采纳',
      }),
    })

    if (!response.ok) {
      setError('科普投稿审核操作失败')
      return
    }
    await loadData()
  }

  const saveKnowledgeItem = async (knowledge: KnowledgeFormValue, knowledgeId?: number) => {
    const response = await fetch(
      knowledgeId ? `${API_BASE}/api/knowledge/admin/${knowledgeId}` : `${API_BASE}/api/knowledge/admin`,
      {
        method: knowledgeId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledge),
      },
    )

    if (!response.ok) {
      const message = await response.text()
      setError(message || '科普内容保存失败')
      return false
    }
    await loadData()
    return true
  }

  const updateKnowledgeStatus = async (knowledgeId: number, status: KnowledgeStatus) => {
    const response = await fetch(`${API_BASE}/api/knowledge/admin/${knowledgeId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      setError('科普内容状态更新失败')
      return
    }
    await loadData()
  }

  const deleteKnowledgeItem = async (knowledgeId: number) => {
    const response = await fetch(`${API_BASE}/api/knowledge/admin/${knowledgeId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      setError('科普内容删除失败')
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
    const pendingKnowledge = knowledgeSubmissions.filter((item) => item.status === 'PENDING').length
    return {
      totalPosts: posts.length,
      pendingPosts,
      reviewedPosts: posts.length - pendingPosts,
      pendingReports,
      pendingKnowledge,
      activeChallenges: challenges.filter((item) => item.challenge.status === 'PUBLISHED' && !item.isExpired).length,
    }
  }, [posts, reports, challenges, knowledgeSubmissions])

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
            <StatCard label="科普投稿" value={stats.pendingKnowledge} tone="red" />
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
            knowledgeSubmissions={knowledgeSubmissions}
            expandedUsers={expandedUsers}
            toggleUser={toggleUser}
            isLoading={isLoading}
            reviewPost={reviewPost}
            reviewReport={reviewReport}
            reviewKnowledgeSubmission={reviewKnowledgeSubmission}
          />
        )}

        {activeSection === 'operations' && (
          <section className="workspace">
            <OperationsWorkspace
              operationView={operationView}
              setOperationView={setOperationView}
              challenges={challenges}
              fortuneCards={fortuneCards}
              knowledgeItems={knowledgeItems}
              onSaveChallenge={saveChallenge}
              onSaveFortuneCard={saveFortuneCard}
              onSaveKnowledgeItem={saveKnowledgeItem}
              onUpdateKnowledgeStatus={updateKnowledgeStatus}
              onDeleteKnowledgeItem={deleteKnowledgeItem}
            />
          </section>
        )}
      </section>
    </main>
  )
}

function OperationsWorkspace({
  operationView,
  setOperationView,
  challenges,
  fortuneCards,
  knowledgeItems,
  onSaveChallenge,
  onSaveFortuneCard,
  onSaveKnowledgeItem,
  onUpdateKnowledgeStatus,
  onDeleteKnowledgeItem,
}: {
  operationView: OperationView
  setOperationView: (value: OperationView) => void
  challenges: AdminChallenge[]
  fortuneCards: FortuneCard[]
  knowledgeItems: KnowledgeItem[]
  onSaveChallenge: (challenge: ChallengeFormValue, challengeId?: number) => Promise<boolean>
  onSaveFortuneCard: (fortuneCard: FortuneCardFormValue, fortuneCardId?: number) => Promise<boolean>
  onSaveKnowledgeItem: (knowledge: KnowledgeFormValue, knowledgeId?: number) => Promise<boolean>
  onUpdateKnowledgeStatus: (knowledgeId: number, status: KnowledgeStatus) => Promise<void>
  onDeleteKnowledgeItem: (knowledgeId: number) => Promise<void>
}) {
  const operationViews: Array<{ key: OperationView; label: string }> = [
    { key: 'challenges', label: '挑战活动' },
    { key: 'fortune', label: '福运卡' },
    { key: 'knowledge', label: '科普页' },
  ]

  return (
    <section className="operations-stack">
      <SegmentedControl items={operationViews} value={operationView} onChange={setOperationView} />
      {operationView === 'challenges' && (
        <ChallengeWorkspace challenges={challenges} onSave={onSaveChallenge} />
      )}
      {operationView === 'fortune' && (
        <FortuneWorkspace fortuneCards={fortuneCards} onSave={onSaveFortuneCard} />
      )}
      {operationView === 'knowledge' && (
        <KnowledgeWorkspace
          knowledgeItems={knowledgeItems}
          onSave={onSaveKnowledgeItem}
          onUpdateStatus={onUpdateKnowledgeStatus}
          onDelete={onDeleteKnowledgeItem}
        />
      )}
    </section>
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
  knowledgeSubmissions,
  expandedUsers,
  toggleUser,
  isLoading,
  reviewPost,
  reviewReport,
  reviewKnowledgeSubmission,
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
  knowledgeSubmissions: KnowledgeSubmission[]
  expandedUsers: Set<number>
  toggleUser: (userId: number) => void
  isLoading: boolean
  reviewPost: (postId: number, action: 'pass' | 'reject') => Promise<void>
  reviewReport: (reportId: number, reportResult: ReportResult, postAction: PostAction) => Promise<void>
  reviewKnowledgeSubmission: (submissionId: number, action: 'adopt' | 'reject') => Promise<void>
}) {
  const auditViews: Array<{ key: AuditView; label: string }> = [
    { key: 'posts', label: '动态审核' },
    { key: 'users', label: '按用户审核' },
    { key: 'reports', label: '举报复审' },
    { key: 'knowledge', label: '科普投稿' },
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

      {auditView === 'knowledge' && (
        <div className="audit-pane">
          <div className="post-grid">
            {knowledgeSubmissions.map((submission) => (
              <KnowledgeSubmissionCard
                key={submission.id}
                submission={submission}
                onReview={reviewKnowledgeSubmission}
              />
            ))}
          </div>
          <EmptyState visible={!isLoading && knowledgeSubmissions.length === 0} text="暂无科普投稿" />
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

function KnowledgeSubmissionCard({
  submission,
  onReview,
}: {
  submission: KnowledgeSubmission
  onReview: (submissionId: number, action: 'adopt' | 'reject') => Promise<void>
}) {
  return (
    <article className="post-card knowledge-card">
      <div className="card-topline">
        <span className={`status-badge ${knowledgeStatusClass(submission.status)}`}>
          {knowledgeStatusLabel(submission.status)}
        </span>
        <time>{formatTime(submission.createTime)}</time>
      </div>
      <ImageGridFromUrls imageUrls={submission.imageUrls} />
      <div className="post-copy">
        <div className="author-line">
          <Avatar user={submission.author} />
          <div>
            <strong>{displayName(submission.author)}</strong>
            <span>{submission.category} · 科普投稿</span>
          </div>
        </div>
        <h3>{submission.title}</h3>
        <p>{submission.content || '暂无正文'}</p>
        <div className="knowledge-question">
          <strong>{submission.questionType === 'SINGLE_CHOICE' ? '单选题' : '判断题'}</strong>
          <p>{submission.questionText}</p>
          {submission.optionsJson && <span>选项：{parseOptionText(submission.optionsJson)}</span>}
          <span>答案：{submission.answer}</span>
          {submission.answerExplanation && <span>解析：{submission.answerExplanation}</span>}
        </div>
        {submission.reviewNote && <p className="review-note">{submission.reviewNote}</p>}
      </div>
      <div className="card-actions">
        <button className="approve" onClick={() => void onReview(submission.id, 'adopt')}>采纳</button>
        <button className="reject" onClick={() => void onReview(submission.id, 'reject')}>拒绝</button>
      </div>
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

function FortuneWorkspace({
  fortuneCards,
  onSave,
}: {
  fortuneCards: FortuneCard[]
  onSave: (fortuneCard: FortuneCardFormValue, fortuneCardId?: number) => Promise<boolean>
}) {
  const [editing, setEditing] = useState<FortuneCard | null>(null)
  const [form, setForm] = useState<FortuneCardFormValue>(() => emptyFortuneCardForm())
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = (item: FortuneCard) => {
    setEditing(item)
    setForm(fortuneCardToForm(item))
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyFortuneCardForm())
  }

  const submit = async () => {
    setIsSaving(true)
    const ok = await onSave(form, editing?.id)
    setIsSaving(false)
    if (ok) resetForm()
  }

  return (
    <div className="fortune-workspace">
      <div className="fortune-editor">
        <div className="editor-head">
          <div>
            <p className="eyebrow">剪纸历运营</p>
            <h3>{editing ? '编辑福运卡' : '创建福运卡'}</h3>
          </div>
          {editing && <button className="ghost-button" onClick={resetForm}>取消编辑</button>}
        </div>
        <div className="form-grid">
          <label>
            展示日期
            <input type="date" value={form.displayDate} onChange={(event) => setForm({ ...form, displayDate: event.target.value })} />
          </label>
          <label>
            节气
            <input value={form.solarTerm} onChange={(event) => setForm({ ...form, solarTerm: event.target.value })} placeholder="谷雨 · 喜鹊登梅" />
          </label>
          <label>
            农历日期
            <input value={form.lunarDate} onChange={(event) => setForm({ ...form, lunarDate: event.target.value })} placeholder="庚子年 · 腊月初八" />
          </label>
          <label>
            宜做事件
            <input value={form.suitableEvents} onChange={(event) => setForm({ ...form, suitableEvents: event.target.value })} placeholder="祈福、纳财" />
          </label>
          <label className="span-2">
            图案图片 URL
            <input value={form.patternImageUrl} onChange={(event) => setForm({ ...form, patternImageUrl: event.target.value })} placeholder="/images/fortune.jpg" />
          </label>
        </div>
        <button className="review-submit" disabled={isSaving} onClick={() => void submit()}>
          {isSaving ? '保存中...' : editing ? '保存修改' : '创建福运卡'}
        </button>
      </div>

      <div className="fortune-list">
        {fortuneCards.map((item) => (
          <FortuneCardItem key={item.id} item={item} onEdit={() => startEdit(item)} />
        ))}
      </div>
      <EmptyState visible={fortuneCards.length === 0} text="暂无福运卡" />
    </div>
  )
}

function FortuneCardItem({ item, onEdit }: { item: FortuneCard; onEdit: () => void }) {
  const image = getFullImageUrl(item.patternImageUrl)

  return (
    <article className="fortune-card">
      <div className="card-topline">
        <span className="status-badge approved">{item.displayDate}</span>
        <time>展示日期</time>
      </div>
      <div className="fortune-card-body">
        <div className="fortune-preview">
          {image ? <img src={image} alt="" referrerPolicy="no-referrer" /> : <span>无图案</span>}
        </div>
        <div>
          <p className="eyebrow">{item.lunarDate}</p>
          <h3>{item.solarTerm}</h3>
          <p>宜：{item.suitableEvents}</p>
        </div>
      </div>
      <button className="ghost-button" onClick={onEdit}>编辑</button>
    </article>
  )
}

function KnowledgeWorkspace({
  knowledgeItems,
  onSave,
  onUpdateStatus,
  onDelete,
}: {
  knowledgeItems: KnowledgeItem[]
  onSave: (knowledge: KnowledgeFormValue, knowledgeId?: number) => Promise<boolean>
  onUpdateStatus: (knowledgeId: number, status: KnowledgeStatus) => Promise<void>
  onDelete: (knowledgeId: number) => Promise<void>
}) {
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [form, setForm] = useState<KnowledgeFormValue>(() => emptyKnowledgeForm())
  const [filter, setFilter] = useState<KnowledgeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [isSaving, setIsSaving] = useState(false)

  const filteredKnowledge = knowledgeItems.filter((item) => {
    const statusMatches = filter === 'all' || item.status === filter
    const categoryMatches = categoryFilter === '全部' || item.category === categoryFilter
    return statusMatches && categoryMatches
  })

  const startEdit = (item: KnowledgeItem) => {
    setEditing(item)
    setForm(knowledgeToForm(item))
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyKnowledgeForm())
  }

  const submit = async () => {
    setIsSaving(true)
    const ok = await onSave(form, editing?.id)
    setIsSaving(false)
    if (ok) resetForm()
  }

  return (
    <div className="knowledge-workspace">
      <div className="knowledge-editor">
        <div className="editor-head">
          <div>
            <p className="eyebrow">科普页运营</p>
            <h3>{editing ? '编辑科普内容' : '新增官方科普'}</h3>
          </div>
          {editing && <button className="ghost-button" onClick={resetForm}>取消编辑</button>}
        </div>
        <KnowledgeForm form={form} setForm={setForm} />
        <button className="review-submit" disabled={isSaving} onClick={() => void submit()}>
          {isSaving ? '保存中...' : editing ? '保存修改' : '新增内容'}
        </button>
      </div>

      <div className="knowledge-list-pane">
        <div className="knowledge-filters">
          <SegmentedControl items={knowledgeFilters} value={filter} onChange={setFilter} />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {['全部', ...knowledgeCategories].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="knowledge-list">
          {filteredKnowledge.map((item) => (
            <KnowledgeAdminCard
              key={item.id}
              item={item}
              onEdit={() => startEdit(item)}
              onToggleStatus={() => void onUpdateStatus(item.id, item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED')}
              onDelete={() => {
                if (window.confirm('确认删除这条科普内容？')) void onDelete(item.id)
              }}
            />
          ))}
        </div>
        <EmptyState visible={filteredKnowledge.length === 0} text="当前筛选下没有科普内容" />
      </div>
    </div>
  )
}

function KnowledgeForm({
  form,
  setForm,
}: {
  form: KnowledgeFormValue
  setForm: (form: KnowledgeFormValue) => void
}) {
  return (
    <div className="form-grid">
      <label>
        分类
        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
          {knowledgeCategories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>
      <label>
        状态
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as KnowledgeStatus })}>
          <option value="PUBLISHED">展示中</option>
          <option value="ARCHIVED">已下架</option>
        </select>
      </label>
      <label className="span-2">
        标题
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="什么是中国民间剪纸" />
      </label>
      <label className="span-2">
        内容
        <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={5} />
      </label>
      <label>
        题型
        <select value={form.questionType} onChange={(event) => setForm({
          ...form,
          questionType: event.target.value,
          optionsJson: event.target.value === 'TRUE_FALSE' ? '["正确","错误"]' : form.optionsJson,
        })}>
          <option value="TRUE_FALSE">判断题</option>
          <option value="SINGLE_CHOICE">单选题</option>
        </select>
      </label>
      <label>
        答案
        <input value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} placeholder={form.questionType === 'TRUE_FALSE' ? 'true 或 false' : '填写完整选项文本'} />
      </label>
      <label className="span-2">
        题目
        <textarea value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })} rows={3} />
      </label>
      <label className="span-2">
        选项 JSON
        <input value={form.optionsJson} onChange={(event) => setForm({ ...form, optionsJson: event.target.value })} placeholder='["A","B","C"]' />
      </label>
      <label className="span-2">
        答案解析
        <textarea value={form.answerExplanation} onChange={(event) => setForm({ ...form, answerExplanation: event.target.value })} rows={3} />
      </label>
    </div>
  )
}

function KnowledgeAdminCard({
  item,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  item: KnowledgeItem
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  return (
    <article className="knowledge-admin-card">
      <div className="card-topline">
        <span className={`status-badge ${item.status === 'PUBLISHED' ? 'approved' : 'rejected'}`}>
          {item.status === 'PUBLISHED' ? '展示中' : '已下架'}
        </span>
        <time>{item.sourceType === 'USER' ? '用户投稿' : '官方内容'}</time>
      </div>
      <p className="eyebrow">{item.category}</p>
      <h3>{item.title}</h3>
      <p>{item.content || '暂无正文'}</p>
      <div className="knowledge-question">
        <strong>{item.questionType === 'SINGLE_CHOICE' ? '单选题' : '判断题'}</strong>
        <p>{item.questionText}</p>
        {item.optionsJson && <span>选项：{parseOptionText(item.optionsJson)}</span>}
        <span>答案：{item.answer}</span>
        {item.answerExplanation && <span>解析：{item.answerExplanation}</span>}
      </div>
      <div className="knowledge-admin-actions">
        <button className="ghost-button" onClick={onEdit}>编辑</button>
        <button className="ghost-button" onClick={onToggleStatus}>{item.status === 'PUBLISHED' ? '下架' : '发布'}</button>
        <button className="ghost-button danger" onClick={onDelete}>删除</button>
      </div>
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
  return <ImageGridFromUrls imageUrls={urls.join(',')} />
}

function ImageGridFromUrls({ imageUrls }: { imageUrls: string }) {
  const urls = imageUrls
    .split(',')
    .map((item) => getFullImageUrl(item))
    .filter(Boolean)
    .slice(0, 9)
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

function knowledgeStatusLabel(status: KnowledgeSubmissionStatus) {
  if (status === 'ADOPTED') return '已采纳'
  if (status === 'REJECTED') return '已拒绝'
  return '待审核'
}

function knowledgeStatusClass(status: KnowledgeSubmissionStatus) {
  if (status === 'ADOPTED') return 'approved'
  if (status === 'REJECTED') return 'rejected'
  return 'pending'
}

function parseOptionText(raw: string) {
  return raw.replace(/^\[/, '').replace(/\]$/, '').replaceAll('"', '').split(',').map((item) => item.trim()).filter(Boolean).join(' / ')
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

function emptyFortuneCardForm(): FortuneCardFormValue {
  return {
    displayDate: toDateInputValue(new Date().toISOString()),
    patternImageUrl: '',
    lunarDate: '',
    solarTerm: '',
    suitableEvents: '',
  }
}

function emptyKnowledgeForm(): KnowledgeFormValue {
  return {
    category: '定义',
    title: '',
    content: '',
    questionType: 'TRUE_FALSE',
    questionText: '',
    optionsJson: '["正确","错误"]',
    answer: 'false',
    answerExplanation: '',
    status: 'PUBLISHED',
  }
}

function knowledgeToForm(item: KnowledgeItem): KnowledgeFormValue {
  return {
    category: item.category,
    title: item.title,
    content: item.content,
    questionType: item.questionType,
    questionText: item.questionText,
    optionsJson: item.optionsJson,
    answer: item.answer,
    answerExplanation: item.answerExplanation,
    status: item.status,
  }
}

function fortuneCardToForm(fortuneCard: FortuneCard): FortuneCardFormValue {
  return {
    displayDate: fortuneCard.displayDate,
    patternImageUrl: fortuneCard.patternImageUrl,
    lunarDate: fortuneCard.lunarDate,
    solarTerm: fortuneCard.solarTerm,
    suitableEvents: fortuneCard.suitableEvents,
  }
}

function toDateInputValue(raw: string) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
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
  if (auditView === 'knowledge') return '审核中心 · 科普投稿'
  return '审核中心 · 动态审核'
}

export default App

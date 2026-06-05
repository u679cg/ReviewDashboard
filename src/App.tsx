import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import './App.css'

const API_BASE = 'http://43.143.241.204:8080'

type ReviewStatus = 0 | 1 | 2
type ReportReviewStatus = 'pending' | 'reviewed'
type ReportResult = 'valid' | 'invalid'
type PostAction = 'keep' | 'reject' | 'approve'
type CommentAction = 'keep' | 'delete'
type ReportKind = 'posts' | 'comments'
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
  latestPostTime?: string | null
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

type CommentSummary = {
  id: number
  postId?: number | null
  parentId?: number | null
  author?: User | null
  replyToUser?: User | null
  content: string
  likeCount?: number
  createTime?: string
}

type CommentReport = {
  id: number
  comment?: CommentSummary | null
  post?: Post | null
  reporter?: User | null
  reason: string
  description?: string
  reviewStatus: ReportReviewStatus
  reportResult?: ReportResult | null
  commentAction?: CommentAction | null
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
type OperationView = 'challenges' | 'fortune' | 'knowledge' | 'officialInfo'
type KnowledgeSubmissionStatus = 'PENDING' | 'ADOPTED' | 'REJECTED'
type KnowledgeStatus = 'PUBLISHED' | 'ARCHIVED'
type OfficialInfoStatus = 'PUBLISHED' | 'ARCHIVED'
type OfficialInfoCategory = 'HOT' | 'INTERVIEW_VIDEO' | 'ACTIVITY' | 'ARTICLE'
type KnowledgeFilter = 'all' | KnowledgeStatus
type OfficialInfoFilter = 'all' | OfficialInfoStatus
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

type OfficialInfoItem = {
  id: number
  category: OfficialInfoCategory
  title: string
  summary: string
  content: string
  coverImageUrl: string
  videoUrl: string
  publishDate: string
  status: OfficialInfoStatus
  sortOrder: number
  createTime?: string
  updateTime?: string
}

type OfficialInfoFormValue = {
  category: OfficialInfoCategory
  title: string
  summary: string
  content: string
  coverImageUrl: string
  videoUrl: string
  publishDate: string
  status: OfficialInfoStatus
  sortOrder: number
}

const knowledgeCategories = ['定义', '历史', '技艺', '信仰', '风格', '民俗', '符号', '民族', '传承', '现代']

const officialInfoCategories: Array<{ key: OfficialInfoCategory; label: string }> = [
  { key: 'HOT', label: '热点信息' },
  { key: 'INTERVIEW_VIDEO', label: '访谈视频' },
  { key: 'ACTIVITY', label: '活动资讯' },
  { key: 'ARTICLE', label: '精选文章' },
]

const knowledgeFilters: Array<{ key: KnowledgeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'PUBLISHED', label: '展示中' },
  { key: 'ARCHIVED', label: '已下架' },
]

const officialInfoFilters: Array<{ key: OfficialInfoFilter; label: string }> = [
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

const reportKinds: Array<{ key: ReportKind; label: string }> = [
  { key: 'posts', label: '动态举报' },
  { key: 'comments', label: '评论举报' },
]

type ChallengeFilter = 'all' | ChallengeStatus
type KnowledgeSourceFilter = 'all' | 'OFFICIAL' | 'USER'
type KnowledgeSubmissionFilter = 'all' | KnowledgeSubmissionStatus

type AdminPageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

type ModuleState<T> = AdminPageResponse<T> & {
  isLoading: boolean
  isRefreshing: boolean
  error: string
  loaded: boolean
  lastUpdated: string | null
}

type AdminOverview = {
  totalPosts: number
  pendingPosts: number
  approvedPosts: number
  rejectedPosts: number
  reviewedPosts: number
  pendingReports: number
  pendingKnowledgeSubmissions: number
  activeChallenges: number
}

type ModuleKey =
  | 'posts'
  | 'users'
  | 'reports'
  | 'submissions'
  | 'challenges'
  | 'fortune'
  | 'knowledge'
  | 'officialInfo'

const PAGE_SIZE = 20
const OVERVIEW_REFRESH_INTERVAL_MS = 60_000

const challengeFilters: Array<{ key: ChallengeFilter; label: string }> = [
  { key: 'all', label: '全部挑战' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'PUBLISHED', label: '已发布' },
  { key: 'ARCHIVED', label: '已归档' },
]

const knowledgeSourceFilters: Array<{ key: KnowledgeSourceFilter; label: string }> = [
  { key: 'all', label: '全部来源' },
  { key: 'OFFICIAL', label: '官方内容' },
  { key: 'USER', label: '用户投稿' },
]

const knowledgeSubmissionFilters: Array<{ key: KnowledgeSubmissionFilter; label: string }> = [
  { key: 'all', label: '全部投稿' },
  { key: 'PENDING', label: '待审核' },
  { key: 'ADOPTED', label: '已采纳' },
  { key: 'REJECTED', label: '已拒绝' },
]

const emptyOverview: AdminOverview = {
  totalPosts: 0,
  pendingPosts: 0,
  approvedPosts: 0,
  rejectedPosts: 0,
  reviewedPosts: 0,
  pendingReports: 0,
  pendingKnowledgeSubmissions: 0,
  activeChallenges: 0,
}

function emptyModuleState<T>(): ModuleState<T> {
  return {
    items: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
    isLoading: false,
    isRefreshing: false,
    error: '',
    loaded: false,
    lastUpdated: null,
  }
}

function App() {
  const [activeSection, setActiveSection] = useState<AdminSection>('audit')
  const [auditView, setAuditView] = useState<AuditView>('posts')
  const [operationView, setOperationView] = useState<OperationView>('challenges')
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all')
  const [reportKind, setReportKind] = useState<ReportKind>('posts')
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('all')
  const [knowledgeFilter, setKnowledgeFilter] = useState<KnowledgeFilter>('all')
  const [knowledgeCategory, setKnowledgeCategory] = useState('全部')
  const [knowledgeSource, setKnowledgeSource] = useState<KnowledgeSourceFilter>('all')
  const [officialInfoFilter, setOfficialInfoFilter] = useState<OfficialInfoFilter>('all')
  const [officialInfoCategory, setOfficialInfoCategory] = useState<'全部' | OfficialInfoCategory>('全部')
  const [knowledgeSubmissionFilter, setKnowledgeSubmissionFilter] = useState<KnowledgeSubmissionFilter>('all')
  const [knowledgeSubmissionCategory, setKnowledgeSubmissionCategory] = useState('全部')
  const [fortuneFromDate, setFortuneFromDate] = useState('')
  const [fortuneToDate, setFortuneToDate] = useState('')
  const initialKeywords: Record<ModuleKey, string> = {
    posts: '',
    users: '',
    reports: '',
    submissions: '',
    challenges: '',
    fortune: '',
    knowledge: '',
    officialInfo: '',
  }
  const [keywords, setKeywords] = useState<Record<ModuleKey, string>>(initialKeywords)
  const [searchInputs, setSearchInputs] = useState<Record<ModuleKey, string>>(initialKeywords)
  const [posts, setPosts] = useState<ModuleState<Post>>(() => emptyModuleState())
  const [groups, setGroups] = useState<ModuleState<UserGroup>>(() => emptyModuleState())
  const [reports, setReports] = useState<ModuleState<PostReport>>(() => emptyModuleState())
  const [commentReports, setCommentReports] = useState<ModuleState<CommentReport>>(() => emptyModuleState())
  const [challenges, setChallenges] = useState<ModuleState<AdminChallenge>>(() => emptyModuleState())
  const [fortuneCards, setFortuneCards] = useState<ModuleState<FortuneCard>>(() => emptyModuleState())
  const [knowledgeItems, setKnowledgeItems] = useState<ModuleState<KnowledgeItem>>(() => emptyModuleState())
  const [officialInfoItems, setOfficialInfoItems] = useState<ModuleState<OfficialInfoItem>>(() => emptyModuleState())
  const [knowledgeSubmissions, setKnowledgeSubmissions] = useState<ModuleState<KnowledgeSubmission>>(() => emptyModuleState())
  const [groupPosts, setGroupPosts] = useState<Record<number, ModuleState<Post>>>({})
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(() => new Set())
  const [error, setError] = useState('')
  const [overviewError, setOverviewError] = useState('')
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview)
  const [overviewUpdatedAt, setOverviewUpdatedAt] = useState<string | null>(null)

  const updateKeyword = (module: ModuleKey, value: string) => {
    setSearchInputs((current) => ({ ...current, [module]: value }))
  }

  const applySearch = (module: ModuleKey, reload: (page?: number) => Promise<void>) => {
    const nextKeyword = searchInputs[module]
    if (keywords[module] === nextKeyword) {
      void reload(0)
      return
    }
    setKeywords((current) => ({ ...current, [module]: nextKeyword }))
  }

  const currentModule = activeSection === 'audit' ? auditViewToModule(auditView) : operationView

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/overview`)
      if (!response.ok) throw new Error(`待办角标加载失败：HTTP ${response.status}`)
      setOverview(await response.json())
      setOverviewUpdatedAt(new Date().toISOString())
      setOverviewError('')
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : '待办角标加载失败')
    }
  }, [])

  const loadPage = useCallback(async <T,>(
    url: string,
    page: number,
    setState: Dispatch<SetStateAction<ModuleState<T>>>,
    label: string,
  ) => {
    const refreshing = page === 0
    setState((current) => ({
      ...current,
      isLoading: !current.loaded,
      isRefreshing: current.loaded && refreshing,
      error: '',
    }))
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${label}加载失败：HTTP ${response.status}`)
      const data = await response.json() as AdminPageResponse<T>
      setState({
        ...data,
        isLoading: false,
        isRefreshing: false,
        error: '',
        loaded: true,
        lastUpdated: new Date().toISOString(),
      })
    } catch (err) {
      setState((current) => ({
        ...current,
        isLoading: false,
        isRefreshing: false,
        error: err instanceof Error ? err.message : `${label}加载失败`,
        loaded: true,
      }))
    }
  }, [])

  const loadPosts = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/posts/admin/review-list', {
      status: postFilter,
      keyword: keywords.posts,
      page,
      size: PAGE_SIZE,
    }), page, setPosts, '动态审核')
  }, [keywords.posts, loadPage, postFilter])

  const loadGroups = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/posts/admin/user-groups', {
      status: postFilter,
      keyword: keywords.users,
      page,
      size: PAGE_SIZE,
    }), page, setGroups, '用户分组')
  }, [keywords.users, loadPage, postFilter])

  const loadGroupPosts = useCallback((userId: number, page = 0) => {
    const setState: Dispatch<SetStateAction<ModuleState<Post>>> = (updater) => {
      setGroupPosts((current) => {
        const previous = current[userId] ?? emptyModuleState<Post>()
        const next = typeof updater === 'function' ? updater(previous) : updater
        return { ...current, [userId]: next }
      })
    }
    return loadPage(buildUrl(`/api/posts/admin/user-groups/${userId}/posts`, {
      status: postFilter,
      keyword: keywords.users,
      page,
      size: PAGE_SIZE,
    }), page, setState, '用户动态')
  }, [keywords.users, loadPage, postFilter])

  const loadReports = useCallback((page = 0) => {
    if (reportKind === 'comments') {
      return loadPage(buildUrl('/api/reports/comments/admin', {
        reviewStatus: reportFilter,
        keyword: keywords.reports,
        page,
        size: PAGE_SIZE,
      }), page, setCommentReports, '评论举报复审')
    }
    return loadPage(buildUrl('/api/reports/posts/admin', {
      reviewStatus: reportFilter,
      keyword: keywords.reports,
      page,
      size: PAGE_SIZE,
    }), page, setReports, '动态举报复审')
  }, [keywords.reports, loadPage, reportFilter, reportKind])

  const loadSubmissions = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/knowledge/admin/submissions', {
      status: knowledgeSubmissionFilter,
      category: knowledgeSubmissionCategory,
      keyword: keywords.submissions,
      page,
      size: PAGE_SIZE,
    }), page, setKnowledgeSubmissions, '科普投稿')
  }, [keywords.submissions, knowledgeSubmissionCategory, knowledgeSubmissionFilter, loadPage])

  const loadChallenges = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/challenges/admin', {
      status: challengeFilter,
      keyword: keywords.challenges,
      page,
      size: PAGE_SIZE,
    }), page, setChallenges, '挑战管理')
  }, [challengeFilter, keywords.challenges, loadPage])

  const loadFortune = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/fortune/admin', {
      keyword: keywords.fortune,
      fromDate: fortuneFromDate,
      toDate: fortuneToDate,
      page,
      size: PAGE_SIZE,
    }), page, setFortuneCards, '福运卡管理')
  }, [fortuneFromDate, fortuneToDate, keywords.fortune, loadPage])

  const loadKnowledge = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/knowledge/admin', {
      status: knowledgeFilter,
      category: knowledgeCategory,
      sourceType: knowledgeSource,
      keyword: keywords.knowledge,
      page,
      size: PAGE_SIZE,
    }), page, setKnowledgeItems, '科普页管理')
  }, [keywords.knowledge, knowledgeCategory, knowledgeFilter, knowledgeSource, loadPage])

  const loadOfficialInfo = useCallback((page = 0) => {
    return loadPage(buildUrl('/api/official-info/admin', {
      status: officialInfoFilter,
      category: officialInfoCategory === '全部' ? 'all' : officialInfoCategory,
      keyword: keywords.officialInfo,
      page,
      size: PAGE_SIZE,
    }), page, setOfficialInfoItems, '官方资讯')
  }, [keywords.officialInfo, loadPage, officialInfoCategory, officialInfoFilter])

  const refreshCurrentModule = useCallback((page = 0) => {
    const loaders: Record<ModuleKey, (page?: number) => Promise<void>> = {
      posts: loadPosts,
      users: loadGroups,
      reports: loadReports,
      submissions: loadSubmissions,
      challenges: loadChallenges,
      fortune: loadFortune,
      knowledge: loadKnowledge,
      officialInfo: loadOfficialInfo,
    }
    return loaders[currentModule](page)
  }, [currentModule, loadChallenges, loadFortune, loadGroups, loadKnowledge, loadOfficialInfo, loadPosts, loadReports, loadSubmissions])

  useEffect(() => {
    void loadOverview()
    const timer = window.setInterval(() => void loadOverview(), OVERVIEW_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [loadOverview])

  useEffect(() => {
    void refreshCurrentModule(0)
  }, [refreshCurrentModule])

  useEffect(() => {
    setExpandedUsers(new Set())
    setGroupPosts({})
  }, [keywords.users, postFilter])

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
    setError('')
    await Promise.all([refreshCurrentModule(), loadOverview()])
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
    setError('')
    await Promise.all([loadReports(), loadOverview()])
  }

  const reviewCommentReport = async (
    reportId: number,
    reportResult: ReportResult,
    commentAction: CommentAction,
  ) => {
    const response = await fetch(`${API_BASE}/api/reports/comments/${reportId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportResult, commentAction }),
    })

    if (!response.ok) {
      setError('评论举报复审操作失败')
      return
    }
    setError('')
    await Promise.all([loadReports(), loadOverview()])
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
    setError('')
    await Promise.all([loadChallenges(0), loadOverview()])
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
    setError('')
    await loadFortune(0)
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
    setError('')
    await Promise.all([loadSubmissions(), loadOverview()])
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
    setError('')
    await loadKnowledge(0)
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
    setError('')
    await loadKnowledge()
  }

  const deleteKnowledgeItem = async (knowledgeId: number) => {
    const response = await fetch(`${API_BASE}/api/knowledge/admin/${knowledgeId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      setError('科普内容删除失败')
      return
    }
    setError('')
    await loadKnowledge()
  }

  const saveOfficialInfoItem = async (info: OfficialInfoFormValue, infoId?: number) => {
    const response = await fetch(
      infoId ? `${API_BASE}/api/official-info/admin/${infoId}` : `${API_BASE}/api/official-info/admin`,
      {
        method: infoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      },
    )

    if (!response.ok) {
      const message = await response.text()
      setError(message || '官方资讯保存失败')
      return false
    }
    setError('')
    await loadOfficialInfo(0)
    return true
  }

  const updateOfficialInfoStatus = async (infoId: number, status: OfficialInfoStatus) => {
    const response = await fetch(`${API_BASE}/api/official-info/admin/${infoId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      setError('官方资讯状态更新失败')
      return
    }
    setError('')
    await loadOfficialInfo()
  }

  const deleteOfficialInfoItem = async (infoId: number) => {
    const response = await fetch(`${API_BASE}/api/official-info/admin/${infoId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      setError('官方资讯删除失败')
      return
    }
    setError('')
    await loadOfficialInfo()
  }

  const uploadOfficialInfoCover = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await fetch(`${API_BASE}/api/official-info/admin/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const message = await response.text()
      setError(message || '封面图上传失败')
      return ''
    }
    const data = await response.json() as { url?: string }
    return data.url || ''
  }

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
          <p>角标刷新</p>
          <strong>每 60 秒</strong>
          <span>{overviewUpdatedAt ? `角标：${formatTime(overviewUpdatedAt)}` : '等待首次刷新'}</span>
          <button onClick={() => void refreshCurrentModule(0)} disabled={currentModuleState({
            posts,
            users: groups,
            reports: reportKind === 'comments' ? commentReports : reports,
            submissions: knowledgeSubmissions,
            challenges,
            fortune: fortuneCards,
            knowledge: knowledgeItems,
            officialInfo: officialInfoItems,
          }, currentModule).isRefreshing}>
            {currentModuleState({
              posts,
              users: groups,
              reports: reportKind === 'comments' ? commentReports : reports,
              submissions: knowledgeSubmissions,
              challenges,
              fortune: fortuneCards,
              knowledge: knowledgeItems,
              officialInfo: officialInfoItems,
            }, currentModule).isRefreshing ? '刷新中...' : '刷新当前模块'}
          </button>
        </section>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">后台管理工作台</p>
            <h2>{sectionTitle(activeSection, auditView)}</h2>
          </div>
          <div className="stat-grid" aria-label="审核统计">
            <StatCard label="动态总数" value={overview.totalPosts} tone="rice" />
            <StatCard label="未审核动态" value={overview.pendingPosts} tone="red" />
            <StatCard label="已审核动态" value={overview.reviewedPosts} tone="green" />
            <StatCard label="未复审举报" value={overview.pendingReports} tone="orange" />
            <StatCard label="科普投稿" value={overview.pendingKnowledgeSubmissions} tone="red" />
            <StatCard label="进行中挑战" value={overview.activeChallenges} tone="red" />
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {overviewError && <div className="error-banner">{overviewError}</div>}
        {activeSection === 'audit' && (
          <AuditCenter
            auditView={auditView}
            setAuditView={setAuditView}
            postFilter={postFilter}
            setPostFilter={setPostFilter}
            reportFilter={reportFilter}
            setReportFilter={setReportFilter}
            reportKind={reportKind}
            setReportKind={setReportKind}
            knowledgeSubmissionFilter={knowledgeSubmissionFilter}
            setKnowledgeSubmissionFilter={setKnowledgeSubmissionFilter}
            knowledgeSubmissionCategory={knowledgeSubmissionCategory}
            setKnowledgeSubmissionCategory={setKnowledgeSubmissionCategory}
            keywords={searchInputs}
            updateKeyword={updateKeyword}
            applySearch={applySearch}
            posts={posts}
            groups={groups}
            groupPosts={groupPosts}
            reports={reports}
            commentReports={commentReports}
            knowledgeSubmissions={knowledgeSubmissions}
            expandedUsers={expandedUsers}
            toggleUser={toggleUser}
            loadPosts={loadPosts}
            loadGroups={loadGroups}
            loadGroupPosts={loadGroupPosts}
            loadReports={loadReports}
            loadSubmissions={loadSubmissions}
            overview={overview}
            reviewPost={reviewPost}
            reviewReport={reviewReport}
            reviewCommentReport={reviewCommentReport}
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
              officialInfoItems={officialInfoItems}
              challengeFilter={challengeFilter}
              setChallengeFilter={setChallengeFilter}
              knowledgeFilter={knowledgeFilter}
              setKnowledgeFilter={setKnowledgeFilter}
              knowledgeCategory={knowledgeCategory}
              setKnowledgeCategory={setKnowledgeCategory}
              knowledgeSource={knowledgeSource}
              setKnowledgeSource={setKnowledgeSource}
              officialInfoFilter={officialInfoFilter}
              setOfficialInfoFilter={setOfficialInfoFilter}
              officialInfoCategory={officialInfoCategory}
              setOfficialInfoCategory={setOfficialInfoCategory}
              fortuneFromDate={fortuneFromDate}
              setFortuneFromDate={setFortuneFromDate}
              fortuneToDate={fortuneToDate}
              setFortuneToDate={setFortuneToDate}
              keywords={searchInputs}
              updateKeyword={updateKeyword}
              applySearch={applySearch}
              loadChallenges={loadChallenges}
              loadFortune={loadFortune}
              loadKnowledge={loadKnowledge}
              loadOfficialInfo={loadOfficialInfo}
              overview={overview}
              onSaveChallenge={saveChallenge}
              onSaveFortuneCard={saveFortuneCard}
              onSaveKnowledgeItem={saveKnowledgeItem}
              onUpdateKnowledgeStatus={updateKnowledgeStatus}
              onDeleteKnowledgeItem={deleteKnowledgeItem}
              onSaveOfficialInfoItem={saveOfficialInfoItem}
              onUpdateOfficialInfoStatus={updateOfficialInfoStatus}
              onDeleteOfficialInfoItem={deleteOfficialInfoItem}
              onUploadOfficialInfoCover={uploadOfficialInfoCover}
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
  officialInfoItems,
  challengeFilter,
  setChallengeFilter,
  knowledgeFilter,
  setKnowledgeFilter,
  knowledgeCategory,
  setKnowledgeCategory,
  knowledgeSource,
  setKnowledgeSource,
  officialInfoFilter,
  setOfficialInfoFilter,
  officialInfoCategory,
  setOfficialInfoCategory,
  fortuneFromDate,
  setFortuneFromDate,
  fortuneToDate,
  setFortuneToDate,
  keywords,
  updateKeyword,
  applySearch,
  loadChallenges,
  loadFortune,
  loadKnowledge,
  loadOfficialInfo,
  overview,
  onSaveChallenge,
  onSaveFortuneCard,
  onSaveKnowledgeItem,
  onUpdateKnowledgeStatus,
  onDeleteKnowledgeItem,
  onSaveOfficialInfoItem,
  onUpdateOfficialInfoStatus,
  onDeleteOfficialInfoItem,
  onUploadOfficialInfoCover,
}: {
  operationView: OperationView
  setOperationView: (value: OperationView) => void
  challenges: ModuleState<AdminChallenge>
  fortuneCards: ModuleState<FortuneCard>
  knowledgeItems: ModuleState<KnowledgeItem>
  officialInfoItems: ModuleState<OfficialInfoItem>
  challengeFilter: ChallengeFilter
  setChallengeFilter: (value: ChallengeFilter) => void
  knowledgeFilter: KnowledgeFilter
  setKnowledgeFilter: (value: KnowledgeFilter) => void
  knowledgeCategory: string
  setKnowledgeCategory: (value: string) => void
  knowledgeSource: KnowledgeSourceFilter
  setKnowledgeSource: (value: KnowledgeSourceFilter) => void
  officialInfoFilter: OfficialInfoFilter
  setOfficialInfoFilter: (value: OfficialInfoFilter) => void
  officialInfoCategory: '全部' | OfficialInfoCategory
  setOfficialInfoCategory: (value: '全部' | OfficialInfoCategory) => void
  fortuneFromDate: string
  setFortuneFromDate: (value: string) => void
  fortuneToDate: string
  setFortuneToDate: (value: string) => void
  keywords: Record<ModuleKey, string>
  updateKeyword: (module: ModuleKey, value: string) => void
  applySearch: (module: ModuleKey, reload: (page?: number) => Promise<void>) => void
  loadChallenges: (page?: number) => Promise<void>
  loadFortune: (page?: number) => Promise<void>
  loadKnowledge: (page?: number) => Promise<void>
  loadOfficialInfo: (page?: number) => Promise<void>
  overview: AdminOverview
  onSaveChallenge: (challenge: ChallengeFormValue, challengeId?: number) => Promise<boolean>
  onSaveFortuneCard: (fortuneCard: FortuneCardFormValue, fortuneCardId?: number) => Promise<boolean>
  onSaveKnowledgeItem: (knowledge: KnowledgeFormValue, knowledgeId?: number) => Promise<boolean>
  onUpdateKnowledgeStatus: (knowledgeId: number, status: KnowledgeStatus) => Promise<void>
  onDeleteKnowledgeItem: (knowledgeId: number) => Promise<void>
  onSaveOfficialInfoItem: (info: OfficialInfoFormValue, infoId?: number) => Promise<boolean>
  onUpdateOfficialInfoStatus: (infoId: number, status: OfficialInfoStatus) => Promise<void>
  onDeleteOfficialInfoItem: (infoId: number) => Promise<void>
  onUploadOfficialInfoCover: (file: File) => Promise<string>
}) {
  const operationViews: Array<{ key: OperationView; label: string }> = [
    { key: 'challenges', label: `挑战活动 ${overview.activeChallenges}` },
    { key: 'fortune', label: '福运卡' },
    { key: 'knowledge', label: '科普页' },
    { key: 'officialInfo', label: '官方资讯' },
  ]

  return (
    <section className="operations-stack">
      <SegmentedControl items={operationViews} value={operationView} onChange={setOperationView} />
      {operationView === 'challenges' && (
        <ModuleFrame
          state={challenges}
          keyword={keywords.challenges}
          keywordPlaceholder="搜索标题、标签、描述"
          onKeywordChange={(value) => updateKeyword('challenges', value)}
          onSearch={() => applySearch('challenges', loadChallenges)}
          onPageChange={(page) => void loadChallenges(page)}
          extraFilters={<SegmentedControl items={challengeFilters} value={challengeFilter} onChange={setChallengeFilter} />}
        >
          <ChallengeWorkspace challenges={challenges.items} onSave={onSaveChallenge} />
        </ModuleFrame>
      )}
      {operationView === 'fortune' && (
        <ModuleFrame
          state={fortuneCards}
          keyword={keywords.fortune}
          keywordPlaceholder="搜索节气、农历、宜做事项"
          onKeywordChange={(value) => updateKeyword('fortune', value)}
          onSearch={() => applySearch('fortune', loadFortune)}
          onPageChange={(page) => void loadFortune(page)}
          extraFilters={(
            <>
              <input type="date" value={fortuneFromDate} onChange={(event) => setFortuneFromDate(event.target.value)} />
              <input type="date" value={fortuneToDate} onChange={(event) => setFortuneToDate(event.target.value)} />
            </>
          )}
        >
          <FortuneWorkspace fortuneCards={fortuneCards.items} onSave={onSaveFortuneCard} />
        </ModuleFrame>
      )}
      {operationView === 'knowledge' && (
        <ModuleFrame
          state={knowledgeItems}
          keyword={keywords.knowledge}
          keywordPlaceholder="搜索标题、正文、题目"
          onKeywordChange={(value) => updateKeyword('knowledge', value)}
          onSearch={() => applySearch('knowledge', loadKnowledge)}
          onPageChange={(page) => void loadKnowledge(page)}
          extraFilters={(
            <>
              <SegmentedControl items={knowledgeFilters} value={knowledgeFilter} onChange={setKnowledgeFilter} />
              <select value={knowledgeCategory} onChange={(event) => setKnowledgeCategory(event.target.value)}>
                {['全部', ...knowledgeCategories].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <SegmentedControl items={knowledgeSourceFilters} value={knowledgeSource} onChange={setKnowledgeSource} />
            </>
          )}
        >
          <KnowledgeWorkspace
            knowledgeItems={knowledgeItems.items}
            onSave={onSaveKnowledgeItem}
            onUpdateStatus={onUpdateKnowledgeStatus}
            onDelete={onDeleteKnowledgeItem}
          />
        </ModuleFrame>
      )}
      {operationView === 'officialInfo' && (
        <ModuleFrame
          state={officialInfoItems}
          keyword={keywords.officialInfo}
          keywordPlaceholder="搜索标题、摘要、正文"
          onKeywordChange={(value) => updateKeyword('officialInfo', value)}
          onSearch={() => applySearch('officialInfo', loadOfficialInfo)}
          onPageChange={(page) => void loadOfficialInfo(page)}
          extraFilters={(
            <>
              <SegmentedControl items={officialInfoFilters} value={officialInfoFilter} onChange={setOfficialInfoFilter} />
              <select value={officialInfoCategory} onChange={(event) => setOfficialInfoCategory(event.target.value as '全部' | OfficialInfoCategory)}>
                {['全部', ...officialInfoCategories.map((category) => category.key)].map((category) => (
                  <option key={category} value={category}>{category === '全部' ? '全部分类' : officialInfoCategoryLabel(category as OfficialInfoCategory)}</option>
                ))}
              </select>
            </>
          )}
        >
          <OfficialInfoWorkspace
            items={officialInfoItems.items}
            onSave={onSaveOfficialInfoItem}
            onUpdateStatus={onUpdateOfficialInfoStatus}
            onDelete={onDeleteOfficialInfoItem}
            onUploadCover={onUploadOfficialInfoCover}
          />
        </ModuleFrame>
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
  reportKind,
  setReportKind,
  knowledgeSubmissionFilter,
  setKnowledgeSubmissionFilter,
  knowledgeSubmissionCategory,
  setKnowledgeSubmissionCategory,
  keywords,
  updateKeyword,
  applySearch,
  posts,
  groups,
  groupPosts,
  reports,
  commentReports,
  knowledgeSubmissions,
  expandedUsers,
  toggleUser,
  loadPosts,
  loadGroups,
  loadGroupPosts,
  loadReports,
  loadSubmissions,
  overview,
  reviewPost,
  reviewReport,
  reviewCommentReport,
  reviewKnowledgeSubmission,
}: {
  auditView: AuditView
  setAuditView: (value: AuditView) => void
  postFilter: PostFilter
  setPostFilter: (value: PostFilter) => void
  reportFilter: ReportFilter
  setReportFilter: (value: ReportFilter) => void
  reportKind: ReportKind
  setReportKind: (value: ReportKind) => void
  knowledgeSubmissionFilter: KnowledgeSubmissionFilter
  setKnowledgeSubmissionFilter: (value: KnowledgeSubmissionFilter) => void
  knowledgeSubmissionCategory: string
  setKnowledgeSubmissionCategory: (value: string) => void
  keywords: Record<ModuleKey, string>
  updateKeyword: (module: ModuleKey, value: string) => void
  applySearch: (module: ModuleKey, reload: (page?: number) => Promise<void>) => void
  posts: ModuleState<Post>
  groups: ModuleState<UserGroup>
  groupPosts: Record<number, ModuleState<Post>>
  reports: ModuleState<PostReport>
  commentReports: ModuleState<CommentReport>
  knowledgeSubmissions: ModuleState<KnowledgeSubmission>
  expandedUsers: Set<number>
  toggleUser: (userId: number) => void
  loadPosts: (page?: number) => Promise<void>
  loadGroups: (page?: number) => Promise<void>
  loadGroupPosts: (userId: number, page?: number) => Promise<void>
  loadReports: (page?: number) => Promise<void>
  loadSubmissions: (page?: number) => Promise<void>
  overview: AdminOverview
  reviewPost: (postId: number, action: 'pass' | 'reject') => Promise<void>
  reviewReport: (reportId: number, reportResult: ReportResult, postAction: PostAction) => Promise<void>
  reviewCommentReport: (reportId: number, reportResult: ReportResult, commentAction: CommentAction) => Promise<void>
  reviewKnowledgeSubmission: (submissionId: number, action: 'adopt' | 'reject') => Promise<void>
}) {
  const auditViews: Array<{ key: AuditView; label: string }> = [
    { key: 'posts', label: `动态审核 ${overview.pendingPosts}` },
    { key: 'users', label: '按用户审核' },
    { key: 'reports', label: `举报复审 ${overview.pendingReports}` },
    { key: 'knowledge', label: `科普投稿 ${overview.pendingKnowledgeSubmissions}` },
  ]

  return (
    <section className="workspace audit-center">
      <SegmentedControl items={auditViews} value={auditView} onChange={setAuditView} />

      {auditView === 'posts' && (
        <ModuleFrame
          state={posts}
          keyword={keywords.posts}
          keywordPlaceholder="搜索内容、分类、位置、作者"
          onKeywordChange={(value) => updateKeyword('posts', value)}
          onSearch={() => applySearch('posts', loadPosts)}
          onPageChange={(page) => void loadPosts(page)}
          extraFilters={<SegmentedControl items={postFilters} value={postFilter} onChange={setPostFilter} />}
        >
          <div className="post-grid">
            {posts.items.map((post) => (
              <PostCard key={post.id} post={post} onReview={reviewPost} />
            ))}
          </div>
          <EmptyState visible={!posts.isLoading && posts.items.length === 0} text="当前筛选下没有动态" />
        </ModuleFrame>
      )}

      {auditView === 'users' && (
        <ModuleFrame
          state={groups}
          keyword={keywords.users}
          keywordPlaceholder="搜索作者或动态内容"
          onKeywordChange={(value) => updateKeyword('users', value)}
          onSearch={() => applySearch('users', loadGroups)}
          onPageChange={(page) => void loadGroups(page)}
          extraFilters={<SegmentedControl items={postFilters} value={postFilter} onChange={setPostFilter} />}
        >
          <div className="audit-pane user-stack">
          {groups.items.map((group) => {
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
                    {postsForUser.isLoading && <div className="empty-state">加载用户动态中...</div>}
                    {postsForUser.error && (
                      <div className="error-banner">
                        {postsForUser.error}
                        <button className="ghost-button" onClick={() => void loadGroupPosts(userId, postsForUser.page)}>重试</button>
                      </div>
                    )}
                    <div className="post-grid compact">
                      {postsForUser.items.map((post) => (
                        <PostCard key={post.id} post={post} onReview={reviewPost} compact />
                      ))}
                    </div>
                    <PageControls state={postsForUser} onPageChange={(page) => void loadGroupPosts(userId, page)} />
                  </>
                )}
              </article>
            )
          })}
          <EmptyState visible={!groups.isLoading && groups.items.length === 0} text="暂无用户动态" />
          </div>
        </ModuleFrame>
      )}

      {auditView === 'reports' && (
        <ModuleFrame
          state={reportKind === 'comments' ? commentReports : reports}
          keyword={keywords.reports}
          keywordPlaceholder={reportKind === 'comments' ? '搜索举报原因、评论、用户、动态' : '搜索举报原因、描述、用户、动态'}
          onKeywordChange={(value) => updateKeyword('reports', value)}
          onSearch={() => applySearch('reports', loadReports)}
          onPageChange={(page) => void loadReports(page)}
          extraFilters={(
            <>
              <SegmentedControl items={reportKinds} value={reportKind} onChange={setReportKind} />
              <SegmentedControl items={reportFilters} value={reportFilter} onChange={setReportFilter} />
            </>
          )}
        >
          {reportKind === 'comments' ? (
            <>
              <div className="report-grid">
                {commentReports.items.map((report) => (
                  <CommentReportCard key={report.id} report={report} onReview={reviewCommentReport} />
                ))}
              </div>
              <EmptyState visible={!commentReports.isLoading && commentReports.items.length === 0} text="当前筛选下没有评论举报记录" />
            </>
          ) : (
            <>
              <div className="report-grid">
                {reports.items.map((report) => (
                  <ReportCard key={report.id} report={report} onReview={reviewReport} />
                ))}
              </div>
              <EmptyState visible={!reports.isLoading && reports.items.length === 0} text="当前筛选下没有动态举报记录" />
            </>
          )}
        </ModuleFrame>
      )}

      {auditView === 'knowledge' && (
        <ModuleFrame
          state={knowledgeSubmissions}
          keyword={keywords.submissions}
          keywordPlaceholder="搜索标题、正文、题目、作者"
          onKeywordChange={(value) => updateKeyword('submissions', value)}
          onSearch={() => applySearch('submissions', loadSubmissions)}
          onPageChange={(page) => void loadSubmissions(page)}
          extraFilters={(
            <>
              <SegmentedControl items={knowledgeSubmissionFilters} value={knowledgeSubmissionFilter} onChange={setKnowledgeSubmissionFilter} />
              <select value={knowledgeSubmissionCategory} onChange={(event) => setKnowledgeSubmissionCategory(event.target.value)}>
                {['全部', ...knowledgeCategories].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </>
          )}
        >
          <div className="post-grid">
            {knowledgeSubmissions.items.map((submission) => (
              <KnowledgeSubmissionCard
                key={submission.id}
                submission={submission}
                onReview={reviewKnowledgeSubmission}
              />
            ))}
          </div>
          <EmptyState visible={!knowledgeSubmissions.isLoading && knowledgeSubmissions.items.length === 0} text="暂无科普投稿" />
        </ModuleFrame>
      )}
    </section>
  )
}

function ModuleFrame<T>({
  state,
  keyword,
  keywordPlaceholder,
  onKeywordChange,
  onSearch,
  onPageChange,
  extraFilters,
  children,
}: {
  state: ModuleState<T>
  keyword: string
  keywordPlaceholder: string
  onKeywordChange: (value: string) => void
  onSearch: () => void
  onPageChange: (page: number) => void
  extraFilters?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="module-frame">
      <div className="module-toolbar">
        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearch()
            }}
            placeholder={keywordPlaceholder}
          />
          <button className="ghost-button" onClick={onSearch}>搜索</button>
        </div>
        <div className="module-filters">{extraFilters}</div>
      </div>
      <div className="module-meta">
        <span>共 {state.totalElements} 条</span>
        <span>{state.lastUpdated ? `更新：${formatTime(state.lastUpdated)}` : '尚未加载'}</span>
      </div>
      {state.error && (
        <div className="error-banner">
          {state.error}
          <button className="ghost-button" onClick={() => onPageChange(state.page)}>重试</button>
        </div>
      )}
      {state.isLoading && <div className="empty-state">加载中...</div>}
      {!state.isLoading && children}
      <PageControls state={state} onPageChange={onPageChange} />
    </div>
  )
}

function PageControls<T>({
  state,
  onPageChange,
}: {
  state: ModuleState<T>
  onPageChange: (page: number) => void
}) {
  if (!state.loaded || state.totalPages <= 1) return null
  const currentPage = state.page + 1
  return (
    <div className="pagination-bar">
      <button className="ghost-button" disabled={state.page <= 0 || state.isRefreshing} onClick={() => onPageChange(state.page - 1)}>
        上一页
      </button>
      <span>第 {currentPage} / {state.totalPages} 页</span>
      <button className="ghost-button" disabled={!state.hasMore || state.isRefreshing} onClick={() => onPageChange(state.page + 1)}>
        下一页
      </button>
    </div>
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

function CommentReportCard({
  report,
  onReview,
}: {
  report: CommentReport
  onReview: (reportId: number, reportResult: ReportResult, commentAction: CommentAction) => Promise<void>
}) {
  const [result, setResult] = useState<ReportResult>('valid')
  const [action, setAction] = useState<CommentAction>('keep')
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
        <span>评论作者：{displayName(report.comment?.author)}</span>
      </div>
      <div className="comment-mini">
        <strong>{report.comment ? displayName(report.comment.author) : '评论已删除'}</strong>
        {report.comment?.replyToUser && <span>回复 @{displayName(report.comment.replyToUser)}</span>}
        <p>{report.comment?.content || '该评论已被删除或解除关联'}</p>
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
          评论处理
          <select value={reviewed ? report.commentAction ?? action : action} onChange={(event) => setAction(event.target.value as CommentAction)} disabled={reviewed}>
            <option value="keep">保留评论</option>
            <option value="delete">删除评论</option>
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
  const [isSaving, setIsSaving] = useState(false)

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
        <div className="knowledge-list">
          {knowledgeItems.map((item) => (
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
        <EmptyState visible={knowledgeItems.length === 0} text="当前筛选下没有科普内容" />
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

function OfficialInfoWorkspace({
  items,
  onSave,
  onUpdateStatus,
  onDelete,
  onUploadCover,
}: {
  items: OfficialInfoItem[]
  onSave: (info: OfficialInfoFormValue, infoId?: number) => Promise<boolean>
  onUpdateStatus: (infoId: number, status: OfficialInfoStatus) => Promise<void>
  onDelete: (infoId: number) => Promise<void>
  onUploadCover: (file: File) => Promise<string>
}) {
  const [editing, setEditing] = useState<OfficialInfoItem | null>(null)
  const [form, setForm] = useState<OfficialInfoFormValue>(() => emptyOfficialInfoForm())
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const startEdit = (item: OfficialInfoItem) => {
    setEditing(item)
    setForm(officialInfoToForm(item))
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyOfficialInfoForm())
  }

  const submit = async () => {
    setIsSaving(true)
    const ok = await onSave(form, editing?.id)
    setIsSaving(false)
    if (ok) resetForm()
  }

  const uploadCover = async (file: File) => {
    setIsUploading(true)
    const url = await onUploadCover(file)
    setIsUploading(false)
    if (url) setForm({ ...form, coverImageUrl: url })
  }

  return (
    <div className="knowledge-workspace">
      <div className="knowledge-editor">
        <div className="editor-head">
          <div>
            <p className="eyebrow">首页运营</p>
            <h3>{editing ? '编辑官方资讯' : '新增官方资讯'}</h3>
          </div>
          {editing && <button className="ghost-button" onClick={resetForm}>取消编辑</button>}
        </div>
        <OfficialInfoForm
          form={form}
          setForm={setForm}
          onUploadCover={uploadCover}
          isUploading={isUploading}
        />
        <button className="review-submit" disabled={isSaving || isUploading} onClick={() => void submit()}>
          {isSaving ? '保存中...' : editing ? '保存修改' : '新增资讯'}
        </button>
      </div>

      <div className="knowledge-list-pane">
        <div className="knowledge-list">
          {items.map((item) => (
            <OfficialInfoAdminCard
              key={item.id}
              item={item}
              onEdit={() => startEdit(item)}
              onToggleStatus={() => void onUpdateStatus(item.id, item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED')}
              onDelete={() => {
                if (window.confirm('确认删除这条官方资讯？')) void onDelete(item.id)
              }}
            />
          ))}
        </div>
        <EmptyState visible={items.length === 0} text="当前筛选下没有官方资讯" />
      </div>
    </div>
  )
}

function OfficialInfoForm({
  form,
  setForm,
  onUploadCover,
  isUploading,
}: {
  form: OfficialInfoFormValue
  setForm: (form: OfficialInfoFormValue) => void
  onUploadCover: (file: File) => void
  isUploading: boolean
}) {
  const coverPreview = getFullImageUrl(form.coverImageUrl)

  return (
    <div className="form-grid">
      <label>
        分类
        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as OfficialInfoCategory })}>
          {officialInfoCategories.map((category) => (
            <option key={category.key} value={category.key}>{category.label}</option>
          ))}
        </select>
      </label>
      <label>
        状态
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as OfficialInfoStatus })}>
          <option value="PUBLISHED">展示中</option>
          <option value="ARCHIVED">已下架</option>
        </select>
      </label>
      <label>
        发布日期
        <input type="date" value={form.publishDate} onChange={(event) => setForm({ ...form, publishDate: event.target.value })} />
      </label>
      <label>
        排序值
        <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} />
      </label>
      <label className="span-2">
        标题
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="非遗剪纸添乐趣，安心守护夕阳红" />
      </label>
      <label className="span-2">
        摘要
        <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={3} />
      </label>
      <label className="span-2">
        正文
        <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={6} />
      </label>
      <label className="span-2">
        封面图
        <input type="file" accept="image/*" onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onUploadCover(file)
          event.currentTarget.value = ''
        }} />
        <input value={form.coverImageUrl} onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })} placeholder="/images/cover.jpg" />
        <span>{isUploading ? '上传中...' : '可上传本地图片，或手动填写图片 URL'}</span>
      </label>
      {coverPreview && (
        <div className="fortune-preview span-2">
          <img src={coverPreview} alt="" referrerPolicy="no-referrer" />
        </div>
      )}
      <label className="span-2">
        视频 / 外链 URL
        <input value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} placeholder="https://..." />
      </label>
    </div>
  )
}

function OfficialInfoAdminCard({
  item,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  item: OfficialInfoItem
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const cover = getFullImageUrl(item.coverImageUrl)

  return (
    <article className="knowledge-admin-card">
      <div className="card-topline">
        <span className={`status-badge ${item.status === 'PUBLISHED' ? 'approved' : 'rejected'}`}>
          {item.status === 'PUBLISHED' ? '展示中' : '已下架'}
        </span>
        <time>{item.publishDate}</time>
      </div>
      {cover && <ImageGridFromUrls imageUrls={cover} />}
      <p className="eyebrow">{officialInfoCategoryLabel(item.category)} · 排序 {item.sortOrder}</p>
      <h3>{item.title}</h3>
      <p>{item.summary || '暂无摘要'}</p>
      {item.videoUrl && <div className="knowledge-question"><strong>视频链接</strong><span>{item.videoUrl}</span></div>}
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

function buildUrl(path: string, params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })
  const suffix = query.toString()
  return `${API_BASE}${path}${suffix ? `?${suffix}` : ''}`
}

function auditViewToModule(view: AuditView): ModuleKey {
  if (view === 'knowledge') return 'submissions'
  return view
}

function currentModuleState(
  states: Record<ModuleKey, ModuleState<unknown>>,
  module: ModuleKey,
) {
  return states[module]
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

function officialInfoCategoryLabel(category: OfficialInfoCategory) {
  return officialInfoCategories.find((item) => item.key === category)?.label || '热点信息'
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

function emptyOfficialInfoForm(): OfficialInfoFormValue {
  return {
    category: 'HOT',
    title: '',
    summary: '',
    content: '',
    coverImageUrl: '',
    videoUrl: '',
    publishDate: toDateInputValue(new Date().toISOString()),
    status: 'PUBLISHED',
    sortOrder: 0,
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

function officialInfoToForm(item: OfficialInfoItem): OfficialInfoFormValue {
  return {
    category: item.category,
    title: item.title,
    summary: item.summary,
    content: item.content,
    coverImageUrl: item.coverImageUrl,
    videoUrl: item.videoUrl,
    publishDate: toDateInputValue(item.publishDate),
    status: item.status,
    sortOrder: item.sortOrder,
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

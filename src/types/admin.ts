import type { Dispatch, SetStateAction } from 'react'

export type ReviewStatus = 0 | 1 | 2
export type ReportReviewStatus = 'pending' | 'reviewed'
export type ReportResult = 'valid' | 'invalid'
export type PostAction = 'keep' | 'reject' | 'approve'
export type CommentAction = 'keep' | 'delete'
export type ReportKind = 'posts' | 'comments'
export type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type FortuneCardStatus = 'PUBLISHED' | 'ARCHIVED'

export type User = {
  id: number
  username?: string
  nickname?: string
  avatarUrl?: string | null
  region?: string
}

export type Post = {
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

export type UserGroup = {
  author?: User | null
  totalCount: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  latestPostTime?: string | null
}

export type PostReport = {
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

export type CommentSummary = {
  id: number
  postId?: number | null
  parentId?: number | null
  author?: User | null
  replyToUser?: User | null
  content: string
  likeCount?: number
  createTime?: string
}

export type CommentReport = {
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

export type Challenge = {
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

export type AdminChallenge = {
  challenge: Challenge
  isExpired: boolean
  participantCount: number
}

export type BannerPlacement = 'HOME' | 'CULTURE'
export type KnowledgeSubmissionStatus = 'PENDING' | 'ADOPTED' | 'REJECTED'
export type KnowledgeStatus = 'PUBLISHED' | 'ARCHIVED'
export type OfficialInfoStatus = 'PUBLISHED' | 'ARCHIVED'
export type OfficialInfoCategory = 'HOT' | 'INTERVIEW_VIDEO' | 'ACTIVITY' | 'ARTICLE'
export type TechniqueVideoFilter = 'all' | 'ENABLED' | 'DISABLED'
export type KnowledgeFilter = 'all' | KnowledgeStatus
export type OfficialInfoFilter = 'all' | OfficialInfoStatus
export type PostFilter = 'all' | 'pending' | 'approved' | 'rejected'
export type ReportFilter = 'all' | 'pending' | 'reviewed'
export type ChallengeFilter = 'all' | ChallengeStatus
export type KnowledgeSourceFilter = 'all' | 'OFFICIAL' | 'USER'
export type KnowledgeSubmissionFilter = 'all' | KnowledgeSubmissionStatus

export type ChallengeFormValue = {
  title: string
  activityLabel: string
  challengeTag: string
  description: string
  inspirationImageUrls: string
  startTime: string
  deadline: string
  status: ChallengeStatus
}

export type FortuneCard = {
  id: number
  displayDate: string
  patternImageUrl: string
  lunarDate: string
  solarTerm: string
  suitableEvents: string
  status: FortuneCardStatus
}

export type FortuneCardFormValue = {
  displayDate: string
  patternImageUrl: string
  lunarDate: string
  solarTerm: string
  suitableEvents: string
  status: FortuneCardStatus
}

export type KnowledgeSubmission = {
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

export type KnowledgeItem = {
  id: number
  category: string
  title: string
  content: string
  questionType: string
  questionText: string
  optionsJson: string
  answer: string
  answerExplanation: string
  imageUrls: string
  sourceType: string
  status: KnowledgeStatus
  authorSubmissionId?: number | null
  createTime?: string
}

export type KnowledgeFormValue = {
  category: string
  title: string
  content: string
  questionType: string
  questionText: string
  optionsJson: string
  answer: string
  answerExplanation: string
  imageUrls: string
  status: KnowledgeStatus
}

export type OfficialInfoItem = {
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

export type OfficialInfoFormValue = {
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

export type TechniqueVideo = {
  id: number
  title: string
  description: string
  videoUrl: string
  sortOrder: number
  enabled: boolean
  createTime?: string
  updateTime?: string
}

export type TechniqueVideoFormValue = {
  title: string
  description: string
  videoUrl: string
  sortOrder: number
  enabled: boolean
}

export type OperationBanner = {
  id: number
  placement: BannerPlacement
  imageUrl: string
  sortOrder: number
  enabled: boolean
  createTime?: string
  updateTime?: string
}

export type OperationBannerFormValue = {
  placement: BannerPlacement
  imageUrl: string
  sortOrder: number
  enabled: boolean
}

export type CropRequest = {
  file: File
  aspectRatio: number
  title: string
  onDone: (file: File) => void
}

export type AdminPageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export type ModuleState<T> = AdminPageResponse<T> & {
  isLoading: boolean
  isRefreshing: boolean
  error: string
  loaded: boolean
  lastUpdated: string | null
}

export type AdminOverview = {
  totalPosts: number
  pendingPosts: number
  approvedPosts: number
  rejectedPosts: number
  reviewedPosts: number
  pendingReports: number
  pendingKnowledgeSubmissions: number
  activeChallenges: number
}

export type ModuleKey =
  | 'posts'
  | 'users'
  | 'reports'
  | 'submissions'
  | 'banners'
  | 'challenges'
  | 'fortune'
  | 'knowledge'
  | 'officialInfo'
  | 'techniqueVideos'

export type ModuleStateSetter<T> = Dispatch<SetStateAction<ModuleState<T>>>

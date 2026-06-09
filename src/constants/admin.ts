import type {
  BannerPlacement,
  ChallengeFilter,
  KnowledgeFilter,
  KnowledgeSourceFilter,
  KnowledgeSubmissionFilter,
  OfficialInfoCategory,
  OfficialInfoFilter,
  PostFilter,
  ReportFilter,
  ReportKind,
  TechniqueVideoFilter,
} from '../types/admin'
import type { FortuneCardStatus } from '../types/admin'

export const PAGE_SIZE = 20
export const OVERVIEW_REFRESH_INTERVAL_MS = 60_000

export const knowledgeCategories = ['定义', '历史', '技艺', '信仰', '风格', '民俗', '符号', '民族', '传承', '现代']

export const officialInfoCategories: Array<{ key: OfficialInfoCategory; label: string }> = [
  { key: 'HOT', label: '热点信息' },
  { key: 'INTERVIEW_VIDEO', label: '访谈视频' },
  { key: 'ACTIVITY', label: '活动资讯' },
  { key: 'ARTICLE', label: '精选文章' },
]

export const knowledgeFilters: Array<{ key: KnowledgeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'PUBLISHED', label: '展示中' },
  { key: 'ARCHIVED', label: '已下架' },
]

export const officialInfoFilters: Array<{ key: OfficialInfoFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'PUBLISHED', label: '展示中' },
  { key: 'ARCHIVED', label: '已下架' },
]

export const techniqueVideoFilters: Array<{ key: TechniqueVideoFilter; label: string }> = [
  { key: 'all', label: '全部视频' },
  { key: 'ENABLED', label: '展示中' },
  { key: 'DISABLED', label: '已停用' },
]

export const postFilters: Array<{ key: PostFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '未审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
]

export const reportFilters: Array<{ key: ReportFilter; label: string }> = [
  { key: 'all', label: '全部举报' },
  { key: 'pending', label: '未复审' },
  { key: 'reviewed', label: '已复审' },
]

export const bannerPlacements: Array<{ key: BannerPlacement; label: string; ratioLabel: string; aspectRatio: number }> = [
  { key: 'HOME', label: '首页轮播', ratioLabel: '2.4:1', aspectRatio: 2.4 },
  { key: 'CULTURE', label: '文化页头图', ratioLabel: '1:1', aspectRatio: 1 },
]

export const reportKinds: Array<{ key: ReportKind; label: string }> = [
  { key: 'posts', label: '动态举报' },
  { key: 'comments', label: '评论举报' },
]

export const challengeFilters: Array<{ key: ChallengeFilter; label: string }> = [
  { key: 'all', label: '全部挑战' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'PUBLISHED', label: '已发布' },
  { key: 'ARCHIVED', label: '已归档' },
]

export const fortuneFilters: Array<{ key: 'all' | FortuneCardStatus; label: string }> = [
  { key: 'all', label: '全部福运卡' },
  { key: 'PUBLISHED', label: '展示中' },
  { key: 'ARCHIVED', label: '已下架' },
]

export const knowledgeSourceFilters: Array<{ key: KnowledgeSourceFilter; label: string }> = [
  { key: 'all', label: '全部来源' },
  { key: 'OFFICIAL', label: '官方内容' },
  { key: 'USER', label: '用户投稿' },
]

export const knowledgeSubmissionFilters: Array<{ key: KnowledgeSubmissionFilter; label: string }> = [
  { key: 'all', label: '全部投稿' },
  { key: 'PENDING', label: '待审核' },
  { key: 'ADOPTED', label: '已采纳' },
  { key: 'REJECTED', label: '已拒绝' },
]

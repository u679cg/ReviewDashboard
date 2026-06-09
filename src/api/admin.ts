import { PAGE_SIZE } from '../constants/admin'
import type {
  AdminChallenge,
  AdminOverview,
  AdminPageResponse,
  ChallengeFilter,
  ChallengeFormValue,
  CommentAction,
  CommentReport,
  FortuneCard,
  FortuneCardFormValue,
  FortuneCardStatus,
  KnowledgeFilter,
  KnowledgeFormValue,
  KnowledgeItem,
  KnowledgeSourceFilter,
  KnowledgeStatus,
  KnowledgeSubmission,
  KnowledgeSubmissionFilter,
  OfficialInfoCategory,
  OfficialInfoFilter,
  OfficialInfoFormValue,
  OfficialInfoItem,
  OfficialInfoStatus,
  OperationBanner,
  OperationBannerFormValue,
  Post,
  PostAction,
  PostFilter,
  PostReport,
  ReportFilter,
  ReportResult,
  TechniqueVideo,
  TechniqueVideoFilter,
  TechniqueVideoFormValue,
  UserGroup,
} from '../types/admin'
import { buildUrl, request, requestUrl, uploadForm } from './request'

export function fetchOverview() {
  return request<AdminOverview>('/api/admin/overview', undefined, '待办角标加载')
}

export function fetchPosts(params: { status: PostFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<Post>>(buildUrl('/api/posts/admin/review-list', {
    status: params.status,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '动态审核加载')
}

export function fetchUserGroups(params: { status: PostFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<UserGroup>>(buildUrl('/api/posts/admin/user-groups', {
    status: params.status,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '用户分组加载')
}

export function fetchUserGroupPosts(userId: number, params: { status: PostFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<Post>>(buildUrl(`/api/posts/admin/user-groups/${userId}/posts`, {
    status: params.status,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '用户动态加载')
}

export function fetchPostReports(params: { reviewStatus: ReportFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<PostReport>>(buildUrl('/api/reports/posts/admin', {
    reviewStatus: params.reviewStatus,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '动态举报复审加载')
}

export function fetchCommentReports(params: { reviewStatus: ReportFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<CommentReport>>(buildUrl('/api/reports/comments/admin', {
    reviewStatus: params.reviewStatus,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '评论举报复审加载')
}

export function fetchKnowledgeSubmissions(params: {
  status: KnowledgeSubmissionFilter
  category: string
  keyword: string
  page?: number
  size?: number
}) {
  return requestUrl<AdminPageResponse<KnowledgeSubmission>>(buildUrl('/api/knowledge/admin/submissions', {
    status: params.status,
    category: params.category,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '科普投稿加载')
}

export function fetchBanners(params: { placement: 'all' | string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<OperationBanner>>(buildUrl('/api/operation-banners/admin', {
    placement: params.placement,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), 'Banner管理加载')
}

export function fetchChallenges(params: { status: ChallengeFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<AdminChallenge>>(buildUrl('/api/challenges/admin', {
    status: params.status,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '挑战管理加载')
}

export function fetchFortuneCards(params: { status: 'all' | FortuneCardStatus; keyword: string; fromDate: string; toDate: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<FortuneCard>>(buildUrl('/api/fortune/admin', {
    status: params.status,
    keyword: params.keyword,
    fromDate: params.fromDate,
    toDate: params.toDate,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '福运卡管理加载')
}

export function fetchKnowledgeItems(params: {
  status: KnowledgeFilter
  category: string
  sourceType: KnowledgeSourceFilter
  keyword: string
  page?: number
  size?: number
}) {
  return requestUrl<AdminPageResponse<KnowledgeItem>>(buildUrl('/api/knowledge/admin', {
    status: params.status,
    category: params.category,
    sourceType: params.sourceType,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '科普页管理加载')
}

export function fetchOfficialInfoItems(params: {
  status: OfficialInfoFilter
  category: '全部' | OfficialInfoCategory
  keyword: string
  page?: number
  size?: number
}) {
  return requestUrl<AdminPageResponse<OfficialInfoItem>>(buildUrl('/api/official-info/admin', {
    status: params.status,
    category: params.category === '全部' ? 'all' : params.category,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '官方资讯加载')
}

export function fetchTechniqueVideos(params: { status: TechniqueVideoFilter; keyword: string; page?: number; size?: number }) {
  return requestUrl<AdminPageResponse<TechniqueVideo>>(buildUrl('/api/culture/techniques/admin', {
    status: params.status,
    keyword: params.keyword,
    page: params.page ?? 0,
    size: params.size ?? PAGE_SIZE,
  }), '技法视频加载')
}

export function reviewPost(postId: number, action: 'pass' | 'reject') {
  return request<void>('/api/posts/review', {
    method: 'POST',
    body: JSON.stringify({ postId, action }),
  }, '动态审核操作')
}

export function reviewPostReport(reportId: number, reportResult: ReportResult, postAction: PostAction) {
  return request<void>(`/api/reports/posts/${reportId}/review`, {
    method: 'POST',
    body: JSON.stringify({ reportResult, postAction }),
  }, '举报复审操作')
}

export function reviewCommentReport(reportId: number, reportResult: ReportResult, commentAction: CommentAction) {
  return request<void>(`/api/reports/comments/${reportId}/review`, {
    method: 'POST',
    body: JSON.stringify({ reportResult, commentAction }),
  }, '评论举报复审操作')
}

export function saveChallenge(challenge: ChallengeFormValue, challengeId?: number) {
  return request<void>(challengeId ? `/api/challenges/admin/${challengeId}` : '/api/challenges/admin', {
    method: challengeId ? 'PUT' : 'POST',
    body: JSON.stringify(challenge),
  }, '挑战保存')
}

export function updateChallengeStatus(challengeId: number, status: ChallengeFormValue['status']) {
  return request<void>(`/api/challenges/admin/${challengeId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }, '挑战状态更新')
}

export function deleteChallenge(challengeId: number) {
  return request<void>(`/api/challenges/admin/${challengeId}`, { method: 'DELETE' }, '挑战删除')
}

export function saveBanner(banner: OperationBannerFormValue, bannerId?: number) {
  return request<void>(bannerId ? `/api/operation-banners/admin/${bannerId}` : '/api/operation-banners/admin', {
    method: bannerId ? 'PUT' : 'POST',
    body: JSON.stringify(banner),
  }, 'Banner保存')
}

export function updateBannerEnabled(bannerId: number, enabled: boolean) {
  return request<void>(`/api/operation-banners/admin/${bannerId}/enabled`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  }, 'Banner状态更新')
}

export function deleteBanner(bannerId: number) {
  return request<void>(`/api/operation-banners/admin/${bannerId}`, { method: 'DELETE' }, 'Banner删除')
}

export function saveFortuneCard(fortuneCard: FortuneCardFormValue, fortuneCardId?: number) {
  return request<void>(fortuneCardId ? `/api/fortune/admin/${fortuneCardId}` : '/api/fortune/admin', {
    method: fortuneCardId ? 'PUT' : 'POST',
    body: JSON.stringify(fortuneCard),
  }, '福运卡保存')
}

export function updateFortuneCardStatus(fortuneCardId: number, status: FortuneCardStatus) {
  return request<void>(`/api/fortune/admin/${fortuneCardId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }, '福运卡状态更新')
}

export function deleteFortuneCard(fortuneCardId: number) {
  return request<void>(`/api/fortune/admin/${fortuneCardId}`, { method: 'DELETE' }, '福运卡删除')
}

export function reviewKnowledgeSubmission(submissionId: number, action: 'adopt' | 'reject') {
  return request<void>(`/api/knowledge/admin/submissions/${submissionId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      reviewNote: action === 'adopt' ? '已采纳至科普页' : '暂未采纳',
    }),
  }, '科普投稿审核操作')
}

export function saveKnowledgeItem(knowledge: KnowledgeFormValue, knowledgeId?: number) {
  return request<void>(knowledgeId ? `/api/knowledge/admin/${knowledgeId}` : '/api/knowledge/admin', {
    method: knowledgeId ? 'PUT' : 'POST',
    body: JSON.stringify(knowledge),
  }, '科普内容保存')
}

export function updateKnowledgeStatus(knowledgeId: number, status: KnowledgeStatus) {
  return request<void>(`/api/knowledge/admin/${knowledgeId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }, '科普内容状态更新')
}

export function deleteKnowledgeItem(knowledgeId: number) {
  return request<void>(`/api/knowledge/admin/${knowledgeId}`, { method: 'DELETE' }, '科普内容删除')
}

export function saveOfficialInfoItem(info: OfficialInfoFormValue, infoId?: number) {
  return request<void>(infoId ? `/api/official-info/admin/${infoId}` : '/api/official-info/admin', {
    method: infoId ? 'PUT' : 'POST',
    body: JSON.stringify(info),
  }, '官方资讯保存')
}

export function updateOfficialInfoStatus(infoId: number, status: OfficialInfoStatus) {
  return request<void>(`/api/official-info/admin/${infoId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }, '官方资讯状态更新')
}

export function deleteOfficialInfoItem(infoId: number) {
  return request<void>(`/api/official-info/admin/${infoId}`, { method: 'DELETE' }, '官方资讯删除')
}

export function saveTechniqueVideo(video: TechniqueVideoFormValue, videoId?: number) {
  return request<void>(videoId ? `/api/culture/techniques/admin/${videoId}` : '/api/culture/techniques/admin', {
    method: videoId ? 'PUT' : 'POST',
    body: JSON.stringify(video),
  }, '技法视频保存')
}

export function updateTechniqueVideoEnabled(videoId: number, enabled: boolean) {
  return request<void>(`/api/culture/techniques/admin/${videoId}/enabled`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  }, '技法视频状态更新')
}

export function deleteTechniqueVideo(videoId: number) {
  return request<void>(`/api/culture/techniques/admin/${videoId}`, { method: 'DELETE' }, '技法视频删除')
}

export async function uploadAdminImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)
  const data = await uploadForm<{ url?: string }>('/api/admin/uploads/images', formData, '图片上传')
  return data.url || ''
}

export async function uploadAdminVideo(file: File) {
  const formData = new FormData()
  formData.append('video', file)
  const data = await uploadForm<{ url?: string }>('/api/admin/uploads/videos', formData, '视频上传')
  return data.url || ''
}

import { officialInfoCategories } from '../constants/admin'
import type {
  AdminChallenge,
  KnowledgeStatus,
  FortuneCardStatus,
  OfficialInfoCategory,
  OfficialInfoStatus,
} from '../types/admin'

export function officialInfoCategoryLabel(category: OfficialInfoCategory) {
  return officialInfoCategories.find((item) => item.key === category)?.label || '热点信息'
}

export function nextKnowledgeStatus(status: KnowledgeStatus): KnowledgeStatus {
  return status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
}

export function nextOfficialInfoStatus(status: OfficialInfoStatus): OfficialInfoStatus {
  return status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
}

export function nextFortuneCardStatus(status: FortuneCardStatus): FortuneCardStatus {
  return status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
}

export function challengeStatusLabel(status: AdminChallenge['challenge']['status'], isExpired: boolean) {
  if (status === 'PUBLISHED' && isExpired) return '已截止'
  if (status === 'PUBLISHED') return '进行中'
  if (status === 'ARCHIVED') return '已归档'
  return '草稿'
}

export function challengeStatusClass(status: AdminChallenge['challenge']['status'], isExpired: boolean) {
  if (status === 'PUBLISHED' && !isExpired) return 'approved'
  if (status === 'ARCHIVED') return 'rejected'
  return 'pending'
}

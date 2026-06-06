import type {
  Challenge,
  ChallengeFormValue,
  FortuneCard,
  FortuneCardFormValue,
  KnowledgeFormValue,
  KnowledgeItem,
  OfficialInfoFormValue,
  OfficialInfoItem,
  OperationBanner,
  OperationBannerFormValue,
} from '../types/admin'
import { toDateInputValue, toDatetimeLocal } from './date'

export function emptyBannerForm(): OperationBannerFormValue {
  return {
    placement: 'HOME',
    imageUrl: '',
    sortOrder: 0,
    enabled: true,
  }
}

export function operationBannerToForm(banner: OperationBanner): OperationBannerFormValue {
  return {
    placement: banner.placement,
    imageUrl: banner.imageUrl,
    sortOrder: banner.sortOrder,
    enabled: banner.enabled,
  }
}

export function emptyChallengeForm(): ChallengeFormValue {
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

export function challengeToForm(challenge: Challenge): ChallengeFormValue {
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

export function emptyFortuneCardForm(): FortuneCardFormValue {
  return {
    displayDate: toDateInputValue(new Date().toISOString()),
    patternImageUrl: '',
    lunarDate: '',
    solarTerm: '',
    suitableEvents: '',
    status: 'PUBLISHED',
  }
}

export function fortuneCardToForm(fortuneCard: FortuneCard): FortuneCardFormValue {
  return {
    displayDate: fortuneCard.displayDate,
    patternImageUrl: fortuneCard.patternImageUrl,
    lunarDate: fortuneCard.lunarDate,
    solarTerm: fortuneCard.solarTerm,
    suitableEvents: fortuneCard.suitableEvents,
    status: fortuneCard.status,
  }
}

export function emptyKnowledgeForm(): KnowledgeFormValue {
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

export function knowledgeToForm(item: KnowledgeItem): KnowledgeFormValue {
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

export function emptyOfficialInfoForm(): OfficialInfoFormValue {
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

export function officialInfoToForm(item: OfficialInfoItem): OfficialInfoFormValue {
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

export function parseOptionText(raw: string) {
  return raw.replace(/^\[/, '').replace(/\]$/, '').replaceAll('"', '').split(',').map((item) => item.trim()).filter(Boolean).join(' / ')
}

import { Button, Popconfirm } from 'antd'
import { bannerPlacements } from '../../constants/admin'
import type {
  AdminChallenge,
  FortuneCard,
  FortuneCardStatus,
  KnowledgeItem,
  OfficialInfoItem,
  OperationBanner,
} from '../../types/admin'
import { formatTime } from '../../utils/date'
import { parseOptionText } from '../../utils/forms'
import { getFullImageUrl } from '../../utils/image'
import { challengeStatusClass, challengeStatusLabel, officialInfoCategoryLabel } from '../../utils/status'
import { ImageGridFromUrls } from '../media/ImageGrid'

export function BannerCard({
  banner,
  onEdit,
  onToggleEnabled,
  onDelete,
}: {
  banner: OperationBanner
  onEdit: () => void
  onToggleEnabled: () => void
  onDelete: () => void
}) {
  const placement = bannerPlacements.find((item) => item.key === banner.placement)
  const image = getFullImageUrl(banner.imageUrl)

  return (
    <article className="banner-card">
      <div className="card-topline">
        <span className={`status-badge ${banner.enabled ? 'approved' : 'rejected'}`}>{banner.enabled ? '展示中' : '已停用'}</span>
        <time>{placement?.label || banner.placement} · 排序 {banner.sortOrder}</time>
      </div>
      <div className={`banner-preview ${banner.placement === 'CULTURE' ? 'square' : ''}`}>
        {image ? <img src={image} alt="" referrerPolicy="no-referrer" /> : <span>无图片</span>}
      </div>
      <div className="knowledge-admin-actions">
        <Button className="ghost-button" onClick={onEdit}>编辑</Button>
        <Button className="ghost-button" onClick={onToggleEnabled}>{banner.enabled ? '停用' : '启用'}</Button>
        <Popconfirm title="确认删除这张 Banner？" okText="删除" cancelText="取消" onConfirm={onDelete}>
          <Button className="ghost-button danger">删除</Button>
        </Popconfirm>
      </div>
    </article>
  )
}

export function ChallengeCard({
  item,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  item: AdminChallenge
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const challenge = item.challenge
  const isPublished = challenge.status === 'PUBLISHED'
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
      <div className="knowledge-admin-actions">
        <Button className="ghost-button" onClick={onEdit}>编辑</Button>
        <Popconfirm
          title={isPublished ? '确认下架这个挑战活动？Android 端会立即不再同步展示。' : '确认重新发布这个挑战活动？'}
          okText={isPublished ? '下架' : '发布'}
          cancelText="取消"
          onConfirm={onToggleStatus}
        >
          <Button className="ghost-button">{isPublished ? '下架' : '发布'}</Button>
        </Popconfirm>
        <Popconfirm title="确认删除这个挑战活动？相关尝试和参与记录也会清理。" okText="删除" cancelText="取消" onConfirm={onDelete}>
          <Button className="ghost-button danger">删除</Button>
        </Popconfirm>
      </div>
    </article>
  )
}

export function FortuneCardItem({
  item,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  item: FortuneCard
  onEdit: () => void
  onToggleStatus: (status: FortuneCardStatus) => void
  onDelete: () => void
}) {
  const image = getFullImageUrl(item.patternImageUrl)

  return (
    <article className="fortune-card">
      <div className="card-topline">
        <span className={`status-badge ${item.status === 'PUBLISHED' ? 'approved' : 'rejected'}`}>
          {item.status === 'PUBLISHED' ? '展示中' : '已下架'}
        </span>
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
      <div className="knowledge-admin-actions">
        <Button className="ghost-button" onClick={onEdit}>编辑</Button>
        <Popconfirm
          title={item.status === 'PUBLISHED' ? '确认下架这张福运卡？Android 端会立即不再同步展示。' : '确认重新发布这张福运卡？'}
          okText={item.status === 'PUBLISHED' ? '下架' : '发布'}
          cancelText="取消"
          onConfirm={() => onToggleStatus(item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED')}
        >
          <Button className="ghost-button">{item.status === 'PUBLISHED' ? '下架' : '发布'}</Button>
        </Popconfirm>
        <Popconfirm title="确认删除这张福运卡？相关收藏记录也会清理。" okText="删除" cancelText="取消" onConfirm={onDelete}>
          <Button className="ghost-button danger">删除</Button>
        </Popconfirm>
      </div>
    </article>
  )
}

export function KnowledgeAdminCard({
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
        <Button className="ghost-button" onClick={onEdit}>编辑</Button>
        <Button className="ghost-button" onClick={onToggleStatus}>{item.status === 'PUBLISHED' ? '下架' : '发布'}</Button>
        <Popconfirm title="确认删除这条科普内容？" okText="删除" cancelText="取消" onConfirm={onDelete}>
          <Button className="ghost-button danger">删除</Button>
        </Popconfirm>
      </div>
    </article>
  )
}

export function OfficialInfoAdminCard({
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
      {item.videoUrl && <div className="knowledge-question"><strong>视频文件</strong><span>{item.videoUrl}</span></div>}
      <div className="knowledge-admin-actions">
        <Button className="ghost-button" onClick={onEdit}>编辑</Button>
        <Button className="ghost-button" onClick={onToggleStatus}>{item.status === 'PUBLISHED' ? '下架' : '发布'}</Button>
        <Popconfirm title="确认删除这条官方资讯？" okText="删除" cancelText="取消" onConfirm={onDelete}>
          <Button className="ghost-button danger">删除</Button>
        </Popconfirm>
      </div>
    </article>
  )
}

import type { User, Post, ReviewStatus } from '../../types/admin'
import { getFullImageUrl, getPostImageUrls } from '../../utils/image'
import { displayName } from '../../utils/user'

export function ImageGrid({ post }: { post: Post }) {
  const urls = getPostImageUrls(post)
  return <ImageGridFromUrls imageUrls={urls.join(',')} />
}

export function ImageGridFromUrls({ imageUrls }: { imageUrls: string }) {
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

export function Avatar({ user }: { user?: User | null }) {
  const avatarUrl = getFullImageUrl(user?.avatarUrl || '')
  if (avatarUrl) {
    return <img className="avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
  }
  return <span className="avatar fallback">{displayName(user).slice(0, 1)}</span>
}

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const meta = {
    0: ['pending', '未审核'],
    1: ['approved', '已通过'],
    2: ['rejected', '已拒绝'],
  }[status]
  return <span className={`status-badge ${meta[0]}`}>{meta[1]}</span>
}

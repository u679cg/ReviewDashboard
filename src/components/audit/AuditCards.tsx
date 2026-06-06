import { Button, Select } from 'antd'
import { useState } from 'react'
import type {
  CommentAction,
  CommentReport,
  KnowledgeSubmission,
  Post,
  PostAction,
  PostReport,
  ReportResult,
} from '../../types/admin'
import { formatTime } from '../../utils/date'
import { parseOptionText } from '../../utils/forms'
import { displayName } from '../../utils/user'
import { Avatar, ImageGrid, ImageGridFromUrls, StatusBadge } from '../media/ImageGrid'

export function PostCard({
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
        <Button className="approve" onClick={() => void onReview(post.id, 'pass')}>通过</Button>
        <Button className="reject" onClick={() => void onReview(post.id, 'reject')}>拒绝</Button>
      </div>
    </article>
  )
}

export function ReportCard({
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
          <Select
            value={reviewed ? report.reportResult ?? result : result}
            disabled={reviewed}
            onChange={setResult}
            options={[
              { value: 'valid', label: '举报成立' },
              { value: 'invalid', label: '举报不成立' },
            ]}
          />
        </label>
        <label>
          动态处理
          <Select
            value={reviewed ? report.postAction ?? action : action}
            disabled={reviewed}
            onChange={setAction}
            options={[
              { value: 'keep', label: '保持原状态' },
              { value: 'reject', label: '下架拒绝' },
              { value: 'approve', label: '通过展示' },
            ]}
          />
        </label>
      </div>
      <Button className="review-submit" disabled={reviewed} onClick={() => void onReview(report.id, result, action)}>
        {reviewed ? '已完成复审' : '提交复审'}
      </Button>
    </article>
  )
}

export function CommentReportCard({
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
          <Select
            value={reviewed ? report.reportResult ?? result : result}
            disabled={reviewed}
            onChange={setResult}
            options={[
              { value: 'valid', label: '举报成立' },
              { value: 'invalid', label: '举报不成立' },
            ]}
          />
        </label>
        <label>
          评论处理
          <Select
            value={reviewed ? report.commentAction ?? action : action}
            disabled={reviewed}
            onChange={setAction}
            options={[
              { value: 'keep', label: '保留评论' },
              { value: 'delete', label: '删除评论' },
            ]}
          />
        </label>
      </div>
      <Button className="review-submit" disabled={reviewed} onClick={() => void onReview(report.id, result, action)}>
        {reviewed ? '已完成复审' : '提交复审'}
      </Button>
    </article>
  )
}

export function KnowledgeSubmissionCard({
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
        <Button className="approve" onClick={() => void onReview(submission.id, 'adopt')}>采纳</Button>
        <Button className="reject" onClick={() => void onReview(submission.id, 'reject')}>拒绝</Button>
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

function knowledgeStatusLabel(status: KnowledgeSubmission['status']) {
  if (status === 'ADOPTED') return '已采纳'
  if (status === 'REJECTED') return '已拒绝'
  return '待审核'
}

function knowledgeStatusClass(status: KnowledgeSubmission['status']) {
  if (status === 'ADOPTED') return 'approved'
  if (status === 'REJECTED') return 'rejected'
  return 'pending'
}

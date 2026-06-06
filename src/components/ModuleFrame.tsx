import type { ReactNode } from 'react'
import { Alert, Card, Empty, Input, Pagination, Space, Typography } from 'antd'
import type { ModuleState } from '../types/admin'
import { formatTime } from '../utils/date'

export function ModuleFrame<T>({
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
    <Card className="module-frame antd-module-frame">
      <div className="module-toolbar">
        <Input.Search
          value={keyword}
          placeholder={keywordPlaceholder}
          onChange={(event) => onKeywordChange(event.target.value)}
          onSearch={onSearch}
          enterButton="搜索"
        />
        <div className="module-filters">{extraFilters}</div>
      </div>
      <div className="module-meta">
        <Typography.Text type="secondary">共 {state.totalElements} 条</Typography.Text>
        <Typography.Text type="secondary">{state.lastUpdated ? `更新：${formatTime(state.lastUpdated)}` : '尚未加载'}</Typography.Text>
      </div>
      {state.error && (
        <Alert
          type="error"
          message={state.error}
          action={<Typography.Link onClick={() => onPageChange(state.page)}>重试</Typography.Link>}
          showIcon
        />
      )}
      {state.isLoading ? (
        <Empty description="加载中..." />
      ) : (
        children
      )}
      <PageControls state={state} onPageChange={onPageChange} />
    </Card>
  )
}

export function PageControls<T>({
  state,
  onPageChange,
}: {
  state: ModuleState<T>
  onPageChange: (page: number) => void
}) {
  if (!state.loaded || state.totalPages <= 1) return null
  return (
    <Space className="pagination-bar" size="middle">
      <Pagination
        current={state.page + 1}
        pageSize={state.size}
        total={state.totalElements}
        showSizeChanger={false}
        disabled={state.isRefreshing}
        onChange={(page) => onPageChange(page - 1)}
      />
    </Space>
  )
}

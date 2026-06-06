import { useCallback, useEffect, useState } from 'react'
import { fetchOverview } from '../api/admin'
import { OVERVIEW_REFRESH_INTERVAL_MS } from '../constants/admin'
import type { AdminOverview } from '../types/admin'

export const emptyOverview: AdminOverview = {
  totalPosts: 0,
  pendingPosts: 0,
  approvedPosts: 0,
  rejectedPosts: 0,
  reviewedPosts: 0,
  pendingReports: 0,
  pendingKnowledgeSubmissions: 0,
  activeChallenges: 0,
}

export function useAdminOverview() {
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setOverview(await fetchOverview())
      setUpdatedAt(new Date().toISOString())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '待办角标加载失败')
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(() => void refresh(), OVERVIEW_REFRESH_INTERVAL_MS)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [refresh])

  return { overview, error, updatedAt, refresh }
}

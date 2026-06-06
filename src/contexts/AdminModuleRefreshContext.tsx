/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

type RefreshContextValue = {
  isRefreshing: boolean
  registerRefresh: (refresh: (() => Promise<void>) | null) => void
  refreshCurrentModule: () => Promise<void>
}

const AdminModuleRefreshContext = createContext<RefreshContextValue | null>(null)

export function AdminModuleRefreshProvider({ children }: { children: ReactNode }) {
  const [refresh, setRefresh] = useState<(() => Promise<void>) | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const registerRefresh = useCallback((nextRefresh: (() => Promise<void>) | null) => {
    setRefresh(() => nextRefresh)
  }, [])

  const refreshCurrentModule = useCallback(async () => {
    if (!refresh) return
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [refresh])

  return (
    <AdminModuleRefreshContext.Provider value={{ isRefreshing, registerRefresh, refreshCurrentModule }}>
      {children}
    </AdminModuleRefreshContext.Provider>
  )
}

export function useAdminModuleRefresh() {
  const context = useContext(AdminModuleRefreshContext)
  if (!context) throw new Error('useAdminModuleRefresh must be used inside AdminModuleRefreshProvider')
  return context
}

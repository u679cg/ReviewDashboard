/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { useAdminOverview } from '../hooks/useAdminOverview'
import type { AdminOverview } from '../types/admin'

type AdminOverviewContextValue = {
  overview: AdminOverview
  error: string
  updatedAt: string | null
  refreshOverview: () => Promise<void>
}

const AdminOverviewContext = createContext<AdminOverviewContextValue | null>(null)

export function AdminOverviewProvider({ children }: { children: ReactNode }) {
  const { overview, error, updatedAt, refresh } = useAdminOverview()
  return (
    <AdminOverviewContext.Provider value={{ overview, error, updatedAt, refreshOverview: refresh }}>
      {children}
    </AdminOverviewContext.Provider>
  )
}

export function useAdminOverviewContext() {
  const context = useContext(AdminOverviewContext)
  if (!context) throw new Error('useAdminOverviewContext must be used inside AdminOverviewProvider')
  return context
}

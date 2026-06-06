import { useEffect } from 'react'
import { useAdminModuleRefresh } from '../contexts/AdminModuleRefreshContext'

export function useRegisterModuleRefresh(refresh: () => Promise<void>) {
  const { registerRefresh } = useAdminModuleRefresh()

  useEffect(() => {
    registerRefresh(refresh)
    return () => registerRefresh(null)
  }, [refresh, registerRefresh])
}

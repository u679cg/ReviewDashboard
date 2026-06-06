import { useCallback, useState } from 'react'
import { PAGE_SIZE } from '../constants/admin'
import type { AdminPageResponse, ModuleState } from '../types/admin'

export function emptyModuleState<T>(): ModuleState<T> {
  return {
    items: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
    isLoading: false,
    isRefreshing: false,
    error: '',
    loaded: false,
    lastUpdated: null,
  }
}

export function useAdminPage<T>(
  loader: (page: number) => Promise<AdminPageResponse<T>>,
  label: string,
) {
  const [state, setState] = useState<ModuleState<T>>(() => emptyModuleState())

  const load = useCallback(async (page = 0) => {
    const refreshing = page === 0
    setState((current) => ({
      ...current,
      isLoading: !current.loaded,
      isRefreshing: current.loaded && refreshing,
      error: '',
    }))

    try {
      const data = await loader(page)
      setState({
        ...data,
        isLoading: false,
        isRefreshing: false,
        error: '',
        loaded: true,
        lastUpdated: new Date().toISOString(),
      })
    } catch (err) {
      setState((current) => ({
        ...current,
        isLoading: false,
        isRefreshing: false,
        error: err instanceof Error ? err.message : `${label}加载失败`,
        loaded: true,
      }))
    }
  }, [label, loader])

  return { state, setState, load }
}

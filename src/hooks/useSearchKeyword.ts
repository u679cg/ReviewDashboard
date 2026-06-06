import { useCallback, useState } from 'react'

export function useSearchKeyword(initialValue = '') {
  const [keyword, setKeyword] = useState(initialValue)
  const [searchInput, setSearchInput] = useState(initialValue)

  const applySearch = useCallback((reload: (page?: number) => Promise<void>) => {
    if (keyword === searchInput) {
      void reload(0)
      return
    }
    setKeyword(searchInput)
  }, [keyword, searchInput])

  return { keyword, searchInput, setSearchInput, applySearch }
}

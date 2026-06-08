export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://49.232.151.194:8080'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function buildUrl(path: string, params: Record<string, string | number | undefined | null> = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })
  const suffix = query.toString()
  return `${API_BASE}${path}${suffix ? `?${suffix}` : ''}`
}

export async function request<T>(path: string, init: RequestInit = {}, label = '请求') {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init.body instanceof FormData
      ? init.headers
      : { 'Content-Type': 'application/json', ...init.headers },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(message || `${label}失败：HTTP ${response.status}`, response.status)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export async function requestUrl<T>(url: string, label = '请求') {
  const response = await fetch(url)
  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(message || `${label}失败：HTTP ${response.status}`, response.status)
  }
  return await response.json() as T
}

export async function uploadForm<T>(path: string, formData: FormData, label = '上传') {
  return request<T>(path, { method: 'POST', body: formData }, label)
}

import type { User } from '../types/admin'

export function displayName(user?: User | null) {
  return user?.nickname || user?.username || '未知用户'
}

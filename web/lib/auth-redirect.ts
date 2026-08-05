export const DEFAULT_LANDING = '/calls'

export function safeNext(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (path === '/' || path.startsWith('/login')) return null
  return path
}

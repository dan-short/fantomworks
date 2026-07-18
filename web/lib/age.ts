export type AgeBucket = 'fresh' | 'aging' | 'stale' | 'cold'

export function ageBucket(receivedDate: string | null): AgeBucket {
  if (!receivedDate) return 'cold'
  const received = new Date(receivedDate).getTime()
  const now = Date.now()
  const days = (now - received) / 86_400_000
  if (days < 30) return 'fresh'
  if (days < 60) return 'aging'
  if (days < 90) return 'stale'
  return 'cold'
}

export const AGE_META: Record<AgeBucket, { dot: string; tip: string; label: string }> = {
  fresh: { dot: 'bg-emerald-500', tip: 'Received less than 30 days ago', label: '< 30 days' },
  aging: { dot: 'bg-amber-400', tip: 'Received 30–60 days ago', label: '30–60 days' },
  stale: { dot: 'bg-orange-500', tip: 'Received 60–90 days ago', label: '60–90 days' },
  cold: { dot: 'bg-red-600', tip: 'Received more than 90 days ago — getting old', label: '> 90 days' },
}

export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
}

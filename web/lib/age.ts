// Reproduces the legacy call-log age coloring based on Received_Date:
//   < 30 days  -> green
//   30–60 days -> yellow
//   60–90 days -> red
//   > 90 days  -> dark red
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

export const AGE_STYLES: Record<AgeBucket, { dot: string; label: string }> = {
  fresh: { dot: 'bg-emerald-500', label: '< 30 days' },
  aging: { dot: 'bg-yellow-400', label: '30–60 days' },
  stale: { dot: 'bg-red-500', label: '60–90 days' },
  cold: { dot: 'bg-red-900', label: '> 90 days' },
}

export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
}

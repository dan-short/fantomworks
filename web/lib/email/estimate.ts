import type { DetailStage } from '@/lib/types'

export const ESTIMATE_PLACEHOLDER = '[Scope and rough figures]'

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export function buildEstimateBlock(stages: DetailStage[], rate: number): string | null {
  const priced = stages.filter((s) => (s.parts_cost ?? 0) > 0 || (s.hours ?? 0) > 0)
  if (priced.length === 0) return null

  const lines = priced.map((s) => {
    const bits: string[] = []
    if (s.parts_cost) bits.push(`${usd(s.parts_cost)} parts`)
    if (s.hours) bits.push(`${s.hours}h labor`)
    const what = (s.description ?? s.label ?? '').trim() || s.label
    return `- ${what} — ${bits.join(', ')}`
  })

  const totalParts = priced.reduce((sum, s) => sum + (s.parts_cost || 0), 0)
  const totalHours = priced.reduce((sum, s) => sum + (s.hours || 0), 0)
  const labor = totalHours * rate

  return [
    ...lines,
    '',
    `Parts: ${usd(totalParts)}`,
    `Labor: ${totalHours} hours at ${usd(rate)}/hr — ${usd(labor)}`,
    `Ballpark total: ${usd(totalParts + labor)}`,
  ].join('\n')
}

export function fillEstimate(body: string, stages: DetailStage[], rate: number): string {
  if (!body.includes(ESTIMATE_PLACEHOLDER)) return body
  const block = buildEstimateBlock(stages, rate)
  return block ? body.replace(ESTIMATE_PLACEHOLDER, block) : body
}

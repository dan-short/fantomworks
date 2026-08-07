import type { Submission, DetailStage, SubmissionStatus } from './types'

export const SEARCH_CATEGORIES: SubmissionStatus[] = [
  'new',
  'pending',
  'active',
  'finished',
  'possible',
  'archived',
]

export const FUZZY_THRESHOLD = 0.45
const HIGHLIGHT_THRESHOLD = 0.6
const SCORE_FLOOR = 0.18

const WEIGHTS = {
  vehicle: 1.0,
  name: 0.92,
  city: 0.84,
  email: 0.76,
  desc: 0.45,
  tasks: 0.4,
}

export function searchTokens(q: string): string[] {
  return q
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
}

export function parseCategories(raw: string | undefined): SubmissionStatus[] {
  if (!raw) return SEARCH_CATEGORIES
  const wanted = new Set(raw.split(',').map((s) => s.trim()))
  const picked = SEARCH_CATEGORIES.filter((c) => wanted.has(c))
  return picked.length ? picked : SEARCH_CATEGORIES
}

export function serializeCategories(cats: SubmissionStatus[]): string | undefined {
  if (cats.length === SEARCH_CATEGORIES.length) return undefined
  return SEARCH_CATEGORIES.filter((c) => cats.includes(c)).join(',')
}

function trigrams(word: string): string[] {
  const w = `  ${word} `
  const out: string[] = []
  for (let i = 0; i + 3 <= w.length; i++) out.push(w.slice(i, i + 3))
  return out
}

function trigramSet(text: string): Set<string> {
  const out = new Set<string>()
  for (const word of text.toLowerCase().split(/[^a-z0-9]+/i)) {
    if (!word) continue
    for (const t of trigrams(word)) out.add(t)
  }
  return out
}

export function wordSimilarity(needle: string, haystack: string): number {
  if (!needle || !haystack) return 0
  if (haystack.includes(needle)) return 1
  const a = trigramSet(needle)
  if (a.size === 0) return 0

  let best = 0
  for (const word of haystack.toLowerCase().split(/[^a-z0-9]+/i)) {
    if (!word) continue
    let shared = 0
    for (const t of trigrams(word)) if (a.has(t)) shared++
    best = Math.max(best, shared / a.size)
  }
  return Math.min(1, best)
}

function blobs(lead: Submission, stages: DetailStage[]) {
  const join = (...parts: (string | null | undefined)[]) =>
    parts.filter(Boolean).join(' ').toLowerCase()
  return {
    vehicle: join(lead.year, lead.make, lead.model),
    name: join(lead.first_name, lead.last_name),
    city: join(lead.city, lead.state_country),
    email: join(lead.email),
    desc: join(lead.project_description),
    tasks: stages.map((s) => join(s.label, s.description)).join(' '),
  }
}

type FieldScores = Record<keyof typeof WEIGHTS, number>

function measure(
  lead: Submission,
  stages: DetailStage[],
  tokens: string[],
): { fields: FieldScores; recruits: boolean[] } {
  const b = blobs(lead, stages)
  const fields: FieldScores = { vehicle: 0, name: 0, city: 0, email: 0, desc: 0, tasks: 0 }
  const recruits: boolean[] = []

  for (const t of tokens) {
    const per: FieldScores = {
      vehicle: wordSimilarity(t, b.vehicle),
      name: wordSimilarity(t, b.name),
      city: wordSimilarity(t, b.city),
      email: wordSimilarity(t, b.email),
      desc: b.desc.includes(t) ? 1 : 0,
      tasks: b.tasks.includes(t) ? 1 : 0,
    }
    let peak = 0
    for (const k of Object.keys(fields) as (keyof FieldScores)[]) {
      fields[k] += per[k] / tokens.length
      if (per[k] > peak) peak = per[k]
    }
    recruits.push(peak >= FUZZY_THRESHOLD)
  }
  return { fields, recruits }
}

function combine(fields: FieldScores): number {
  let best = 0
  let hits = 0
  for (const k of Object.keys(fields) as (keyof FieldScores)[]) {
    best = Math.max(best, WEIGHTS[k] * fields[k])
    if (fields[k] >= 0.6) hits++
  }
  return best < SCORE_FLOOR ? 0 : Math.min(1, best + 0.02 * hits)
}

export function scoreSubmission(lead: Submission, stages: DetailStage[], tokens: string[]): number {
  if (!tokens.length) return 0
  const { fields, recruits } = measure(lead, stages, tokens)
  return recruits.some(Boolean) ? combine(fields) : 0
}

export function searchCollection<T>(
  items: T[],
  tokens: string[],
  read: (item: T) => { lead: Submission; stages: DetailStage[] },
): { lead: Submission; score: number }[] {
  if (!tokens.length) return []

  const measured = items.map((item) => {
    const { lead, stages } = read(item)
    return { lead, ...measure(lead, stages, tokens) }
  })

  const recruited = tokens.map((_, i) => measured.reduce((n, m) => n + (m.recruits[i] ? 1 : 0), 0))
  const cap = Math.max(250, Math.floor(measured.length / 4))
  let keep = tokens.map((_, i) => recruited[i] <= cap)
  if (!keep.some(Boolean)) keep = tokens.map(() => true)

  const out: { lead: Submission; score: number }[] = []
  for (const m of measured) {
    if (!m.recruits.some((r, i) => r && keep[i])) continue
    const score = combine(m.fields)
    if (score > 0) out.push({ lead: m.lead, score })
  }
  return out
}

export type HighlightPart = { text: string; hit: boolean }

export function highlightParts(text: string, tokens: string[]): HighlightPart[] {
  if (!text || !tokens.length) return [{ text, hit: false }]

  const lower = text.toLowerCase()
  const ranges: [number, number][] = []

  for (const tok of tokens) {
    let from = lower.indexOf(tok)
    if (from !== -1) {
      while (from !== -1) {
        ranges.push([from, from + tok.length])
        from = lower.indexOf(tok, from + tok.length)
      }
      continue
    }
    const re = /[a-z0-9]+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(lower)) !== null) {
      if (wordSimilarity(tok, m[0]) >= HIGHLIGHT_THRESHOLD) {
        ranges.push([m.index, m.index + m[0].length])
      }
    }
  }

  if (!ranges.length) return [{ text, hit: false }]
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }

  const parts: HighlightPart[] = []
  let at = 0
  for (const [start, end] of merged) {
    if (start > at) parts.push({ text: text.slice(at, start), hit: false })
    parts.push({ text: text.slice(start, end), hit: true })
    at = end
  }
  if (at < text.length) parts.push({ text: text.slice(at), hit: false })
  return parts
}

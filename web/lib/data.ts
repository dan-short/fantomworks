import 'server-only'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { isSupabaseConfigured } from './supabase/config'
import { createClient } from './supabase/server'
import { seedSubmissions, seedDetails } from './seed'
import type { Submission, DetailStage, DetailsMap, SubmissionStatus } from './types'

// Dev store: prefer the converted real dump (web/lib/real-data.json, produced by
// scripts/convert.mjs) and fall back to the small seed. Loaded once via fs so the
// 18MB JSON is never bundled into the client. globalThis survives HMR.
const g = globalThis as unknown as {
  __fw_subs?: Submission[]
  __fw_details?: DetailsMap
}

function loadDev() {
  if (g.__fw_subs) return
  const realPath = join(process.cwd(), 'lib', 'real-data.json')
  if (existsSync(realPath)) {
    const raw = JSON.parse(readFileSync(realPath, 'utf8')) as {
      submissions: Submission[]
      details: DetailsMap
    }
    g.__fw_subs = raw.submissions
    g.__fw_details = raw.details
  } else {
    g.__fw_subs = seedSubmissions.map((s) => ({ ...s }))
    g.__fw_details = seedDetails
  }
}

function devSubs(): Submission[] {
  loadDev()
  return g.__fw_subs!
}
function devDetails(): DetailsMap {
  loadDev()
  return g.__fw_details!
}

// Supabase rows store images as image_name_1..4 columns; the app wants an array.
// Also guarantees `images` is never undefined regardless of source.
function fromRow(row: Record<string, unknown>): Submission {
  const images = [row.image_name_1, row.image_name_2, row.image_name_3, row.image_name_4].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
  return { ...(row as unknown as Submission), images }
}

export type SortKey = 'received' | 'name' | 'vehicle' | 'distance'

export const PAGE_SIZE = 50

const SEARCH_COLS = ['first_name', 'last_name', 'email', 'make', 'model', 'city'] as const

// Build a safe PostgREST `.or()` value for an ILIKE contains-search.
//  1. Neutralize LIKE metacharacters (\ % _) so the term matches literally.
//  2. Quote + escape for PostgREST's or() grammar, so commas / parentheses in
//     the search string can't break out of the filter or inject extra clauses.
function orIlikeFilter(term: string): string {
  const likeSafe = term.replace(/[\\%_]/g, (m) => `\\${m}`)
  const quoted = `%${likeSafe}%`.replace(/["\\]/g, (m) => `\\${m}`)
  return SEARCH_COLS.map((c) => `${c}.ilike."${quoted}"`).join(',')
}

// Dev-store equivalent of the DB ordering (see the `.order()` chain below).
function sortSubs(rows: Submission[], sort: SortKey): Submission[] {
  const r = [...rows]
  switch (sort) {
    case 'name':
      return r.sort((a, b) => (a.last_name ?? '').localeCompare(b.last_name ?? ''))
    case 'vehicle':
      return r.sort((a, b) => (a.year ?? '').localeCompare(b.year ?? ''))
    case 'distance':
      return r.sort((a, b) => (b.distance_miles ?? 0) - (a.distance_miles ?? 0))
    default:
      // bumped rows first (most recent bump on top), then by real received_date
      return r.sort(
        (a, b) =>
          (b.bumped_at ?? '').localeCompare(a.bumped_at ?? '') ||
          (b.received_date ?? '').localeCompare(a.received_date ?? ''),
      )
  }
}

// Push the sort into the query so pagination returns the right page (sorting
// only the current page in JS would be wrong).
function applySort<T extends { order: (col: string, o?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(
  q: T,
  sort: SortKey,
): T {
  switch (sort) {
    case 'name':
      return q.order('last_name', { ascending: true })
    case 'vehicle':
      return q.order('year', { ascending: true })
    case 'distance':
      return q.order('distance_miles', { ascending: false, nullsFirst: false })
    default:
      return q
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('received_date', { ascending: false, nullsFirst: false })
  }
}

export interface SubmissionsPage {
  rows: Submission[]
  total: number
}

export async function getSubmissions(
  status: SubmissionStatus,
  opts: { sort?: SortKey; search?: string; page?: number } = {},
): Promise<SubmissionsPage> {
  const sort = opts.sort ?? 'received'
  const search = opts.search?.trim().toLowerCase()
  const page = Math.max(1, opts.page ?? 1)
  const from = (page - 1) * PAGE_SIZE

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    let q = supabase.from('submissions').select('*', { count: 'exact' }).eq('status', status)
    if (search) q = q.or(orIlikeFilter(search))
    q = applySort(q, sort).range(from, from + PAGE_SIZE - 1)
    const { data, error, count } = await q
    if (error) throw error
    return { rows: (data ?? []).map(fromRow), total: count ?? 0 }
  }

  let rows = devSubs().filter((s) => s.status === status)
  if (search) {
    rows = rows.filter((s) =>
      [s.first_name, s.last_name, s.email, s.make, s.model, s.city]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(search)),
    )
  }
  rows = sortSubs(rows, sort)
  return { rows: rows.slice(from, from + PAGE_SIZE), total: rows.length }
}

export async function countByStatus(): Promise<Record<string, number>> {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('submissions').select('status')
    if (error) throw error
    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      const s = (row as { status: string }).status
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }
  const counts: Record<string, number> = {}
  for (const s of devSubs()) counts[s.status] = (counts[s.status] ?? 0) + 1
  return counts
}

export async function getSubmission(id: number): Promise<Submission | null> {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('submissions').select('*').eq('id', id).single()
    if (error) return null
    return fromRow(data)
  }
  return devSubs().find((s) => s.id === id) ?? null
}

// DB columns are stage_key / stage_label; the app type uses key / label.
function toDetailStage(row: Record<string, unknown>): DetailStage {
  return {
    key: (row.stage_key ?? row.key) as string,
    label: (row.stage_label ?? row.label) as string,
    description: (row.description ?? null) as string | null,
    parts_cost: (row.parts_cost ?? null) as number | null,
    hours: (row.hours ?? null) as number | null,
    sort_order: (row.sort_order ?? 0) as number,
  }
}

export async function getDetailStages(id: number): Promise<DetailStage[]> {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('submission_detail_stages')
      .select('*')
      .eq('submission_id', id)
      .order('sort_order')
    if (error) return []
    return (data ?? []).map(toDetailStage)
  }
  return devDetails()[id] ?? []
}

// Batched fetch for a page of submissions — one round-trip instead of one per
// row (the old N+1). Returns a map keyed by submission id.
export async function getDetailStagesFor(ids: number[]): Promise<DetailsMap> {
  if (ids.length === 0) return {}
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('submission_detail_stages')
      .select('*')
      .in('submission_id', ids)
      .order('sort_order')
    if (error) return {}
    const map: DetailsMap = {}
    for (const row of data ?? []) {
      const sid = (row as { submission_id: number }).submission_id
      ;(map[sid] ??= []).push(toDetailStage(row))
    }
    return map
  }
  const all = devDetails()
  const map: DetailsMap = {}
  for (const id of ids) if (all[id]?.length) map[id] = all[id]
  return map
}

// dev-mode mutators (used by server actions when Supabase isn't configured)
export const devStore = {
  update(id: number, patch: Partial<Submission>) {
    const row = devSubs().find((s) => s.id === id)
    if (row) Object.assign(row, patch)
  },
}

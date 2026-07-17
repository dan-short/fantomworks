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

export type SortKey = 'received' | 'name' | 'vehicle' | 'distance'

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
      return r.sort((a, b) => (b.received_date ?? '').localeCompare(a.received_date ?? ''))
  }
}

export async function getSubmissions(
  status: SubmissionStatus,
  opts: { sort?: SortKey; search?: string } = {},
): Promise<Submission[]> {
  const sort = opts.sort ?? 'received'
  const search = opts.search?.trim().toLowerCase()

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    let q = supabase.from('submissions').select('*').eq('status', status)
    if (search) {
      q = q.or(
        [
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `make.ilike.%${search}%`,
          `model.ilike.%${search}%`,
          `city.ilike.%${search}%`,
        ].join(','),
      )
    }
    const { data, error } = await q
    if (error) throw error
    return sortSubs((data ?? []) as Submission[], sort)
  }

  let rows = devSubs().filter((s) => s.status === status)
  if (search) {
    rows = rows.filter((s) =>
      [s.first_name, s.last_name, s.email, s.make, s.model, s.city]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(search)),
    )
  }
  return sortSubs(rows, sort)
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
    return data as Submission
  }
  return devSubs().find((s) => s.id === id) ?? null
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
    return (data ?? []) as DetailStage[]
  }
  return devDetails()[id] ?? []
}

// dev-mode mutators (used by server actions when Supabase isn't configured)
export const devStore = {
  update(id: number, patch: Partial<Submission>) {
    const row = devSubs().find((s) => s.id === id)
    if (row) Object.assign(row, patch)
  },
}

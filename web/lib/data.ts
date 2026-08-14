import 'server-only'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { isSupabaseConfigured } from './supabase/config'
import { createClient } from './supabase/server'
import { seedSubmissions, seedDetails } from './seed'
import { PHOTO_BUCKET, resolvePhotoUrl, storageKey } from './images'
import { SEARCH_CATEGORIES, searchCollection, searchTokens, type SearchFields } from './search'
import type { Submission, DetailStage, DetailsMap, EmailsMap, SentEmail, SubmissionStatus } from './types'
import { defaultSortDir, type SortKey, type SortDir } from './sort'

const SIGNED_URL_TTL = 60 * 60

async function attachImageUrls(rows: Submission[]): Promise<void> {
  const keys = new Set<string>()
  for (const r of rows) for (const v of r.images) {
    const k = storageKey(v)
    if (k) keys.add(k)
  }

  const signed = new Map<string, string>()
  if (isSupabaseConfigured && keys.size) {
    const supabase = await createClient()
    const list = [...keys]
    const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list, SIGNED_URL_TTL)
    data?.forEach((d, i) => {
      if (d.signedUrl) signed.set(list[i], d.signedUrl)
    })
  }

  for (const r of rows) {
    r.image_urls = r.images.map((v) => {
      const k = storageKey(v)
      if (k) return signed.get(k) ?? ''
      return resolvePhotoUrl(v) ?? ''
    })
  }
}

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

function fromRow(row: Record<string, unknown>): Submission {
  const images = [row.image_name_1, row.image_name_2, row.image_name_3, row.image_name_4].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
  return { ...(row as unknown as Submission), images }
}

export type { SortKey, SortDir } from './sort'
export { defaultSortDir } from './sort'

export const PAGE_SIZE = 50
export const SEARCH_PAGE_SIZE = 25

// Explicit column projection: fetch only what the app models (the Submission
// interface + the image_name_* columns folded into `images`). `select('*')`
// also dragged along ~17 columns the UI never reads — the 9 legacy_* flags, the
// policy-acknowledgement text blobs, arrival_date, created_at/updated_at — which
// were fetched off the wire only to be dropped by the type cast. Narrower rows =
// less to serialize and transfer on every page load.
const SELECT_COLS = [
  'id', 'legacy_id', 'source',
  'first_name', 'last_name', 'phone', 'alt_phone', 'call_schedule', 'email',
  'street', 'zipcode', 'city', 'state_country', 'time_zone', 'distance_miles',
  'year', 'make', 'model', 'budget', 'project_start', 'project_description',
  'restoration_decision_matrix', 'storage_type', 'storage_years',
  'status', 'status_changed_at', 'received_date', 'original_date', 'bumped_at', 'added_by', 'notes',
  'call_attempt_one', 'call_attempt_two', 'call_attempt_three', 'email_attempt',
  'image_name_1', 'image_name_2', 'image_name_3', 'image_name_4',
].join(', ')

const SEARCH_COLS = ['first_name', 'last_name', 'email', 'make', 'model', 'city'] as const

function orIlikeFilter(term: string): string {
  const likeSafe = term.replace(/[\\%_]/g, (m) => `\\${m}`)
  const quoted = `%${likeSafe}%`.replace(/["\\]/g, (m) => `\\${m}`)
  return SEARCH_COLS.map((c) => `${c}.ilike."${quoted}"`).join(',')
}

export function sortsByArchivedDate(status: SubmissionStatus, sort: SortKey): boolean {
  return status === 'archived' && sort === 'received'
}

function sortSubs(rows: Submission[], sort: SortKey, dir: SortDir, status: SubmissionStatus): Submission[] {
  const r = [...rows]
  // Ascending-first base comparators, flipped by `sign` for desc.
  const sign = dir === 'asc' ? 1 : -1
  switch (sort) {
    case 'name':
      return r.sort((a, b) => sign * (a.last_name ?? '').localeCompare(b.last_name ?? ''))
    case 'vehicle':
      return r.sort((a, b) => sign * (a.year ?? '').localeCompare(b.year ?? ''))
    case 'distance':
      return r.sort((a, b) => sign * ((a.distance_miles ?? 0) - (b.distance_miles ?? 0)))
    default: {
      const archivedFirst = sortsByArchivedDate(status, sort)
      return r.sort(
        (a, b) =>
          sign * (a.bumped_at ?? '').localeCompare(b.bumped_at ?? '') ||
          (archivedFirst ? sign * (a.status_changed_at ?? '').localeCompare(b.status_changed_at ?? '') : 0) ||
          sign * (a.received_date ?? '').localeCompare(b.received_date ?? ''),
      )
    }
  }
}

function applySort<T extends { order: (col: string, o?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(
  q: T,
  sort: SortKey,
  dir: SortDir,
  status: SubmissionStatus,
): T {
  const ascending = dir === 'asc'
  switch (sort) {
    case 'name':
      return q.order('last_name', { ascending })
    case 'vehicle':
      return q.order('year', { ascending })
    case 'distance':
      return q.order('distance_miles', { ascending, nullsFirst: false })
    default: {
      let ordered = q.order('bumped_at', { ascending, nullsFirst: false })
      if (sortsByArchivedDate(status, sort)) {
        ordered = ordered.order('status_changed_at', { ascending, nullsFirst: false })
      }
      return ordered.order('received_date', { ascending, nullsFirst: false })
    }
  }
}

export interface SubmissionsPage {
  rows: Submission[]
  total: number
}

export async function getSubmissions(
  status: SubmissionStatus,
  opts: { sort?: SortKey; dir?: SortDir; page?: number } = {},
): Promise<SubmissionsPage> {
  const sort = opts.sort ?? 'received'
  const dir = opts.dir ?? defaultSortDir(sort, status)
  const page = Math.max(1, opts.page ?? 1)
  const from = (page - 1) * PAGE_SIZE

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const q = applySort(
      supabase.from('submissions').select(SELECT_COLS, { count: 'exact' }).eq('status', status),
      sort,
      dir,
      status,
    ).range(from, from + PAGE_SIZE - 1)
    const { data, error, count } = await q
    if (error) throw error
    // A computed (non-literal) select string widens supabase-js's row type, so
    // cast back to plain rows for fromRow.
    const rawRows = (data ?? []) as unknown as Record<string, unknown>[]
    const rows = rawRows.map(fromRow)
    await attachImageUrls(rows)
    return { rows, total: count ?? 0 }
  }

  const rows = sortSubs(devSubs().filter((s) => s.status === status), sort, dir, status)
  return { rows: rows.slice(from, from + PAGE_SIZE), total: rows.length }
}

export interface SearchResult {
  rows: Submission[]
  total: number
  counts: Record<string, number>
}

export interface SearchOptions {
  q: string
  view: SubmissionStatus
  cats: SubmissionStatus[]
  fields: SearchFields
  sort: SortKey
  dir: SortDir
  page: number
}

function categoryRank(view: SubmissionStatus): Record<string, number> {
  const order = [view, ...SEARCH_CATEGORIES.filter((c) => c !== view)]
  return Object.fromEntries(order.map((c, i) => [c, i]))
}

function compareInCategory(sort: SortKey, dir: SortDir, scores: Map<number, number>) {
  const sign = dir === 'asc' ? 1 : -1
  return (a: Submission, b: Submission): number => {
    switch (sort) {
      case 'name':
        return sign * (a.last_name ?? '').localeCompare(b.last_name ?? '')
      case 'vehicle':
        return sign * (a.year ?? '').localeCompare(b.year ?? '')
      case 'distance':
        return sign * ((a.distance_miles ?? 0) - (b.distance_miles ?? 0))
      case 'received':
        return (
          sign * (a.bumped_at ?? '').localeCompare(b.bumped_at ?? '') ||
          sign * (a.received_date ?? '').localeCompare(b.received_date ?? '')
        )
      default:
        return (
          (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
          (b.received_date ?? '').localeCompare(a.received_date ?? '')
        )
    }
  }
}

function rankAndPage(
  matches: { lead: Submission; score: number }[],
  opts: SearchOptions,
): SearchResult {
  const counts: Record<string, number> = {}
  for (const m of matches) counts[m.lead.status] = (counts[m.lead.status] ?? 0) + 1

  const kept = matches.filter((m) => opts.cats.includes(m.lead.status))
  const scores = new Map(kept.map((m) => [m.lead.id, m.score]))
  const rank = categoryRank(opts.view)
  const within = compareInCategory(opts.sort, opts.dir, scores)

  const sorted = kept
    .map((m) => m.lead)
    .sort((a, b) => (rank[a.status] ?? 99) - (rank[b.status] ?? 99) || within(a, b) || a.id - b.id)

  const from = (Math.max(1, opts.page) - 1) * SEARCH_PAGE_SIZE
  return { rows: sorted.slice(from, from + SEARCH_PAGE_SIZE), total: sorted.length, counts }
}

async function searchFallback(opts: SearchOptions): Promise<SearchResult> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(SELECT_COLS)
    .neq('status', 'deleted')
    .or(orIlikeFilter(opts.q.trim()))
    .limit(500)
  if (error) throw error

  const matches = searchCollection(
    ((data ?? []) as unknown as Record<string, unknown>[]).map(fromRow),
    searchTokens(opts.q),
    opts.fields,
    (lead) => ({ lead, stages: [] }),
  )

  const result = rankAndPage(matches, opts)
  await attachImageUrls(result.rows)
  return result
}

export async function searchSubmissions(opts: SearchOptions): Promise<SearchResult> {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('submissions_search', {
      q: opts.q,
      cur_status: opts.view,
      statuses: opts.cats,
      sort_key: opts.sort,
      sort_dir: opts.dir,
      lim: SEARCH_PAGE_SIZE,
      off: (Math.max(1, opts.page) - 1) * SEARCH_PAGE_SIZE,
      incl_desc: opts.fields.desc,
      incl_tasks: opts.fields.tasks,
    })
    if (error) return searchFallback(opts)

    const envelope = (data ?? {}) as {
      total?: number
      counts?: Record<string, number>
      rows?: Record<string, unknown>[]
    }
    const rows = (envelope.rows ?? []).map(fromRow)
    await attachImageUrls(rows)
    return { rows, total: envelope.total ?? 0, counts: envelope.counts ?? {} }
  }

  const details = devDetails()
  const matches = searchCollection(
    devSubs().filter((s) => s.status !== 'deleted'),
    searchTokens(opts.q),
    opts.fields,
    (lead) => ({ lead, stages: details[lead.id] ?? [] }),
  )
  return rankAndPage(matches, opts)
}

export async function countByStatus(): Promise<Record<string, number>> {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    // One grouped aggregate instead of pulling every row's status and tallying
    // in Node (see migration 0006). Falls back to the old scan if the RPC isn't
    // deployed yet, so this ships safely ahead of the migration.
    const { data, error } = await supabase.rpc('submissions_status_counts')
    if (!error && Array.isArray(data)) {
      const counts: Record<string, number> = {}
      for (const row of data as { status: string; n: number }[]) {
        counts[row.status] = Number(row.n)
      }
      return counts
    }
    const { data: rows, error: scanErr } = await supabase.from('submissions').select('status')
    if (scanErr) throw scanErr
    const counts: Record<string, number> = {}
    for (const row of rows ?? []) {
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
    const row = fromRow(data)
    await attachImageUrls([row])
    return row
  }
  return devSubs().find((s) => s.id === id) ?? null
}

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

function toSentEmail(row: Record<string, unknown>): SentEmail {
  return {
    id: row.id as number,
    template_label: (row.template_label ?? null) as string | null,
    to_email: (row.to_email ?? '') as string,
    subject: (row.subject ?? '') as string,
    body_text: (row.body_text ?? '') as string,
    sent_at: (row.sent_at ?? null) as string | null,
    sent_by: (row.sent_by ?? null) as string | null,
  }
}

export async function getEmailsFor(ids: number[]): Promise<EmailsMap> {
  if (ids.length === 0 || !isSupabaseConfigured) return {}
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('submission_emails')
    .select('id, submission_id, template_label, to_email, subject, body_text, sent_at, sent_by')
    .in('submission_id', ids)
    .not('sent_at', 'is', null)
    .order('created_at', { ascending: false })
  if (error) return {}
  const map: EmailsMap = {}
  for (const row of data ?? []) {
    const sid = (row as { submission_id: number }).submission_id
    ;(map[sid] ??= []).push(toSentEmail(row))
  }
  return map
}

export const devStore = {
  update(id: number, patch: Partial<Submission>) {
    const row = devSubs().find((s) => s.id === id)
    if (row) Object.assign(row, patch)
  },
  setStages(id: number, stages: DetailStage[]) {
    const all = devDetails()
    if (stages.length) all[id] = stages
    else delete all[id]
  },
  insert(patch: Partial<Submission>, stages: DetailStage[] = []): number {
    const subs = devSubs()
    const id = subs.reduce((m, s) => Math.max(m, s.id), 0) + 1
    const legacy_id = subs.reduce((m, s) => Math.max(m, s.legacy_id), 0) + 1
    const row: Submission = {
      id,
      legacy_id,
      source: 'live',
      first_name: null, last_name: null, phone: null, alt_phone: null,
      call_schedule: null, email: null, street: null, zipcode: null,
      city: null, state_country: null, time_zone: null, distance_miles: null,
      year: null, make: null, model: null, budget: null, project_start: null,
      project_description: null, restoration_decision_matrix: null,
      storage_type: null, storage_years: null,
      status: 'new', status_changed_at: new Date().toISOString(),
      received_date: null, original_date: null, bumped_at: null,
      added_by: null, notes: null,
      call_attempt_one: null, call_attempt_two: null, call_attempt_three: null,
      email_attempt: null, images: [],
      ...patch,
    }
    subs.push(row)
    if (stages.length) devDetails()[id] = stages
    return id
  },
}

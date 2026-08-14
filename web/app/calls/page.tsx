import {
  getSubmissions,
  getDetailStagesFor,
  getEmailsFor,
  countByStatus,
  searchSubmissions,
  defaultSortDir,
  PAGE_SIZE,
  SEARCH_PAGE_SIZE,
  type SortKey,
  type SortDir,
} from '@/lib/data'
import { parseCategories, parseFields, searchTokens } from '@/lib/search'
import { isStatus, type SubmissionStatus } from '@/lib/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { CallConsole } from '@/components/fw/CallConsole'

const SORT_KEYS: SortKey[] = ['relevance', 'received', 'name', 'vehicle', 'distance']
const SORT_DIRS: SortDir[] = ['asc', 'desc']

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string
    sort?: string
    dir?: string
    q?: string
    p?: string
    cats?: string
    fields?: string
  }>
}) {
  const sp = await searchParams
  const view: SubmissionStatus = sp.view && isStatus(sp.view) ? sp.view : 'new'
  const search = (sp.q ?? '').trim()
  const searching = searchTokens(search).length > 0
  const cats = parseCategories(sp.cats)
  const fields = parseFields(sp.fields)
  const page = Math.max(1, Number(sp.p) || 1)

  const requested = SORT_KEYS.includes(sp.sort as SortKey) ? (sp.sort as SortKey) : undefined
  const sort: SortKey = requested ?? (searching ? 'relevance' : 'received')

  const requestedDir = SORT_DIRS.includes(sp.dir as SortDir) ? (sp.dir as SortDir) : undefined
  const dir: SortDir = requestedDir ?? defaultSortDir(sort, view)

  let rows, total, counts
  if (searching) {
    const result = await searchSubmissions({ q: search, view, cats, fields, sort, dir, page })
    rows = result.rows
    total = result.total
    counts = result.counts
  } else {
    const effectiveSort = sort === 'relevance' ? 'received' : sort
    const [pageResult, statusCounts] = await Promise.all([
      getSubmissions(view, { sort: effectiveSort, dir: sort === 'relevance' ? defaultSortDir(effectiveSort, view) : dir, page }),
      countByStatus(),
    ])
    rows = pageResult.rows
    total = pageResult.total
    counts = statusCounts
  }

  const ids = rows.map((s) => s.id)
  const [details, emails] = await Promise.all([getDetailStagesFor(ids), getEmailsFor(ids)])

  const size = searching ? SEARCH_PAGE_SIZE : PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(total / size))
  const first = total === 0 ? 0 : (page - 1) * size + 1
  const last = (page - 1) * size + rows.length

  let email: string | null = null
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    email = user?.email ?? null
  }

  return (
    <CallConsole
      rows={rows}
      details={details}
      emails={emails}
      counts={counts}
      view={view}
      sort={sort}
      dir={dir}
      search={search}
      searching={searching}
      cats={cats}
      fields={fields}
      page={page}
      pageCount={pageCount}
      total={total}
      first={first}
      last={last}
      email={email}
      devMode={!isSupabaseConfigured}
    />
  )
}

import {
  getSubmissions,
  getDetailStagesFor,
  countByStatus,
  searchSubmissions,
  PAGE_SIZE,
  SEARCH_PAGE_SIZE,
  type SortKey,
} from '@/lib/data'
import { parseCategories, searchTokens } from '@/lib/search'
import { isStatus, type SubmissionStatus } from '@/lib/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { CallConsole } from '@/components/fw/CallConsole'

const SORT_KEYS: SortKey[] = ['relevance', 'received', 'name', 'vehicle', 'distance']

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string; q?: string; p?: string; cats?: string }>
}) {
  const sp = await searchParams
  const view: SubmissionStatus = sp.view && isStatus(sp.view) ? sp.view : 'new'
  const search = (sp.q ?? '').trim()
  const searching = searchTokens(search).length > 0
  const cats = parseCategories(sp.cats)
  const page = Math.max(1, Number(sp.p) || 1)

  const requested = SORT_KEYS.includes(sp.sort as SortKey) ? (sp.sort as SortKey) : undefined
  const sort: SortKey = requested ?? (searching ? 'relevance' : 'received')

  let rows, total, counts
  if (searching) {
    const result = await searchSubmissions({ q: search, view, cats, sort, page })
    rows = result.rows
    total = result.total
    counts = result.counts
  } else {
    const [pageResult, statusCounts] = await Promise.all([
      getSubmissions(view, { sort: sort === 'relevance' ? 'received' : sort, page }),
      countByStatus(),
    ])
    rows = pageResult.rows
    total = pageResult.total
    counts = statusCounts
  }

  const details = await getDetailStagesFor(rows.map((s) => s.id))

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
      counts={counts}
      view={view}
      sort={sort}
      search={search}
      searching={searching}
      cats={cats}
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

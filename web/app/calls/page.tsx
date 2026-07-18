import { getSubmissions, getDetailStagesFor, countByStatus, PAGE_SIZE, type SortKey } from '@/lib/data'
import { isStatus, type SubmissionStatus } from '@/lib/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { CallConsole } from '@/components/fw/CallConsole'

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sort?: string; q?: string; p?: string }>
}) {
  const sp = await searchParams
  const view: SubmissionStatus = sp.view && isStatus(sp.view) ? sp.view : 'new'
  const sort = (sp.sort as SortKey) ?? 'received'
  const search = sp.q ?? ''
  const page = Math.max(1, Number(sp.p) || 1)

  const [{ rows, total }, counts] = await Promise.all([
    getSubmissions(view, { sort, search, page }),
    countByStatus(),
  ])
  const details = await getDetailStagesFor(rows.map((s) => s.id))

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const last = (page - 1) * PAGE_SIZE + rows.length

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

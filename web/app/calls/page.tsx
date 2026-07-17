import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getSubmissions, getDetailStagesFor, PAGE_SIZE, type SortKey } from '@/lib/data'
import { isStatus, STATUS_VIEWS, type SubmissionStatus } from '@/lib/types'
import { CallLogTable } from '@/components/CallLogTable'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'name', label: 'Name' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'distance', label: 'Distance' },
]

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

  const { rows, total } = await getSubmissions(view, { sort, search, page })
  const details = await getDetailStagesFor(rows.map((s) => s.id))

  const label = STATUS_VIEWS.find((v) => v.key === view)?.label ?? view
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const last = (page - 1) * PAGE_SIZE + rows.length

  // Build a /calls URL, carrying the current view/sort/search and overriding page.
  const href = (p: number) => {
    const params = new URLSearchParams({ view })
    if (sort !== 'received') params.set('sort', sort)
    if (search) params.set('q', search)
    if (p > 1) params.set('p', String(p))
    return `/calls?${params.toString()}`
  }

  // Clear-search: same view/sort, no query, back to page 1.
  const clearHref = () => {
    const params = new URLSearchParams({ view })
    if (sort !== 'received') params.set('sort', sort)
    return `/calls?${params.toString()}`
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">{label}</h1>
          <p className="tnum text-sm text-stone-500">
            {total} {total === 1 ? 'submission' : 'submissions'}
            {pageCount > 1 && <span className="text-stone-400"> · showing {first}–{last}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2">
            <input type="hidden" name="view" value={view} />
            <div className="relative">
              <input
                name="q"
                defaultValue={search}
                placeholder="Search name, vehicle, city…"
                className="w-64 rounded-md border border-stone-300 bg-white px-3 py-1.5 pr-8 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
              {search && (
                <a
                  href={clearHref()}
                  aria-label="Clear search"
                  title="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="h-4 w-4" />
                </a>
              )}
            </div>
            <button className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100">
              Search
            </button>
          </form>

          <div className="flex items-center gap-1 text-sm">
            <span className="mr-1 text-xs text-stone-400">Sort</span>
            {SORTS.map((s) => {
              const params = new URLSearchParams()
              params.set('view', view)
              params.set('sort', s.key)
              if (search) params.set('q', search)
              const active = sort === s.key
              return (
                <a
                  key={s.key}
                  href={`/calls?${params.toString()}`}
                  className={`rounded px-2 py-1 ${
                    active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {s.label}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <CallLogTable submissions={rows} details={details} />
      </div>

      {pageCount > 1 && (
        <nav className="mt-3 flex shrink-0 items-center justify-between text-sm text-stone-600">
          <span className="tnum text-xs text-stone-400">
            Page {page} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <a
                href={href(page - 1)}
                className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 hover:bg-stone-100"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </a>
            ) : (
              <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1.5 text-stone-300">
                <ChevronLeft className="h-4 w-4" /> Prev
              </span>
            )}
            {page < pageCount ? (
              <a
                href={href(page + 1)}
                className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 hover:bg-stone-100"
              >
                Next <ChevronRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="flex cursor-not-allowed items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1.5 text-stone-300">
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}

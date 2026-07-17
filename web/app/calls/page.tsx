import { X } from 'lucide-react'
import { getSubmissions, getDetailStages, type SortKey } from '@/lib/data'
import { isStatus, STATUS_VIEWS, type SubmissionStatus, type DetailsMap } from '@/lib/types'
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
  searchParams: Promise<{ view?: string; sort?: string; q?: string }>
}) {
  const sp = await searchParams
  const view: SubmissionStatus = sp.view && isStatus(sp.view) ? sp.view : 'new'
  const sort = (sp.sort as SortKey) ?? 'received'
  const search = sp.q ?? ''

  const submissions = await getSubmissions(view, { sort, search })

  // fetch detail stages for the visible page
  const stageLists = await Promise.all(submissions.map((s) => getDetailStages(s.id)))
  const details: DetailsMap = {}
  submissions.forEach((s, i) => {
    if (stageLists[i].length) details[s.id] = stageLists[i]
  })

  const label = STATUS_VIEWS.find((v) => v.key === view)?.label ?? view

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">{label}</h1>
          <p className="tnum text-sm text-stone-500">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
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
                  href={`/calls?view=${view}${sort !== 'received' ? `&sort=${sort}` : ''}`}
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
        <CallLogTable submissions={submissions} details={details} />
      </div>
    </div>
  )
}

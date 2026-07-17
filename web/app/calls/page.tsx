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
          <h1 className="text-lg font-semibold">{label}</h1>
          <p className="text-sm text-neutral-400">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2">
            <input type="hidden" name="view" value={view} />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search name, vehicle, city…"
              className="rounded-md bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm outline-none focus:border-neutral-400 w-64"
            />
            <button className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700">
              Search
            </button>
          </form>

          <div className="flex items-center gap-1 text-sm">
            <span className="text-neutral-500 text-xs mr-1">Sort</span>
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
                    active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-300 hover:bg-neutral-800'
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

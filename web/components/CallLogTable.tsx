'use client'
import { useTransition } from 'react'
import { ageBucket, AGE_STYLES } from '@/lib/age'
import type { Submission, DetailsMap, SubmissionStatus } from '@/lib/types'
import {
  logCallAttempt,
  logEmailAttempt,
  setStatus,
  addNote,
  bump,
} from '@/app/actions/submissions'

// Legacy images still live on the old Bluehost host; point at them directly for now.
const UPLOADS_BASE =
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? 'https://projects.fantomworks.com/uploads/'
const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(name)

function fmtDate(ts: string | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}
function relAge(date: string | null): string {
  if (!date) return ''
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
  if (d < 1) return 'today'
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

// Online (public form) vs Office (entered by staff).
function SourceBadge({ addedBy }: { addedBy: string | null }) {
  const online = (addedBy ?? '').toLowerCase().includes('online')
  return online ? (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-sky-50 text-sky-700 ring-1 ring-sky-200">
      Online
    </span>
  ) : (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      title={addedBy ? `Entered by ${addedBy}` : 'Entered in office'}
    >
      Office{addedBy ? ` · ${addedBy}` : ''}
    </span>
  )
}

const STATUS_ACTIONS: { status: SubmissionStatus; label: string; confirm?: string; danger?: boolean }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'active', label: 'Active' },
  { status: 'possible', label: 'Possible' },
  { status: 'archived', label: 'Archive', confirm: 'Archive this record?' },
  { status: 'deleted', label: 'Delete', confirm: 'Delete this record?', danger: true },
]

export function CallLogTable({
  submissions,
  details,
}: {
  submissions: Submission[]
  details: DetailsMap
}) {
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<void>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    startTransition(() => void fn())
  }

  if (submissions.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-lg border border-stone-200 bg-white text-stone-400">
        No submissions in this view.
      </div>
    )
  }

  return (
    <div
      className={`h-full overflow-auto rounded-lg border border-stone-200 bg-white shadow-sm ${
        pending ? 'opacity-60' : ''
      }`}
    >
      <table className="w-full text-sm">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[32%]" />
          <col className="w-[10%]" />
          <col className="w-[17%]" />
          <col className="w-[9%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="[&>th]:bg-stone-100 [&>th]:border-b [&>th]:border-stone-200 [&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-stone-500">
            <th>Customer</th>
            <th>Project</th>
            <th>Attempts</th>
            <th>Notes</th>
            <th>Received</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {submissions.map((s) => {
            const bucket = ageBucket(s.received_date)
            const stages = details[s.id] ?? []
            const imgs = s.images ?? []
            return (
              <tr key={s.id} className="align-top hover:bg-stone-50/70">
                {/* Customer — combined identity */}
                <td className="px-3 py-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${AGE_STYLES[bucket].dot}`}
                      title={AGE_STYLES[bucket].label}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-stone-900">
                          {s.first_name} {s.last_name}
                        </span>
                        <SourceBadge addedBy={s.added_by} />
                      </div>
                      <div className="tnum mt-1 space-y-0.5 text-xs text-stone-600">
                        {s.phone && (
                          <a href={`tel:${s.phone}`} className="block font-mono hover:text-stone-900">
                            {s.phone}
                          </a>
                        )}
                        {s.alt_phone && (
                          <a href={`tel:${s.alt_phone}`} className="block font-mono text-stone-400 hover:text-stone-900">
                            {s.alt_phone}
                          </a>
                        )}
                        {s.email && (
                          <a href={`mailto:${s.email}`} className="block truncate text-stone-500 hover:text-stone-900">
                            {s.email}
                          </a>
                        )}
                        {s.call_schedule && (
                          <div className="text-stone-400">🕑 {s.call_schedule}</div>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs text-stone-500">
                        <span className="font-medium text-stone-700">
                          {[s.year, s.make, s.model].filter(Boolean).join(' ') || '—'}
                        </span>
                      </div>
                      <div className="tnum text-xs text-stone-400">
                        {[s.city, s.state_country].filter(Boolean).join(', ')}
                        {s.distance_miles != null && ` · ${s.distance_miles} mi`}
                        {s.time_zone ? ` · ${s.time_zone.replace(/\s+/g, ' ').trim()}` : ''}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-stone-300">#{s.legacy_id}</div>
                    </div>
                  </div>
                </td>

                {/* Project — description + stages + photos, all inline */}
                <td className="px-3 py-3">
                  {s.budget != null && (
                    <div className="tnum mb-1 text-xs font-medium text-stone-700">
                      Budget ${s.budget.toLocaleString()}
                      {s.project_start ? <span className="text-stone-400"> · {s.project_start}</span> : null}
                    </div>
                  )}
                  {s.project_description && (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-600 max-h-32 overflow-auto">
                      {s.project_description}
                    </p>
                  )}
                  {stages.length > 0 && (
                    <dl className="mt-2 space-y-1 border-t border-stone-100 pt-2">
                      {stages.map((st) => (
                        <div key={st.key} className="flex items-baseline gap-2 text-xs">
                          <dt className="w-24 shrink-0 text-stone-400">{st.label}</dt>
                          <dd className="flex-1 text-stone-600">{st.description || '—'}</dd>
                          <dd className="tnum shrink-0 font-mono text-[10px] text-stone-400">
                            {st.parts_cost ? `$${st.parts_cost.toLocaleString()}` : ''}
                            {st.hours ? ` ${st.hours}h` : ''}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {imgs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {imgs.map((img) => {
                        const url = UPLOADS_BASE + img
                        return isImageFile(img) ? (
                          <a key={img} href={url} target="_blank" rel="noreferrer" title={img}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={img}
                              loading="lazy"
                              className="h-14 w-14 rounded object-cover ring-1 ring-stone-200 hover:ring-stone-400"
                            />
                          </a>
                        ) : (
                          <a
                            key={img}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-14 w-14 place-items-center rounded bg-stone-100 text-[10px] text-stone-500 ring-1 ring-stone-200 hover:ring-stone-400"
                          >
                            {img.split('.').pop()?.toUpperCase()}
                          </a>
                        )
                      })}
                    </div>
                  )}
                </td>

                {/* Attempts */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1 text-xs">
                    {[1, 2, 3].map((n) => {
                      const col = ([s.call_attempt_one, s.call_attempt_two, s.call_attempt_three] as const)[n - 1]
                      return col ? (
                        <span key={n} className="tnum text-stone-500">
                          Call {n} · {fmtDate(col)}
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => run(() => logCallAttempt(s.id, n as 1 | 2 | 3))}
                          className="w-fit rounded px-1.5 py-0.5 text-left text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        >
                          + Call {n}
                        </button>
                      )
                    })}
                    {s.email_attempt ? (
                      <span className="tnum text-stone-500">Email · {fmtDate(s.email_attempt)}</span>
                    ) : (
                      <button
                        onClick={() => run(() => logEmailAttempt(s.id))}
                        className="w-fit rounded px-1.5 py-0.5 text-left text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                      >
                        + Email
                      </button>
                    )}
                  </div>
                </td>

                {/* Notes */}
                <td className="px-3 py-3">
                  {s.notes && (
                    <p className="mb-1.5 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-stone-50 p-1.5 text-xs leading-relaxed text-stone-600 ring-1 ring-stone-100">
                      {s.notes}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      const note = window.prompt('Add note')
                      if (note) run(() => addNote(s.id, note))
                    }}
                    className="rounded px-1.5 py-0.5 text-xs text-sky-700 hover:bg-sky-50"
                  >
                    + Note
                  </button>
                </td>

                {/* Received */}
                <td className="px-3 py-3">
                  <div className="tnum text-xs text-stone-700">{s.received_date}</div>
                  <div className="text-[11px] text-stone-400">{relAge(s.received_date)}</div>
                  <button
                    onClick={() => run(() => bump(s.id))}
                    className="mt-1 rounded px-1.5 py-0.5 text-[11px] text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                    title="Send to top of the list"
                  >
                    Bump ↑
                  </button>
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    {STATUS_ACTIONS.filter((a) => a.status !== s.status).map((a) => (
                      <button
                        key={a.status}
                        onClick={() => run(() => setStatus(s.id, a.status), a.confirm)}
                        className={`rounded px-1.5 py-0.5 text-left text-xs hover:bg-stone-100 ${
                          a.danger ? 'text-red-600 hover:bg-red-50' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

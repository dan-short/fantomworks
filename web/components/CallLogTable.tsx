'use client'
import { Fragment, useState, useTransition } from 'react'
import { ageBucket, AGE_STYLES } from '@/lib/age'
import type { Submission, DetailsMap, SubmissionStatus } from '@/lib/types'
import {
  logCallAttempt,
  logEmailAttempt,
  setStatus,
  addNote,
  bump,
} from '@/app/actions/submissions'

function fmtTs(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Status transitions available from a row, mirroring the legacy action buttons.
const STATUS_ACTIONS: { status: SubmissionStatus; label: string; confirm?: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'active', label: 'Active' },
  { status: 'possible', label: 'Possible' },
  { status: 'archived', label: 'Archive', confirm: 'Archive this record?' },
  { status: 'deleted', label: 'Delete', confirm: 'Delete this record?' },
]

export function CallLogTable({
  submissions,
  details,
}: {
  submissions: Submission[]
  details: DetailsMap
}) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<void>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    startTransition(() => {
      void fn()
    })
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 p-10 text-center text-neutral-500">
        No submissions in this view.
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-neutral-800 ${pending ? 'opacity-70' : ''}`}>
      <table className="w-full text-sm">
        <thead className="bg-neutral-900 text-neutral-400 text-left">
          <tr>
            <th className="p-3 font-medium">Customer</th>
            <th className="p-3 font-medium">Contact</th>
            <th className="p-3 font-medium">Location</th>
            <th className="p-3 font-medium">Vehicle</th>
            <th className="p-3 font-medium">Project</th>
            <th className="p-3 font-medium">Attempts</th>
            <th className="p-3 font-medium">Received</th>
            <th className="p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {submissions.map((s) => {
            const bucket = ageBucket(s.received_date)
            const isOpen = expanded === s.id
            const stages = details[s.id]
            return (
              <Fragment key={s.id}>
                <tr className="align-top hover:bg-neutral-900/50">
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${AGE_STYLES[bucket].dot}`}
                        title={AGE_STYLES[bucket].label}
                      />
                      <div>
                        <div className="font-medium">
                          {s.first_name} {s.last_name}
                        </div>
                        <div className="text-xs text-neutral-500">#{s.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-neutral-300">
                    {s.phone && (
                      <a href={`tel:${s.phone}`} className="block hover:text-white">
                        {s.phone}
                      </a>
                    )}
                    {s.alt_phone && (
                      <a href={`tel:${s.alt_phone}`} className="block text-neutral-500 hover:text-white">
                        {s.alt_phone}
                      </a>
                    )}
                    {s.email && (
                      <a href={`mailto:${s.email}`} className="block text-xs text-neutral-500 hover:text-white">
                        {s.email}
                      </a>
                    )}
                    {s.call_schedule && (
                      <div className="text-xs text-neutral-600 mt-1">{s.call_schedule}</div>
                    )}
                  </td>

                  <td className="p-3 text-neutral-300">
                    <div>
                      {s.city}
                      {s.state_country ? `, ${s.state_country}` : ''}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {s.distance_miles != null ? `${s.distance_miles} mi` : 'distance unknown'}
                      {s.time_zone ? ` · ${s.time_zone}` : ''}
                    </div>
                  </td>

                  <td className="p-3 text-neutral-300">
                    {s.year} {s.make} {s.model}
                  </td>

                  <td className="p-3 text-neutral-300 max-w-xs">
                    <div className="text-xs text-neutral-500">
                      {s.budget != null && `Budget $${s.budget.toLocaleString()}`}
                      {s.project_start ? ` · ${s.project_start}` : ''}
                    </div>
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="mt-1 text-xs text-sky-400 hover:text-sky-300"
                    >
                      {isOpen ? 'Hide details' : 'Show details'}
                    </button>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {[1, 2, 3].map((n) => {
                        const col = ([s.call_attempt_one, s.call_attempt_two, s.call_attempt_three] as const)[n - 1]
                        return col ? (
                          <span key={n} className="text-xs text-neutral-500">
                            Call {n}: {fmtTs(col)}
                          </span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => run(() => logCallAttempt(s.id, n as 1 | 2 | 3))}
                            className="text-xs text-left text-neutral-300 hover:text-white"
                          >
                            + Call {n}
                          </button>
                        )
                      })}
                      {s.email_attempt ? (
                        <span className="text-xs text-neutral-500">Emailed: {fmtTs(s.email_attempt)}</span>
                      ) : (
                        <button
                          onClick={() => run(() => logEmailAttempt(s.id))}
                          className="text-xs text-left text-neutral-300 hover:text-white"
                        >
                          + Email
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="text-neutral-300">{s.received_date}</div>
                    <button
                      onClick={() => run(() => bump(s.id))}
                      className="text-xs text-neutral-500 hover:text-white"
                    >
                      Bump ↑
                    </button>
                    <div className="text-xs text-neutral-600 mt-1">{s.added_by}</div>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {STATUS_ACTIONS.filter((a) => a.status !== s.status).map((a) => (
                        <button
                          key={a.status}
                          onClick={() => run(() => setStatus(s.id, a.status), a.confirm)}
                          className="text-xs text-left text-neutral-300 hover:text-white"
                        >
                          {a.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const note = window.prompt('Add note')
                          if (note) run(() => addNote(s.id, note))
                        }}
                        className="text-xs text-left text-neutral-300 hover:text-white"
                      >
                        Add note
                      </button>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-neutral-900/40">
                    <td colSpan={8} className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                            Project Description
                          </h4>
                          <p className="whitespace-pre-wrap text-neutral-300 text-sm">
                            {s.project_description || '—'}
                          </p>
                          {s.notes && (
                            <>
                              <h4 className="text-xs uppercase tracking-wide text-neutral-500 mb-1 mt-3">
                                Notes
                              </h4>
                              <p className="whitespace-pre-wrap text-neutral-300 text-sm">{s.notes}</p>
                            </>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                            Tasks to Complete
                          </h4>
                          {stages && stages.length > 0 ? (
                            <table className="text-sm w-full">
                              <thead className="text-neutral-500 text-xs text-left">
                                <tr>
                                  <th className="font-medium pb-1">Stage</th>
                                  <th className="font-medium pb-1">Detail</th>
                                  <th className="font-medium pb-1 text-right">Parts</th>
                                  <th className="font-medium pb-1 text-right">Hrs</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stages.map((st) => (
                                  <tr key={st.key} className="align-top">
                                    <td className="pr-3 py-0.5 text-neutral-400 whitespace-nowrap">
                                      {st.label}
                                    </td>
                                    <td className="pr-3 py-0.5 text-neutral-300">
                                      {st.description || '—'}
                                    </td>
                                    <td className="py-0.5 text-neutral-400 text-right whitespace-nowrap">
                                      {st.parts_cost ? `$${st.parts_cost.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="py-0.5 text-neutral-400 text-right">
                                      {st.hours || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-neutral-500 text-sm">No detail breakdown.</p>
                          )}
                          {s.images.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                                Images ({s.images.length})
                              </h4>
                              <div className="flex gap-2">
                                {s.images.map((img) => (
                                  <span
                                    key={img}
                                    className="grid h-16 w-16 place-items-center rounded bg-neutral-800 text-[10px] text-neutral-500 text-center px-1"
                                  >
                                    {img}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

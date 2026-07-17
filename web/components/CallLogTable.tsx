'use client'
import { useTransition } from 'react'
import {
  Phone,
  Mail,
  StickyNote,
  ArrowUp,
  Clock,
  CircleCheck,
  CircleHelp,
  Archive,
  Trash2,
  Car,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ImageGallery } from '@/components/ImageGallery'
import { ageBucket, type AgeBucket } from '@/lib/age'
import type { Submission, DetailsMap, SubmissionStatus } from '@/lib/types'
import { logCallAttempt, logEmailAttempt, setStatus, addNote, bump } from '@/app/actions/submissions'

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

const AGE_DOT: Record<AgeBucket, { color: string; tip: string }> = {
  fresh: { color: 'bg-emerald-500', tip: 'Received less than 30 days ago' },
  aging: { color: 'bg-amber-400', tip: 'Received 30–60 days ago' },
  stale: { color: 'bg-orange-500', tip: 'Received 60–90 days ago' },
  cold: { color: 'bg-red-600', tip: 'Received more than 90 days ago — getting old' },
}

const STATUS_ACTIONS: {
  status: SubmissionStatus
  label: string
  Icon: typeof Clock
  color: string
  confirm?: string
}[] = [
  { status: 'pending', label: 'Pending', Icon: Clock, color: 'text-amber-600' },
  { status: 'active', label: 'Active', Icon: CircleCheck, color: 'text-emerald-600' },
  { status: 'possible', label: 'Possible', Icon: CircleHelp, color: 'text-violet-600' },
  { status: 'archived', label: 'Archive', Icon: Archive, color: 'text-stone-500', confirm: 'Archive this record?' },
  { status: 'deleted', label: 'Delete', Icon: Trash2, color: 'text-red-600', confirm: 'Delete this record?' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{children}</div>
  )
}

export function CallLogTable({ submissions, details }: { submissions: Submission[]; details: DetailsMap }) {
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
      className={cn(
        'h-full overflow-auto rounded-lg border border-stone-200 bg-white shadow-sm',
        pending && 'pointer-events-none opacity-60',
      )}
    >
      <table className="w-full text-sm">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[33%]" />
          <col className="w-[11%]" />
          <col className="w-[17%]" />
          <col className="w-[8%]" />
          <col className="w-[9%]" />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="[&>th]:border-b [&>th]:border-stone-200 [&>th]:bg-stone-100 [&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-stone-500">
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
            const online = (s.added_by ?? '').toLowerCase().includes('online')
            return (
              <tr key={s.id} className="align-top hover:bg-stone-50/70">
                {/* Customer */}
                <td className="px-3 py-3">
                  <div className="flex items-start gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn('mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full', AGE_DOT[bucket].color)} />
                      </TooltipTrigger>
                      <TooltipContent>{AGE_DOT[bucket].tip}</TooltipContent>
                    </Tooltip>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-stone-900">
                          {s.first_name} {s.last_name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn(
                                'cursor-default px-1.5 py-0 text-[10px] font-medium uppercase',
                                online
                                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700',
                              )}
                            >
                              {online ? 'Online' : `Office${s.added_by ? ` · ${s.added_by}` : ''}`}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {online
                              ? 'Submitted through the website form'
                              : `Entered by shop staff${s.added_by ? ` (${s.added_by})` : ''}`}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="tnum mt-1 space-y-0.5 text-xs text-stone-600">
                        {s.phone && (
                          <a href={`tel:${s.phone}`} className="flex items-center gap-1 font-mono hover:text-stone-900">
                            <Phone className="h-3 w-3 text-stone-400" />
                            {s.phone}
                          </a>
                        )}
                        {s.alt_phone && (
                          <a href={`tel:${s.alt_phone}`} className="flex items-center gap-1 font-mono text-stone-400 hover:text-stone-900">
                            <Phone className="h-3 w-3" />
                            {s.alt_phone}
                          </a>
                        )}
                        {s.email && (
                          <a href={`mailto:${s.email}`} className="flex items-center gap-1 truncate text-stone-500 hover:text-stone-900">
                            <Mail className="h-3 w-3 shrink-0 text-stone-400" />
                            <span className="truncate">{s.email}</span>
                          </a>
                        )}
                        {s.call_schedule && (
                          <div className="flex items-center gap-1 text-stone-400">
                            <Clock className="h-3 w-3" />
                            {s.call_schedule}
                          </div>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-stone-700">
                        <Car className="h-3.5 w-3.5 text-stone-400" />
                        {[s.year, s.make, s.model].filter(Boolean).join(' ') || '—'}
                      </div>
                      <div className="tnum flex items-center gap-1 text-xs text-stone-400">
                        <MapPin className="h-3 w-3" />
                        {[s.city, s.state_country].filter(Boolean).join(', ')}
                        {s.distance_miles != null && ` · ${s.distance_miles} mi`}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-stone-300">#{s.legacy_id}</div>
                    </div>
                  </div>
                </td>

                {/* Project */}
                <td className="px-3 py-3">
                  {s.budget != null && (
                    <div className="tnum mb-2 text-xs font-medium text-stone-700">
                      Budget ${s.budget.toLocaleString()}
                      {s.project_start ? <span className="text-stone-400"> · {s.project_start}</span> : null}
                    </div>
                  )}
                  {s.project_description && (
                    <div className="mb-3">
                      <SectionLabel>Description</SectionLabel>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-600">
                        {s.project_description}
                      </p>
                    </div>
                  )}
                  {stages.length > 0 && (
                    <div className="mb-3">
                      <SectionLabel>Estimate / Tasks</SectionLabel>
                      <dl className="space-y-1 border-t border-stone-100 pt-1.5">
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
                    </div>
                  )}
                  {imgs.length > 0 && (
                    <div>
                      <SectionLabel>Photos ({imgs.length})</SectionLabel>
                      <ImageGallery images={imgs} customer={`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()} />
                    </div>
                  )}
                </td>

                {/* Attempts */}
                <td className="px-3 py-3">
                  <div className="flex flex-col items-start gap-1">
                    {[1, 2, 3].map((n) => {
                      const col = ([s.call_attempt_one, s.call_attempt_two, s.call_attempt_three] as const)[n - 1]
                      return col ? (
                        <span key={n} className="tnum flex items-center gap-1 text-xs text-stone-500">
                          <Phone className="h-3 w-3 text-emerald-500" />
                          {n} · {fmtDate(col)}
                        </span>
                      ) : (
                        <Button
                          key={n}
                          variant="ghost"
                          size="sm"
                          onClick={() => run(() => logCallAttempt(s.id, n as 1 | 2 | 3))}
                          className="h-7 justify-start gap-1.5 px-2 text-xs font-normal text-stone-500"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call {n}
                        </Button>
                      )
                    })}
                    {s.email_attempt ? (
                      <span className="tnum flex items-center gap-1 text-xs text-stone-500">
                        <Mail className="h-3 w-3 text-emerald-500" /> {fmtDate(s.email_attempt)}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => run(() => logEmailAttempt(s.id))}
                        className="h-7 justify-start gap-1.5 px-2 text-xs font-normal text-stone-500"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </Button>
                    )}
                  </div>
                </td>

                {/* Notes */}
                <td className="px-3 py-3">
                  {s.notes && (
                    <>
                      <SectionLabel>Notes</SectionLabel>
                      <p className="mb-2 whitespace-pre-wrap rounded-md bg-stone-50 p-2 text-xs leading-relaxed text-stone-600 ring-1 ring-stone-100">
                        {s.notes}
                      </p>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const note = window.prompt('Add note')
                      if (note) run(() => addNote(s.id, note))
                    }}
                    className="h-7 gap-1.5 px-2 text-xs"
                  >
                    <StickyNote className="h-3.5 w-3.5" /> Add note
                  </Button>
                </td>

                {/* Received */}
                <td className="px-3 py-3">
                  <div className="tnum text-xs text-stone-700">{s.received_date}</div>
                  <div className="text-[11px] text-stone-400">{relAge(s.received_date)}</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => run(() => bump(s.id))}
                        className="mt-1 h-7 gap-1 px-2 text-[11px] font-normal text-stone-500"
                      >
                        <ArrowUp className="h-3.5 w-3.5" /> Bump
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send to the top of the list</TooltipContent>
                  </Tooltip>
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    {STATUS_ACTIONS.filter((a) => a.status !== s.status).map((a) => (
                      <Button
                        key={a.status}
                        variant="ghost"
                        size="sm"
                        onClick={() => run(() => setStatus(s.id, a.status), a.confirm)}
                        className={cn('h-7 justify-start gap-1.5 px-2 text-xs font-normal', a.color)}
                      >
                        <a.Icon className="h-3.5 w-3.5" /> {a.label}
                      </Button>
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

'use client'
import { useState, useTransition } from 'react'
import {
  Phone,
  Mail,
  StickyNote,
  ArrowUp,
  Clock,
  CircleCheck,
  CircleHelp,
  CircleDot,
  Flag,
  Archive,
  Trash2,
  Car,
  MapPin,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ImageGallery } from '@/components/ImageGallery'
import { ageBucket, AGE_META } from '@/lib/age'
import type { Submission, DetailStage, SubmissionStatus } from '@/lib/types'
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

type StatusAction = {
  status: SubmissionStatus
  label: string
  Icon: typeof Clock
  color: string
  confirm?: { title: string; body: string; destructive?: boolean }
}

// Full pipeline transitions available from the row menu. Grouped: the "move
// along the pipeline" set, then the two removal actions (which confirm first).
const MOVE_ACTIONS: StatusAction[] = [
  { status: 'new', label: 'Back to Call Log', Icon: CircleDot, color: 'text-sky-600' },
  { status: 'pending', label: 'Pending', Icon: Clock, color: 'text-amber-600' },
  { status: 'active', label: 'Active', Icon: CircleCheck, color: 'text-emerald-600' },
  { status: 'possible', label: 'Possible', Icon: CircleHelp, color: 'text-violet-600' },
  { status: 'finished', label: 'Finished', Icon: Flag, color: 'text-stone-600' },
]
const REMOVE_ACTIONS: StatusAction[] = [
  {
    status: 'archived',
    label: 'Archive',
    Icon: Archive,
    color: 'text-stone-500',
    confirm: { title: 'Archive this record?', body: 'It moves to Archives and leaves this view. You can still find it later.' },
  },
  {
    status: 'deleted',
    label: 'Delete',
    Icon: Trash2,
    color: 'text-red-600',
    confirm: { title: 'Delete this record?', body: 'It will be removed from the active pipeline.', destructive: true },
  },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{children}</div>
  )
}

// ── Notes editor: replaces the old window.prompt with a real dialog that also
//    shows the existing thread so staff have context while adding to it.
function NotesDialog({
  name,
  existing,
  onSave,
  children,
}: {
  name: string
  existing: string | null
  onSave: (note: string) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const trimmed = text.trim()

  function save() {
    if (!trimmed) return
    onSave(trimmed)
    setText('')
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setText('')
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add note{name ? ` — ${name}` : ''}</DialogTitle>
          <DialogDescription>New notes are appended to the record; existing notes are kept.</DialogDescription>
        </DialogHeader>

        {existing && (
          <div className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-stone-50 p-2 text-xs leading-relaxed text-stone-500 ring-1 ring-stone-100">
            {existing}
          </div>
        )}

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save()
          }}
          rows={4}
          placeholder="Type a note…"
          className="w-full resize-y rounded-md border border-stone-300 bg-white p-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        />

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={!trimmed}>
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  s,
  stages,
  run,
}: {
  s: Submission
  stages: DetailStage[]
  run: (fn: () => Promise<void>) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  // Which removal action is awaiting confirmation (null = dialog closed).
  const [confirming, setConfirming] = useState<StatusAction | null>(null)

  const bucket = ageBucket(s.received_date)
  const age = AGE_META[bucket]
  const imgs = s.images ?? []
  const online = (s.added_by ?? '').toLowerCase().includes('online')
  const fullName = `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()
  const moves = MOVE_ACTIONS.filter((a) => a.status !== s.status)

  return (
    <tr className="align-top hover:bg-stone-50/70">
      {/* Customer */}
      <td className="px-3 py-3">
        <div className="flex items-start gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full', age.dot)} />
            </TooltipTrigger>
            <TooltipContent>{age.tip}</TooltipContent>
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
            <ImageGallery images={imgs} customer={fullName} />
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
        <NotesDialog name={fullName} existing={s.notes} onSave={(note) => run(() => addNote(s.id, note))}>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs">
            <StickyNote className="h-3.5 w-3.5" /> Add note
          </Button>
        </NotesDialog>
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
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Row actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Move or remove this record</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48">
            {moves.map((a) => (
              <DropdownMenuItem key={a.status} onSelect={() => run(() => setStatus(s.id, a.status))}>
                <a.Icon className={cn('h-4 w-4', a.color)} />
                {a.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {REMOVE_ACTIONS.filter((a) => a.status !== s.status).map((a) => (
              <DropdownMenuItem
                key={a.status}
                variant={a.confirm?.destructive ? 'destructive' : 'default'}
                onSelect={(e) => {
                  // Close the menu ourselves and open the confirm dialog on the
                  // next tick — avoids Radix's menu-close vs. dialog-open focus race.
                  e.preventDefault()
                  setMenuOpen(false)
                  setConfirming(a)
                }}
              >
                <a.Icon className="h-4 w-4" />
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={confirming != null} onOpenChange={(o) => !o && setConfirming(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirming?.confirm?.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {fullName ? `${fullName} — ` : ''}
                {confirming?.confirm?.body}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={confirming?.confirm?.destructive ? 'destructive' : 'default'}
                onClick={() => {
                  if (confirming) run(() => setStatus(s.id, confirming.status))
                  setConfirming(null)
                }}
              >
                {confirming?.label}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  )
}

export function CallLogTable({ submissions, details }: { submissions: Submission[]; details: Record<number, DetailStage[]> }) {
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<void>) {
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
          {submissions.map((s) => (
            <Row key={s.id} s={s} stages={details[s.id] ?? []} run={run} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'
import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Pencil,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Camera,
  Wrench,
  SlidersHorizontal,
  ArrowDown,
  Check,
} from 'lucide-react'
import type { Submission, DetailsMap, SubmissionStatus } from '@/lib/types'
import { STATUS_VIEWS } from '@/lib/types'
import type { SortKey } from '@/lib/data'
import { resolvePhotoUrl } from '@/lib/images'
import { logCallAttempt, logEmailAttempt, setStatus, addNote, bump } from '@/app/actions/submissions'
import { signOut } from '@/app/login/actions'
import { LeadCard, type LeadActionKey } from './LeadCard'
import { LeadEditDialog, type EditSection } from './LeadEditDialog'
import { PipelineNav, FwButton, FwDialog } from './primitives'

const SORT_FIELDS: { k: SortKey; label: string; phrase: string }[] = [
  { k: 'received', label: 'Received', phrase: 'Newest first' },
  { k: 'name', label: 'Customer name', phrase: 'Last name, A → Z' },
  { k: 'vehicle', label: 'Vehicle year', phrase: 'Oldest → newest' },
  { k: 'distance', label: 'Distance', phrase: 'Farthest first' },
]
const SORT_META = Object.fromEntries(SORT_FIELDS.map((f) => [f.k, f])) as Record<SortKey, (typeof SORT_FIELDS)[number]>

function buildUrl(opts: { view: string; sort?: SortKey; q?: string; p?: number }): string {
  const params = new URLSearchParams()
  params.set('view', opts.view)
  if (opts.sort && opts.sort !== 'received') params.set('sort', opts.sort)
  if (opts.q) params.set('q', opts.q)
  if (opts.p && opts.p > 1) params.set('p', String(opts.p))
  return `/calls?${params.toString()}`
}

// Windowed page list with ellipses: always show first + last, and the current
// page ±1. e.g. count=20, page=9 → [1,'gap',8,9,10,'gap',20].
function pageList(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const out: (number | 'gap')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(count - 1, page + 1)
  if (start > 2) out.push('gap')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < count - 1) out.push('gap')
  out.push(count)
  return out
}

/* ── Pager — numbered pages, first/last jumps, keyboard ← →, prefetch ── */
function Pager({
  page,
  pageCount,
  onGo,
  hrefFor,
}: {
  page: number
  pageCount: number
  onGo: (p: number) => void
  hrefFor: (p: number) => string
}) {
  const router = useRouter()
  const items = pageList(page, pageCount)

  // Prefetch every page the pager can jump to in one step, so clicking (or the
  // ← → shortcuts) resolves from cache instead of a fresh server round-trip.
  React.useEffect(() => {
    const targets = new Set<number>([page - 1, page + 1, 1, pageCount])
    for (const it of items) if (typeof it === 'number') targets.add(it)
    for (const p of targets) if (p >= 1 && p <= pageCount) router.prefetch(hrefFor(p))
  }, [page, pageCount, router, hrefFor, items])

  // Keyboard: ← / → step pages when not typing in a field.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' && page > 1) {
        e.preventDefault()
        onGo(page - 1)
      } else if (e.key === 'ArrowRight' && page < pageCount) {
        e.preventDefault()
        onGo(page + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, pageCount, onGo])

  const numBtn = (current: boolean): React.CSSProperties => ({
    minWidth: 32,
    height: 32,
    padding: '0 8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: current ? 'default' : 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 12.5,
    fontWeight: current ? 700 : 500,
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${current ? 'var(--accent)' : 'var(--border-strong)'}`,
    background: current ? 'var(--accent)' : 'var(--surface-card)',
    color: current ? 'var(--text-on-accent)' : 'var(--text-body)',
    boxShadow: current ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
  })

  return (
    <nav
      aria-label="Pagination"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, flexWrap: 'wrap' }}
    >
      <span className="tnum fw-label" style={{ letterSpacing: '.08em' }}>
        Page {page} of {pageCount}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <FwButton variant="secondary" size="sm" icon={<ChevronsLeft size={14} />} disabled={page <= 1} onClick={() => onGo(1)} aria-label="First page" />
        <FwButton variant="secondary" size="sm" icon={<ChevronLeft size={14} />} disabled={page <= 1} onClick={() => onGo(page - 1)} aria-label="Previous page" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {items.map((it, i) =>
            it === 'gap' ? (
              <span key={`gap-${i}`} className="tnum" style={{ minWidth: 18, textAlign: 'center', color: 'var(--faint)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                …
              </span>
            ) : (
              <button
                key={it}
                onClick={() => it !== page && onGo(it)}
                aria-label={`Page ${it}`}
                aria-current={it === page ? 'page' : undefined}
                style={numBtn(it === page)}
              >
                {it}
              </button>
            ),
          )}
        </div>
        <FwButton variant="secondary" size="sm" icon={<ChevronRight size={14} />} disabled={page >= pageCount} onClick={() => onGo(page + 1)} aria-label="Next page" />
        <FwButton variant="secondary" size="sm" icon={<ChevronsRight size={14} />} disabled={page >= pageCount} onClick={() => onGo(pageCount)} aria-label="Last page" />
      </div>
    </nav>
  )
}

/* ── Filters popover — pick the sort field (direction is server-defined) ── */
function FiltersPopover({
  sort,
  onPick,
  onClose,
}: {
  sort: SortKey
  onPick: (k: SortKey) => void
  onClose: () => void
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 6px)',
          zIndex: 41,
          width: 244,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-hairline)',
          borderTop: '3px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          padding: '12px 12px 10px',
        }}
      >
        <div className="fw-label" style={{ marginBottom: 9 }}>
          Sort by
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_FIELDS.map((f) => {
            const on = sort === f.k
            return (
              <button
                key={f.k}
                onClick={() => {
                  onPick(f.k)
                  onClose()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  cursor: 'pointer',
                  padding: '7px 9px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  border: `1px solid ${on ? 'var(--accent)' : 'transparent'}`,
                  background: on ? 'var(--accent-tint)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!on) e.currentTarget.style.background = 'var(--paper-sunk)'
                }}
                onMouseLeave={(e) => {
                  if (!on) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ color: on ? 'var(--accent)' : 'transparent', display: 'flex' }}>
                  <Check size={14} />
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      color: on ? 'var(--ink)' : 'var(--muted)',
                    }}
                  >
                    {f.label}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--faint)' }}>{f.phrase}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function SearchField({ value, onChange, onClear }: { value: string; onChange: (v: string) => void; onClear: () => void }) {
  const [focus, setFocus] = React.useState(false)
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'var(--surface-card)',
        border: `1px solid ${focus ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0 10px',
        height: 34,
        minWidth: 280,
        boxShadow: focus ? '0 0 0 3px var(--focus-ring)' : 'var(--shadow-inset)',
        transition: 'border-color .12s ease, box-shadow .12s ease',
      }}
    >
      <span style={{ color: 'var(--text-faint)', display: 'flex' }}>
        <Search size={14} />
      </span>
      <input
        data-search
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder="Search name, vehicle, city, email…  ( / )"
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--text-body)',
          minWidth: 0,
        }}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear"
          onClick={onClear}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 2 }}
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}

type Confirming = { title: string; message: string; danger?: boolean; label: string; onConfirm: () => void }

export function CallConsole({
  rows,
  details,
  counts,
  view,
  sort,
  search,
  page,
  pageCount,
  total,
  first,
  last,
  email,
  devMode,
}: {
  rows: Submission[]
  details: DetailsMap
  counts: Record<string, number>
  view: SubmissionStatus
  sort: SortKey
  search: string
  page: number
  pageCount: number
  total: number
  first: number
  last: number
  email: string | null
  devMode: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const nav = React.useCallback(
    (url: string) => startTransition(() => router.push(url)),
    [router],
  )

  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [night, setNight] = React.useState(false)
  const [density, setDensity] = React.useState<'comfortable' | 'compact'>('comfortable')
  const [sel, setSel] = React.useState<Set<number>>(() => new Set())
  const [noteFor, setNoteFor] = React.useState<Submission | null>(null)
  const [noteText, setNoteText] = React.useState('')
  const [photos, setPhotos] = React.useState<{ lead: Submission; idx: number } | null>(null)
  const [confirming, setConfirming] = React.useState<Confirming | null>(null)
  const [editMode, setEditMode] = React.useState(false)
  const [editing, setEditing] = React.useState<{ lead: Submission; section: EditSection } | null>(null)

  const [qInput, setQInput] = React.useState(search)
  const [prevView, setPrevView] = React.useState(view)
  if (view !== prevView) {
    setPrevView(view)
    setQInput(search)
  }
  React.useEffect(() => {
    const h = setTimeout(() => {
      const draft = qInput.trim()
      if (draft === (search ?? '')) return
      router.replace(buildUrl({ view, sort, q: draft }))
    }, 350)
    return () => clearTimeout(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  function run(fn: () => Promise<unknown>) {
    startTransition(() => void fn())
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[data-search]')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const [prevRows, setPrevRows] = React.useState(rows)
  if (rows !== prevRows) {
    setPrevRows(rows)
    setSel((prev) => {
      const ids = new Set(rows.map((l) => l.id))
      const next = new Set([...prev].filter((id) => ids.has(id)))
      return next.size === prev.size ? prev : next
    })
  }

  const tabs = STATUS_VIEWS.map((v) => ({ key: v.key, label: v.label, count: counts[v.key] ?? 0 }))
  const viewLabel = STATUS_VIEWS.find((v) => v.key === view)?.label ?? view
  const sortMeta = SORT_META[sort] ?? SORT_META.received

  function onAction(lead: Submission, k: LeadActionKey) {
    if (k === 'call1') return run(() => logCallAttempt(lead.id, 1))
    if (k === 'call2') return run(() => logCallAttempt(lead.id, 2))
    if (k === 'call3') return run(() => logCallAttempt(lead.id, 3))
    if (k === 'email') return run(() => logEmailAttempt(lead.id))
    if (k === 'bump') return run(() => bump(lead.id))
    return run(() => setStatus(lead.id, k as SubmissionStatus))
  }

  function onConfirm(lead: Submission, item: { k: LeadActionKey; label: string; message: string; danger?: boolean }) {
    const name = `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim()
    setConfirming({
      title: `${item.label} this record?`,
      message: `${name ? `${name} — ` : ''}${item.message}`,
      danger: item.danger,
      label: item.label,
      onConfirm: () => run(() => setStatus(lead.id, item.k as SubmissionStatus)),
    })
  }

  function saveNote() {
    if (noteFor && noteText.trim()) run(() => addNote(noteFor.id, noteText.trim()))
    setNoteFor(null)
    setNoteText('')
  }

  function toggleSel(id: number) {
    setSel((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function doBulk(k: SubmissionStatus | 'bump') {
    const ids = [...sel]
    run(() => Promise.all(ids.map((id) => (k === 'bump' ? bump(id) : setStatus(id, k)))))
    setSel(new Set())
  }

  function bulkAction(k: SubmissionStatus | 'bump') {
    if (k === 'deleted' || k === 'archived') {
      const label = k === 'deleted' ? 'Delete' : 'Archive'
      setConfirming({
        title: `${label} ${sel.size} record${sel.size === 1 ? '' : 's'}?`,
        message: k === 'deleted' ? 'They will be removed from the active pipeline.' : 'They move to Archives and leave this view.',
        danger: k === 'deleted',
        label,
        onConfirm: () => doBulk(k),
      })
      return
    }
    doBulk(k)
  }

  const steelToggleBorder = '1px solid rgba(255,255,255,.2)'

  return (
    <div className={`fw${night ? ' night' : ''}`} style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {devMode && (
        <div
          style={{
            background: 'color-mix(in oklch, var(--status-pending) 14%, var(--surface-card))',
            color: 'var(--status-pending)',
            fontSize: 12,
            padding: '6px 22px',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          Dev mode — running on seed data. Set Supabase env vars to connect the real database.
        </div>
      )}

      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--steel)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              FW
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: '.03em',
                textTransform: 'uppercase',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              FantomWorks
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 13,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--steel-ink)',
                opacity: 0.65,
              }}
            >
              Call Log
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {email && (
              <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--steel-ink)', opacity: 0.8 }}>
                {email}
              </span>
            )}
            <button
              onClick={() => router.push('/calls/new')}
              title="Log a phoned-in or walk-in lead"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                height: 32,
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-hover)'
                e.currentTarget.style.borderColor = 'var(--accent-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)'
                e.currentTarget.style.borderColor = 'var(--accent)'
              }}
            >
              <Plus size={15} /> New lead
            </button>
            <button
              onClick={() => setNight((n) => !n)}
              title="Night shift"
              aria-label="Toggle night shift"
              style={{
                border: steelToggleBorder,
                background: 'rgba(255,255,255,.06)',
                color: '#fff',
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {night ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <form action={signOut}>
              <button
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--steel-ink)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div style={{ padding: '0 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={
              {
                ['--text-muted' as string]: '#CDD1D6',
                ['--text-faint' as string]: '#AEB3BA',
                ['--paper-sunk' as string]: 'rgba(255,255,255,.12)',
              } as React.CSSProperties
            }
          >
            <PipelineNav active={view} onChange={(k) => nav(buildUrl({ view: k }))} tabs={tabs} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setEditMode((e) => !e)}
              title="Toggle edit mode — click any part of a lead to edit it"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: editMode ? '1px solid var(--accent)' : steelToggleBorder,
                background: editMode ? 'var(--accent)' : 'rgba(255,255,255,.06)',
                color: editMode ? '#fff' : 'var(--steel-ink)',
                cursor: 'pointer',
                height: 32,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}
            >
              <Pencil size={13} /> {editMode ? 'Editing' : 'Edit'}
            </button>
            <SearchField value={qInput} onChange={setQInput} onClear={() => setQInput('')} />
            <div style={{ display: 'flex', border: steelToggleBorder, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(
                [
                  ['comfortable', 'Comfortable'],
                  ['compact', 'Compact'],
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  onClick={() => setDensity(k)}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: '7px 11px',
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    background: density === k ? 'var(--accent)' : 'rgba(255,255,255,.06)',
                    color: density === k ? '#fff' : 'var(--steel-ink)',
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <FwButton
                variant="secondary"
                icon={<SlidersHorizontal size={14} />}
                iconRight={<ArrowDown size={12} />}
                active={filtersOpen}
                onClick={() => setFiltersOpen((o) => !o)}
              >
                {sortMeta.label}
              </FwButton>
              {filtersOpen && (
                <FiltersPopover
                  sort={sort}
                  onPick={(k) => nav(buildUrl({ view, sort: k, q: search }))}
                  onClose={() => setFiltersOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-app)', borderTop: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-xs)', padding: '11px 22px 9px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                {viewLabel}
              </span>
              <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                {total} {total === 1 ? 'lead' : 'leads'}
                {pageCount > 1 && <span style={{ color: 'var(--faint)' }}> · showing {first}–{last}</span>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>
              <span className="fw-label" style={{ marginRight: 2 }}>
                Sorted by
              </span>
              <span style={{ color: 'var(--muted)' }}>{sortMeta.label}</span>
              <span style={{ color: 'var(--accent)' }}>▼</span>
              <span style={{ color: 'var(--faint)' }}>{sortMeta.phrase}</span>
            </div>
          </div>
          {density === 'comfortable' && rows.length > 0 && (
            <div style={{ display: 'flex', paddingLeft: 4, marginTop: 9 }}>
              <div style={{ width: 4 }} />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.68fr 128px 1.95fr 0.8fr' }}>
                {['Customer', 'Photos', 'Project & Estimate', 'Activity'].map((h) => (
                  <span key={h} className="fw-label" style={{ padding: '0 16px' }}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="app-scroll" style={{ flex: 1, padding: '14px 22px 40px', width: '100%', opacity: pending ? 0.6 : 1, transition: 'opacity .12s ease' }}>
        {rows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 7 : 12 }}>
            {rows.map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                stages={details[l.id] ?? []}
                compact={density === 'compact'}
                selected={sel.has(l.id)}
                editMode={editMode}
                onEditSection={(lead, section) => setEditing({ lead, section })}
                onToggleSelect={toggleSel}
                onAction={onAction}
                onAddNote={(lead) => {
                  setNoteFor(lead)
                  setNoteText('')
                }}
                onOpenPhotos={(lead, idx) => setPhotos({ lead, idx })}
                onConfirm={onConfirm}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              padding: '70px 20px',
              background: 'var(--surface-card)',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--faint)',
              textAlign: 'center',
            }}
          >
            <Wrench size={26} />
            <p style={{ margin: '12px 0 2px', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {search ? 'No matching leads' : `Nothing in ${viewLabel} yet`}
            </p>
            <p style={{ margin: 0, fontSize: 12.5 }}>
              {search ? 'No leads match your search — clear it to see the full list.' : 'Triage a lead from the Call Log — move it here with the ⋮ actions menu.'}
            </p>
          </div>
        )}

        {pageCount > 1 && (
          <Pager
            page={page}
            pageCount={pageCount}
            onGo={(p) => nav(buildUrl({ view, sort, q: search, p }))}
            hrefFor={(p) => buildUrl({ view, sort, q: search, p })}
          />
        )}
      </main>

      {editing && (
        <LeadEditDialog
          lead={editing.lead}
          stages={details[editing.lead.id] ?? []}
          section={editing.section}
          onClose={() => setEditing(null)}
        />
      )}

      <FwDialog
        open={!!noteFor}
        onClose={() => setNoteFor(null)}
        title="Add note"
        width={460}
        footer={
          <>
            <FwButton variant="ghost" onClick={() => setNoteFor(null)}>
              Cancel
            </FwButton>
            <FwButton variant="primary" onClick={saveNote} disabled={!noteText.trim()}>
              Save note
            </FwButton>
          </>
        }
      >
        {noteFor && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, letterSpacing: '.03em', color: 'var(--ink)', marginBottom: 2 }}>
              {noteFor.first_name} {noteFor.last_name}
            </div>
            <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', marginBottom: 12 }}>
              #{noteFor.legacy_id} · {[noteFor.year, noteFor.make, noteFor.model].filter(Boolean).join(' ')}
            </div>
            {noteFor.notes && (
              <div style={{ marginBottom: 12 }}>
                <div className="fw-label" style={{ marginBottom: 5 }}>
                  Existing notes
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)', background: 'var(--paper-sunk)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap' }}>
                  {noteFor.notes}
                </p>
              </div>
            )}
            <textarea
              className="fw-ta"
              autoFocus
              placeholder="What happened on this call / email?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveNote()
              }}
            />
          </>
        )}
      </FwDialog>

      <FwDialog
        open={!!photos}
        onClose={() => setPhotos(null)}
        title={photos ? `${photos.lead.first_name} ${photos.lead.last_name} — photos` : ''}
        width={640}
      >
        {photos &&
          (() => {
            const list = photos.lead.images ?? []
            const i = photos.idx
            const name = list[i]
            const url = photos.lead.image_urls?.[i] || (name ? resolvePhotoUrl(name) : null)
            const go = (d: number) => setPhotos((p) => (p ? { ...p, idx: (p.idx + d + list.length) % list.length } : p))
            return (
              <div>
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-hairline)',
                    background: url
                      ? 'var(--paper-sunk)'
                      : `repeating-linear-gradient(45deg,var(--paper-sunk),var(--paper-sunk) 14px,var(--surface-raised) 14px,var(--surface-raised) 28px)`,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--faint)',
                    overflow: 'hidden',
                  }}
                >
                  {url ? (
                    <Image
                      src={url}
                      alt={name}
                      fill
                      sizes="640px"
                      unoptimized={/^(blob:|data:)/.test(url)}
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Camera size={30} />
                      <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
                        {name}
                      </span>
                    </div>
                  )}
                  {list.length > 1 && (
                    <>
                      <button
                        onClick={() => go(-1)}
                        aria-label="Previous photo"
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--surface-card)', boxShadow: 'var(--shadow-md)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => go(1)}
                        aria-label="Next photo"
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--surface-card)', boxShadow: 'var(--shadow-md)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>
                <div className="tnum" style={{ textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>
                  {i + 1} of {list.length}
                </div>
              </div>
            )
          })()}
      </FwDialog>

      <FwDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        title={confirming?.title}
        width={440}
        footer={
          <>
            <FwButton variant="ghost" onClick={() => setConfirming(null)}>
              Cancel
            </FwButton>
            <FwButton
              variant={confirming?.danger ? 'destructive' : 'primary'}
              onClick={() => {
                confirming?.onConfirm()
                setConfirming(null)
              }}
              style={confirming?.danger ? { border: '1px solid color-mix(in oklch, var(--age-cold) 45%, transparent)' } : undefined}
            >
              {confirming?.label}
            </FwButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>{confirming?.message}</p>
      </FwDialog>

      {sel.size > 0 && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 22,
            transform: 'translateX(-50%)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px 10px 16px',
            background: 'var(--steel)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#fff' }}>
            <span className="tnum" style={{ fontFamily: 'var(--font-mono)' }}>
              {sel.size}
            </span>{' '}
            selected
          </span>
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.2)' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                ['pending', 'Pending'],
                ['active', 'Active'],
                ['possible', 'Possible'],
                ['finished', 'Finished'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => bulkAction(k)}
                style={{ border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', padding: '6px 11px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}
              >
                {lbl}
              </button>
            ))}
            <button
              onClick={() => bulkAction('archived')}
              style={{ border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', padding: '6px 11px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}
            >
              Archive
            </button>
            <button
              onClick={() => bulkAction('deleted')}
              style={{ border: '1px solid color-mix(in oklch,var(--age-cold) 60%,transparent)', background: 'color-mix(in oklch,var(--age-cold) 22%,transparent)', color: '#fff', cursor: 'pointer', padding: '6px 11px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}
            >
              Delete
            </button>
          </div>
          <button
            onClick={() => setSel(new Set())}
            title="Clear selection"
            aria-label="Clear selection"
            style={{ border: 'none', background: 'transparent', color: 'var(--steel-ink)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

'use client'
import * as React from 'react'
import Image from 'next/image'
import {
  Phone,
  Mail,
  Clock,
  Car,
  MapPin,
  Camera,
  ArrowUp,
  StickyNote,
  MoreVertical,
  CircleCheck,
  CircleHelp,
  Archive,
  Trash2,
  Undo,
  ChevronRight,
  Pencil,
  Printer,
  X,
} from 'lucide-react'
import type { Submission, DetailStage, SentEmail, SubmissionStatus } from '@/lib/types'
import type { EditSection } from './LeadEditDialog'
import { SentEmailList } from './SentEmails'
import { NoteBody } from './NoteBody'
import { highlightParts } from '@/lib/search'
import { resolvePhotoUrl } from '@/lib/images'
import { printSubmission } from '@/lib/print-submission'
import {
  AgeSpine,
  Badge,
  ContactCue,
  FwButton,
  FwTooltip,
  ageBucket,
  fmtDate,
  relAge,
} from './primitives'

export const SHOP_RATE = 150

export type LeadActionKey =
  | 'call1'
  | 'call2'
  | 'call3'
  | 'clear1'
  | 'clear2'
  | 'clear3'
  | 'email'
  | 'bump'
  | SubmissionStatus

export function lastContact(s: Submission): string | null {
  const ds = [s.call_attempt_one, s.call_attempt_two, s.call_attempt_three, s.email_attempt]
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime())
  if (!ds.length) return null
  return new Date(Math.max(...ds)).toISOString().slice(0, 10)
}

const HighlightContext = React.createContext<string[]>([])

function Hl({ children }: { children: string | null | undefined }) {
  const tokens = React.useContext(HighlightContext)
  const text = children ?? ''
  if (!tokens.length || !text) return <>{text}</>
  const parts = highlightParts(text, tokens)
  if (parts.length === 1 && !parts[0].hit) return <>{text}</>
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="fw-hl">
            {p.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ),
      )}
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="fw-label" style={{ marginBottom: 5 }}>
      {children}
    </div>
  )
}

function Meta({
  icon,
  children,
  mono,
  faint,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  mono?: boolean
  faint?: boolean
}) {
  return (
    <div
      className={mono ? 'tnum' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        lineHeight: 1.6,
        color: faint ? 'var(--faint)' : 'var(--muted)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      }}
    >
      <span style={{ color: 'var(--faint)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      {children}
    </div>
  )
}

function AttemptRow({
  done,
  label,
  icon,
  onLog,
  onClear,
  reopen,
  editMode,
}: {
  done: string | null
  label: string
  icon: React.ReactNode
  onLog: () => void
  onClear?: () => void
  reopen?: boolean
  editMode?: boolean
}) {
  if (done) {
    const content = (
      <>
        <span style={{ color: 'var(--age-fresh)', display: 'flex' }}>{icon}</span>
        {label} · {fmtDate(done)}
      </>
    )
    const rowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 12,
      color: 'var(--ink-2)',
      fontFamily: 'var(--font-mono)',
      padding: '4px 2px',
    }
    if (editMode && onClear) {
      return (
        <button
          className="tnum"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          title={`Remove ${label.toLowerCase()}`}
          style={{ ...rowStyle, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-sunk)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {content}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--age-cold)' }}>
            <X size={11} />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Remove
            </span>
          </span>
        </button>
      )
    }

    if (!reopen) {
      return (
        <div className="tnum" style={rowStyle}>
          {content}
        </div>
      )
    }
    return (
      <button
        className="tnum"
        onClick={onLog}
        title={`${label} sent — write another`}
        style={{ ...rowStyle, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-sunk)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {content}
        <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--faint)' }} />
      </button>
    )
  }
  return (
    <FwButton variant="ghost" size="sm" icon={icon} onClick={onLog} style={{ justifyContent: 'flex-start', width: '100%', fontWeight: 500 }}>
      {label}
    </FwButton>
  )
}

function Selector({ selected, onToggle }: { selected: boolean; onToggle?: () => void }) {
  if (!onToggle) return null
  return (
    <button
      aria-label="Select lead"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      style={{
        position: 'absolute',
        top: 10,
        left: 12,
        zIndex: 5,
        width: 18,
        height: 18,
        borderRadius: 'var(--radius-xs)',
        cursor: 'pointer',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
        background: selected ? 'var(--accent)' : 'var(--surface-card)',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        padding: 0,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {selected && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  )
}

export type LeadMenuItem = {
  k: LeadActionKey
  label: string
  icon: React.ReactNode
  divider?: boolean
  danger?: boolean
  confirm?: string
}

export const LEAD_MENU: LeadMenuItem[] = [
  { k: 'pending', label: 'Move to Pending', icon: <Clock size={14} /> },
  { k: 'active', label: 'Move to Active', icon: <CircleCheck size={14} /> },
  { k: 'possible', label: 'Move to Possible', icon: <CircleHelp size={14} /> },
  { k: 'finished', label: 'Mark Finished', icon: <CircleCheck size={14} /> },
  { k: 'new', label: 'Back to Call Log', icon: <Undo size={14} />, divider: true },
  { k: 'archived', label: 'Archive', icon: <Archive size={14} />, confirm: 'It moves to Archives and leaves this view. You can still find it later.' },
  { k: 'deleted', label: 'Delete', icon: <Trash2 size={14} />, danger: true, confirm: 'It will be removed from the active pipeline.' },
]

function Kebab({
  onAction,
  onConfirm,
}: {
  onAction: (k: LeadActionKey) => void
  onConfirm: (item: { k: LeadActionKey; label: string; message: string; danger?: boolean }) => void
}) {
  const [menu, setMenu] = React.useState(false)
  const items = LEAD_MENU
  return (
    <div style={{ position: 'relative' }}>
      <FwButton
        variant="ghost"
        size="sm"
        icon={<MoreVertical size={15} />}
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation()
          setMenu((m) => !m)
        }}
        style={{ padding: '0 6px' }}
      />
      {menu && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation()
              setMenu(false)
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 30 }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 30,
              zIndex: 31,
              minWidth: 186,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 5,
              overflow: 'hidden',
            }}
          >
            {items.map((m) => (
              <div
                key={m.k}
                style={{
                  borderTop: m.divider ? '1px solid var(--border-hairline)' : 'none',
                  marginTop: m.divider ? 4 : 0,
                  paddingTop: m.divider ? 4 : 0,
                }}
              >
                <button
                  onClick={() => {
                    setMenu(false)
                    if (m.confirm) onConfirm({ k: m.k, label: m.label, message: m.confirm, danger: m.danger })
                    else onAction(m.k)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '7px 9px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12.5,
                    textAlign: 'left',
                    color: m.danger ? 'var(--age-cold)' : 'var(--ink-2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = m.danger
                      ? 'color-mix(in oklch, var(--age-cold) 10%, transparent)'
                      : 'var(--paper-sunk)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {m.icon}
                  {m.label}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PhotoTile({ src, name, onClick }: { src: string | null; name: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={name}
      style={{
        position: 'relative',
        width: '100%',
        height: 108,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-strong)',
        background: src
          ? undefined
          : `repeating-linear-gradient(45deg,var(--paper-sunk),var(--paper-sunk) 6px,var(--surface-raised) 6px,var(--surface-raised) 12px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        cursor: 'pointer',
        color: 'var(--faint)',
        padding: 0,
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="128px"
          unoptimized={/^(blob:|data:)/.test(src)}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <>
          <Camera size={18} />
          <span
            className="tnum"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--faint)', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {name}
          </span>
        </>
      )}
    </button>
  )
}

function EditZone({
  editMode,
  label,
  onClick,
  children,
  style,
}: {
  editMode: boolean
  label: string
  onClick?: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const [hover, setHover] = React.useState(false)
  if (!editMode || !onClick) return <>{children}</>
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        outline: `1.5px dashed ${hover ? 'var(--accent)' : 'transparent'}`,
        outlineOffset: 1,
        background: hover ? 'color-mix(in oklch, var(--accent) 5%, transparent)' : 'transparent',
        transition: 'outline-color .1s ease, background .1s ease',
        ...style,
      }}
    >
      <div style={{ pointerEvents: 'none' }}>{children}</div>
      {hover && (
        <span
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            zIndex: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Pencil size={10} /> {label}
        </span>
      )}
    </div>
  )
}

export function LeadCard({
  lead,
  stages,
  emails,
  compact = false,
  selected = false,
  editMode = false,
  tokens = [],
  onEditSection,
  onToggleSelect,
  onAction,
  onAddNote,
  onOpenPhotos,
  onConfirm,
}: {
  lead: Submission
  stages: DetailStage[]
  emails: SentEmail[]
  compact?: boolean
  selected?: boolean
  editMode?: boolean
  tokens?: string[]
  onEditSection?: (lead: Submission, section: EditSection) => void
  onToggleSelect?: (id: number) => void
  onAction: (lead: Submission, k: LeadActionKey) => void
  onAddNote: (lead: Submission) => void
  onOpenPhotos: (lead: Submission, idx: number) => void
  onConfirm: (lead: Submission, item: { k: LeadActionKey; label: string; message: string; danger?: boolean }) => void
}) {
  const bucket = ageBucket(lead.received_date)
  const [expanded, setExpanded] = React.useState(false)

  const online = (lead.added_by ?? '').toLowerCase().includes('online')
  const isOffice = !online
  const srcColor = online ? '#0369A1' : '#B45309'
  const cardBg = selected
    ? 'var(--accent-tint)'
    : isOffice
      ? 'color-mix(in oklch, var(--steel) 5%, var(--surface-card))'
      : 'var(--surface-card)'
  const last = lastContact(lead)
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(' ')
  const loc =
    [lead.city, lead.state_country].filter(Boolean).join(', ') +
    (lead.distance_miles != null ? ` · ${lead.distance_miles} mi` : '')

  const photos = lead.images ?? []
  const totalHours = stages.reduce((s, x) => s + (x.hours || 0), 0)
  const totalParts = stages.reduce((s, x) => s + (x.parts_cost || 0), 0)
  const estTotal = totalParts + totalHours * SHOP_RATE

  const act = (k: LeadActionKey) => onAction(lead, k)
  const confirm = (item: { k: LeadActionKey; label: string; message: string; danger?: boolean }) => onConfirm(lead, item)
  const edit = (section: EditSection) => onEditSection?.(lead, section)
  const storageLine =
    lead.storage_type
      ? `${lead.storage_type}${lead.storage_years != null ? ` · ${lead.storage_years} yr` : ''}`
      : null

  if (compact && !expanded) {
    return (
      <HighlightContext.Provider value={tokens}>
      <div
        style={{
          display: 'flex',
          background: cardBg,
          border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-hairline)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <AgeSpine bucket={bucket} />
        <Selector selected={selected} onToggle={onToggleSelect ? () => onToggleSelect(lead.id) : undefined} />
        <button
          onClick={() => setExpanded(true)}
          title="Expand"
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.3fr 1fr auto auto',
            alignItems: 'center',
            gap: 14,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            padding: '9px 14px 9px 34px',
            minWidth: 0,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              <Hl>{fullName}</Hl>
            </span>
            {online ? <Badge tone="sky">Online</Badge> : <Badge tone="amber">{lead.added_by || 'Office'}</Badge>}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', minWidth: 0 }}>
            <span style={{ color: 'var(--accent)', display: 'flex' }}>
              <Car size={14} />
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Hl>{vehicle}</Hl>
            </span>
          </span>
          <ContactCue last={last} />
          <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>
            {lead.budget != null ? `$${lead.budget.toLocaleString('en-US')}` : ''}
            <span style={{ color: 'var(--faint)', marginLeft: 8 }}>{relAge(lead.received_date)}</span>
          </span>
          <span style={{ color: 'var(--faint)', display: 'flex' }}>
            <ChevronRight size={16} />
          </span>
        </button>
        <div style={{ alignSelf: 'center', paddingRight: 8 }}>
          <Kebab onAction={act} onConfirm={confirm} />
        </div>
        <span
          aria-hidden
          title={online ? 'Self-submitted (website)' : 'Entered by office'}
          style={{ width: 5, alignSelf: 'stretch', background: srcColor }}
        />
      </div>
      </HighlightContext.Provider>
    )
  }

  return (
    <HighlightContext.Provider value={tokens}>
    <div
      style={{
        display: 'flex',
        background: cardBg,
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-hairline)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow .15s ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          e.currentTarget.style.borderColor = 'var(--border-strong)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          e.currentTarget.style.borderColor = 'var(--border-hairline)'
        }
      }}
    >
      <AgeSpine bucket={bucket} />
      <Selector selected={selected} onToggle={onToggleSelect ? () => onToggleSelect(lead.id) : undefined} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.68fr 128px 1.95fr 0.8fr', minWidth: 0 }}>
        <div style={{ padding: '13px 14px 13px 30px', borderRight: '1px solid var(--border-hairline)', minWidth: 0 }}>
          <EditZone editMode={editMode} label="Customer" onClick={() => edit('customer')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '.01em', color: 'var(--ink)', lineHeight: 1.05 }}>
                <Hl>{fullName}</Hl>
              </span>
              {online ? <Badge tone="sky">Online</Badge> : <Badge tone="amber">{lead.added_by || 'Office'}</Badge>}
            </div>
          </EditZone>
          <EditZone editMode={editMode} label="Vehicle" onClick={() => edit('vehicle')} style={{ marginTop: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
              <span style={{ color: 'var(--accent)', display: 'flex' }}>
                <Car size={16} />
              </span>
              {vehicle ? <Hl>{vehicle}</Hl> : editMode ? <span style={{ color: 'var(--faint)', fontWeight: 500 }}>Add vehicle…</span> : '—'}
            </div>
          </EditZone>
          <EditZone editMode={editMode} label="Customer" onClick={() => edit('customer')} style={{ marginTop: 3 }}>
            <div
              className="tnum"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}
            >
              <MapPin size={12} />
              <Hl>{loc}</Hl>
              <span style={{ color: 'var(--faint)', fontSize: 10 }}>#{lead.legacy_id}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 9, paddingTop: 9, borderTop: '1px dashed var(--border-hairline)' }}>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} style={{ textDecoration: 'none' }}>
                  <Meta icon={<Phone size={13} />} mono>
                    {lead.phone}
                  </Meta>
                </a>
              )}
              {lead.alt_phone && (
                <a href={`tel:${lead.alt_phone}`} style={{ textDecoration: 'none' }}>
                  <Meta icon={<Phone size={13} />} mono faint>
                    {lead.alt_phone}
                  </Meta>
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} style={{ textDecoration: 'none' }}>
                  <Meta icon={<Mail size={13} />}>
                    <Hl>{lead.email}</Hl>
                  </Meta>
                </a>
              )}
              {lead.call_schedule && (
                <Meta icon={<Clock size={13} />} faint>
                  {lead.call_schedule}
                </Meta>
              )}
              {!lead.phone && !lead.email && !lead.call_schedule && editMode && (
                <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>Add contact info…</span>
              )}
            </div>
          </EditZone>
        </div>

        <div style={{ padding: '13px 12px', borderRight: '1px solid var(--border-hairline)', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <EditZone editMode={editMode} label="Photos" onClick={() => edit('photos')}>
            <Label>Photos{photos.length ? ` (${photos.length})` : ''}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
              {photos.length > 0 ? (
                photos.slice(0, 4).map((p, i) => (
                  <PhotoTile key={i} src={lead.image_urls?.[i] || resolvePhotoUrl(p)} name={p} onClick={() => onOpenPhotos(lead, i)} />
                ))
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border-strong)',
                    display: 'grid',
                    placeItems: 'center',
                    color: editMode ? 'var(--accent)' : 'var(--faint)',
                    fontSize: 10.5,
                  }}
                >
                  {editMode ? '+ Add photos' : 'No photos'}
                </div>
              )}
            </div>
          </EditZone>
        </div>

        <div style={{ padding: '13px 16px', borderRight: '1px solid var(--border-hairline)', minWidth: 0 }}>
          <EditZone editMode={editMode} label="Vehicle" onClick={() => edit('vehicle')}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              {lead.budget != null && (
                <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                  Budget ${lead.budget.toLocaleString('en-US')}
                </span>
              )}
              {lead.project_start && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Start · {lead.project_start}</span>}
              {storageLine && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Stored · {storageLine}</span>
              )}
              {lead.budget == null && !lead.project_start && !storageLine && editMode && (
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>Add budget, start &amp; storage…</span>
              )}
            </div>
          </EditZone>
          <EditZone editMode={editMode} label="History" onClick={() => edit('history')}>
            {lead.project_description ? (
              <>
                <Label>Description</Label>
                <p style={{ margin: '0 0 6px', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)', textWrap: 'pretty' }}>
                  <Hl>{lead.project_description}</Hl>
                </p>
              </>
            ) : editMode ? (
              <div style={{ fontSize: 12, color: 'var(--faint)', padding: '2px 0 6px' }}>Add description…</div>
            ) : null}
          </EditZone>
          <EditZone editMode={editMode} label="Tasks" onClick={() => edit('tasks')}>
          {stages.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <Label>{isOffice ? 'Work Requested' : 'Estimate / Tasks'}</Label>
              <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
                {stages.map((st, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border-hairline)' }}
                  >
                    {!isOffice && (
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '.08em',
                          textTransform: 'uppercase',
                          color: 'var(--steel)',
                          width: 82,
                          flexShrink: 0,
                        }}
                      >
                        <Hl>{st.label}</Hl>
                      </span>
                    )}
                    <span style={{ flex: 1, color: 'var(--muted)', lineHeight: 1.5, textWrap: 'pretty' }}>
                      <Hl>{st.description}</Hl>
                    </span>
                    {!isOffice && (
                      <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                        {st.parts_cost ? `$${st.parts_cost.toLocaleString('en-US')}` : ''}
                        {st.hours ? ` · ${st.hours}h` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {!isOffice && (
                <div
                  className="tnum"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginTop: 8,
                    padding: '8px 10px',
                    background: 'var(--paper-sunk)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: 'var(--steel)',
                    }}
                  >
                    Est. Total
                  </span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                    <span>
                      {totalHours}h (${(totalHours * SHOP_RATE).toLocaleString('en-US')})
                    </span>
                    <span style={{ color: 'var(--faint)' }}>·</span>
                    <span>${totalParts.toLocaleString('en-US')} in parts</span>
                    <span style={{ color: 'var(--faint)' }}>≈</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                      estimated total cost ${estTotal.toLocaleString('en-US')}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ) : editMode ? (
            <div style={{ fontSize: 12, color: 'var(--faint)', padding: '2px 0' }}>Add tasks…</div>
          ) : null}
          </EditZone>
        </div>

        <div style={{ padding: '13px 12px', display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>Contact Attempts</Label>
              <div style={{ marginBottom: 7 }}>
                <ContactCue last={last} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <AttemptRow done={lead.call_attempt_one} label="Call 1" icon={<Phone size={13} />} onLog={() => act('call1')} onClear={() => act('clear1')} editMode={editMode} />
                <AttemptRow done={lead.call_attempt_two} label="Call 2" icon={<Phone size={13} />} onLog={() => act('call2')} onClear={() => act('clear2')} editMode={editMode} />
                <AttemptRow done={lead.call_attempt_three} label="Call 3" icon={<Phone size={13} />} onLog={() => act('call3')} onClear={() => act('clear3')} editMode={editMode} />
                <AttemptRow done={lead.email_attempt} label="Email" icon={<Mail size={13} />} onLog={() => act('email')} reopen />
              </div>
            </div>
            <Kebab onAction={act} onConfirm={confirm} />
          </div>

          {emails.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Label>Emails Sent</Label>
              <SentEmailList emails={emails} />
            </div>
          )}

          <EditZone editMode={editMode} label="Notes" onClick={() => edit('notes')}>
            {lead.notes ? (
              <div style={{ marginTop: 10 }}>
                <Label>Notes</Label>
                <NoteBody notes={lead.notes} />
              </div>
            ) : editMode ? (
              <div style={{ fontSize: 12, color: 'var(--faint)', padding: '2px 0 6px', marginTop: 10 }}>Add note…</div>
            ) : null}
          </EditZone>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <FwButton variant="secondary" size="sm" icon={<StickyNote size={13} />} onClick={() => onAddNote(lead)}>
                Note
              </FwButton>
              <FwTooltip label="Send to top of the list">
                <FwButton variant="ghost" size="sm" icon={<ArrowUp size={13} />} onClick={() => act('bump')}>
                  Bump
                </FwButton>
              </FwTooltip>
              <FwTooltip label="Print a PDF of what the customer submitted">
                <FwButton
                  variant="ghost"
                  size="sm"
                  icon={<Printer size={13} />}
                  onClick={() => printSubmission(lead, stages)}
                >
                  Print
                </FwButton>
              </FwTooltip>
            </div>
            <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', lineHeight: 1.35 }}>
              Received {fmtDate(lead.received_date)} · {relAge(lead.received_date)}
              {lead.status === 'archived' && lead.status_changed_at && (
                <>
                  <br />
                  Archived {fmtDate(lead.status_changed_at)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <span
        aria-hidden
        title={online ? 'Self-submitted (website)' : 'Entered by office'}
        style={{ width: 5, alignSelf: 'stretch', background: srcColor }}
      />
    </div>
    </HighlightContext.Provider>
  )
}

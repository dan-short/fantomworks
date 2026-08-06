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
  ChevronRight,
  ChevronDown,
  Pencil,
  Printer,
  X,
} from 'lucide-react'
import type { Submission, DetailStage } from '@/lib/types'
import type { EditSection } from './LeadEditDialog'
import { resolvePhotoUrl } from '@/lib/images'
import { printSubmission } from '@/lib/print-submission'
import { LEAD_MENU, SHOP_RATE, lastContact, type LeadActionKey } from './LeadCard'
import { AgeSpine, Badge, ContactCue, FwButton, ageBucket, fmtDate, relAge } from './primitives'

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

export function MobileLeadRow({ lead, onOpen }: { lead: Submission; onOpen: (lead: Submission) => void }) {
  const bucket = ageBucket(lead.received_date)
  const online = (lead.added_by ?? '').toLowerCase().includes('online')
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(' ')
  const last = lastContact(lead)
  const never = !last
  const lastDays = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000) : null
  const cueColor = never ? 'var(--age-cold)' : lastDays != null && lastDays >= 14 ? 'var(--age-stale)' : 'var(--age-fresh)'
  return (
    <button
      onClick={() => onOpen(lead)}
      style={{
        display: 'flex',
        width: '100%',
        minHeight: 56,
        textAlign: 'left',
        border: '1px solid var(--border-hairline)',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xs)',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <AgeSpine bucket={bucket} />
      <span style={{ flex: 1, minWidth: 0, padding: '9px 2px 9px 11px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: '.01em',
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {lead.first_name} {lead.last_name}
          </span>
          {lead.budget != null && (
            <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              {fmtMoney(lead.budget)}
            </span>
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: cueColor, flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--ink-2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {vehicle || '—'}
            {lead.distance_miles != null && (
              <span style={{ fontWeight: 400, color: 'var(--muted)' }}> · {lead.distance_miles} mi</span>
            )}
            {!online && <span style={{ fontWeight: 400, color: '#B45309' }}> · Office</span>}
          </span>
          <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
            {relAge(lead.received_date)}
          </span>
        </span>
      </span>
      <span style={{ alignSelf: 'center', color: 'var(--faint)', display: 'flex', padding: '0 8px 0 2px' }}>
        <ChevronRight size={17} />
      </span>
    </button>
  )
}

function SheetSection({
  label,
  onEdit,
  children,
  first,
}: {
  label: string
  onEdit?: () => void
  children: React.ReactNode
  first?: boolean
}) {
  return (
    <div style={{ paddingTop: first ? 0 : 14, marginTop: first ? 0 : 14, borderTop: first ? 'none' : '1px solid var(--border-hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
        <span className="fw-label">{label}</span>
        {onEdit && (
          <button
            onClick={onEdit}
            aria-label={`Edit ${label.toLowerCase()}`}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 30,
              height: 30,
              margin: '-6px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--faint)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function AttemptPill({ done, label, icon, onLog }: { done: string | null; label: string; icon: React.ReactNode; onLog: () => void }) {
  return (
    <button
      onClick={done ? undefined : onLog}
      disabled={!!done}
      className="tnum"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        padding: '0 12px',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        cursor: done ? 'default' : 'pointer',
        border: done ? '1px solid color-mix(in oklch, var(--age-fresh) 40%, transparent)' : '1px dashed var(--border-strong)',
        background: done ? 'color-mix(in oklch, var(--age-fresh) 10%, transparent)' : 'var(--surface-card)',
        color: done ? 'var(--age-fresh)' : 'var(--muted)',
      }}
    >
      {icon}
      {label}
      {done ? ` · ${fmtDate(done)}` : ''}
    </button>
  )
}

function ContactRow({ href, icon, primary, secondary }: { href: string; icon: React.ReactNode; primary: string; secondary: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textDecoration: 'none',
        padding: '9px 2px',
        borderBottom: '1px dashed var(--border-hairline)',
        minHeight: 48,
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: 'color-mix(in oklch, var(--accent) 10%, transparent)',
          color: 'var(--accent)',
        }}
      >
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          className="tnum"
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 13.5,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {primary}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--faint)' }}>{secondary}</span>
      </span>
    </a>
  )
}

export function MobileLeadSheet({
  lead,
  stages,
  onClose,
  onAction,
  onAddNote,
  onOpenPhotos,
  onConfirm,
  onEditSection,
}: {
  lead: Submission
  stages: DetailStage[]
  onClose: () => void
  onAction: (k: LeadActionKey) => void
  onAddNote: () => void
  onOpenPhotos: (idx: number) => void
  onConfirm: (item: { k: LeadActionKey; label: string; message: string; danger?: boolean }) => void
  onEditSection: (section: EditSection) => void
}) {
  const [moveOpen, setMoveOpen] = React.useState(false)

  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const online = (lead.added_by ?? '').toLowerCase().includes('online')
  const isOffice = !online
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(' ')
  const loc = [lead.city, lead.state_country].filter(Boolean).join(', ')
  const last = lastContact(lead)
  const photos = lead.images ?? []
  const totalHours = stages.reduce((s, x) => s + (x.hours || 0), 0)
  const totalParts = stages.reduce((s, x) => s + (x.parts_cost || 0), 0)
  const estTotal = totalParts + totalHours * SHOP_RATE
  const storageLine = lead.storage_type
    ? `${lead.storage_type}${lead.storage_years != null ? ` · ${lead.storage_years} yr` : ''}`
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,25,28,.55)', backdropFilter: 'blur(2px)' }} />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 'max(24px, env(safe-area-inset-top))',
          background: 'var(--bg-app)',
          borderRadius: '16px 16px 0 0',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border-hairline)', padding: '8px 16px 12px', flexShrink: 0 }}>
          <div aria-hidden style={{ width: 38, height: 4, borderRadius: 'var(--radius-full)', background: 'var(--border-strong)', margin: '0 auto 8px' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '.01em', color: 'var(--ink)', lineHeight: 1.1 }}>
                  {lead.first_name} {lead.last_name}
                </span>
                {online ? <Badge tone="sky">Online</Badge> : <Badge tone="amber">{lead.added_by || 'Office'}</Badge>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', marginTop: 5 }}>
                <span style={{ color: 'var(--accent)', display: 'flex' }}>
                  <Car size={16} />
                </span>
                {vehicle || '—'}
              </div>
              <div
                className="tnum"
                style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 5 }}
              >
                {lead.budget != null && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Budget {fmtMoney(lead.budget)}</span>
                )}
                {loc && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} />
                    {loc}
                    {lead.distance_miles != null ? ` · ${lead.distance_miles} mi` : ''}
                  </span>
                )}
                <span style={{ color: 'var(--faint)' }}>#{lead.legacy_id}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 40,
                height: 40,
                margin: '-4px -8px 0 0',
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                color: 'var(--faint)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="app-scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 16px 20px' }}>
          {(lead.project_description || lead.project_start || storageLine) && (
            <SheetSection first label="Project" onEdit={() => onEditSection('history')}>
              {lead.project_description && (
                <p style={{ margin: '0 0 8px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', textWrap: 'pretty' }}>{lead.project_description}</p>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--muted)' }}>
                {lead.project_start && <span>Start · {lead.project_start}</span>}
                {storageLine && <span>Stored · {storageLine}</span>}
              </div>
            </SheetSection>
          )}

          {stages.length > 0 && (
            <SheetSection first={!lead.project_description && !lead.project_start && !storageLine} label={isOffice ? 'Work Requested' : 'Estimate / Tasks'} onEdit={() => onEditSection('tasks')}>
              <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
                {stages.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12.5, padding: '7px 0', borderBottom: '1px solid var(--border-hairline)' }}>
                    {!isOffice && (
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '.08em',
                          textTransform: 'uppercase',
                          color: 'var(--steel)',
                          width: 74,
                          flexShrink: 0,
                        }}
                      >
                        {st.label}
                      </span>
                    )}
                    <span style={{ flex: 1, color: 'var(--muted)', lineHeight: 1.5, textWrap: 'pretty' }}>{st.description}</span>
                    {!isOffice && (st.parts_cost || st.hours) ? (
                      <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                        {st.parts_cost ? fmtMoney(st.parts_cost) : ''}
                        {st.hours ? ` · ${st.hours}h` : ''}
                      </span>
                    ) : null}
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
                    marginTop: 9,
                    padding: '9px 11px',
                    background: 'var(--paper-sunk)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
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
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                    {totalHours}h + {fmtMoney(totalParts)} parts ≈ {fmtMoney(estTotal)}
                  </span>
                </div>
              )}
            </SheetSection>
          )}

          <SheetSection label="Contact" onEdit={() => onEditSection('customer')}>
            <div style={{ marginBottom: 8 }}>
              <ContactCue last={last} />
            </div>
            {lead.phone && <ContactRow href={`tel:${lead.phone}`} icon={<Phone size={16} />} primary={lead.phone} secondary="Tap to call" />}
            {lead.alt_phone && <ContactRow href={`tel:${lead.alt_phone}`} icon={<Phone size={16} />} primary={lead.alt_phone} secondary="Alternate · tap to call" />}
            {lead.email && <ContactRow href={`mailto:${lead.email}`} icon={<Mail size={16} />} primary={lead.email} secondary="Tap to email" />}
            {lead.call_schedule && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', padding: '8px 2px 0' }}>
                <Clock size={13} />
                {lead.call_schedule}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 11 }}>
              <AttemptPill done={lead.call_attempt_one} label="Call 1" icon={<Phone size={12} />} onLog={() => onAction('call1')} />
              <AttemptPill done={lead.call_attempt_two} label="Call 2" icon={<Phone size={12} />} onLog={() => onAction('call2')} />
              <AttemptPill done={lead.call_attempt_three} label="Call 3" icon={<Phone size={12} />} onLog={() => onAction('call3')} />
              <AttemptPill done={lead.email_attempt} label="Email" icon={<Mail size={12} />} onLog={() => onAction('email')} />
            </div>
          </SheetSection>

          <SheetSection label={`Photos${photos.length ? ` (${photos.length})` : ''}`} onEdit={() => onEditSection('photos')}>
            {photos.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                {photos.map((p, i) => {
                  const src = lead.image_urls?.[i] || resolvePhotoUrl(p)
                  return (
                    <button
                      key={i}
                      onClick={() => onOpenPhotos(i)}
                      style={{
                        position: 'relative',
                        width: 92,
                        height: 68,
                        flexShrink: 0,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        background: src
                          ? undefined
                          : `repeating-linear-gradient(45deg,var(--paper-sunk),var(--paper-sunk) 6px,var(--surface-raised) 6px,var(--surface-raised) 12px)`,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--faint)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        padding: 0,
                      }}
                    >
                      {src ? (
                        <Image src={src} alt={p} fill sizes="92px" unoptimized={/^(blob:|data:)/.test(src)} style={{ objectFit: 'cover' }} />
                      ) : (
                        <Camera size={16} />
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>No photos</div>
            )}
          </SheetSection>

          {lead.notes && (
            <SheetSection label="Notes">
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: 'var(--ink-2)',
                  background: 'var(--paper-sunk)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '2px solid var(--steel)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {lead.notes}
              </p>
            </SheetSection>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
            <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>
              Received {fmtDate(lead.received_date)} · {relAge(lead.received_date)}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <FwButton variant="ghost" size="md" icon={<ArrowUp size={13} />} onClick={() => onAction('bump')}>
                Bump
              </FwButton>
              <FwButton variant="ghost" size="md" icon={<Printer size={13} />} onClick={() => printSubmission(lead, stages)}>
                Print
              </FwButton>
            </div>
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            gap: 8,
            padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
            background: 'var(--surface-card)',
            borderTop: '1px solid var(--border-hairline)',
            position: 'relative',
          }}
        >
          <FwButton variant="secondary" size="lg" icon={<StickyNote size={15} />} onClick={onAddNote} style={{ height: 48 }}>
            Note
          </FwButton>
          <FwButton
            variant="secondary"
            size="lg"
            iconRight={<ChevronDown size={14} />}
            active={moveOpen}
            onClick={() => setMoveOpen((o) => !o)}
            style={{ height: 48 }}
          >
            Move
          </FwButton>
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 48,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Phone size={16} /> Call
            </a>
          ) : (
            <span
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 48,
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-strong)',
                color: 'var(--faint)',
                fontSize: 12.5,
              }}
            >
              No phone on file
            </span>
          )}

          {moveOpen && (
            <>
              <div onClick={() => setMoveOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 91 }} />
              <div
                style={{
                  position: 'absolute',
                  left: 14,
                  right: 14,
                  bottom: 'calc(58px + env(safe-area-inset-bottom))',
                  zIndex: 92,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 6,
                }}
              >
                {LEAD_MENU.map((m) => (
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
                        setMoveOpen(false)
                        if (m.confirm) onConfirm({ k: m.k, label: m.label, message: m.confirm, danger: m.danger })
                        else onAction(m.k)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        minHeight: 44,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '0 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 13.5,
                        textAlign: 'left',
                        color: m.danger ? 'var(--age-cold)' : 'var(--ink-2)',
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
      </div>
    </div>
  )
}

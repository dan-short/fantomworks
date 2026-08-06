'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  Send,
  Mail,
  Car,
  Phone,
  MapPin,
  AlertTriangle,
  CircleCheck,
  RotateCcw,
  Check,
} from 'lucide-react'
import type { DetailStage, Submission } from '@/lib/types'
import { STATUS_VIEWS } from '@/lib/types'
import { TEMPLATE_GROUPS, TOKENS, applyTemplate, tokensFor, type EmailTemplate } from '@/lib/email/templates'
import { composeSections, isSendable, type EmailParts } from '@/lib/email/compose'
import { fillEstimate } from '@/lib/email/estimate'
import type { SentEmail } from '@/lib/email/history'
import { sendLeadEmail } from '@/app/actions/email'
import { SHOP_RATE } from './LeadCard'
import { FwButton, FwDialog, Spinner, Badge, fmtDate } from './primitives'

type FieldKey = 'header' | 'body' | 'footer'

const FIELDS: { key: FieldKey; label: string; hint: string; rows: number }[] = [
  { key: 'header', label: 'Header', hint: 'Greeting and the opening line — who they are and what this is about.', rows: 4 },
  { key: 'body', label: 'Body', hint: 'The substance. Blank paragraphs stay blank; a blank line starts a new paragraph.', rows: 12 },
  { key: 'footer', label: 'Footer', hint: 'The close and the signature.', rows: 6 },
]

function SectionCard({
  title,
  aside,
  children,
}: {
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--surface-raised)',
        }}
      >
        <span className="fw-label">{title}</span>
        {aside}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </section>
  )
}

function LeadStrip({ lead }: { lead: Submission }) {
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(' ')
  const loc = [lead.city, lead.state_country].filter(Boolean).join(', ')
  const online = (lead.added_by ?? '').toLowerCase().includes('online')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
          {lead.first_name} {lead.last_name}
        </span>
        {online ? <Badge tone="sky">Online</Badge> : <Badge tone="amber">{lead.added_by || 'Office'}</Badge>}
      </span>
      {vehicle && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-2)' }}>
          <Car size={13} style={{ color: 'var(--accent)' }} />
          {vehicle}
        </span>
      )}
      {lead.phone && (
        <span className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          <Phone size={12} />
          {lead.phone}
        </span>
      )}
      {loc && (
        <span className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          <MapPin size={12} />
          {loc}
        </span>
      )}
      {lead.email_attempt && (
        <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--age-stale)' }}>
          Already emailed {fmtDate(lead.email_attempt)}
        </span>
      )}
    </div>
  )
}

function Preview({ to, from, parts }: { to: string; from: string; parts: EmailParts }) {
  const { header, body, footer } = composeSections(parts)
  const all = [
    ...header.map((p) => ({ p, zone: 'header' as const })),
    ...body.map((p) => ({ p, zone: 'body' as const })),
    ...footer.map((p) => ({ p, zone: 'footer' as const })),
  ]
  return (
    <div>
      <div
        className="tnum"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr)',
          gap: '3px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: 'var(--muted)',
          paddingBottom: 12,
          marginBottom: 14,
          borderBottom: '1px dashed var(--border-strong)',
        }}
      >
        <span style={{ color: 'var(--faint)' }}>To</span>
        <span style={{ color: 'var(--ink-2)', overflowWrap: 'anywhere' }}>{to || '—'}</span>
        <span style={{ color: 'var(--faint)' }}>From</span>
        <span style={{ overflowWrap: 'anywhere' }}>{from}</span>
        <span style={{ color: 'var(--faint)' }}>Subject</span>
        <span style={{ color: 'var(--ink)', fontWeight: 500, overflowWrap: 'anywhere' }}>
          {parts.subject.trim() || <em style={{ color: 'var(--faint)' }}>No subject</em>}
        </span>
      </div>

      {all.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--faint)', fontStyle: 'italic' }}>
          Nothing to preview yet — pick a template or start writing.
        </p>
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)' }}>
          {all.map(({ p, zone }, i) => (
            <p
              key={i}
              style={{
                margin: '0 0 15px',
                whiteSpace: 'pre-wrap',
                textWrap: 'pretty',
                paddingLeft: 10,
                borderLeft: `2px solid ${
                  zone === 'body' ? 'transparent' : 'color-mix(in oklch, var(--steel) 22%, transparent)'
                }`,
              }}
            >
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function SentHistory({ history }: { history: SentEmail[] }) {
  const [openId, setOpenId] = React.useState<number | null>(null)
  return (
    <SectionCard
      title={`Already sent (${history.length})`}
      aside={
        <span style={{ fontSize: 11, color: 'var(--faint)' }}>newest first</span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {history.map((h) => {
          const open = openId === h.id
          return (
            <div key={h.id} style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenId(open ? null : h.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  background: open ? 'var(--paper-sunk)' : 'transparent',
                  padding: '8px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', overflowWrap: 'anywhere' }}>{h.subject}</span>
                  {h.sendError && <Badge tone="red">Failed</Badge>}
                </div>
                <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)', marginTop: 3 }}>
                  {h.sentAt ? fmtDate(h.sentAt) : 'not sent'}
                  {h.templateLabel ? ` \u00b7 ${h.templateLabel}` : ''}
                  {h.sentBy ? ` \u00b7 ${h.sentBy}` : ''}
                </div>
              </button>
              {open && (
                <pre
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    borderTop: '1px solid var(--border-hairline)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'var(--ink-2)',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {h.sendError ? `Send failed: ${h.sendError}\n\n${h.bodyText}` : h.bodyText}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function EmailComposer({
  lead,
  stages,
  templates,
  history,
  fromLabel,
  devMode,
}: {
  lead: Submission
  stages: DetailStage[]
  templates: EmailTemplate[]
  history: SentEmail[]
  fromLabel: string
  devMode: boolean
}) {
  const router = useRouter()
  const tokens = React.useMemo(() => tokensFor(lead), [lead])

  const first = templates[0]
  const [templateId, setTemplateId] = React.useState(first?.id ?? '')
  const template = templates.find((t) => t.id === templateId) ?? first

  const fill = React.useCallback(
    (t: EmailTemplate): EmailParts => {
      const applied = applyTemplate(t, tokens)
      return { ...applied, body: fillEstimate(applied.body, stages, SHOP_RATE) }
    },
    [tokens, stages],
  )

  const initial = React.useMemo(
    () => (first ? fill(first) : { subject: '', header: '', body: '', footer: '' }),
    [first, fill],
  )
  const [parts, setParts] = React.useState<EmailParts>(initial)
  const [pristine, setPristine] = React.useState<EmailParts>(initial)
  const [to, setTo] = React.useState(lead.email ?? '')

  const [pane, setPane] = React.useState<'write' | 'preview'>('write')
  const [confirmSwitch, setConfirmSwitch] = React.useState<string | null>(null)
  const [confirmSend, setConfirmSend] = React.useState(false)
  const [applyStatus, setApplyStatus] = React.useState<boolean>(Boolean(first?.suggestedStatus))
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const refs = {
    header: React.useRef<HTMLTextAreaElement>(null),
    body: React.useRef<HTMLTextAreaElement>(null),
    footer: React.useRef<HTMLTextAreaElement>(null),
  }
  const [focused, setFocused] = React.useState<FieldKey>('body')

  const dirty =
    parts.subject !== pristine.subject ||
    parts.header !== pristine.header ||
    parts.body !== pristine.body ||
    parts.footer !== pristine.footer

  function loadTemplate(id: string) {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    const next = fill(t)
    setTemplateId(id)
    setParts(next)
    setPristine(next)
    setApplyStatus(Boolean(t.suggestedStatus))
    setError(null)
  }

  function pickTemplate(id: string) {
    if (id === templateId) return
    if (dirty) setConfirmSwitch(id)
    else loadTemplate(id)
  }

  function set(key: keyof EmailParts, value: string) {
    setParts((p) => ({ ...p, [key]: value }))
  }

  function insertToken(token: string) {
    const el = refs[focused].current
    const snippet = `{{${token}}}`
    if (!el) {
      set(focused, `${parts[focused]}${snippet}`)
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const next = `${el.value.slice(0, start)}${snippet}${el.value.slice(end)}`
    set(focused, next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + snippet.length, start + snippet.length)
    })
  }

  async function doSend() {
    setConfirmSend(false)
    setSending(true)
    setError(null)
    const res = await sendLeadEmail({
      submissionId: lead.id,
      to,
      templateSlug: template?.id ?? '',
      templateLabel: template?.label ?? 'Custom',
      applyStatus: applyStatus ? (template?.suggestedStatus ?? null) : null,
      ...parts,
    })
    setSending(false)
    if (res.ok) setSent(true)
    else setError(res.error)
  }

  const ready = isSendable(parts) && Boolean(to.trim())

  if (sent) {
    return (
      <div className="fw" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div
          style={{
            maxWidth: 420,
            textAlign: 'center',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-hairline)',
            borderTop: '3px solid var(--age-fresh)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: '30px 26px',
          }}
        >
          <CircleCheck size={34} style={{ color: 'var(--age-fresh)' }} />
          <h1
            style={{
              margin: '14px 0 6px',
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}
          >
            Email sent
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 13, lineHeight: 1.55, color: 'var(--muted)' }}>
            Sent to {to}. The full email is saved to this lead’s history and the email attempt is stamped.
          </p>
          <FwButton variant="primary" onClick={() => router.push('/calls')}>
            Back to Call Log
          </FwButton>
        </div>
      </div>
    )
  }

  return (
    <div className="fw" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
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
          Dev mode — sending is disabled until RESEND_API_KEY and the Supabase env vars are set.
        </div>
      )}

      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--steel)', boxShadow: 'var(--shadow-md)' }}>
        <div className="fw-mail-header">
          <button
            onClick={() => router.push('/calls')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(255,255,255,.06)',
              color: '#fff',
              cursor: 'pointer',
              height: 32,
              padding: '0 11px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-display)',
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={14} /> Call Log
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <Image
              src="/logo.png"
              alt=""
              width={26}
              height={26}
              style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Compose Email
            </span>
          </div>

          <div className="fw-mail-tabs" style={{ display: 'flex', border: '1px solid rgba(255,255,255,.2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
            {(
              [
                ['write', 'Write'],
                ['preview', 'Preview'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setPane(k)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '7px 12px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  background: pane === k ? 'var(--accent)' : 'rgba(255,255,255,.06)',
                  color: pane === k ? '#fff' : 'var(--steel-ink)',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <FwButton
            variant="primary"
            icon={sending ? <Spinner size={13} color="#fff" /> : <Send size={14} />}
            disabled={!ready || sending}
            onClick={() => setConfirmSend(true)}
            style={{ flexShrink: 0 }}
          >
            {sending ? 'Sending' : 'Send'}
          </FwButton>
        </div>
        <div
          className="fw-mail-substrip"
          style={{ background: 'var(--bg-app)', borderTop: '1px solid var(--border-hairline)' }}
        >
          <LeadStrip lead={lead} />
        </div>
      </header>

      <main className="fw-mail-grid" data-pane={pane} style={{ flex: 1 }}>
        <div className="fw-mail-pane-write" style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid color-mix(in oklch, var(--age-cold) 35%, transparent)',
                background: 'color-mix(in oklch, var(--age-cold) 8%, var(--surface-card))',
                color: 'var(--age-cold)',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <SectionCard
            title="Template"
            aside={
              dirty ? (
                <FwButton variant="ghost" size="sm" icon={<RotateCcw size={12} />} onClick={() => loadTemplate(templateId)}>
                  Reset
                </FwButton>
              ) : null
            }
          >
            <select
              className="fw-field"
              value={templateId}
              onChange={(e) => pickTemplate(e.target.value)}
              aria-label="Email template"
            >
              {TEMPLATE_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {templates.filter((t) => t.group === g).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p style={{ margin: '9px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
              {template?.blurb}
              {dirty && <span style={{ color: 'var(--age-stale)' }}> · edited</span>}
            </p>
          </SectionCard>

          <SectionCard title="Recipient">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="fw-label" style={{ display: 'block', marginBottom: 6 }}>
                  To
                </label>
                <input
                  className="fw-field"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="customer@example.com"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                />
                {!lead.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--age-stale)' }}>
                    <AlertTriangle size={12} />
                    No email on file for this lead — enter one to send.
                  </div>
                )}
              </div>
              <div>
                <label className="fw-label" style={{ display: 'block', marginBottom: 6 }}>
                  Subject
                </label>
                <input
                  className="fw-field"
                  value={parts.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  placeholder="Subject line"
                />
              </div>
            </div>
          </SectionCard>

          {FIELDS.map((f) => (
            <SectionCard
              key={f.key}
              title={f.label}
              aside={
                <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)' }}>
                  {parts[f.key].trim() ? `${parts[f.key].trim().split(/\s+/).length} words` : 'empty'}
                </span>
              }
            >
              <textarea
                ref={refs[f.key]}
                className="fw-field"
                rows={f.rows}
                value={parts[f.key]}
                onFocus={() => setFocused(f.key)}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.hint}
                style={{ minHeight: f.rows * 22, lineHeight: 1.6, fontSize: 13.5 }}
              />
              <p style={{ margin: '7px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--faint)' }}>{f.hint}</p>
            </SectionCard>
          ))}

          {history.length > 0 && <SentHistory history={history} />}

          <SectionCard title={`Insert into ${focused}`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TOKENS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => insertToken(t.key)}
                  title={`${t.label} — ${tokens[t.key] || '(blank)'}`}
                  style={{
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-raised)',
                    color: 'var(--ink-2)',
                    cursor: 'pointer',
                    padding: '5px 9px',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                >
                  {`{{${t.key}}}`}
                </button>
              ))}
            </div>
            <p style={{ margin: '9px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--faint)' }}>
              Tokens are filled in from the lead record when a template loads. Anything you type by hand stays literal
              until you reload a template.
            </p>
          </SectionCard>
        </div>

        <div className="fw-mail-pane-preview fw-mail-preview" style={{ minWidth: 0 }}>
          <SectionCard
            title="Preview"
            aside={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--faint)' }}>
                <Mail size={12} /> what the customer receives
              </span>
            }
          >
            <Preview to={to} from={fromLabel} parts={parts} />
          </SectionCard>
        </div>
      </main>

      <FwDialog
        open={confirmSwitch !== null}
        onClose={() => setConfirmSwitch(null)}
        title="Replace your edits?"
        width={420}
        footer={
          <>
            <FwButton variant="ghost" onClick={() => setConfirmSwitch(null)}>
              Keep editing
            </FwButton>
            <FwButton
              variant="primary"
              onClick={() => {
                if (confirmSwitch) loadTemplate(confirmSwitch)
                setConfirmSwitch(null)
              }}
            >
              Load template
            </FwButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
          You have changes in this draft. Loading{' '}
          <strong>{templates.find((t) => t.id === confirmSwitch)?.label}</strong> overwrites the subject, header, body,
          and footer.
        </p>
      </FwDialog>

      <FwDialog
        open={confirmSend}
        onClose={() => setConfirmSend(false)}
        title="Send this email?"
        width={460}
        footer={
          <>
            <FwButton variant="ghost" onClick={() => setConfirmSend(false)}>
              Cancel
            </FwButton>
            <FwButton variant="primary" icon={<Send size={13} />} onClick={doSend}>
              Send it
            </FwButton>
          </>
        }
      >
        <div
          className="tnum"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1fr)',
            gap: '5px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-2)',
          }}
        >
          <span style={{ color: 'var(--faint)' }}>From</span>
          <span style={{ overflowWrap: 'anywhere' }}>{fromLabel}</span>
          <span style={{ color: 'var(--faint)' }}>To</span>
          <span style={{ overflowWrap: 'anywhere' }}>{to}</span>
          <span style={{ color: 'var(--faint)' }}>Subject</span>
          <span style={{ overflowWrap: 'anywhere' }}>{parts.subject}</span>
          <span style={{ color: 'var(--faint)' }}>Template</span>
          <span>{template?.label ?? 'Custom'}</span>
        </div>

        {template?.suggestedStatus && (
          <button
            type="button"
            onClick={() => setApplyStatus((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${applyStatus ? 'var(--accent)' : 'var(--border-strong)'}`,
              background: applyStatus ? 'var(--accent-tint)' : 'var(--surface-card)',
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                flexShrink: 0,
                borderRadius: 'var(--radius-xs)',
                display: 'grid',
                placeItems: 'center',
                border: `1.5px solid ${applyStatus ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: applyStatus ? 'var(--accent)' : 'transparent',
                color: '#fff',
              }}
            >
              {applyStatus && <Check size={12} strokeWidth={3.5} />}
            </span>
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>
              Also move this lead to{' '}
              <strong>
                {STATUS_VIEWS.find((v) => v.key === template.suggestedStatus)?.label ?? template.suggestedStatus}
              </strong>
            </span>
          </button>
        )}

        <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)' }}>
          This goes out immediately and cannot be recalled. The full email is saved to this lead&apos;s history and the
          email attempt is stamped.
        </p>
      </FwDialog>
    </div>
  )
}

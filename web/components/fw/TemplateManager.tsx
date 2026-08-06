'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Plus, Save, Trash2, RotateCcw, AlertTriangle, CircleCheck } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types'
import { STATUS_VIEWS } from '@/lib/types'
import { DEFAULT_TEMPLATES, TEMPLATE_GROUPS, type EmailTemplate, type TemplateGroup } from '@/lib/email/templates'
import { saveTemplate, archiveTemplate, resetTemplate } from '@/app/actions/templates'
import { FwButton, FwDialog, Spinner, Badge } from './primitives'

const BLANK: EmailTemplate = {
  id: '',
  label: '',
  blurb: '',
  group: 'Move forward',
  subject: 'FantomWorks — your {{vehicle}}',
  header: '{{first}},',
  body: '',
  footer: 'Sincerely,\nDan Short\nFantomWorks\n{{shop_phone}}',
  suggestedStatus: null,
}

const GROUP_TONE: Record<TemplateGroup, string> = {
  'Move forward': 'green',
  'Gather info': 'sky',
  'Slow down': 'amber',
  Decline: 'stone',
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label className="fw-label" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: '6px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--faint)' }}>{hint}</p>}
    </div>
  )
}

export function TemplateManager({ templates, devMode }: { templates: EmailTemplate[]; devMode: boolean }) {
  const router = useRouter()
  const [list, setList] = React.useState(templates)
  const [selected, setSelected] = React.useState(templates[0]?.id ?? '')
  const [draft, setDraft] = React.useState<EmailTemplate>(templates[0] ?? BLANK)
  const [creating, setCreating] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const [confirmArchive, setConfirmArchive] = React.useState(false)
  const [pane, setPane] = React.useState<'list' | 'edit'>('list')

  const [prev, setPrev] = React.useState(templates)
  if (templates !== prev) {
    setPrev(templates)
    setList(templates)
  }

  const original = list.find((t) => t.id === selected)
  const dirty =
    creating ||
    (original ? JSON.stringify(original) !== JSON.stringify(draft) : false)
  const hasDefault = DEFAULT_TEMPLATES.some((t) => t.id === draft.id)

  function pick(t: EmailTemplate) {
    setSelected(t.id)
    setDraft(t)
    setCreating(false)
    setError(null)
    setSaved(false)
    setPane('edit')
  }

  function startNew() {
    setSelected('')
    setDraft(BLANK)
    setCreating(true)
    setError(null)
    setSaved(false)
    setPane('edit')
  }

  function set<K extends keyof EmailTemplate>(key: K, value: EmailTemplate[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setSaved(false)
  }

  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setBusy(true)
    setError(null)
    const res = await fn()
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setSaved(true)
    after?.()
    router.refresh()
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
          Dev mode — showing the shipped defaults. Edits need Supabase configured and migration 0010 applied.
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
            <Image src="/logo.png" alt="" width={26} height={26} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              Email Templates
            </span>
          </div>
          <div className="fw-mail-tabs" style={{ display: 'flex', border: '1px solid rgba(255,255,255,.2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
            {(
              [
                ['list', 'All'],
                ['edit', 'Edit'],
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
          <FwButton variant="primary" icon={<Plus size={14} />} onClick={startNew} style={{ flexShrink: 0 }}>
            New
          </FwButton>
        </div>
      </header>

      <main className="fw-tpl-grid" data-pane={pane === 'list' ? 'write' : 'preview'} style={{ flex: 1 }}>
        <div className="fw-mail-pane-write" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {TEMPLATE_GROUPS.map((g) => {
            const inGroup = list.filter((t) => t.group === g)
            if (!inGroup.length) return null
            return (
              <div key={g}>
                <div className="fw-label" style={{ marginBottom: 7 }}>
                  {g}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inGroup.map((t) => {
                    const on = t.id === selected && !creating
                    return (
                      <button
                        key={t.id}
                        onClick={() => pick(t)}
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--border-hairline)'}`,
                          background: on ? 'var(--accent-tint)' : 'var(--surface-card)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                            {t.label}
                          </span>
                          {t.suggestedStatus && (
                            <Badge tone={GROUP_TONE[t.group]}>→ {t.suggestedStatus}</Badge>
                          )}
                        </div>
                        <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)' }}>{t.blurb}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="fw-mail-pane-preview" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <section
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
              borderTop: '3px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                {creating ? 'New template' : draft.label || 'Template'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {saved && !dirty && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--age-fresh)' }}>
                    <CircleCheck size={13} /> Saved
                  </span>
                )}
                {hasDefault && !creating && (
                  <FwButton
                    variant="ghost"
                    size="sm"
                    icon={<RotateCcw size={12} />}
                    disabled={busy}
                    onClick={() => run(() => resetTemplate(draft.id))}
                  >
                    Restore default
                  </FwButton>
                )}
                {!creating && (
                  <FwButton variant="destructive" size="sm" icon={<Trash2 size={12} />} disabled={busy} onClick={() => setConfirmArchive(true)}>
                    Archive
                  </FwButton>
                )}
              </span>
            </div>

            <div className="fw-grid-2">
              <Labeled label="Name">
                <input className="fw-field" value={draft.label} onChange={(e) => set('label', e.target.value)} placeholder="Pursue Build" />
              </Labeled>
              <Labeled label="Group">
                <select className="fw-field" value={draft.group} onChange={(e) => set('group', e.target.value as TemplateGroup)}>
                  {TEMPLATE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Labeled>
            </div>

            <Labeled label="Description" hint="Shown under the dropdown on the compose screen.">
              <input className="fw-field" value={draft.blurb} onChange={(e) => set('blurb', e.target.value)} />
            </Labeled>

            <Labeled label="Suggested status" hint="Pre-checked in the send dialog. Staff can always uncheck it.">
              <select
                className="fw-field"
                value={draft.suggestedStatus ?? ''}
                onChange={(e) => set('suggestedStatus', (e.target.value || null) as SubmissionStatus | null)}
              >
                <option value="">Leave the lead where it is</option>
                {STATUS_VIEWS.map((v) => (
                  <option key={v.key} value={v.key}>
                    Move to {v.label}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Subject">
              <input className="fw-field" value={draft.subject} onChange={(e) => set('subject', e.target.value)} />
            </Labeled>

            {(['header', 'body', 'footer'] as const).map((k) => (
              <Labeled key={k} label={k}>
                <textarea
                  className="fw-field"
                  rows={k === 'body' ? 10 : 5}
                  value={draft[k]}
                  onChange={(e) => set(k, e.target.value)}
                  style={{ minHeight: k === 'body' ? 200 : 110, fontSize: 13.5, lineHeight: 1.6 }}
                />
              </Labeled>
            ))}

            <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--faint)' }}>
              Tokens: <code>{'{{first}}'}</code> <code>{'{{last}}'}</code> <code>{'{{name}}'}</code>{' '}
              <code>{'{{vehicle}}'}</code> <code>{'{{budget}}'}</code> <code>{'{{phone}}'}</code>{' '}
              <code>{'{{shop_phone}}'}</code>. Put <code>[Scope and rough figures]</code> in the body to have the lead&apos;s
              task breakdown and totals filled in automatically.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <FwButton
                variant="primary"
                icon={busy ? <Spinner size={13} color="#fff" /> : <Save size={14} />}
                disabled={busy || !dirty || !draft.label.trim()}
                onClick={() =>
                  run(
                    () => saveTemplate(draft, creating ? list.length : Math.max(0, list.findIndex((t) => t.id === selected))),
                    () => setCreating(false),
                  )
                }
              >
                {creating ? 'Create template' : 'Save changes'}
              </FwButton>
            </div>
          </section>
        </div>
      </main>

      <FwDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archive this template?"
        width={420}
        footer={
          <>
            <FwButton variant="ghost" onClick={() => setConfirmArchive(false)}>
              Cancel
            </FwButton>
            <FwButton
              variant="primary"
              onClick={() => {
                setConfirmArchive(false)
                run(() => archiveTemplate(draft.id))
              }}
            >
              Archive
            </FwButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
          <strong>{draft.label}</strong> disappears from the compose dropdown. Emails already sent with it keep their
          record.
          {hasDefault && ' Because this is a shipped template, Restore default brings it back.'}
        </p>
      </FwDialog>
    </div>
  )
}

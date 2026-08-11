'use client'
import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SentEmail } from '@/lib/types'
import { fmtDate } from './primitives'

function heading(email: SentEmail): string {
  const label = (email.template_label ?? '').trim()
  const when = fmtDate(email.sent_at)
  return [when, label].filter(Boolean).join(' — ')
}

function SentEmailRow({ email }: { email: SentEmail }) {
  const [open, setOpen] = React.useState(true)
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <div style={{ borderBottom: '1px solid var(--border-hairline)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          width: '100%',
          padding: '6px 0',
          background: 'none',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: 'var(--ink-2)',
        }}
      >
        <Chevron size={12} style={{ flexShrink: 0, alignSelf: 'center', color: 'var(--faint)' }} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--steel)',
            flexShrink: 0,
          }}
        >
          {heading(email)}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: 'var(--muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {email.subject}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 0 8px 18px' }}>
          <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--faint)', marginBottom: 5 }}>
            To: {email.to_email}
            {email.sent_by ? ` · sent by ${email.sent_by}` : ''}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              background: 'var(--paper-sunk)',
              padding: '7px 9px',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '2px solid var(--steel)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {email.body_text}
          </p>
        </div>
      )}
    </div>
  )
}

export function SentEmailList({ emails }: { emails: SentEmail[] }) {
  if (emails.length === 0) return null
  return (
    <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
      {emails.map((e) => (
        <SentEmailRow key={e.id} email={e} />
      ))}
    </div>
  )
}

import type { Metadata } from 'next'
import { CircleCheck, CircleAlert } from 'lucide-react'
import { lookupConfirmation } from '@/lib/confirmations'
import { shopPhone, mailReplyTo } from '@/lib/email/config'
import { confirmSubmission } from './actions'

export const metadata: Metadata = {
  title: 'Confirm your submission — FantomWorks',
  robots: { index: false, follow: false },
}

const shell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
}

const headingStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-display)',
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: '.02em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
}

const bodyStyle: React.CSSProperties = {
  margin: '0 0 20px',
  fontSize: 14,
  color: 'var(--muted)',
  lineHeight: 1.6,
}

function Badge({ tone }: { tone: 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'var(--age-fresh)' : 'var(--age-aging)'
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: `color-mix(in oklch,${color} 14%,white)`,
        border: `1px solid color-mix(in oklch,${color} 30%,transparent)`,
        display: 'grid',
        placeItems: 'center',
        margin: '0 auto 18px',
        color,
      }}
    >
      {tone === 'ok' ? <CircleCheck size={30} /> : <CircleAlert size={30} />}
    </div>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fw" style={shell}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>{children}</div>
    </div>
  )
}

export default async function ConfirmPage({ params }: PageProps<'/confirm/[token]'>) {
  const { token } = await params
  const state = await lookupConfirmation(token)

  if (state.status === 'invalid') {
    return (
      <Frame>
        <Badge tone="warn" />
        <h1 style={headingStyle}>Link not recognized</h1>
        <p style={bodyStyle}>
          This confirmation link isn&rsquo;t valid. It may have been mistyped or already replaced by a
          newer one. Your submission is most likely still in the call log — give the shop a ring at{' '}
          {shopPhone} or email {mailReplyTo} and we&rsquo;ll check.
        </p>
      </Frame>
    )
  }

  if (state.status === 'unavailable') {
    return (
      <Frame>
        <Badge tone="warn" />
        <h1 style={headingStyle}>Try that again in a minute</h1>
        <p style={bodyStyle}>
          We couldn&rsquo;t check your link just now. Your submission is safe — refresh this page
          shortly, or call the shop at {shopPhone} if it keeps happening.
        </p>
      </Frame>
    )
  }

  if (state.status === 'expired') {
    return (
      <Frame>
        <Badge tone="warn" />
        <h1 style={headingStyle}>Link expired</h1>
        <p style={bodyStyle}>
          This link has expired, but your submission is still on file. Call the shop at {shopPhone} or
          email {mailReplyTo} if you&rsquo;d like an update.
        </p>
      </Frame>
    )
  }

  const greeting = state.firstName ? `Thanks, ${state.firstName}.` : 'Thanks.'
  const vehicle = state.vehicle ? ` on your ${state.vehicle}` : ''

  if (state.status === 'confirmed') {
    return (
      <Frame>
        <Badge tone="ok" />
        <h1 style={headingStyle}>Email confirmed</h1>
        <p style={bodyStyle}>
          {greeting} We have a good address for you and your submission{vehicle} is in the call log.
          Dan calls in the order they come in, typically within 2–4 weeks. Replying to that email is
          fine if you need to add anything.
        </p>
      </Frame>
    )
  }

  return (
    <Frame>
      <h1 style={headingStyle}>Confirm your submission</h1>
      <p style={bodyStyle}>
        {greeting} Press the button below so we know this email address reaches you — it&rsquo;s how
        we follow up{vehicle ? ` about your ${state.vehicle}` : ''} if Dan can&rsquo;t get you by
        phone.
      </p>
      <form action={confirmSubmission}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
            padding: '0 18px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1,
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: 'pointer',
          }}
        >
          Confirm my submission
        </button>
      </form>
    </Frame>
  )
}

'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { FwButton } from './primitives'

const STORAGE_KEY = 'fw_tour_seen'
const TOUR_VERSION = '2026-08-emails-notes'

type Step = { selector: string | null; title: string; body: string }

const STEPS: Step[] = [
  {
    selector: '[data-tour="emails-sent"]',
    title: 'Emails you send are logged here',
    body: 'Every email sent from the composer now appears on the lead itself — date, subject, and the full message. Click one to expand or collapse it. Older sends are included, going back to when email logging started.',
  },
  {
    selector: '[data-tour="notes"]',
    title: 'Notes are dated',
    body: 'New notes are stamped when you write them and show as Today, Yesterday, or the date. Notes written before this change have no date, since there is no record of when they were added.',
  },
  {
    selector: '[data-tour="edit-mode"]',
    title: 'Edit notes and undo a logged call',
    body: 'Turn on Edit, then click the Notes block to reword or delete an individual note. In Edit mode, Call 1/2/3 also become clickable — hover one and it offers to remove it, for when a call gets logged by mistake.',
  },
]

function hasSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === TOUR_VERSION
  } catch {
    return true
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, TOUR_VERSION)
  } catch {
    /* private mode — tour simply shows again next visit */
  }
}

function subscribe() {
  return () => {}
}

function place(card: HTMLDivElement, target: Element | null) {
  const margin = 12
  const w = card.offsetWidth
  const h = card.offsetHeight

  if (!target) {
    card.style.top = `${Math.max(margin, (window.innerHeight - h) / 2)}px`
    card.style.left = `${Math.max(margin, (window.innerWidth - w) / 2)}px`
    return
  }

  const r = target.getBoundingClientRect()
  const below = r.bottom + margin
  const fitsBelow = below + h < window.innerHeight
  card.style.top = `${fitsBelow ? below : Math.max(margin, r.top - h - margin)}px`
  card.style.left = `${Math.min(Math.max(margin, r.left), window.innerWidth - w - margin)}px`
}

export function FeatureTour() {
  const seen = React.useSyncExternalStore(subscribe, hasSeen, () => true)
  const [step, setStep] = React.useState(0)
  const [done, setDone] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement | null>(null)

  const current = STEPS[step]

  React.useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !current) return
    const target = current.selector ? document.querySelector(current.selector) : null
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    place(card, target)
    const onResize = () => place(card, target)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [current])

  if (seen || done || !current) return null

  function finish() {
    markSeen()
    setDone(true)
  }

  const last = step === STEPS.length - 1

  return createPortal(
    <>
      <div
        onClick={finish}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 8000 }}
      />
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          zIndex: 8001,
          width: 'min(340px, calc(100vw - 24px))',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 12px 32px rgba(0,0,0,.28)',
          padding: '14px 16px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--steel)',
            }}
          >
            New · {step + 1} of {STEPS.length}
          </div>
          <button
            onClick={finish}
            title="Dismiss"
            style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--faint)', display: 'flex', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '6px 0 4px' }}>
          {current.title}
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{current.body}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          {step > 0 && (
            <FwButton variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              Back
            </FwButton>
          )}
          <FwButton variant="primary" size="sm" onClick={() => (last ? finish() : setStep((s) => s + 1))}>
            {last ? 'Got it' : 'Next'}
          </FwButton>
        </div>
      </div>
    </>,
    document.body,
  )
}

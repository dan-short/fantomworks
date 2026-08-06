'use client'
import * as React from 'react'
import Image from 'next/image'
import {
  Phone,
  Car,
  Wrench,
  StickyNote,
  Camera,
  CircleCheck,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  Trash,
  User,
  Mail,
} from 'lucide-react'
import { FwButton, FwDialog, Spinner } from './primitives'
import {
  StorageField,
  HistoryTextarea,
  Label,
  Field,
  Err,
  Row2,
  PrefixInput,
  TaskListEditor,
} from './form-fields'
import { VEHICLES, MAKES } from '@/lib/vehicles'
import {
  uploadPhoto,
  toDraftPhoto,
  fromDraftPhoto,
  type UploadedPhoto,
  type DraftPhoto,
} from '@/lib/photo-upload'
import { submitSelfSubmission } from '@/app/actions/submit'
import {
  onlyDigits,
  formatPhone,
  phoneOk,
  zipOk,
  numOk,
  parseNum,
  yearNum,
  yearOk,
  parseTaskList,
} from '@/lib/form-utils'

type Form = {
  first: string
  last: string
  phone: string
  email: string
  zip: string
  schedule: string
  year: string
  make: string
  model: string
  budget: string
  startWhen: 'asap' | 'custom'
  startCustom: string
  storageType: string
  storageYears: string
  tasksRaw: string
  materialsCost: string
  laborHours: string
  description: string
  photos: UploadedPhoto[]
}

const BLANK: Form = {
  first: '',
  last: '',
  phone: '',
  email: '',
  zip: '',
  schedule: '',
  year: '',
  make: '',
  model: '',
  budget: '',
  startWhen: 'asap',
  startCustom: '',
  storageType: '',
  storageYears: '',
  tasksRaw: '',
  materialsCost: '',
  laborHours: '',
  description: '',
  photos: [],
}

const MAX_PHOTOS = 4
const DRAFT_KEY = 'fw_self_submission_draft_v2'

type StepDef = { key: string; label: string; Icon: React.ComponentType<{ size?: number }> }
const STEPS: StepDef[] = [
  { key: 'contact', label: 'Contact', Icon: Phone },
  { key: 'vehicle', label: 'Vehicle', Icon: Car },
  { key: 'tasks', label: 'Tasks', Icon: Wrench },
  { key: 'history', label: 'History', Icon: StickyNote },
  { key: 'photos', label: 'Photos', Icon: Camera },
  { key: 'review', label: 'Review', Icon: CircleCheck },
]

// A clickable acknowledgement row with a check + CONFIRM affordance.
function ConfirmCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--accent-tint)' : 'var(--surface-card)',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          marginTop: 1,
          borderRadius: 'var(--radius-sm)',
          display: 'grid',
          placeItems: 'center',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: checked ? 'var(--accent)' : 'transparent',
          color: '#fff',
        }}
      >
        {checked && <CircleCheck size={15} />}
      </span>
      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>{children}</span>
      <span
        style={{
          flexShrink: 0,
          marginTop: 3,
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: checked ? 'var(--accent)' : 'var(--faint)',
        }}
      >
        {checked ? 'Confirmed' : 'Confirm'}
      </span>
    </button>
  )
}

function WhyAsk({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 6,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--accent)',
          textDecoration: 'underline',
          textUnderlineOffset: 2,
        }}
      >
        Why do we ask?
      </button>
      {open && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            zIndex: 20,
            width: 250,
            background: 'var(--steel)',
            color: 'var(--steel-ink)',
            fontSize: 12,
            lineHeight: 1.5,
            padding: '9px 11px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          {children}
        </span>
      )}
    </span>
  )
}

function Stepper({
  step,
  setStep,
  maxReached,
}: {
  step: number
  setStep: (n: number) => void
  maxReached: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
      {STEPS.map((s, i) => {
        const done = i < step
        const on = i === step
        const reachable = i <= maxReached
        const color = on ? 'var(--accent)' : done ? 'var(--age-fresh)' : 'var(--faint)'
        const Icon = s.Icon
        return (
          <React.Fragment key={s.key}>
            <button
              type="button"
              onClick={() => reachable && setStep(i)}
              disabled={!reachable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'transparent',
                cursor: reachable ? 'pointer' : 'default',
                padding: '4px 2px',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  background: on
                    ? 'var(--accent)'
                    : done
                      ? 'color-mix(in oklch,var(--age-fresh) 14%,white)'
                      : 'var(--paper-sunk)',
                  color: on ? '#fff' : color,
                  border: `1px solid ${
                    on
                      ? 'var(--accent)'
                      : done
                        ? 'color-mix(in oklch,var(--age-fresh) 32%,transparent)'
                        : 'var(--border-hairline)'
                  }`,
                }}
              >
                {done ? <CircleCheck size={15} /> : <Icon size={14} />}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color,
                }}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                style={{
                  flex: '0 0 26px',
                  height: 2,
                  background: i < step ? 'var(--age-fresh)' : 'var(--border-hairline)',
                  margin: '0 6px',
                  borderRadius: 2,
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 19,
  fontWeight: 600,
  letterSpacing: '.02em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
}
const subStyle: React.CSSProperties = { margin: '5px 0 0', fontSize: 13, color: 'var(--muted)' }
const monoStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)' }

export function SelfSubmissionForm() {
  const [step, setStep] = React.useState(0)
  const [maxReached, setMax] = React.useState(0)
  const [f, setF] = React.useState<Form>(BLANK)
  const [done, setDone] = React.useState(false)
  const [started, setStarted] = React.useState(false)
  const [savedLater, setSavedLater] = React.useState(false)
  const [draft, setDraft] = React.useState<{ f: Form; step: number; ts: number } | null>(null)
  const [taskConfirmOpen, setTaskConfirmOpen] = React.useState(false)
  const [estimateOpen, setEstimateOpen] = React.useState(false)
  const [confirmTime, setConfirmTime] = React.useState(false)
  const [confirmBudget, setConfirmBudget] = React.useState(false)
  // Any forward move out of Tasks (via Continue OR the stepper) routes through
  // the task-confirm modal, then the estimate gate if a parts/hours estimate
  // was given. pendingStep remembers where they were headed so either gate can
  // finish the trip.
  const [pendingStep, setPendingStep] = React.useState<number | null>(null)
  const [photoWarn, setPhotoWarn] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    try {
      const s = localStorage.getItem(DRAFT_KEY)
      if (!s) return
      const parsed = JSON.parse(s) as { f: Form; step: number; ts: number }
      const photos = (
        (parsed.f?.photos as unknown as DraftPhoto[] | undefined) ?? []
      ).map(fromDraftPhoto)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({ ...parsed, f: { ...BLANK, ...parsed.f, photos } })
    } catch {
    }
  }, [])

  React.useEffect(() => {
    if (!started || done) return
    try {
      const persist = { ...f, photos: f.photos.map(toDraftPhoto) }
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: persist, step, ts: Date.now() }))
    } catch {
    }
  }, [f, step, started, done])

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
    }
    setDraft(null)
  }
  const resumeDraft = () => {
    if (!draft) return
    setF({ ...BLANK, ...draft.f })
    setStep(draft.step || 0)
    setMax(draft.step || 0)
    setStarted(true)
  }
  const saveForLater = () => {
    try {
      const persist = { ...f, photos: f.photos.map(toDraftPhoto) }
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: persist, step, ts: Date.now() }))
    } catch {
    }
    setSavedLater(true)
  }

  const set =
    (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }))
  const valid = [
    Boolean(f.first && f.last && phoneOk(f.phone) && zipOk(f.zip) && f.schedule.trim()),
    Boolean(
      f.make && numOk(f.budget) && yearOk(f.year) && (f.startWhen === 'asap' || f.startCustom.trim()),
    ),
    parseTaskList(f.tasksRaw).length > 0 &&
      (!f.materialsCost || numOk(f.materialsCost)) &&
      (!f.laborHours || numOk(f.laborHours)),
    true,
    true,
    true,
  ]

  const go = (n: number) => {
    const t = Math.max(0, Math.min(STEPS.length - 1, n))
    setStep(t)
    setMax((m) => Math.max(m, t))
  }

  // Any forward move out of the Tasks step routes through the task-confirm
  // modal first, then the estimate gate if the customer entered a parts/hours
  // estimate. Used by both the Continue button and the stepper so neither can
  // bypass either confirmation.
  const needBudget = parseNum(f.materialsCost) != null
  const needTime = parseNum(f.laborHours) != null
  const requestStep = (target: number) => {
    if (step === 2 && target > 2) {
      setPendingStep(target)
      setTaskConfirmOpen(true)
      return
    }
    go(target)
  }

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    const room = MAX_PHOTOS - f.photos.length
    const take = files.slice(0, Math.max(0, room))
    setUploading(true)
    try {
      const uploaded = await Promise.all(take.map(uploadPhoto))
      setF((s) => ({ ...s, photos: [...s.photos, ...uploaded].slice(0, MAX_PHOTOS) }))
    } finally {
      setUploading(false)
    }
  }
  const rmPhoto = (i: number) =>
    setF((s) => {
      const p = s.photos[i]
      if (p?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl)
      return { ...s, photos: s.photos.filter((_, j) => j !== i) }
    })

  if (done) {
    const recap: [string, React.ReactNode][] = [
      [
        'Contact',
        `${f.first} ${f.last} · ${f.phone}${f.email ? ` · ${f.email}` : ''}`,
      ],
      ['ZIP', f.zip],
      ['Vehicle', [f.year, f.make, f.model].filter(Boolean).join(' ') || '—'],
      ['Budget', f.budget ? `$${f.budget}` : '—'],
      ['Start', f.startWhen === 'asap' ? 'As soon as possible' : f.startCustom || '—'],
      ['Tasks', `${parseTaskList(f.tasksRaw).length} task(s)`],
      ['Photos', f.photos.length ? `${f.photos.length} attached` : 'None'],
    ]
    return (
      <div className="fw" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'color-mix(in oklch,var(--age-fresh) 14%,white)',
              border: '1px solid color-mix(in oklch,var(--age-fresh) 30%,transparent)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              color: 'var(--age-fresh)',
            }}
          >
            <CircleCheck size={30} />
          </div>
          <h1
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}
          >
            Submission received
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Thanks, {f.first}. We&rsquo;ve got the details on your{' '}
            {[f.year, f.make, f.model].filter(Boolean).join(' ')} and someone from the shop will
            reach out at {f.phone}. We call in the order they come in — talk soon.
          </p>
          {f.email ? (
            <div
              style={{
                display: 'flex',
                gap: 12,
                textAlign: 'left',
                background: 'color-mix(in oklch,var(--accent) 7%,white)',
                border: '1px solid color-mix(in oklch,var(--accent) 25%,transparent)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 18,
              }}
            >
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>
                <Mail size={16} />
              </span>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--ink)' }}>One more step — check your email.</strong>{' '}
                We sent a confirmation link to {f.email}. Open it and press the button so we know
                this address reaches you. If it isn&rsquo;t there in a few minutes, look in your
                spam folder.
              </div>
            </div>
          ) : null}
          <div
            style={{
              textAlign: 'left',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: '16px 18px',
              marginBottom: 18,
            }}
          >
            <div className="fw-label" style={{ marginBottom: 10 }}>
              What we received
            </div>
            {recap.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 13 }}>
                <span
                  style={{
                    width: 70,
                    flexShrink: 0,
                    color: 'var(--faint)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                >
                  {k}
                </span>
                <span style={{ color: 'var(--ink-2)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <FwButton variant="secondary" icon={<StickyNote size={14} />} onClick={() => window.print()}>
              Print / save a copy
            </FwButton>
            <FwButton
              variant="ghost"
              onClick={() => {
                clearDraft()
                setF(BLANK)
                setStep(0)
                setMax(0)
                setDone(false)
                setStarted(false)
              }}
            >
              Submit another project
            </FwButton>
          </div>
        </div>
      </div>
    )
  }

  if (savedLater) {
    return (
      <div className="fw" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--paper-sunk)',
              border: '1px solid var(--border-hairline)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              color: 'var(--steel)',
            }}
          >
            <StickyNote size={28} />
          </div>
          <h1
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}
          >
            Saved for later
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Your progress is saved right here on this device. Come back to this page anytime on the
            same device and we&rsquo;ll pick up exactly where you left off — take your time gathering
            photos and details.
          </p>
          <FwButton variant="primary" onClick={() => setSavedLater(false)}>
            Keep working
          </FwButton>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="fw" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SubmitHeader />
        <main style={{ flex: 1, width: '100%', maxWidth: 760, margin: '0 auto', padding: '26px 22px 44px' }}>
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
              borderTop: '3px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: '26px 28px 28px',
            }}
          >
            <h1
              style={{
                margin: '0 0 4px',
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}
            >
              Before you start
            </h1>
            <p className="fw-label" style={{ marginBottom: 18 }}>
              Please read this first
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--ink-2)',
                textWrap: 'pretty',
              }}
            >
              <p
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  background: 'var(--paper-sunk)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <strong style={{ color: 'var(--ink)' }}>There is no time limit</strong> — you can
                finish later if you need time to get photos or other information you find necessary
                in this application. If you are having problems using this form, please contact{' '}
                <a href="mailto:webmaster@fantomworks.com">webmaster@fantomworks.com</a> with your
                name, number and a good time for us to call and assist you in working through this
                form.
              </p>
              <p style={{ margin: 0 }}>
                Dan hates bureaucracy as much as you do and certainly understands that you are
                probably asking yourself why we want you to fill out this form. His hope is that, by
                asking you to fill out the information below, you&rsquo;ll find out whether or not it
                makes sense to do your project — and please remember that we are a classic car
                restoration and modification shop that typically works on vehicles 1973 and older.
              </p>
              <p style={{ margin: 0 }}>
                Dan Short personally reviews every single applicant. If you ask for unreasonable or
                unsafe things, he will be unable to assist and likely not call. Every reasonable
                request will receive a call. Please ensure your project request is reasonable. After
                submitting your project, you will receive a call from a 757 phone number. Over ninety
                percent of his attempts to contact customers are met by call screening voicemails or
                automated AI call intercept software. Dan will ensure the phone rings and your caller
                ID of a 757 number will be the ONLY record of the call — Dan does not leave messages
                for the 90% of the people who can&rsquo;t be bothered answering the calls.{' '}
                <strong style={{ color: 'var(--ink)' }}>
                  After 3 screened calls, if you don&rsquo;t return a call or we can&rsquo;t get
                  through to you, we&rsquo;ll delete your submission and move on.
                </strong>{' '}
                We will always respect your time and only ask the same in return. Please answer the
                phone during the times you say you will answer, and if you miss a call from a 757
                area code, please call back at your earliest opportunity.
              </p>
            </div>
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
              <FwButton
                variant="primary"
                size="lg"
                iconRight={<ChevronRight size={16} />}
                onClick={() => setStarted(true)}
              >
                I understand — start my submission
              </FwButton>
            </div>
            {draft && (
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  padding: '12px 14px',
                  background: 'var(--paper-sunk)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <StickyNote size={16} style={{ color: 'var(--steel)', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 180, fontSize: 13, color: 'var(--ink-2)' }}>
                  You have a saved submission on this device from{' '}
                  {new Date(draft.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.
                  Want to pick up where you left off?
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <FwButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Discard the saved submission and start over?')) clearDraft()
                    }}
                  >
                    Start fresh
                  </FwButton>
                  <FwButton variant="primary" size="sm" onClick={resumeDraft}>
                    Resume
                  </FwButton>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fw" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SubmitHeader
        action={
          <FwButton variant="secondary" icon={<StickyNote size={14} />} onClick={saveForLater}>
            Save &amp; finish later
          </FwButton>
        }
        stacked
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 760,
          margin: '0 auto',
          padding: '22px 22px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <Stepper step={step} setStep={requestStep} maxReached={maxReached} />

        <section
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '22px 22px 24px',
            minHeight: 340,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={headingStyle}>How do we reach you?</h2>
                <p style={subStyle}>
                  We&rsquo;ll call you back to talk through the project — no automated anything.
                </p>
              </div>
              <Row2>
                <Field label="First name" req>
                  <input className="fw-field" value={f.first} onChange={set('first')} placeholder="Marcus" />
                </Field>
                <Field label="Last name" req>
                  <input className="fw-field" value={f.last} onChange={set('last')} placeholder="Reilly" />
                </Field>
              </Row2>
              <Row2>
                <div style={{ minWidth: 0 }}>
                  <Label req>Phone</Label>
                  <input
                    className="fw-field tnum"
                    style={{
                      ...monoStyle,
                      borderColor: f.phone && !phoneOk(f.phone) ? 'var(--age-cold)' : undefined,
                    }}
                    value={f.phone}
                    onChange={(e) => setF((s) => ({ ...s, phone: formatPhone(e.target.value) }))}
                    inputMode="tel"
                    placeholder="(757) 555-0148"
                  />
                  {f.phone && !phoneOk(f.phone) ? (
                    <Err show>Please enter a 10-digit phone number.</Err>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 5 }}>
                      Best number to reach you at.
                    </div>
                  )}
                </div>
                <Field label="Email">
                  <input
                    className="fw-field"
                    type="email"
                    value={f.email}
                    onChange={set('email')}
                    placeholder="optional"
                  />
                </Field>
              </Row2>
              <Row2>
                <div style={{ minWidth: 0 }}>
                  <Label req>
                    Vehicle ZIP code{' '}
                    <WhyAsk>
                      The ZIP where the vehicle is kept — we use it to estimate how far it is from
                      our shop, which helps us plan pickup, delivery, and visits.
                    </WhyAsk>
                  </Label>
                  <input
                    className="fw-field tnum"
                    style={{
                      ...monoStyle,
                      borderColor: f.zip && !zipOk(f.zip) ? 'var(--age-cold)' : undefined,
                    }}
                    value={f.zip}
                    onChange={(e) => setF((s) => ({ ...s, zip: onlyDigits(e.target.value).slice(0, 5) }))}
                    inputMode="numeric"
                    placeholder="23517"
                  />
                  <Err show={Boolean(f.zip && !zipOk(f.zip))}>ZIP code should be 5 digits.</Err>
                </div>
                <Field label="Best time to call" req hint="So we don’t catch you at a bad time.">
                  <input
                    className="fw-field"
                    value={f.schedule}
                    onChange={set('schedule')}
                    placeholder="e.g. Weekdays after 5pm"
                  />
                </Field>
              </Row2>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={headingStyle}>Tell us about the car</h2>
                <p style={subStyle}>
                  Whatever you know — if you&rsquo;re not sure of the exact model, just give us the
                  make.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr', gap: 16 }}>
                <Field label="Year">
                  <input
                    className="fw-field tnum"
                    style={{ ...monoStyle, borderColor: !yearOk(f.year) ? 'var(--age-cold)' : undefined }}
                    value={f.year}
                    onChange={(e) => setF((s) => ({ ...s, year: onlyDigits(e.target.value).slice(0, 4) }))}
                    inputMode="numeric"
                    placeholder="1969"
                  />
                  <Err show={!yearOk(f.year)}>Enter a year between 1851 and 2025.</Err>
                </Field>
                <Field label="Make" req hint="Pick from the list or type your own.">
                  <input
                    className="fw-field"
                    list="fw-makes"
                    value={f.make}
                    onChange={(e) => setF((s) => ({ ...s, make: e.target.value, model: '' }))}
                    placeholder="Chevrolet"
                  />
                  <datalist id="fw-makes">
                    {MAKES.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Model" hint="Suggestions match the make.">
                  <input
                    className="fw-field"
                    list="fw-models"
                    value={f.model}
                    onChange={set('model')}
                    placeholder="Camaro"
                  />
                  <datalist id="fw-models">
                    {(VEHICLES[f.make] || []).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </Field>
              </div>
              {yearNum(f.year) !== null && (yearNum(f.year) as number) > 1973 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '12px 14px',
                    background: 'color-mix(in oklch,var(--age-aging) 12%,white)',
                    border: '1px solid color-mix(in oklch,var(--age-aging) 32%,transparent)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'var(--ink-2)',
                  }}
                >
                  <span style={{ color: 'var(--age-stale)', flexShrink: 0, marginTop: 1 }}>
                    <CircleHelp size={16} />
                  </span>
                  <span>
                    We usually work on vehicles{' '}
                    <strong style={{ color: 'var(--ink)' }}>1973 and older</strong> — emissions-era
                    changes make later cars far costlier to restore. You&rsquo;re welcome to submit
                    anyway, but wanted to set expectations up front.
                  </span>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <Label req>Ballpark budget</Label>
                <PrefixInput
                  prefix="$"
                  error={Boolean(f.budget && !numOk(f.budget))}
                  value={f.budget}
                  onChange={set('budget')}
                  inputMode="decimal"
                  placeholder="80,000"
                />
                {f.budget && !numOk(f.budget) ? (
                  <Err show>Numbers only — e.g. 80000.</Err>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 5 }}>
                    A rough number helps us tell you what&rsquo;s realistic.
                  </div>
                )}
              </div>
              <Field label="When would you like to start?" req>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: f.startWhen === 'custom' ? 10 : 0,
                  }}
                >
                  {([['asap', 'As soon as possible'], ['custom', 'A specific timeframe']] as const).map(
                    ([k, lbl]) => {
                      const on = f.startWhen === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setF((v) => ({ ...v, startWhen: k }))}
                          style={{
                            cursor: 'pointer',
                            flex: '1 1 160px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 13,
                            fontWeight: 600,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                            background: on ? 'var(--accent)' : 'var(--surface-card)',
                            color: on ? '#fff' : 'var(--ink-2)',
                          }}
                        >
                          {lbl}
                        </button>
                      )
                    },
                  )}
                </div>
                {f.startWhen === 'custom' && (
                  <input
                    className="fw-field"
                    value={f.startCustom}
                    onChange={set('startCustom')}
                    placeholder="e.g. In about 6 months / next spring / within 2 years"
                  />
                )}
              </Field>
              <StorageField
                type={f.storageType}
                years={f.storageYears}
                onType={(v) => setF((s) => ({ ...s, storageType: v }))}
                onYears={(v) => setF((s) => ({ ...s, storageYears: v }))}
              />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={headingStyle}>What do you want done?</h2>
                <p style={subStyle}>
                  Provide a detailed list of all of the tasks you want accomplished on your vehicle.{' '}
                  <strong style={{ color: 'var(--ink)' }}>
                    Please ensure you start each task with a dash (-) followed by your task, then
                    press enter and repeat.
                  </strong>
                </p>
              </div>
              <TaskListEditor
                value={f.tasksRaw}
                onChange={(v) => setF((s) => ({ ...s, tasksRaw: v }))}
                rows={16}
                confirmOpen={taskConfirmOpen}
                onConfirmOpenChange={setTaskConfirmOpen}
                onConfirm={() => {
                  if (needBudget || needTime) {
                    setConfirmTime(false)
                    setConfirmBudget(false)
                    setEstimateOpen(true)
                  } else if (pendingStep != null) {
                    go(pendingStep)
                    setPendingStep(null)
                  } else {
                    go(3)
                  }
                }}
              />
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <Label>
                    Optional — based on your list, what do you think is the cost of materials to
                    accomplish that list?
                  </Label>
                  <PrefixInput
                    prefix="$"
                    error={Boolean(f.materialsCost && !numOk(f.materialsCost))}
                    value={f.materialsCost}
                    onChange={set('materialsCost')}
                    inputMode="decimal"
                    placeholder="e.g. 12,000"
                  />
                  <Err show={Boolean(f.materialsCost && !numOk(f.materialsCost))}>
                    Numbers only — e.g. 12000.
                  </Err>
                </div>
                <div>
                  <Label>
                    Optional — based on your list, how many hours do you think it would take to
                    accomplish every task on your list?
                  </Label>
                  <PrefixInput
                    prefix={<User size={14} />}
                    error={Boolean(f.laborHours && !numOk(f.laborHours))}
                    value={f.laborHours}
                    onChange={set('laborHours')}
                    inputMode="decimal"
                    placeholder="e.g. 200"
                  />
                  <Err show={Boolean(f.laborHours && !numOk(f.laborHours))}>
                    Numbers only — e.g. 200.
                  </Err>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={headingStyle}>The fuller story</h2>
                <p style={subStyle}>
                  Optional, but helpful. The car&rsquo;s history, its condition, what&rsquo;s already
                  been done, what you&rsquo;re after, any deadlines — however you&rsquo;d tell it.
                </p>
              </div>
              <Field label="History & notes">
                <HistoryTextarea
                  value={f.description}
                  onChange={(v) => setF((s) => ({ ...s, description: v }))}
                  placeholder={
                    'e.g. Bought it in 2001, did a budget rebuild myself over five years. Runs and drives but there’s an oil leak into the bell housing. I have a binder of receipts and a specs sheet I can share…'
                  }
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={headingStyle}>Add photos</h2>
                <p style={subStyle}>
                  Optional, but they help a lot. Up to {MAX_PHOTOS} — overall shots plus anything you
                  want us to see: rust, damage, the interior.
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={onPickFiles}
                style={{ display: 'none' }}
              />
              {f.photos.length < MAX_PHOTOS ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{
                    border: '2px dashed var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-raised)',
                    padding: 26,
                    cursor: uploading ? 'default' : 'pointer',
                    color: 'var(--muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? <Spinner size={22} color="var(--accent)" /> : <Camera size={26} />}
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {uploading ? 'Uploading…' : 'Click to add photos'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--faint)' }}>
                    JPG or PNG · {MAX_PHOTOS - f.photos.length} left
                  </span>
                </button>
              ) : (
                <div
                  style={{
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--paper-sunk)',
                    padding: 14,
                    textAlign: 'center',
                    fontSize: 12.5,
                    color: 'var(--muted)',
                  }}
                >
                  That&rsquo;s the max of {MAX_PHOTOS} photos — remove one to swap it out.
                </div>
              )}
              {f.photos.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))',
                    gap: 10,
                  }}
                >
                  {f.photos.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        overflow: 'hidden',
                        background: p.previewUrl
                          ? 'var(--paper-sunk)'
                          : 'repeating-linear-gradient(45deg,var(--paper-sunk),var(--paper-sunk) 6px,var(--surface-raised) 6px,var(--surface-raised) 12px)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--faint)',
                      }}
                    >
                      {p.previewUrl ? (
                        <Image
                          src={p.previewUrl}
                          alt={p.name}
                          fill
                          sizes="96px"
                          unoptimized={/^(blob:|data:)/.test(p.previewUrl)}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Camera size={18} />
                      )}
                      <button
                        type="button"
                        onClick={() => rmPhoto(i)}
                        title="Remove"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'var(--surface-card)',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          color: 'var(--age-cold)',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={headingStyle}>Look it over</h2>
                <p style={subStyle}>Make sure it&rsquo;s right, then send it our way.</p>
              </div>
              {(
                [
                  [
                    'Contact',
                    `${f.first} ${f.last} · ${f.phone}${f.email ? ` · ${f.email}` : ''}\nZIP ${
                      f.zip || '—'
                    }${f.schedule ? ` · ${f.schedule}` : ''}`,
                    0,
                  ],
                  [
                    'Vehicle',
                    [f.year, f.make, f.model].filter(Boolean).join(' ') +
                      (f.budget ? `  ·  budget $${f.budget}` : '') +
                      `\nStart: ${f.startWhen === 'asap' ? 'As soon as possible' : f.startCustom || '—'}` +
                      (f.storageType
                        ? `\nStored: ${f.storageType}${f.storageYears ? ` · ${f.storageYears} yr` : ''}`
                        : ''),
                    1,
                  ],
                  [
                    'Tasks',
                    (parseTaskList(f.tasksRaw)
                      .map((t) => `• ${t}`)
                      .join('\n') || '—') +
                      (f.materialsCost || f.laborHours
                        ? `\nEstimate: ${[
                            f.materialsCost ? `$${f.materialsCost} materials` : '',
                            f.laborHours ? `${f.laborHours} hrs labor` : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}`
                        : ''),
                    2,
                  ],
                  ['History', f.description || '—', 3],
                  [
                    'Photos',
                    f.photos.length ? `${f.photos.length} photo${f.photos.length > 1 ? 's' : ''} attached` : 'None attached',
                    4,
                  ],
                ] as [string, string, number][]
              ).map(([k, v, s], i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-hairline)',
                  }}
                >
                  <span className="fw-label" style={{ width: 86, flexShrink: 0, paddingTop: 2 }}>
                    {k}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: 'var(--ink-2)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      textWrap: 'pretty',
                    }}
                  >
                    {v}
                  </span>
                  <button
                    type="button"
                    onClick={() => go(s)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <FwButton variant="ghost" size="sm" icon={<StickyNote size={13} />} onClick={() => window.print()}>
                  Print / save a copy
                </FwButton>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />
        </section>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <FwButton
            variant="ghost"
            icon={<ChevronLeft size={15} />}
            disabled={step === 0}
            onClick={() => go(step - 1)}
          >
            Back
          </FwButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--faint)' }}>
              Step {step + 1} of {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <FwButton
                variant="primary"
                iconRight={<ChevronRight size={15} />}
                disabled={!valid[step]}
                onClick={() => {
                  if (!valid[step]) return
                  if (step === 4 && f.photos.length === 0) {
                    setPhotoWarn(true)
                    return
                  }
                  // step 2 → task-confirm, then the estimate gate if needed —
                  // both handled inside requestStep so Continue and the
                  // stepper can't bypass either confirmation.
                  requestStep(step + 1)
                }}
              >
                Continue
              </FwButton>
            ) : (
              <FwButton
                variant="primary"
                icon={<CircleCheck size={15} />}
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true)
                  setSubmitError(null)
                  const res = await submitSelfSubmission({
                    first: f.first,
                    last: f.last,
                    phone: f.phone,
                    email: f.email,
                    zip: f.zip,
                    schedule: f.schedule,
                    year: f.year,
                    make: f.make,
                    model: f.model,
                    budget: f.budget,
                    startWhen: f.startWhen,
                    startCustom: f.startCustom,
                    storageType: f.storageType,
                    storageYears: f.storageYears,
                    tasksRaw: f.tasksRaw,
                    materialsCost: f.materialsCost,
                    laborHours: f.laborHours,
                    description: f.description,
                    photos: f.photos.map((p) => ({ path: p.path })),
                  })
                  setSubmitting(false)
                  if (!res.ok) {
                    setSubmitError(res.error)
                    return
                  }
                  clearDraft()
                  setDone(true)
                }}
              >
                {submitting ? 'Submitting…' : 'Submit project'}
              </FwButton>
            )}
          </div>
        </div>
        {submitError && (
          <div style={{ fontSize: 12.5, color: 'var(--age-cold)', textAlign: 'right' }}>{submitError}</div>
        )}
      </main>

      <FwDialog
        open={photoWarn}
        onClose={() => setPhotoWarn(false)}
        title="Continue without photos?"
        width={440}
        footer={
          <>
            <FwButton
              variant="ghost"
              onClick={() => {
                setPhotoWarn(false)
                go(5)
              }}
            >
              Continue anyway
            </FwButton>
            <FwButton variant="primary" icon={<Camera size={14} />} onClick={() => setPhotoWarn(false)}>
              Add photos
            </FwButton>
          </>
        }
      >
        <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          <strong style={{ color: 'var(--ink)' }}>Photos are extremely helpful</strong> in allowing
          us to understand your project. If you do not know how to load them and would prefer to
          email them, please email them to{' '}
          <a href="mailto:webmaster@fantomworks.com">webmaster@fantomworks.com</a> separately.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          No photos handy right now? Use{' '}
          <strong style={{ color: 'var(--ink)' }}>Save &amp; finish later</strong> (top right) — your
          progress is saved on this computer, so you can gather photos and come back to finish.
        </p>
      </FwDialog>

      {/* Estimate-confirmation gate — only shown when a parts/hours estimate was
          entered; confirmations shown match what the customer provided. */}
      <FwDialog
        open={estimateOpen}
        onClose={() => {
          setEstimateOpen(false)
          setPendingStep(null)
        }}
        title="Confirm your estimate"
        width={540}
        footer={
          <>
            <FwButton
              variant="ghost"
              onClick={() => {
                setEstimateOpen(false)
                setPendingStep(null)
              }}
            >
              Back
            </FwButton>
            <FwButton
              variant="primary"
              icon={<CircleCheck size={14} />}
              disabled={!((!needTime || confirmTime) && (!needBudget || confirmBudget))}
              onClick={() => {
                const target = pendingStep ?? 3
                setEstimateOpen(false)
                setPendingStep(null)
                go(target)
              }}
            >
              Confirm &amp; continue
            </FwButton>
          </>
        }
      >
        {(() => {
          const nTasks = parseTaskList(f.tasksRaw).length || 1
          const partsNum = parseNum(f.materialsCost)
          const hoursNum = parseNum(f.laborHours)
          const avgParts = partsNum != null ? Math.round(partsNum / nTasks) : null
          const avgHours = hoursNum != null ? Math.round((hoursNum / nTasks) * 10) / 10 : null
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(avgParts != null || avgHours != null) && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--paper-sunk)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: 'var(--ink-2)',
                  }}
                >
                  Across your{' '}
                  <strong style={{ color: 'var(--ink)' }}>{nTasks}</strong> task
                  {nTasks === 1 ? '' : 's'}, your estimate is for an average of{' '}
                  {avgParts != null && (
                    <>
                      <strong className="tnum" style={{ color: 'var(--ink)' }}>
                        ${avgParts.toLocaleString()}
                      </strong>{' '}
                      in parts
                    </>
                  )}
                  {avgParts != null && avgHours != null ? ' and ' : ''}
                  {avgHours != null && (
                    <>
                      <strong className="tnum" style={{ color: 'var(--ink)' }}>
                        {avgHours}
                      </strong>{' '}
                      hours of labor
                    </>
                  )}{' '}
                  per task.
                </div>
              )}
              {needTime && (
                <ConfirmCheck checked={confirmTime} onChange={setConfirmTime}>
                  Please confirm that you believe this is a reasonable estimate of time necessary for
                  a person to diagnose, research, order, receive, install, and test all parts.
                </ConfirmCheck>
              )}
              {needBudget && (
                <ConfirmCheck checked={confirmBudget} onChange={setConfirmBudget}>
                  I also believe that my materials budget is sufficient to purchase the component
                  including all necessary accessories, installation kits, fasteners, and misc coating
                  and paint materials, including the costs of shipping and taxes in today&rsquo;s
                  prices.
                </ConfirmCheck>
              )}
            </div>
          )
        })()}
      </FwDialog>
    </div>
  )
}

function SubmitHeader({
  action,
  stacked,
}: {
  action?: React.ReactNode
  stacked?: boolean
}) {
  const wordmark = (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: '.03em',
        textTransform: 'uppercase',
        color: '#fff',
        lineHeight: 1,
      }}
    >
      FantomWorks
    </span>
  )
  const tagline = (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: 'var(--steel-ink)',
        opacity: 0.65,
        lineHeight: 1,
      }}
    >
      Submit Your Project
    </span>
  )
  return (
    <header
      style={{
        background: 'var(--steel)',
        boxShadow: 'var(--shadow-md)',
        padding: '12px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: action ? 'space-between' : 'flex-start',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image
          src="/logo.png"
          alt="FantomWorks"
          width={30}
          height={30}
          priority
          style={{ width: 30, height: 30, borderRadius: '50%' }}
        />
        {stacked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {wordmark}
            {tagline}
          </div>
        ) : (
          <>
            {wordmark}
            {tagline}
          </>
        )}
      </div>
      {action}
    </header>
  )
}

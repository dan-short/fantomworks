'use client'
// Office submission — staff quick-entry for a customer who phoned or walked in.
// Single scrolling page on the "Shop Work Order" paper theme. Recreated from the
// design-system reference (office-submission/index.html) using the shared .fw
// tokens + FwButton/Badge primitives. UI-only for now: submit shows a success
// screen; no lead is written yet (persistence lands in a later pass).
import * as React from 'react'
import { Phone, Car, Wrench, StickyNote, CircleCheck, Trash } from 'lucide-react'
import { FwButton, Badge } from './primitives'

const STAFF = ['Melissa', 'Hailey', 'Mike', 'Dan'] as const

type Form = {
  first: string
  last: string
  phone: string
  altPhone: string
  email: string
  schedule: string
  city: string
  state: string
  year: string
  make: string
  model: string
  tasks: string[]
  description: string
  addedBy: string
}

const blank = (addedBy = 'Hailey'): Form => ({
  first: '',
  last: '',
  phone: '',
  altPhone: '',
  email: '',
  schedule: '',
  city: '',
  state: '',
  year: '',
  make: '',
  model: '',
  tasks: [''],
  description: '',
  addedBy,
})

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="fw-label" style={{ display: 'block', marginBottom: 6 }}>
      {children}
      {req && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function Field({
  label,
  req,
  hint,
  children,
}: {
  label: React.ReactNode
  req?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <Label req={req}>{label}</Label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function SectionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode
  title: string
  desc?: string
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
          gap: 11,
          padding: '13px 18px',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--surface-raised)',
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--paper-sunk)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--steel)',
          }}
        >
          {icon}
        </span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '.03em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          {desc && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  )
}

const monoStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)' }

export function OfficeSubmissionForm() {
  const [f, setF] = React.useState<Form>(() => blank())
  const [saved, setSaved] = React.useState(false)

  const set =
    (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }))
  const setTask = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, tasks: s.tasks.map((t, j) => (j === i ? e.target.value : t)) }))
  const addTask = () => setF((s) => ({ ...s, tasks: [...s.tasks, ''] }))
  const rmTask = (i: number) =>
    setF((s) => ({ ...s, tasks: s.tasks.length > 1 ? s.tasks.filter((_, j) => j !== i) : [''] }))

  const canSave = Boolean(
    f.first && f.last && f.phone && f.make && f.tasks.some((t) => t.trim()),
  )

  const root: React.CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column' }

  if (saved) {
    return (
      <div className="fw fw-compact" style={{ ...root, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
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
            Added to Call Log
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
            {f.first} {f.last}&rsquo;s {[f.year, f.make, f.model].filter(Boolean).join(' ')} was
            entered by {f.addedBy} and is now at the top of the Call Log.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <FwButton
              variant="primary"
              onClick={() => {
                setF(blank(f.addedBy))
                setSaved(false)
              }}
            >
              Enter another
            </FwButton>
            <FwButton variant="secondary" onClick={() => setSaved(false)}>
              Back to form
            </FwButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fw fw-compact" style={root}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--steel)',
          boxShadow: 'var(--shadow-md)',
          padding: '12px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
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
            }}
          >
            FW
          </span>
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
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--steel-ink)',
              opacity: 0.65,
            }}
          >
            New Lead · Office
          </span>
        </div>
        <Badge tone="amber" variant="solid">
          Office Entry
        </Badge>
      </header>

      {/* Body */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 920,
          margin: '0 auto',
          padding: '22px 22px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}
          >
            New lead — office entry
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--muted)', maxWidth: 640 }}>
            Quick-log a customer who called or walked in. Type what they want done in plain words —
            no need for stage-by-stage estimates; that gets worked up later.{' '}
            <span style={{ color: 'var(--accent)' }}>*</span> marks required fields.
          </p>
        </div>

        <SectionCard
          icon={<Phone size={16} />}
          title="Customer"
          desc="Who is this and how do we reach them?"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="First name" req>
              <input className="fw-field" value={f.first} onChange={set('first')} placeholder="Marcus" />
            </Field>
            <Field label="Last name" req>
              <input className="fw-field" value={f.last} onChange={set('last')} placeholder="Reilly" />
            </Field>
            <Field label="Phone" req>
              <input
                className="fw-field tnum"
                style={monoStyle}
                value={f.phone}
                onChange={set('phone')}
                placeholder="(757) 555-0148"
              />
            </Field>
            <Field label="Alt phone">
              <input
                className="fw-field tnum"
                style={monoStyle}
                value={f.altPhone}
                onChange={set('altPhone')}
                placeholder="optional"
              />
            </Field>
            <Field label="Email">
              <input
                className="fw-field"
                type="email"
                value={f.email}
                onChange={set('email')}
                placeholder="optional"
              />
            </Field>
            <Field label="Best time to call">
              <input
                className="fw-field"
                value={f.schedule}
                onChange={set('schedule')}
                placeholder="e.g. Weekdays after 5pm"
              />
            </Field>
            <Field label="City">
              <input
                className="fw-field"
                value={f.city}
                onChange={set('city')}
                placeholder="Williamsburg"
              />
            </Field>
            <Field label="State">
              <input className="fw-field" value={f.state} onChange={set('state')} placeholder="VA" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard icon={<Car size={16} />} title="Vehicle" desc="The car the project is about.">
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr', gap: 14 }}>
            <Field label="Year">
              <input
                className="fw-field tnum"
                style={monoStyle}
                value={f.year}
                onChange={set('year')}
                placeholder="1969"
              />
            </Field>
            <Field label="Make" req>
              <input
                className="fw-field"
                value={f.make}
                onChange={set('make')}
                placeholder="Chevrolet"
              />
            </Field>
            <Field label="Model">
              <input
                className="fw-field"
                value={f.model}
                onChange={set('model')}
                placeholder="Camaro"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Wrench size={16} />}
          title="Work requested"
          desc="The tasks the customer wants done — one short line each."
        >
          <Field
            label="Tasks"
            req
            hint="Keep each to a line or two. No parts or hours needed — that gets worked up later."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {f.tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--faint)',
                      width: 18,
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    {i + 1}
                  </span>
                  <input
                    className="fw-field"
                    value={t}
                    onChange={setTask(i)}
                    placeholder={
                      i === 0 ? 'e.g. Go through the 350 and add a mild cam' : 'Add a task…'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => rmTask(i)}
                    title="Remove task"
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-hairline)',
                      background: 'var(--surface-card)',
                      cursor: 'pointer',
                      color: 'var(--faint)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <FwButton variant="secondary" size="sm" onClick={addTask}>
                + Add another task
              </FwButton>
            </div>
          </Field>
        </SectionCard>

        <SectionCard
          icon={<StickyNote size={16} />}
          title="Project description"
          desc="The fuller picture — in the customer’s words."
        >
          <Field
            label="Description"
            hint="History, condition, what they’re after, deadlines — however they described it."
          >
            <textarea
              className="fw-field"
              value={f.description}
              onChange={set('description')}
              rows={6}
              placeholder={
                'e.g. Owned since 2001, did a budget rebuild himself. Runs and drives but leaking oil into the bell housing. Wants it done right this time — respray in the original green, interior back to stock bench. Has a binder of receipts. Motivated, flexible on timing.'
              }
            />
          </Field>
        </SectionCard>

        <SectionCard
          icon={<StickyNote size={16} />}
          title="Entered by"
          desc="Which staff member is logging this."
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STAFF.map((s) => {
              const on = f.addedBy === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setF((v) => ({ ...v, addedBy: s }))}
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--accent)' : 'var(--surface-card)',
                    color: on ? '#fff' : 'var(--ink-2)',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* Action bar */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <span style={{ fontSize: 12, color: canSave ? 'var(--muted)' : 'var(--faint)' }}>
            {canSave
              ? 'Ready to add to the Call Log.'
              : 'Fill in first name, last name, phone, make, and at least one task.'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <FwButton variant="ghost" onClick={() => setF(blank(f.addedBy))}>
              Clear
            </FwButton>
            <FwButton
              variant="primary"
              icon={<CircleCheck size={14} />}
              disabled={!canSave}
              onClick={() => canSave && setSaved(true)}
            >
              Add to Call Log
            </FwButton>
          </div>
        </div>
      </main>
    </div>
  )
}

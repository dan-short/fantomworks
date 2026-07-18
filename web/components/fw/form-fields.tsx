'use client'
import * as React from 'react'
import { Trash, User } from 'lucide-react'
import { FwButton, FwDialog } from './primitives'
import {
  numOk,
  countWords,
  clampWords,
  MAX_HISTORY_WORDS,
  STORAGE_OPTIONS,
  TASK_AREAS,
  taskComplete,
  taskEmpty,
  emptyTask,
  type TaskInput,
} from '@/lib/form-utils'

const monoStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)' }

export function Label({
  children,
  req,
  style,
}: {
  children: React.ReactNode
  req?: boolean
  style?: React.CSSProperties
}) {
  return (
    <label className="fw-label" style={{ display: 'block', marginBottom: 7, ...style }}>
      {children}
      {req && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
    </label>
  )
}

export function Field({
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
      {hint && <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

export function Err({ show, children }: { show?: boolean | string; children: React.ReactNode }) {
  if (!show) return null
  return (
    <div style={{ fontSize: 12, color: 'var(--age-cold)', marginTop: 5, lineHeight: 1.4 }}>
      {children}
    </div>
  )
}

export function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

export function PrefixInput({
  prefix,
  error,
  ...rest
}: {
  prefix: React.ReactNode
  error?: boolean | string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        border: `1px solid ${error ? 'var(--age-cold)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-card)',
        overflow: 'hidden',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${
          error ? 'color-mix(in oklch,var(--age-cold) 22%,transparent)' : 'var(--focus-ring)'
        }`
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 34,
          flexShrink: 0,
          background: 'var(--paper-sunk)',
          borderRight: '1px solid var(--border-hairline)',
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 15,
        }}
      >
        {prefix}
      </span>
      <input
        className="tnum"
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--ink)',
        }}
        {...rest}
      />
    </div>
  )
}

export function HistoryTextarea({
  value,
  onChange,
  placeholder,
  max = MAX_HISTORY_WORDS,
  minHeight,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  max?: number
  minHeight?: number
}) {
  const words = countWords(value)
  const atCap = words >= max
  return (
    <div>
      <textarea
        className="fw-field"
        value={value}
        onChange={(e) => onChange(clampWords(e.target.value, max))}
        placeholder={placeholder}
        style={minHeight ? { minHeight } : undefined}
      />
      <div
        className="tnum"
        style={{
          marginTop: 5,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: atCap ? 'var(--age-stale)' : 'var(--faint)',
        }}
      >
        {words} / {max} words{atCap ? ' · limit reached' : ''}
      </div>
    </div>
  )
}

export function StorageField({
  type,
  years,
  onType,
  onYears,
  req,
}: {
  type: string
  years: string
  onType: (v: string) => void
  onYears: (v: string) => void
  req?: boolean
}) {
  const isPreset = (STORAGE_OPTIONS as readonly string[]).includes(type)
  const [other, setOther] = React.useState(!isPreset && type !== '')
  const selectValue = other ? 'Other' : type
  const yearsBad = Boolean(years.trim() && !numOk(years))
  return (
    <div>
      <Label req={req}>How has the vehicle been stored?</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
        <select
          className="fw-field"
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value
            if (v === 'Other') {
              setOther(true)
              onType('')
            } else {
              setOther(false)
              onType(v)
            }
          }}
        >
          <option value="">Choose a condition…</option>
          {STORAGE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <div>
          <input
            className="fw-field tnum"
            style={monoStyle}
            value={years}
            onChange={(e) => onYears(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="decimal"
            placeholder="Years"
            aria-label="Years in this condition"
          />
        </div>
      </div>
      {other && (
        <input
          className="fw-field"
          style={{ marginTop: 10 }}
          value={type}
          onChange={(e) => onType(e.target.value)}
          placeholder="Describe how it's been stored"
        />
      )}
      <div style={{ fontSize: 12, color: yearsBad ? 'var(--age-cold)' : 'var(--faint)', marginTop: 5 }}>
        {yearsBad ? 'Years must be a number.' : 'Most recent condition, and how many years it’s been that way.'}
      </div>
    </div>
  )
}

export function TaskEditor({
  tasks,
  setTasks,
  firstDescPlaceholder = 'e.g. Fix oil leaks, better tune the Holley Sniper',
}: {
  tasks: TaskInput[]
  setTasks: (updater: (prev: TaskInput[]) => TaskInput[]) => void
  firstDescPlaceholder?: string
}) {
  const [openTask, setOpenTask] = React.useState(0)
  const [confirmDel, setConfirmDel] = React.useState<number | null>(null)

  const setTask = (i: number, k: keyof TaskInput, v: string) =>
    setTasks((prev) => prev.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  const addTask = () => {
    setTasks((prev) => [...prev, emptyTask()])
    setOpenTask(tasks.length)
  }
  const rmTask = (i: number) =>
    setTasks((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : [emptyTask()]))

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map((t, i) => {
          const open = openTask === i
          if (!open) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpenTask(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: `1px solid ${
                    taskComplete(t)
                      ? 'var(--border-hairline)'
                      : 'color-mix(in oklch,var(--age-stale) 40%,transparent)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  padding: '11px 14px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--faint)',
                    flexShrink: 0,
                  }}
                >
                  Task {i + 1}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    color: 'var(--ink-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {[t.topic, t.desc].filter(Boolean).join(' — ') || (
                    <span style={{ color: 'var(--faint)' }}>Empty — click to fill in</span>
                  )}
                </span>
                {(t.parts || t.hours) && (
                  <span
                    className="tnum"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)', flexShrink: 0 }}
                  >
                    {t.parts ? `$${t.parts}` : ''}
                    {t.parts && t.hours ? ' · ' : ''}
                    {t.hours ? `${t.hours}h` : ''}
                  </span>
                )}
                <span
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  Edit
                </span>
              </button>
            )
          }
          return (
            <div
              key={i}
              style={{
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-raised)',
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--faint)',
                  }}
                >
                  Task {i + 1}
                </span>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => (taskEmpty(t) ? rmTask(i) : setConfirmDel(i))}
                  title="Remove task"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 34,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid color-mix(in oklch,var(--age-cold) 40%,transparent)',
                    background: 'color-mix(in oklch,var(--age-cold) 10%,transparent)',
                    cursor: 'pointer',
                    color: 'var(--age-cold)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  <Trash size={15} />
                  Delete
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1fr', gap: 10 }}>
                  <div>
                    <Label>Area</Label>
                    <input
                      className="fw-field"
                      list="fw-task-areas"
                      value={t.topic}
                      onChange={(e) => setTask(i, 'topic', e.target.value)}
                      placeholder="e.g. Mechanical, Paint…"
                    />
                    <datalist id="fw-task-areas">
                      {TASK_AREAS.map((x) => (
                        <option key={x} value={x} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <Label>What needs doing</Label>
                    <input
                      className="fw-field"
                      value={t.desc}
                      onChange={(e) => setTask(i, 'desc', e.target.value)}
                      placeholder={i === 0 ? firstDescPlaceholder : 'A line or two…'}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <Label>Ballpark parts cost</Label>
                    <PrefixInput
                      prefix="$"
                      error={Boolean(t.parts && !numOk(t.parts))}
                      value={t.parts}
                      onChange={(e) => setTask(i, 'parts', e.target.value)}
                      inputMode="decimal"
                      placeholder="3,200"
                    />
                    <Err show={Boolean(t.parts && !numOk(t.parts))}>Numbers only — e.g. 3200.</Err>
                  </div>
                  <div>
                    <Label>Ballpark labor hours</Label>
                    <PrefixInput
                      prefix={<User size={14} />}
                      error={Boolean(t.hours && !numOk(t.hours))}
                      value={t.hours}
                      onChange={(e) => setTask(i, 'hours', e.target.value)}
                      inputMode="decimal"
                      placeholder="60"
                    />
                    <Err show={Boolean(t.hours && !numOk(t.hours))}>Numbers only — e.g. 60.</Err>
                  </div>
                </div>
                {taskComplete(t) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <FwButton variant="ghost" size="sm" onClick={() => setOpenTask(-1)}>
                      Done — collapse
                    </FwButton>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <FwButton variant="secondary" size="lg" onClick={addTask} style={{ width: '100%' }}>
          + Add another task
        </FwButton>
      </div>

      <FwDialog
        open={confirmDel !== null}
        onClose={() => setConfirmDel(null)}
        title="Delete task?"
        width={380}
        footer={
          <>
            <FwButton variant="ghost" onClick={() => setConfirmDel(null)}>
              Cancel
            </FwButton>
            <FwButton
              variant="primary"
              icon={<Trash size={14} />}
              onClick={() => {
                if (confirmDel !== null) rmTask(confirmDel)
                setConfirmDel(null)
              }}
            >
              Delete task
            </FwButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          This removes task {confirmDel !== null ? confirmDel + 1 : ''} and everything you’ve entered
          in it. This can’t be undone.
        </p>
      </FwDialog>
    </div>
  )
}

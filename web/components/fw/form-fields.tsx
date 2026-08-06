'use client'
import * as React from 'react'
import { ListChecks } from 'lucide-react'
import { FwButton, FwDialog } from './primitives'
import { numOk, countWords, clampWords, MAX_HISTORY_WORDS, STORAGE_OPTIONS, parseTaskList } from '@/lib/form-utils'

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
  return <div className="fw-grid-2">{children}</div>
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
      <div className="fw-grid-storage">
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

function TaskPreviewList({ tasks }: { tasks: string[] }) {
  if (!tasks.length) {
    return (
      <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '4px 2px', lineHeight: 1.5 }}>
        Nothing yet — start a line with a dash, e.g. &ldquo;- Fix the oil leak&rdquo;.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tasks.map((t, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 8,
            fontSize: 13,
            padding: '8px 0',
            borderBottom: '1px solid var(--border-hairline)',
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              flexShrink: 0,
              paddingTop: 2,
            }}
          >
            Task {i + 1}:
          </span>
          <span style={{ color: 'var(--ink-2)', textWrap: 'pretty' }}>{t}</span>
        </div>
      ))}
    </div>
  )
}

// One free-form textarea — "- a task per line" — instead of a repeating list
// of little task boxes. The "Review tasks" button opens a modal with the
// parsed breakdown and asks the writer to confirm it's right. The preview
// uses the same parseTaskList() the server saves with, so what someone sees
// as "Task 1" is exactly what gets saved — if they never used a dash,
// that's the whole paragraph as one task, which combined with the bold
// warning is the nudge to go back and break it up.
//
// The confirm modal's open state can be driven externally (confirmOpen /
// onConfirmOpenChange) so a host wizard can pop it as its own "continue"
// gate — e.g. clicking Continue opens it, and confirming both closes it and
// advances via onConfirm. Without those props it just manages itself.
export function TaskListEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
  confirmOpen,
  onConfirmOpenChange,
  onConfirm,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  confirmOpen?: boolean
  onConfirmOpenChange?: (open: boolean) => void
  onConfirm?: () => void
}) {
  const tasks = React.useMemo(() => parseTaskList(value), [value])
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = confirmOpen ?? internalOpen
  const setOpen = onConfirmOpenChange ?? setInternalOpen

  return (
    <div>
      <Label req>Tasks</Label>
      <textarea
        className="fw-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={
          placeholder ??
          '- Fix the oil leaks and better tune the Holley Sniper\n- Replace the headliner\n- Sort out the A/C'
        }
        style={{ minHeight: rows * 24, resize: 'vertical' }}
      />

      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 16px',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-raised)',
            color: 'var(--ink-2)',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <ListChecks size={15} />
          Review tasks{tasks.length ? ` (${tasks.length})` : ''}
        </button>
      </div>

      <FwDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm your tasks"
        width={440}
        footer={
          <FwButton
            variant="primary"
            onClick={() => {
              setOpen(false)
              onConfirm?.()
            }}
            style={{ width: '100%' }}
          >
            Yes, continue
          </FwButton>
        }
      >
        <TaskPreviewList tasks={tasks} />
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--age-cold)',
            lineHeight: 1.5,
          }}
        >
          IF NOT: Please ensure you start each task with a dash (-) followed by your task, then
          press enter and repeat.
        </p>
      </FwDialog>
    </div>
  )
}


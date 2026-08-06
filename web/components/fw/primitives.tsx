'use client'
import * as React from 'react'

export type AgeBucket = 'fresh' | 'aging' | 'stale' | 'cold'

const AGE: Record<AgeBucket, { color: string; label: string; tip: string }> = {
  fresh: { color: 'var(--age-fresh)', label: '< 30 days', tip: 'Received less than 30 days ago' },
  aging: { color: 'var(--age-aging)', label: '30–60 days', tip: 'Received 30–60 days ago' },
  stale: { color: 'var(--age-stale)', label: '60–90 days', tip: 'Received 60–90 days ago' },
  cold: { color: 'var(--age-cold)', label: '> 90 days', tip: 'Received more than 90 days ago — getting old' },
}

export function ageBucket(receivedDate: string | null): AgeBucket {
  if (!receivedDate) return 'cold'
  const days = (Date.now() - new Date(receivedDate).getTime()) / 86_400_000
  if (days < 30) return 'fresh'
  if (days < 60) return 'aging'
  if (days < 90) return 'stale'
  return 'cold'
}

export function AgeSpine({ bucket, style }: { bucket: AgeBucket; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: 'var(--bw-spine)',
        alignSelf: 'stretch',
        background: AGE[bucket].color,
        borderRadius: '2px 0 0 2px',
        ...style,
      }}
    />
  )
}

export function AgeDot({ bucket, size = 10 }: { bucket: AgeBucket; size?: number }) {
  const a = AGE[bucket]
  return (
    <span title={a.tip} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: a.color,
          boxShadow: `0 0 0 2px color-mix(in oklch, ${a.color} 20%, transparent)`,
          flexShrink: 0,
        }}
      />
    </span>
  )
}

export function Spinner({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid color-mix(in oklch, ${color} 25%, transparent)`,
        borderTopColor: color,
        animation: 'fw-spin .7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

const TONES: Record<string, string> = {
  neutral: '#6B655D',
  red: '#C1352B',
  steel: '#3F4A55',
  green: '#15803D',
  amber: '#B45309',
  violet: '#7C3AED',
  slate: '#64748B',
  stone: '#8B8378',
  sky: '#0369A1',
}

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  icon,
  children,
  style,
}: {
  tone?: string
  variant?: 'soft' | 'solid' | 'outline'
  icon?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
}) {
  const c = TONES[tone] ?? tone
  const variants: Record<string, React.CSSProperties> = {
    soft: { background: `color-mix(in oklch, ${c} 12%, white)`, color: c, border: `1px solid color-mix(in oklch, ${c} 25%, transparent)` },
    solid: { background: c, color: '#fff', border: `1px solid ${c}` },
    outline: { background: 'transparent', color: c, border: `1px solid color-mix(in oklch, ${c} 40%, transparent)` },
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: 1,
        padding: '3px 6px',
        borderRadius: 'var(--radius-xs)',
        whiteSpace: 'nowrap',
        ...variants[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  )
}

function relAge(d: string | null): string {
  if (!d) return ''
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (n < 1) return 'today'
  if (n < 30) return `${n}d ago`
  if (n < 365) return `${Math.floor(n / 30)}mo ago`
  return `${Math.floor(n / 365)}y ago`
}

function daysSince(d: string | null): number | null {
  return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null
}

export function ContactCue({ last }: { last: string | null }) {
  const never = !last
  const days = daysSince(last)
  const warn = never || (days != null && days >= 14)
  const color = never ? 'var(--age-cold)' : warn ? 'var(--age-stale)' : 'var(--age-fresh)'
  return (
    <span
      className="tnum"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        maxWidth: '100%',
        lineHeight: 1.35,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {never ? 'Never contacted' : `Last contact ${relAge(last)}`}
    </span>
  )
}

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'steel' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  active?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function FwButton({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  active = false,
  disabled = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = React.useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: size === 'sm' ? 6 : 7,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    lineHeight: 1,
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    transition: 'background .12s ease, border-color .12s ease, color .12s ease, transform .05s ease',
    userSelect: 'none',
  }
  const sizes: Record<string, React.CSSProperties> = {
    sm: { height: 26, padding: '0 8px', fontSize: 11 },
    md: { height: 32, padding: '0 12px', fontSize: 12.5 },
    lg: { height: 40, padding: '0 18px', fontSize: 14 },
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      borderColor: 'var(--accent)',
      boxShadow: 'var(--shadow-sm)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    secondary: {
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      borderColor: 'var(--border-strong)',
      boxShadow: 'var(--shadow-xs)',
    },
    ghost: {
      background: active ? 'var(--paper-sunk)' : 'transparent',
      color: 'var(--text-muted)',
      borderColor: 'transparent',
    },
    steel: {
      background: 'var(--steel)',
      color: 'var(--steel-ink)',
      borderColor: 'var(--steel)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    destructive: { background: 'transparent', color: 'var(--age-cold)', borderColor: 'transparent' },
  }
  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent-hover)', borderColor: 'var(--accent-hover)' },
    secondary: { background: 'var(--surface-raised)', borderColor: 'var(--faint)' },
    ghost: { background: 'var(--paper-sunk)', color: 'var(--text-body)' },
    steel: { background: 'var(--steel-2)' },
    destructive: { background: 'color-mix(in oklch, var(--age-cold) 10%, transparent)' },
  }
  const hoverStyle = !disabled && hover ? hoverStyles[variant] : null
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...hoverStyle, ...style }}
      {...rest}
    >
      {icon}
      {children != null && <span>{children}</span>}
      {iconRight}
    </button>
  )
}

export function FwTooltip({
  label,
  side = 'top',
  children,
  style,
}: {
  label: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const [show, setShow] = React.useState(false)
  const pos: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  }
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && label && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...pos[side],
            zIndex: 60,
            pointerEvents: 'none',
            background: 'var(--steel)',
            color: 'var(--steel-ink)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.3,
            padding: '5px 8px',
            borderRadius: 'var(--radius-xs)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {label}
        </span>
      )}
    </span>
  )
}

export function FwDialog({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  width?: number
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(23,25,28,.55)',
        backdropFilter: 'blur(2px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        placeItems: 'center',
        padding: 'clamp(12px, 4vw, 24px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width,
          maxWidth: '100%',
          maxHeight: '86vh',
          overflow: 'auto',
          background: 'var(--surface-card)',
          color: 'var(--text-body)',
          border: '1px solid var(--border-hairline)',
          borderTop: '3px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {title != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-hairline)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}
            >
              {title}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: 'var(--text-faint)', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ padding: 18 }}>{children}</div>
        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: 8,
              padding: '12px 18px',
              borderTop: '1px solid var(--border-hairline)',
              background: 'var(--surface-raised)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export type PipelineTab = { key: string; label: string; count: number }

export function PipelineNav({
  tabs,
  active,
  onChange,
}: {
  tabs: PipelineTab[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-current={on ? 'page' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '7px 13px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              border: '1px solid transparent',
              color: on ? 'var(--text-on-accent)' : 'var(--text-muted)',
              background: on ? 'var(--accent)' : 'transparent',
              transition: 'background .12s ease, color .12s ease',
            }}
            onMouseEnter={(e) => {
              if (!on) e.currentTarget.style.background = 'var(--paper-sunk)'
            }}
            onMouseLeave={(e) => {
              if (!on) e.currentTarget.style.background = 'transparent'
            }}
          >
            {t.label}
            <span
              className="tnum"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                lineHeight: 1.4,
                color: on ? 'var(--text-on-accent)' : 'var(--text-faint)',
                background: on ? 'rgba(255,255,255,.2)' : 'var(--paper-sunk)',
              }}
            >
              {t.count}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export function fmtDate(ts: string | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' })
}
export { relAge }

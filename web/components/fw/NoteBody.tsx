'use client'
import * as React from 'react'
import { noteDateLabel, parseNotes } from '@/lib/notes'

export function NoteBody({ notes, style }: { notes: string | null; style?: React.CSSProperties }) {
  const parsed = parseNotes(notes)
  if (parsed.length === 0) return null

  return (
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
        ...style,
      }}
    >
      {parsed.map((n, i) => (
        <React.Fragment key={i}>
          {i > 0 && '\n'}
          {n.date && (
            <span style={{ fontWeight: 600, color: 'var(--steel)' }}>{noteDateLabel(n.date)} · </span>
          )}
          {n.text}
        </React.Fragment>
      ))}
    </p>
  )
}

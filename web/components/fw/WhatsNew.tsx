'use client'
import * as React from 'react'
import { Mail, StickyNote, Pencil, Undo } from 'lucide-react'
import { FwButton, FwDialog } from './primitives'

const STORAGE_KEY = 'fw_whats_new_seen'
const VERSION = '2026-08-emails-notes'

const ITEMS = [
  {
    icon: <Mail size={15} />,
    title: 'Sent emails show on the lead',
    body: 'Every email sent from the composer now appears on the lead itself, with the date, subject and full message. Click one to expand or collapse it. Past sends are included, so emails from before this change are already there.',
  },
  {
    icon: <StickyNote size={15} />,
    title: 'Notes are dated',
    body: 'A note you write from now on is stamped with the date and shows as Today, Yesterday, or the date it was written. Notes added before this change have no date — there was no record of when they were written.',
  },
  {
    icon: <Pencil size={15} />,
    title: 'Notes can be edited',
    body: 'Turn on Edit, then click the Notes block on a lead. Each note gets its own box to reword, and an ✕ to delete it. Editing a note keeps its original date.',
  },
  {
    icon: <Undo size={15} />,
    title: 'A logged call can be removed',
    body: 'In Edit mode, Call 1, 2 and 3 become clickable. Hover one and it offers to remove it — for when a call gets logged by mistake.',
  },
]

function subscribe() {
  return () => {}
}

function hasSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === VERSION
  } catch {
    return true
  }
}

export function WhatsNew() {
  const seen = React.useSyncExternalStore(subscribe, hasSeen, () => true)
  const [closed, setClosed] = React.useState(false)

  function close() {
    try {
      window.localStorage.setItem(STORAGE_KEY, VERSION)
    } catch {
      /* private mode — it shows again next visit */
    }
    setClosed(true)
  }

  return (
    <FwDialog
      open={!seen && !closed}
      onClose={close}
      title="What's new"
      width={520}
      footer={
        <FwButton variant="primary" onClick={close}>
          Got it
        </FwButton>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ITEMS.map((it) => (
          <div key={it.title} style={{ display: 'flex', gap: 11 }}>
            <span style={{ color: 'var(--steel)', display: 'flex', paddingTop: 1, flexShrink: 0 }}>{it.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{it.title}</div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </FwDialog>
  )
}

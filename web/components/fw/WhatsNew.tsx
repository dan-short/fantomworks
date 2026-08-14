'use client'
import * as React from 'react'
import { SearchX, ArrowUpDown, Smartphone } from 'lucide-react'
import { FwButton, FwDialog } from './primitives'

const STORAGE_KEY = 'fw_whats_new_seen'
const VERSION = '2026-08-sort-pwa'

const ITEMS = [
  {
    icon: <SearchX size={15} />,
    title: 'Search clears when you switch tabs',
    body: 'Jumping from Call Log to Pending (or any other tab) while a search is active now clears the search box, instead of carrying that search — and its result ordering — into the new tab.',
  },
  {
    icon: <ArrowUpDown size={15} />,
    title: 'Call Log now starts oldest-first',
    body: 'The Call Log tab defaults to the oldest received leads first, so nothing new sits unworked at the bottom. Every other tab still opens newest-first, as before.',
  },
  {
    icon: <ArrowUpDown size={15} />,
    title: 'Every sort now has a direction',
    body: 'Open Filters and each sort — Received, Customer name, Vehicle year, Distance — now offers both directions: oldest/newest, A→Z/Z→A, nearest/farthest. Pick whichever fits what you’re working on.',
  },
  {
    icon: <Smartphone size={15} />,
    title: 'Installable as an app',
    body: 'The Call Log can now be installed to your phone or desktop like a native app — look for "Install" or "Add to Home Screen" in the browser menu. It opens in its own window, no address bar.',
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

'use client'
import * as React from 'react'
import { FwButton, FwDialog } from './primitives'
import { ReleaseItemRow } from './PatchNotes'
import { LATEST_RELEASE } from './release-notes'

const STORAGE_KEY = 'fw_whats_new_seen'
const VERSION = LATEST_RELEASE.id

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

export function WhatsNew({ onSeeAll }: { onSeeAll?: () => void }) {
  const seen = React.useSyncExternalStore(subscribe, hasSeen, () => true)
  const [closed, setClosed] = React.useState(false)

  function markSeen(): boolean {
    try {
      window.localStorage.setItem(STORAGE_KEY, VERSION)
      return true
    } catch {
      return false
    }
  }

  function close() {
    markSeen()
    setClosed(true)
  }

  function seeAll() {
    close()
    onSeeAll?.()
  }

  return (
    <FwDialog
      open={!seen && !closed}
      onClose={close}
      title="What's new"
      width={520}
      footer={
        <>
          {onSeeAll && (
            <FwButton variant="ghost" onClick={seeAll}>
              All patch notes
            </FwButton>
          )}
          <FwButton variant="primary" onClick={close}>
            Got it
          </FwButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {LATEST_RELEASE.items.map((it) => (
          <ReleaseItemRow key={it.title} item={it} />
        ))}
      </div>
    </FwDialog>
  )
}

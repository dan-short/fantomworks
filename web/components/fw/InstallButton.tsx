'use client'
import * as React from 'react'
import { Download } from 'lucide-react'
import { FwButton, FwDialog } from './primitives'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  // iPadOS 13+ identifies as "MacIntel" but, unlike a real Mac, has touch support.
  return window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
}

export function InstallButton() {
  const [installed, setInstalled] = React.useState(true)
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = React.useState(false)
  const [showIosHelp, setShowIosHelp] = React.useState(false)

  React.useEffect(() => {
    setInstalled(isStandalone())
    setIos(isIOS())

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || (!deferredPrompt && !ios)) return null

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
      return
    }
    setShowIosHelp(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Install this app"
        aria-label="Install app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid rgba(255,255,255,.2)',
          background: 'rgba(255,255,255,.06)',
          color: '#fff',
          cursor: 'pointer',
          height: 32,
          padding: '0 14px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-display)',
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <Download size={15} /> <span className="fw-hide-mobile">Install</span>
      </button>

      <FwDialog
        open={showIosHelp}
        onClose={() => setShowIosHelp(false)}
        title="Install on iPhone or iPad"
        width={420}
        footer={
          <FwButton variant="primary" onClick={() => setShowIosHelp(false)}>
            Got it
          </FwButton>
        }
      >
        <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
          <li>Open this page in <strong>Safari</strong> (not another browser).</li>
          <li>
            Tap the <strong>Share</strong> button — the square with an arrow pointing up, in the toolbar.
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>.
          </li>
          <li>
            Tap <strong>Add</strong> in the top right to confirm.
          </li>
        </ol>
      </FwDialog>
    </>
  )
}

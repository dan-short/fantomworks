'use client'
import { FwButton, FwDialog } from './primitives'
import { RELEASES, formatReleaseDate, type ReleaseItem } from './release-notes'

export function ReleaseItemRow({ item }: { item: ReleaseItem }) {
  return (
    <div style={{ display: 'flex', gap: 11 }}>
      <span style={{ color: 'var(--steel)', display: 'flex', paddingTop: 1, flexShrink: 0 }}>{item.icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{item.title}</div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{item.body}</p>
      </div>
    </div>
  )
}

export function PatchNotes({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <FwDialog
      open={open}
      onClose={onClose}
      title="Patch notes"
      width={660}
      footer={
        <FwButton variant="primary" onClick={onClose}>
          Close
        </FwButton>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-muted)' }}>
          Every change that has shipped to the Call Log, newest first.
        </p>
        {RELEASES.map((rel) => (
          <section key={rel.id} style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 0 3px var(--accent-tint)',
                }}
              />
              <span style={{ flex: 1, width: 1, background: 'var(--border-hairline)', marginTop: 6 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 26 }}>
              <div
                className="tnum fw-label"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)', marginBottom: 2 }}
              >
                {formatReleaseDate(rel.date)}
              </div>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '.02em',
                  color: 'var(--ink)',
                }}
              >
                {rel.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {rel.items.map((it) => (
                  <ReleaseItemRow key={it.title} item={it} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </FwDialog>
  )
}

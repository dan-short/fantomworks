'use client'
import * as React from 'react'
import Image from 'next/image'
import { Camera, Trash, Plus, User, X } from 'lucide-react'
import type { Submission, DetailStage } from '@/lib/types'
import { FwButton, FwDialog, Spinner } from './primitives'
import {
  Field,
  Row2,
  Label,
  Err,
  PrefixInput,
  HistoryTextarea,
  StorageField,
  TaskListEditor,
} from './form-fields'
import { VEHICLES, MAKES } from '@/lib/vehicles'
import { formatPhone, phoneOk, zipOk, numOk, parseNum, yearOk, parseTaskList } from '@/lib/form-utils'
import { PHOTO_BUCKET, resolvePhotoUrl } from '@/lib/images'
import { uploadPhoto } from '@/lib/photo-upload'
import { updateLead, setStages, setPhotos, setNotes, type StageInput } from '@/app/actions/submissions'
import { noteDateLabel, parseNotes, serializeNotes } from '@/lib/notes'

export type EditSection = 'customer' | 'vehicle' | 'tasks' | 'history' | 'photos' | 'notes'

const SECTION_TITLE: Record<EditSection, string> = {
  customer: 'Edit customer',
  vehicle: 'Edit vehicle',
  tasks: 'Edit tasks',
  history: 'Edit history',
  photos: 'Edit photos',
  notes: 'Edit notes',
}

const monoStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const MAX_PHOTOS = 4

type PhotoItem = { value: string; url: string | null; uploading?: boolean }

export function LeadEditDialog({
  lead,
  stages,
  section,
  onClose,
}: {
  lead: Submission
  stages: DetailStage[]
  section: EditSection
  onClose: () => void
}) {
  const [saving, setSaving] = React.useState(false)

  const [cust, setCust] = React.useState(() => ({
    first_name: lead.first_name ?? '',
    last_name: lead.last_name ?? '',
    phone: lead.phone ?? '',
    alt_phone: lead.alt_phone ?? '',
    email: lead.email ?? '',
    call_schedule: lead.call_schedule ?? '',
    city: lead.city ?? '',
    state_country: lead.state_country ?? '',
    zipcode: lead.zipcode ?? '',
  }))

  const [veh, setVeh] = React.useState(() => ({
    year: lead.year ?? '',
    make: lead.make ?? '',
    model: lead.model ?? '',
    budget: lead.budget != null ? String(lead.budget) : '',
    project_start: lead.project_start ?? '',
    storageType: lead.storage_type ?? '',
    storageYears: lead.storage_years != null ? String(lead.storage_years) : '',
  }))

  const [history, setHistory] = React.useState(lead.project_description ?? '')

  const [notes, setNoteList] = React.useState(() => parseNotes(lead.notes))

  const [tasksRaw, setTasksRaw] = React.useState(() => {
    const descs = stages.map((s) => s.description ?? '').filter((d) => d.trim())
    return descs.map((d) => `- ${d}`).join('\n')
  })
  const [materialsCost, setMaterialsCost] = React.useState(() => {
    const sum = stages.reduce((s, x) => s + (x.parts_cost || 0), 0)
    return sum ? String(sum) : ''
  })
  const [laborHours, setLaborHours] = React.useState(() => {
    const sum = stages.reduce((s, x) => s + (x.hours || 0), 0)
    return sum ? String(sum) : ''
  })

  const [photos, setPhotoState] = React.useState<PhotoItem[]>(() =>
    (lead.images ?? []).map((v, i) => ({ value: v, url: lead.image_urls?.[i] || resolvePhotoUrl(v) })),
  )
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    const room = MAX_PHOTOS - photos.length
    setUploading(true)
    try {
      for (const file of files.slice(0, Math.max(0, room))) {
        const up = await uploadPhoto(file)
        const value = up.path ? `${PHOTO_BUCKET}/${up.path}` : up.previewUrl
        setPhotoState((prev) => [...prev, { value, url: up.previewUrl }].slice(0, MAX_PHOTOS))
      }
    } finally {
      setUploading(false)
    }
  }
  const rmPhoto = (i: number) =>
    setPhotoState((prev) => {
      const p = prev[i]
      if (p?.url?.startsWith('blob:')) URL.revokeObjectURL(p.url)
      return prev.filter((_, j) => j !== i)
    })

  const custValid =
    !!cust.first_name.trim() &&
    !!cust.last_name.trim() &&
    (!cust.phone || phoneOk(cust.phone)) &&
    (!cust.zipcode || zipOk(cust.zipcode))
  const vehValid =
    yearOk(veh.year) &&
    (!veh.budget || numOk(veh.budget)) &&
    (!veh.storageYears || numOk(veh.storageYears))
  const tasksValid =
    parseTaskList(tasksRaw).length > 0 &&
    (!materialsCost || numOk(materialsCost)) &&
    (!laborHours || numOk(laborHours))
  const canSave =
    section === 'customer'
      ? custValid
      : section === 'vehicle'
        ? vehValid
        : section === 'tasks'
          ? tasksValid
          : true

  async function save() {
    setSaving(true)
    try {
      if (section === 'customer') {
        await updateLead(lead.id, {
          first_name: cust.first_name.trim() || null,
          last_name: cust.last_name.trim() || null,
          phone: cust.phone.trim() || null,
          alt_phone: cust.alt_phone.trim() || null,
          email: cust.email.trim() || null,
          call_schedule: cust.call_schedule.trim() || null,
          city: cust.city.trim() || null,
          state_country: cust.state_country.trim() || null,
          zipcode: cust.zipcode.trim() || null,
        })
      } else if (section === 'vehicle') {
        await updateLead(lead.id, {
          year: veh.year.trim() || null,
          make: veh.make.trim() || null,
          model: veh.model.trim() || null,
          budget: parseNum(veh.budget),
          project_start: veh.project_start.trim() || null,
          storage_type: veh.storageType.trim() || null,
          storage_years: parseNum(veh.storageYears),
        })
      } else if (section === 'history') {
        await updateLead(lead.id, { project_description: history.trim() || null })
      } else if (section === 'notes') {
        await setNotes(lead.id, serializeNotes(notes))
      } else if (section === 'tasks') {
        const complete = parseTaskList(tasksRaw)
        const n = Math.max(1, complete.length)
        const totalParts = parseNum(materialsCost)
        const totalHours = parseNum(laborHours)
        const avgParts = totalParts != null ? Math.round(totalParts / n) : null
        const avgHours = totalHours != null ? Math.round(totalHours / n) : null
        const payload: StageInput[] = complete.map((t, i) => ({
          label: `Task ${i + 1}`,
          description: t.trim(),
          parts_cost: avgParts,
          hours: avgHours,
        }))
        await setStages(lead.id, payload)
      } else if (section === 'photos') {
        await setPhotos(
          lead.id,
          photos.map((p) => p.value),
        )
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const subtitle = (
    <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', marginBottom: 14 }}>
      #{lead.legacy_id} · {[lead.year, lead.make, lead.model].filter(Boolean).join(' ') || 'vehicle'} ·{' '}
      {lead.first_name} {lead.last_name}
    </div>
  )

  return (
    <FwDialog
      open
      onClose={onClose}
      title={SECTION_TITLE[section]}
      width={section === 'photos' ? 620 : 540}
      footer={
        <>
          <FwButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </FwButton>
          <FwButton variant="primary" onClick={save} disabled={!canSave || saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </FwButton>
        </>
      }
    >
      {subtitle}

      {section === 'customer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row2>
            <Field label="First name" req>
              <input className="fw-field" value={cust.first_name} onChange={(e) => setCust((s) => ({ ...s, first_name: e.target.value }))} />
            </Field>
            <Field label="Last name" req>
              <input className="fw-field" value={cust.last_name} onChange={(e) => setCust((s) => ({ ...s, last_name: e.target.value }))} />
            </Field>
          </Row2>
          <Row2>
            <div style={{ minWidth: 0 }}>
              <Label>Phone</Label>
              <input
                className="fw-field tnum"
                style={{ ...monoStyle, borderColor: cust.phone && !phoneOk(cust.phone) ? 'var(--age-cold)' : undefined }}
                value={cust.phone}
                onChange={(e) => setCust((s) => ({ ...s, phone: formatPhone(e.target.value) }))}
                inputMode="tel"
                placeholder="(757) 555-0148"
              />
              <Err show={Boolean(cust.phone && !phoneOk(cust.phone))}>Enter a 10-digit phone number.</Err>
            </div>
            <Field label="Alt phone">
              <input className="fw-field tnum" style={monoStyle} value={cust.alt_phone} onChange={(e) => setCust((s) => ({ ...s, alt_phone: e.target.value }))} placeholder="optional" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Email">
              <input className="fw-field" type="email" value={cust.email} onChange={(e) => setCust((s) => ({ ...s, email: e.target.value }))} placeholder="optional" />
            </Field>
            <Field label="Best time to call">
              <input className="fw-field" value={cust.call_schedule} onChange={(e) => setCust((s) => ({ ...s, call_schedule: e.target.value }))} placeholder="e.g. Weekdays after 5pm" />
            </Field>
          </Row2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Field label="City">
              <input className="fw-field" value={cust.city} onChange={(e) => setCust((s) => ({ ...s, city: e.target.value }))} />
            </Field>
            <Field label="State">
              <input className="fw-field" value={cust.state_country} onChange={(e) => setCust((s) => ({ ...s, state_country: e.target.value }))} />
            </Field>
            <div style={{ minWidth: 0 }}>
              <Label>Vehicle ZIP</Label>
              <input
                className="fw-field tnum"
                style={{ ...monoStyle, borderColor: cust.zipcode && !zipOk(cust.zipcode) ? 'var(--age-cold)' : undefined }}
                value={cust.zipcode}
                onChange={(e) => setCust((s) => ({ ...s, zipcode: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                inputMode="numeric"
                placeholder="23517"
              />
              <Err show={Boolean(cust.zipcode && !zipOk(cust.zipcode))}>5 digits.</Err>
            </div>
          </div>
        </div>
      )}

      {section === 'vehicle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr', gap: 14 }}>
            <Field label="Year">
              <input
                className="fw-field tnum"
                style={{ ...monoStyle, borderColor: !yearOk(veh.year) ? 'var(--age-cold)' : undefined }}
                value={veh.year}
                onChange={(e) => setVeh((s) => ({ ...s, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                inputMode="numeric"
                placeholder="1969"
              />
              <Err show={!yearOk(veh.year)}>1851–2025.</Err>
            </Field>
            <Field label="Make">
              <input className="fw-field" list="fw-edit-makes" value={veh.make} onChange={(e) => setVeh((s) => ({ ...s, make: e.target.value, model: '' }))} placeholder="Chevrolet" />
              <datalist id="fw-edit-makes">
                {MAKES.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Model">
              <input className="fw-field" list="fw-edit-models" value={veh.model} onChange={(e) => setVeh((s) => ({ ...s, model: e.target.value }))} placeholder="Camaro" />
              <datalist id="fw-edit-models">
                {(VEHICLES[veh.make] || []).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          </div>
          <Row2>
            <div style={{ minWidth: 0 }}>
              <Label>Budget</Label>
              <PrefixInput
                prefix="$"
                error={Boolean(veh.budget && !numOk(veh.budget))}
                value={veh.budget}
                onChange={(e) => setVeh((s) => ({ ...s, budget: e.target.value }))}
                inputMode="decimal"
                placeholder="80,000"
              />
              <Err show={Boolean(veh.budget && !numOk(veh.budget))}>Numbers only.</Err>
            </div>
            <Field label="When to start">
              <input className="fw-field" value={veh.project_start} onChange={(e) => setVeh((s) => ({ ...s, project_start: e.target.value }))} placeholder="ASAP / Spring 2025" />
            </Field>
          </Row2>
          <StorageField
            type={veh.storageType}
            years={veh.storageYears}
            onType={(v) => setVeh((s) => ({ ...s, storageType: v }))}
            onYears={(v) => setVeh((s) => ({ ...s, storageYears: v }))}
          />
        </div>
      )}

      {section === 'history' && (
        <Field label="History & notes">
          <HistoryTextarea value={history} onChange={setHistory} minHeight={180} placeholder="The car’s history, condition, what’s been done, what they’re after…" />
        </Field>
      )}

      {section === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--faint)' }}>No notes on this lead yet.</div>
          )}
          {notes.map((n, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--steel)',
                  }}
                >
                  {n.date ? noteDateLabel(n.date) : 'Undated'}
                </span>
                <button
                  type="button"
                  onClick={() => setNoteList((list) => list.filter((_, j) => j !== i))}
                  title="Remove note"
                  style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--faint)', display: 'flex', padding: 2 }}
                >
                  <X size={13} />
                </button>
              </div>
              <textarea
                className="fw-ta"
                value={n.text}
                rows={3}
                onChange={(e) =>
                  setNoteList((list) => list.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                }
              />
            </div>
          ))}
        </div>
      )}

      {section === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <TaskListEditor value={tasksRaw} onChange={setTasksRaw} rows={8} />
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <Label>
                Optional — based on the list, what&rsquo;s the cost of materials to accomplish it?
              </Label>
              <PrefixInput
                prefix="$"
                error={Boolean(materialsCost && !numOk(materialsCost))}
                value={materialsCost}
                onChange={(e) => setMaterialsCost(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 12,000"
              />
              <Err show={Boolean(materialsCost && !numOk(materialsCost))}>Numbers only — e.g. 12000.</Err>
            </div>
            <div>
              <Label>
                Optional — how many hours would it take to accomplish every task on the list?
              </Label>
              <PrefixInput
                prefix={<User size={14} />}
                error={Boolean(laborHours && !numOk(laborHours))}
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 200"
              />
              <Err show={Boolean(laborHours && !numOk(laborHours))}>Numbers only — e.g. 200.</Err>
            </div>
          </div>
        </div>
      )}

      {section === 'photos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple onChange={onPickFiles} style={{ display: 'none' }} />
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
              {photos.map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    overflow: 'hidden',
                    background: p.url
                      ? 'var(--paper-sunk)'
                      : 'repeating-linear-gradient(45deg,var(--paper-sunk),var(--paper-sunk) 6px,var(--surface-raised) 6px,var(--surface-raised) 12px)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--faint)',
                  }}
                >
                  {p.url ? (
                    <Image
                      src={p.url}
                      alt=""
                      fill
                      sizes="120px"
                      unoptimized={/^(blob:|data:)/.test(p.url)}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Camera size={18} />
                  )}
                  <button
                    type="button"
                    onClick={() => rmPhoto(i)}
                    title="Remove"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--surface-card)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      color: 'var(--age-cold)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < MAX_PHOTOS ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-raised)',
                padding: 22,
                cursor: uploading ? 'default' : 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? <Spinner size={20} color="var(--accent)" /> : <Plus size={22} />}
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                {uploading ? 'Uploading…' : 'Add photos'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--faint)' }}>JPG or PNG · {MAX_PHOTOS - photos.length} left</span>
            </button>
          ) : (
            <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', background: 'var(--paper-sunk)', padding: 12, textAlign: 'center', fontSize: 12.5, color: 'var(--muted)' }}>
              Max of {MAX_PHOTOS} photos — remove one to swap it out.
            </div>
          )}
        </div>
      )}
    </FwDialog>
  )
}

'use server'
import { revalidatePath } from 'next/cache'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { devStore } from '@/lib/data'
import { stampNote } from '@/lib/notes'
import type { DetailStage, SubmissionStatus } from '@/lib/types'

async function apply(id: number, patch: Record<string, unknown>) {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { error } = await supabase.from('submissions').update(patch).eq('id', id)
    if (error) throw error
  } else {
    devStore.update(id, patch)
  }
  revalidatePath('/calls')
}

const EDITABLE_COLS = new Set([
  'first_name',
  'last_name',
  'phone',
  'alt_phone',
  'email',
  'call_schedule',
  'city',
  'state_country',
  'zipcode',
  'year',
  'make',
  'model',
  'budget',
  'project_start',
  'project_description',
  'storage_type',
  'storage_years',
])

export async function updateLead(id: number, patch: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) if (EDITABLE_COLS.has(k)) clean[k] = v
  if (Object.keys(clean).length === 0) return
  await apply(id, clean)
}

export type StageInput = {
  label: string
  description: string | null
  parts_cost: number | null
  hours: number | null
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

export async function setStages(id: number, stages: StageInput[]) {
  const rows = stages
    .filter((s) => (s.label && s.label.trim()) || (s.description && s.description.trim()))
    .map((s, i) => ({
      submission_id: id,
      stage_key: slug(s.label) || `stage_${i + 1}`,
      stage_label: s.label || `Task ${i + 1}`,
      description: s.description,
      parts_cost: s.parts_cost,
      hours: s.hours,
      sort_order: i,
    }))

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { error: delErr } = await supabase
      .from('submission_detail_stages')
      .delete()
      .eq('submission_id', id)
    if (delErr) throw delErr
    if (rows.length) {
      const { error: insErr } = await supabase.from('submission_detail_stages').insert(rows)
      if (insErr) throw insErr
    }
  } else {
    const stagesForDev: DetailStage[] = rows.map((r) => ({
      key: r.stage_key,
      label: r.stage_label,
      description: r.description,
      parts_cost: r.parts_cost,
      hours: r.hours,
      sort_order: r.sort_order,
    }))
    devStore.setStages(id, stagesForDev)
  }
  revalidatePath('/calls')
}

export async function setPhotos(id: number, images: string[]) {
  const imgs = images.filter((s) => typeof s === 'string' && s.length > 0).slice(0, 4)
  if (isSupabaseConfigured) {
    const cols: Record<string, string | null> = {
      image_name_1: imgs[0] ?? null,
      image_name_2: imgs[1] ?? null,
      image_name_3: imgs[2] ?? null,
      image_name_4: imgs[3] ?? null,
    }
    await apply(id, cols)
  } else {
    devStore.update(id, { images: imgs })
  }
}

const CALL_COLS = ['call_attempt_one', 'call_attempt_two', 'call_attempt_three'] as const

export async function logCallAttempt(id: number, which: 1 | 2 | 3) {
  await apply(id, { [CALL_COLS[which - 1]]: new Date().toISOString() })
}

export async function clearCallAttempt(id: number, which: 1 | 2 | 3) {
  await apply(id, { [CALL_COLS[which - 1]]: null })
}

export async function setNotes(id: number, notes: string) {
  await apply(id, { notes: notes.trim() || null })
}

export async function logEmailAttempt(id: number) {
  await apply(id, { email_attempt: new Date().toISOString() })
}

export async function setStatus(id: number, status: SubmissionStatus) {
  await apply(id, isSupabaseConfigured ? { status } : { status, status_changed_at: new Date().toISOString() })
}

export async function addNote(id: number, note: string) {
  const stamped = stampNote(note)
  const supabase = isSupabaseConfigured ? await createClient() : null
  if (supabase) {
    const { data } = await supabase.from('submissions').select('notes').eq('id', id).single()
    const existing = (data?.notes as string | null) ?? ''
    await apply(id, { notes: existing ? `${existing}\n${stamped}` : stamped })
  } else {
    await apply(id, { notes: stamped })
  }
}

export async function bump(id: number) {
  await apply(id, { bumped_at: new Date().toISOString() })
}

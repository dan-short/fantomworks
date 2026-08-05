'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { sendSubmissionConfirmation } from '@/lib/email/confirmation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { devStore } from '@/lib/data'
import { formatPhone, parseNum, parseTaskList } from '@/lib/form-utils'
import { PHOTO_BUCKET } from '@/lib/images'
import { haversineMiles } from '@/lib/distance'
import type { DetailStage } from '@/lib/types'

type Result = { ok: true } | { ok: false; error: string }

async function distanceMilesFor(zip: string | null, client: SupabaseClient): Promise<number | null> {
  if (!zip) return null
  const { data } = await client.from('zipcodes').select('latitude, longitude').eq('zip_code', zip).maybeSingle()
  if (data?.latitude == null || data?.longitude == null) return null
  return Math.round(haversineMiles(data.latitude, data.longitude))
}

type CityState = { city: string | null; state: string | null }

async function lookupCityStateFromZip(zip: string): Promise<CityState> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=us&format=jsonv2&addressdetails=1&limit=1`,
      { headers: { 'User-Agent': 'FantomWorks-CRM/1.0 (webmaster@fantomworks.com)' } },
    )
    if (!res.ok) return { city: null, state: null }
    const results = (await res.json()) as Array<{ address?: Record<string, string> }>
    const addr = results[0]?.address
    if (!addr) return { city: null, state: null }
    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || null
    const state = addr.state || null
    return { city, state }
  } catch (err) {
    console.error('[submit] zip city/state lookup failed', err)
    return { city: null, state: null }
  }
}

// Cached in the `zipcodes` table (keyed on zip_code) so repeat ZIPs skip the network call.
// Always goes through the admin client — office submissions insert via a plain
// authenticated client with no write policy on `zipcodes`, and this cache is
// shared infrastructure unrelated to row ownership.
async function cityStateFor(zip: string | null): Promise<CityState> {
  if (!zip) return { city: null, state: null }
  if (!isSupabaseConfigured) return lookupCityStateFromZip(zip)

  const admin = createAdminClient()
  const { data } = await admin.from('zipcodes').select('city, state').eq('zip_code', zip).maybeSingle()
  if (data?.city && data?.state) return { city: data.city, state: data.state }

  const looked = await lookupCityStateFromZip(zip)
  if (looked.city || looked.state) {
    await admin.from('zipcodes').upsert({ zip_code: zip, city: looked.city, state: looked.state }, { onConflict: 'zip_code' })
  }
  return looked
}

function photoColumns(paths: (string | null)[]): Record<string, string | null> {
  const values = paths.filter((p): p is string => Boolean(p)).slice(0, 4).map((p) => `${PHOTO_BUCKET}/${p}`)
  return {
    image_name_1: values[0] ?? null,
    image_name_2: values[1] ?? null,
    image_name_3: values[2] ?? null,
    image_name_4: values[3] ?? null,
  }
}

const today = () => new Date().toISOString().slice(0, 10)

export type SelfSubmissionInput = {
  first: string
  last: string
  phone: string
  email: string
  zip: string
  schedule: string
  year: string
  make: string
  model: string
  budget: string
  startWhen: 'asap' | 'custom'
  startCustom: string
  storageType: string
  storageYears: string
  tasksRaw: string
  materialsCost: string
  laborHours: string
  description: string
  photos: { path: string | null }[]
}

export async function submitSelfSubmission(input: SelfSubmissionInput): Promise<Result> {
  const tasks = parseTaskList(input.tasksRaw)
  const first = input.first.trim()
  const last = input.last.trim()
  if (!first || !last || !/^\d{10}$/.test(input.phone.replace(/\D/g, '')) || !tasks.length) {
    return { ok: false, error: 'Missing required fields.' }
  }

  const n = tasks.length
  const totalParts = parseNum(input.materialsCost)
  const totalHours = parseNum(input.laborHours)
  const avgParts = totalParts != null ? Math.round(totalParts / n) : null
  const avgHours = totalHours != null ? Math.round(totalHours / n) : null
  const stages: DetailStage[] = tasks.map((t, i) => ({
    key: `task_${i + 1}`,
    label: `Task ${i + 1}`,
    description: t,
    parts_cost: avgParts,
    hours: avgHours,
    sort_order: i,
  }))

  const zipcode = input.zip.trim() || null
  const cityState = await cityStateFor(zipcode)
  const row: Record<string, unknown> = {
    source: 'live',
    status: 'new',
    added_by: 'Online Form',
    received_date: today(),
    first_name: first,
    last_name: last,
    phone: formatPhone(input.phone) || null,
    email: input.email.trim() || null,
    call_schedule: input.schedule.trim() || null,
    zipcode,
    city: cityState.city,
    state_country: cityState.state,
    year: input.year.trim() || null,
    make: input.make.trim() || null,
    model: input.model.trim() || null,
    budget: parseNum(input.budget),
    project_start: input.startWhen === 'asap' ? 'As soon as possible' : input.startCustom.trim() || null,
    project_description: input.description.trim() || null,
    storage_type: input.storageType.trim() || null,
    storage_years: parseNum(input.storageYears),
    ...photoColumns(input.photos.map((p) => p.path)),
  }

  if (isSupabaseConfigured) {
    const supabase = createAdminClient()
    row.distance_miles = await distanceMilesFor(zipcode, supabase)
    const { data, error } = await supabase.from('submissions').insert(row).select('id').single()
    if (error) return { ok: false, error: error.message }
    const { error: stageErr } = await supabase
      .from('submission_detail_stages')
      .insert(stages.map((s) => ({ submission_id: data.id, stage_key: s.key, stage_label: s.label, description: s.description, parts_cost: s.parts_cost, hours: s.hours, sort_order: s.sort_order })))
    if (stageErr) return { ok: false, error: stageErr.message }

    const email = row.email as string | null
    if (email) {
      const submissionId = data.id as number
      const vehicle = [input.year, input.make, input.model].map((v) => v.trim()).filter(Boolean).join(' ')
      after(async () => {
        const sent = await sendSubmissionConfirmation({ submissionId, email, firstName: first, vehicle })
        if (!sent.ok) console.error('[submit] confirmation email failed', submissionId, sent.error)
      })
    }
  } else {
    devStore.insert(row as never, stages)
  }

  revalidatePath('/calls')
  return { ok: true }
}

export type OfficeSubmissionInput = {
  first: string
  last: string
  phone: string
  altPhone: string
  email: string
  schedule: string
  city: string
  state: string
  zip: string
  year: string
  make: string
  model: string
  storageType: string
  storageYears: string
  tasks: string[]
  description: string
  addedBy: string
}

export async function submitOfficeSubmission(input: OfficeSubmissionInput): Promise<Result> {
  const tasks = input.tasks.map((t) => t.trim()).filter(Boolean)
  const first = input.first.trim()
  const last = input.last.trim()
  const make = input.make.trim()
  if (!first || !last || !input.phone.trim() || !make || !tasks.length) {
    return { ok: false, error: 'Missing required fields.' }
  }

  const stages: DetailStage[] = tasks.map((t, i) => ({
    key: `task_${i + 1}`,
    label: `Task ${i + 1}`,
    description: t,
    parts_cost: null,
    hours: null,
    sort_order: i,
  }))

  const zipcode = input.zip.trim() || null
  const city = input.city.trim()
  const state = input.state.trim()
  const cityState = !city || !state ? await cityStateFor(zipcode) : null
  const row: Record<string, unknown> = {
    source: 'live',
    status: 'new',
    added_by: input.addedBy.trim() || null,
    received_date: today(),
    first_name: first,
    last_name: last,
    phone: formatPhone(input.phone) || input.phone.trim(),
    alt_phone: input.altPhone.trim() || null,
    email: input.email.trim() || null,
    call_schedule: input.schedule.trim() || null,
    city: city || cityState?.city || null,
    state_country: state || cityState?.state || null,
    zipcode,
    year: input.year.trim() || null,
    make,
    model: input.model.trim() || null,
    project_description: input.description.trim() || null,
    storage_type: input.storageType.trim() || null,
    storage_years: parseNum(input.storageYears),
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    row.distance_miles = await distanceMilesFor(zipcode, supabase)
    const { data, error } = await supabase.from('submissions').insert(row).select('id').single()
    if (error) return { ok: false, error: error.message }
    const { error: stageErr } = await supabase
      .from('submission_detail_stages')
      .insert(stages.map((s) => ({ submission_id: data.id, stage_key: s.key, stage_label: s.label, description: s.description, parts_cost: s.parts_cost, hours: s.hours, sort_order: s.sort_order })))
    if (stageErr) return { ok: false, error: stageErr.message }
  } else {
    devStore.insert(row as never, stages)
  }

  revalidatePath('/calls')
  return { ok: true }
}

'use server'
import { revalidatePath } from 'next/cache'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { devStore } from '@/lib/data'
import type { SubmissionStatus } from '@/lib/types'

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

const CALL_COLS = ['call_attempt_one', 'call_attempt_two', 'call_attempt_three'] as const

export async function logCallAttempt(id: number, which: 1 | 2 | 3) {
  await apply(id, { [CALL_COLS[which - 1]]: new Date().toISOString() })
}

export async function logEmailAttempt(id: number) {
  await apply(id, { email_attempt: new Date().toISOString() })
}

export async function setStatus(id: number, status: SubmissionStatus) {
  await apply(id, { status })
}

export async function addNote(id: number, note: string) {
  // append rather than overwrite
  const supabase = isSupabaseConfigured ? await createClient() : null
  if (supabase) {
    const { data } = await supabase.from('submissions').select('notes').eq('id', id).single()
    const existing = (data?.notes as string | null) ?? ''
    await apply(id, { notes: existing ? `${existing}\n${note}` : note })
  } else {
    await apply(id, { notes: note })
  }
}

// Bump-to-top: in the real DB this is a Postgres function (atomic reorder).
// For the scaffold we approximate by resetting received_date to today.
export async function bump(id: number) {
  await apply(id, { received_date: new Date().toISOString().slice(0, 10) })
}

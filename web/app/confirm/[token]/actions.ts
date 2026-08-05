'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { hashConfirmToken, isValidTokenShape } from '@/lib/confirm-token'

export async function confirmSubmission(formData: FormData) {
  const token = String(formData.get('token') ?? '')
  if (!isValidTokenShape(token) || !isSupabaseConfigured) return

  const admin = createAdminClient()
  const { data } = await admin
    .from('submission_confirmations')
    .select('id, submission_id, confirmed_at, expires_at')
    .eq('token_hash', hashConfirmToken(token))
    .maybeSingle()

  if (!data || data.confirmed_at) return
  if (new Date(data.expires_at).getTime() < Date.now()) return

  const now = new Date().toISOString()
  await admin.from('submission_confirmations').update({ confirmed_at: now }).eq('id', data.id)
  await admin.from('submissions').update({ confirmed_at: now }).eq('id', data.submission_id)

  revalidatePath(`/confirm/${token}`)
  revalidatePath('/calls')
}

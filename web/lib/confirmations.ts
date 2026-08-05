import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { hashConfirmToken, isValidTokenShape } from '@/lib/confirm-token'

type Lead = { first_name: string | null; year: string | null; make: string | null; model: string | null }

export type ConfirmationState =
  | { status: 'invalid' }
  | { status: 'unavailable' }
  | { status: 'expired' }
  | { status: 'pending'; firstName: string; vehicle: string }
  | { status: 'confirmed'; firstName: string; vehicle: string }

export async function lookupConfirmation(token: string): Promise<ConfirmationState> {
  if (!isValidTokenShape(token)) return { status: 'invalid' }
  if (!isSupabaseConfigured) return { status: 'unavailable' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('submission_confirmations')
    .select('confirmed_at, expires_at, submissions (first_name, year, make, model)')
    .eq('token_hash', hashConfirmToken(token))
    .maybeSingle()

  if (error) {
    console.error('[confirm] lookup failed', error.message)
    return { status: 'unavailable' }
  }
  if (!data) return { status: 'invalid' }

  const lead = data.submissions as unknown as Lead | null
  const firstName = lead?.first_name?.trim() || ''
  const vehicle = [lead?.year, lead?.make, lead?.model].map((v) => v?.trim()).filter(Boolean).join(' ')

  if (data.confirmed_at) return { status: 'confirmed', firstName, vehicle }
  if (new Date(data.expires_at).getTime() < Date.now()) return { status: 'expired' }
  return { status: 'pending', firstName, vehicle }
}

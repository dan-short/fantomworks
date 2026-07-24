import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseUrl } from './config'

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !secretKey) {
    throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY')
  }
  return createSupabaseClient(supabaseUrl, secretKey, { auth: { persistSession: false } })
}

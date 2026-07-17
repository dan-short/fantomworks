'use client'
import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabasePublishableKey } from './config'

// Browser client. Only call when isSupabaseConfigured is true.
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabasePublishableKey!)
}

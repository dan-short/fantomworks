import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseUrl, supabasePublishableKey } from './config'

// Server client (Server Components, Server Actions, Route Handlers).
// Uses the getAll/setAll cookie API. Only call when isSupabaseConfigured is true.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes the session.
        }
      },
    },
  })
}

// Central flag: is a real Supabase project wired up yet?
// Until the phpMyAdmin export is loaded into a Supabase project and these env vars
// are set, the app runs in "dev mode" against seed data with auth bypassed.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

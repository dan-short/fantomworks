'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { DEFAULT_LANDING, safeNext } from '@/lib/auth-redirect'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error?: string }

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const destination = safeNext(String(formData.get('next') ?? '')) ?? DEFAULT_LANDING

  if (!isSupabaseConfigured) {
    redirect(destination)
  }

  const raw = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const email = raw.includes('@') ? raw : `${raw}@fantomworks.com`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect(destination)
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: 'local' })
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

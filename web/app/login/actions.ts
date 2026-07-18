'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error?: string }

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    redirect('/calls')
  }

  const raw = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const email = raw.includes('@') ? raw : `${raw}@fantomworks.com`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/calls')
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

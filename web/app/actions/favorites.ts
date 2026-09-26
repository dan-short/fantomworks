'use server'
import { revalidatePath } from 'next/cache'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { devStore } from '@/lib/data'

export async function setFavorite(id: number, on: boolean) {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    const { error } = on
      ? await supabase
          .from('submission_favorites')
          .upsert({ user_id: user.id, submission_id: id }, { onConflict: 'user_id,submission_id', ignoreDuplicates: true })
      : await supabase.from('submission_favorites').delete().eq('user_id', user.id).eq('submission_id', id)
    if (error) throw error
  } else {
    devStore.setFavorite(id, on)
  }
  revalidatePath('/calls')
}

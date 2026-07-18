'use client'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { PHOTO_BUCKET } from '@/lib/images'

export { PHOTO_BUCKET }

export type UploadedPhoto = {
  name: string
  previewUrl: string
  path: string | null
}

export type DraftPhoto = { name: string; path: string | null }

export async function uploadPhoto(file: File): Promise<UploadedPhoto> {
  const previewUrl = URL.createObjectURL(file)
  if (!isSupabaseConfigured) return { name: file.name, previewUrl, path: null }

  try {
    const supabase = createClient()
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
    if (error) {
      console.error('[submission] photo upload failed', error)
      return { name: file.name, previewUrl, path: null }
    }
    return { name: file.name, previewUrl, path }
  } catch (err) {
    console.error('[submission] photo upload threw', err)
    return { name: file.name, previewUrl, path: null }
  }
}

export const toDraftPhoto = (p: UploadedPhoto): DraftPhoto => ({ name: p.name, path: p.path })

export const fromDraftPhoto = (p: DraftPhoto): UploadedPhoto => ({
  name: p.name,
  path: p.path,
  previewUrl: '',
})

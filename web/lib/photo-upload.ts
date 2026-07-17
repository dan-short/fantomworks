'use client'
// Photo upload for the public self-submission form. When a real Supabase project
// is wired up (isSupabaseConfigured), files go to the `submission-photos` Storage
// bucket and we keep the returned object path. In dev / seed mode there's no
// project, so we fall back to an in-session object-URL preview only (path=null) —
// the UI stays fully functional and demonstrable.
//
// Bucket setup (run once on the real project — see migrations/0004):
//   create a public bucket `submission-photos`; allow anon INSERT.
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const PHOTO_BUCKET = 'submission-photos'

export type UploadedPhoto = {
  name: string
  previewUrl: string // blob: URL (this session) or a Storage public URL (on resume)
  path: string | null // Storage object path when a real upload happened
}

// Serializable subset persisted in the localStorage draft (blob URLs can't survive).
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

export function photoPublicUrl(path: string): string {
  if (!isSupabaseConfigured) return ''
  return createClient().storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

export const toDraftPhoto = (p: UploadedPhoto): DraftPhoto => ({ name: p.name, path: p.path })

// Rebuild a previewable photo from a persisted draft entry. Uploaded photos can be
// re-previewed via their public URL; dev-only placeholders come back without a preview.
export const fromDraftPhoto = (p: DraftPhoto): UploadedPhoto => ({
  name: p.name,
  path: p.path,
  previewUrl: p.path ? photoPublicUrl(p.path) : '',
})

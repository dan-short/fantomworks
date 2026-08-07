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

const MAX_EDGE = 2000
const JPEG_QUALITY = 0.85
const RESIZE_ABOVE_BYTES = 400 * 1024

async function downscale(file: File): Promise<Blob | null> {
  if (file.size <= RESIZE_ABOVE_BYTES) return null
  if (typeof createImageBitmap !== 'function') return null

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return null
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    return blob && blob.size < file.size ? blob : null
  } catch {
    return null
  } finally {
    bitmap.close()
  }
}

export async function uploadPhoto(file: File): Promise<UploadedPhoto> {
  if (!isSupabaseConfigured) {
    return { name: file.name, previewUrl: URL.createObjectURL(file), path: null }
  }

  let body: Blob = file
  try {
    body = (await downscale(file)) ?? file
  } catch (err) {
    console.error('[submission] photo downscale threw', err)
  }
  const previewUrl = URL.createObjectURL(body)

  try {
    const supabase = createClient()
    const resized = body !== file
    const ext = resized ? 'jpg' : (file.name.split('.').pop() || 'jpg').toLowerCase()
    const contentType = resized ? 'image/jpeg' : file.type || 'image/jpeg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, body, { contentType, upsert: false })
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

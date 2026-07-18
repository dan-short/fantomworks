export const UPLOADS_BASE =
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? 'https://projects.fantomworks.com/uploads/'

export const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(name)

export function resolvePhotoUrl(value: string): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
    return value
  }
  if (isImageFile(value)) return UPLOADS_BASE + value
  return null
}

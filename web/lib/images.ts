// Legacy images still live on the old Bluehost host; point at them directly for now.
// (Phase 2 moves these into Supabase Storage.)
export const UPLOADS_BASE =
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? 'https://projects.fantomworks.com/uploads/'

export const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(name)

// Resolve a stored image value to a displayable URL. New photos (added via the
// Call Log edit) are stored as full Supabase Storage public URLs; legacy imports
// are bare filenames on the old Bluehost host. Returns null when it's neither
// (e.g. a placeholder name in dev) so callers fall back to a placeholder tile.
export function resolvePhotoUrl(value: string): string | null {
  if (!value) return null
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
    return value
  }
  if (isImageFile(value)) return UPLOADS_BASE + value
  return null
}

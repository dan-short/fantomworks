// Legacy images still live on the old Bluehost host; point at them directly for now.
// (Phase 2 moves these into Supabase Storage.)
export const UPLOADS_BASE =
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? 'https://projects.fantomworks.com/uploads/'

export const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(name)

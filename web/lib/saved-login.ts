const KEY = 'fw-saved-login'

export type SavedLogin = { email: string; password: string }

export function readSavedLogin(): SavedLogin | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.email === 'string' && typeof parsed?.password === 'string') {
      return { email: parsed.email, password: parsed.password }
    }
    return null
  } catch {
    return null
  }
}

export function saveLogin(login: SavedLogin) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(login))
  } catch {}
}

export function clearSavedLogin() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
}

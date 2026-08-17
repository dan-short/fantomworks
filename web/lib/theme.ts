export type Theme = 'day' | 'night'

export const THEME_KEY = 'fw_theme'
export const THEME_ATTR = 'data-fw-theme'

export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==='night'||t==='day')document.documentElement.setAttribute(${JSON.stringify(
  THEME_ATTR,
)},t)}catch(e){}})()`

export function storedTheme(): Theme | null {
  try {
    const t = window.localStorage.getItem(THEME_KEY)
    return t === 'night' || t === 'day' ? t : null
  } catch {
    return null
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute(THEME_ATTR, theme)
  saveTheme(theme)
}

export function setThemeAttr(theme: Theme): void {
  document.documentElement.setAttribute(THEME_ATTR, theme)
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute(THEME_ATTR) === 'night' ? 'night' : 'day'
}

function saveTheme(theme: Theme): boolean {
  try {
    window.localStorage.setItem(THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}

export const onlyDigits = (v: string) => (v || '').replace(/\D/g, '')

export const formatPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 10)
  const a = d.slice(0, 3)
  const b = d.slice(3, 6)
  const c = d.slice(6, 10)
  if (d.length > 6) return `(${a}) ${b}-${c}`
  if (d.length > 3) return `(${a}) ${b}`
  if (d.length > 0) return `(${a}`
  return ''
}

export const phoneOk = (v: string) => onlyDigits(v).length === 10
export const zipOk = (v: string) => /^\d{5}$/.test((v || '').trim())

export const numOk = (v: string) => {
  const n = (v || '').replace(/[$,\s]/g, '')
  return n !== '' && /^\d+(\.\d+)?$/.test(n)
}
export const parseNum = (v: string): number | null => {
  const n = (v || '').replace(/[$,\s]/g, '')
  return n !== '' && /^\d+(\.\d+)?$/.test(n) ? Number(n) : null
}

export const yearNum = (v: string) => {
  const n = parseInt(onlyDigits(v), 10)
  return isNaN(n) ? null : n
}
export const yearOk = (v: string) => {
  if (!(v || '').trim()) return true
  const n = yearNum(v)
  return n !== null && n > 1850 && n < 2026
}

export const MAX_HISTORY_WORDS = 300
export const countWords = (v: string) => (v.trim() ? v.trim().split(/\s+/).length : 0)
export const clampWords = (v: string, max = MAX_HISTORY_WORDS) => {
  const words = v.split(/(\s+)/)
  let count = 0
  let out = ''
  for (const tok of words) {
    if (/^\s+$/.test(tok) || tok === '') {
      out += tok
      continue
    }
    if (count >= max) break
    out += tok
    count++
  }
  return out
}

// Splits free-form "- one task per line" text into discrete tasks. A line
// starting with -/*/• begins a new task; any line without that prefix is
// treated as a continuation of the current one. If the writer never uses a
// bullet at all, everything collapses into a single task — which is the
// point: it surfaces as "Task 1: <whole paragraph>" in the preview so
// someone who just rambled in one block can see they need to break it up.
export const parseTaskList = (raw: string): string[] => {
  const tasks: string[] = []
  let current: string[] = []
  let started = false
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const m = /^[-*•]\s*(.*)$/.exec(line)
    if (m) {
      if (started) tasks.push(current.join(' ').trim())
      current = [m[1]]
      started = true
    } else {
      current.push(line)
    }
  }
  if (current.length) tasks.push(current.join(' ').trim())
  return tasks.filter(Boolean)
}

export const STORAGE_OPTIONS = [
  'Indoor — climate-controlled',
  'Indoor — unheated garage / barn',
  'Carport / covered outdoor',
  'Outdoor — under a car cover',
  'Outdoor — uncovered / exposed',
  'Disassembled / in pieces',
  'Driven / in regular use',
  'Other',
] as const


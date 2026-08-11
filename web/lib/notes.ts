const STAMP = /^\[(\d{4}-\d{2}-\d{2})\]\s?/

export interface ParsedNote {
  date: string | null
  text: string
}

function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function stampNote(note: string, when: Date = new Date()): string {
  return `[${isoDay(when)}] ${note}`
}

export function parseNotes(notes: string | null | undefined): ParsedNote[] {
  if (!notes) return []
  const out: ParsedNote[] = []
  for (const line of notes.split('\n')) {
    const m = STAMP.exec(line)
    if (m) out.push({ date: m[1], text: line.slice(m[0].length) })
    else if (out.length) out[out.length - 1].text += `\n${line}`
    else out.push({ date: null, text: line })
  }
  return out
}

export function serializeNotes(notes: ParsedNote[]): string {
  return notes
    .filter((n) => n.text.trim())
    .map((n) => (n.date ? `[${n.date}] ${n.text}` : n.text))
    .join('\n')
}

export function noteDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  const when = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - when.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  const sameYear = when.getFullYear() === now.getFullYear()
  return when.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

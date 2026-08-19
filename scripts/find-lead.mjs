// Find leads by name/phone/email across EVERY status, including 'deleted'
// rows that the app's tabs and search deliberately hide. Read-only.
//
// Run: node scripts/find-lead.mjs "Percy Barksdale"
//      node scripts/find-lead.mjs barksdale
//      node scripts/find-lead.mjs 5551234567

import { readFileSync } from 'node:fs'
import { createClient } from '../web/node_modules/@supabase/supabase-js/dist/main/index.js'

// load web/.env
const env = {}
for (const line of readFileSync(new URL('../web/.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in web/.env')

const query = process.argv.slice(2).join(' ').trim()
if (!query) throw new Error('Usage: node scripts/find-lead.mjs "<name | phone | email>"')

const supabase = createClient(url, key, { auth: { persistSession: false } })

// Each whitespace-separated token must match somewhere on the row, so
// "percy barksdale" still hits when the name is split across two columns.
const tokens = query.split(/\s+/)
const COLS = ['first_name', 'last_name', 'phone', 'alt_phone', 'email']

let rows = null
for (const token of tokens) {
  const or = COLS.map((c) => `${c}.ilike.%${token}%`).join(',')
  const { data, error } = await supabase
    .from('submissions')
    .select('id, legacy_id, first_name, last_name, phone, email, status, received_date, status_changed_at, year, make, model')
    .or(or)
    .limit(500)
  if (error) throw error

  const ids = new Set(data.map((r) => r.id))
  rows = rows === null ? data : rows.filter((r) => ids.has(r.id))
  if (rows.length === 0) break
}

if (rows.length === 0) {
  console.log(`No submissions match "${query}" in any status.`)
  process.exit(0)
}

rows.sort((a, b) => (a.received_date ?? '').localeCompare(b.received_date ?? ''))

console.log(`${rows.length} match${rows.length === 1 ? '' : 'es'} for "${query}":\n`)
for (const r of rows) {
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || '(no name)'
  const car = [r.year, r.make, r.model].filter(Boolean).join(' ')
  console.log(`  #${r.legacy_id ?? r.id}  [${r.status}]  ${name}${car ? ` — ${car}` : ''}`)
  console.log(`     received ${r.received_date ?? '(none)'}   status changed ${r.status_changed_at ?? '(never)'}`)
  console.log(`     ${r.phone ?? '(no phone)'}   ${r.email ?? '(no email)'}   id=${r.id}`)
}

const deleted = rows.filter((r) => r.status === 'deleted')
if (deleted.length) {
  console.log(`\n${deleted.length} of these are soft-deleted and therefore invisible in the app.`)
  console.log(`Restore to Call Log with:`)
  console.log(`  update submissions set status = 'new' where id in (${deleted.map((r) => r.id).join(', ')});`)
}

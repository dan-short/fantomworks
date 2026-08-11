// Soft-delete Call Log leads (status = 'new') whose received_date is 7+ years old.
// Previews by default; pass --apply to write. status_changed_at is set by the
// submissions_set_status_changed_at trigger, so it is not written here.
//
// Run: node scripts/purge-old-call-log.mjs
//      node scripts/purge-old-call-log.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '../web/node_modules/@supabase/supabase-js/dist/main/index.js'

const env = {}
for (const line of readFileSync(new URL('../web/.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in web/.env')

const supabase = createClient(url, key, { auth: { persistSession: false } })

const YEARS = 7
const now = new Date()
const cutoff = new Date(now.getFullYear() - YEARS, now.getMonth(), now.getDate())
  .toISOString()
  .slice(0, 10)

const apply = process.argv.includes('--apply')

const { count, error: countErr } = await supabase
  .from('submissions')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'new')
  .lt('received_date', cutoff)
if (countErr) throw countErr

const { count: totalNew } = await supabase
  .from('submissions')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'new')

const { count: undated } = await supabase
  .from('submissions')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'new')
  .is('received_date', null)

console.log(`cutoff              received_date < ${cutoff}`)
console.log(`Call Log total      ${totalNew}`)
console.log(`matching (7y+)      ${count}`)
console.log(`no received_date    ${undated}  (never matched, left alone)`)

const { data: sample, error: sampleErr } = await supabase
  .from('submissions')
  .select('id, legacy_id, first_name, last_name, received_date, year, make, model')
  .eq('status', 'new')
  .lt('received_date', cutoff)
  .order('received_date', { ascending: true })
  .limit(10)
if (sampleErr) throw sampleErr

console.log('\noldest 10:')
for (const r of sample) {
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || '(no name)'
  const car = [r.year, r.make, r.model].filter(Boolean).join(' ')
  console.log(`  #${r.legacy_id ?? r.id}  ${r.received_date}  ${name}${car ? ` — ${car}` : ''}`)
}

if (!apply) {
  console.log(`\nPreview only. Re-run with --apply to soft-delete these ${count}.`)
  process.exit(0)
}

const { data: targets, error: idErr } = await supabase
  .from('submissions')
  .select('id')
  .eq('status', 'new')
  .lt('received_date', cutoff)
  .limit(10000)
if (idErr) throw idErr

const ids = targets.map((r) => r.id)
const receipt = new URL(`./purged-call-log-${cutoff}.json`, import.meta.url)
writeFileSync(receipt, JSON.stringify({ cutoff, ran_at: now.toISOString(), ids }, null, 2))
console.log(`\nwrote ${ids.length} ids to ${receipt.pathname}`)

const { error: updErr, count: updated } = await supabase
  .from('submissions')
  .update({ status: 'deleted' }, { count: 'exact' })
  .in('id', ids)
if (updErr) throw updErr

const { count: remaining } = await supabase
  .from('submissions')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'new')

console.log(`\nsoft-deleted        ${updated}`)
console.log(`Call Log remaining  ${remaining}`)

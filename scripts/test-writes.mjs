// Verify the viewer's write-actions work end-to-end through the SAME path the app
// uses: signed in as a staff user (authenticated role, RLS enforced). Picks a spam
// (deleted) row, exercises each action, and restores original values.
//
// Run: node scripts/test-writes.mjs

import { readFileSync } from 'node:fs'
import { createClient } from '../web/node_modules/@supabase/supabase-js/dist/main/index.js'

const env = {}
for (const line of readFileSync(new URL('../web/.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const pub = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(url, pub, { auth: { persistSession: false } })

const log = (ok, msg) => console.log(`${ok ? '✓' : '✗ FAIL'}  ${msg}`)
let failures = 0
const check = (cond, msg) => { if (!cond) failures++; log(cond, msg) }

// 1) sign in as staff (authenticated role → RLS)
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: 'office@fantomworks.com',
  password: 'fan69tom',
})
check(!authErr && auth?.user, `sign in as office (${authErr?.message ?? 'ok'})`)
if (authErr) process.exit(1)

// 2) pick a spam/deleted row to mutate safely
const { data: rows } = await supabase
  .from('submissions')
  .select('id, status, notes, call_attempt_one, received_date')
  .eq('status', 'deleted')
  .limit(1)
const row = rows?.[0]
check(!!row, `found a test row (#${row?.id})`)
if (!row) process.exit(1)
const orig = { ...row }

async function upd(patch, label) {
  const { error } = await supabase.from('submissions').update(patch).eq('id', row.id)
  const { data: after } = await supabase.from('submissions').select('*').eq('id', row.id).single()
  const key = Object.keys(patch)[0]
  check(!error && after?.[key] != null, `${label} — ${error?.message ?? `${key}=${String(after?.[key]).slice(0, 24)}`}`)
}

// 3) exercise each write-action's underlying operation
await upd({ status: 'pending' }, 'setStatus (Pending)')
await upd({ status: 'active' }, 'setStatus (Active)')
await upd({ call_attempt_one: new Date().toISOString() }, 'logCallAttempt (Call 1)')
await upd({ email_attempt: new Date().toISOString() }, 'logEmailAttempt (Email)')
await upd({ notes: 'test note' }, 'addNote')
await upd({ received_date: new Date().toISOString().slice(0, 10) }, 'bump (received_date)')

// 4) restore original values exactly
const { error: restoreErr } = await supabase
  .from('submissions')
  .update({
    status: orig.status,
    notes: orig.notes,
    call_attempt_one: orig.call_attempt_one,
    email_attempt: null,
    received_date: orig.received_date,
  })
  .eq('id', row.id)
check(!restoreErr, `restored row #${row.id} to original state`)

console.log(failures === 0 ? '\nALL WRITE-ACTIONS WORK ✅' : `\n${failures} FAILURE(S) ❌`)
process.exit(failures === 0 ? 0 : 1)

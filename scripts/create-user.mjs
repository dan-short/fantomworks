// Create/update a staff login in the FantomWorks Supabase project using the
// service (secret) key. Invite-only — no public sign-up.
//
// Run: node scripts/create-user.mjs office@fantomworks.com fan69tom

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

const email = process.argv[2] ?? 'office@fantomworks.com'
const password = process.argv[3] ?? 'fan69tom'

const supabase = createClient(url, key, { auth: { persistSession: false } })

// find existing by email
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
if (listErr) throw listErr
const existing = list.users.find((u) => u.email === email)

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
  if (error) throw error
  console.log(`Updated existing user ${email} (password reset).`)
} else {
  const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  console.log(`Created user ${email}.`)
}
console.log(`Sign in with email "${email}" (or just "office") and the password you set.`)

'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { isStatus } from '@/lib/types'
import { DEFAULT_TEMPLATES, TEMPLATE_GROUPS, type EmailTemplate, type TemplateGroup } from '@/lib/email/templates'
import { toRow } from '@/lib/email/template-store'

export type TemplateResult = { ok: true } | { ok: false; error: string }

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

function clean(t: EmailTemplate): EmailTemplate | null {
  const id = slugify(t.id || t.label)
  const label = t.label.trim()
  if (!id || !label) return null
  return {
    id,
    label,
    blurb: t.blurb.trim(),
    group: TEMPLATE_GROUPS.includes(t.group as TemplateGroup) ? t.group : 'Move forward',
    subject: t.subject,
    header: t.header,
    body: t.body,
    footer: t.footer,
    suggestedStatus: t.suggestedStatus && isStatus(t.suggestedStatus) ? t.suggestedStatus : null,
  }
}

async function client() {
  if (!isSupabaseConfigured) return null
  return createClient()
}

function done() {
  revalidatePath('/templates')
  revalidatePath('/calls')
}

export async function saveTemplate(template: EmailTemplate, sortOrder: number): Promise<TemplateResult> {
  const t = clean(template)
  if (!t) return { ok: false, error: 'A template needs a name.' }

  const supabase = await client()
  if (!supabase) return { ok: false, error: 'Templates are read-only until Supabase is configured.' }

  const { error } = await supabase
    .from('email_templates')
    .upsert({ ...toRow(t, sortOrder), updated_at: new Date().toISOString() }, { onConflict: 'slug' })
  if (error) return { ok: false, error: error.message }

  done()
  return { ok: true }
}

export async function archiveTemplate(slug: string): Promise<TemplateResult> {
  const supabase = await client()
  if (!supabase) return { ok: false, error: 'Templates are read-only until Supabase is configured.' }

  const { error } = await supabase
    .from('email_templates')
    .update({ archived_at: new Date().toISOString() })
    .eq('slug', slug)
  if (error) return { ok: false, error: error.message }

  done()
  return { ok: true }
}

export async function resetTemplate(slug: string): Promise<TemplateResult> {
  const original = DEFAULT_TEMPLATES.find((t) => t.id === slug)
  if (!original) return { ok: false, error: 'That template has no shipped default to restore.' }

  const supabase = await client()
  if (!supabase) return { ok: false, error: 'Templates are read-only until Supabase is configured.' }

  const sortOrder = DEFAULT_TEMPLATES.indexOf(original)
  const { error } = await supabase
    .from('email_templates')
    .upsert(
      { ...toRow(original, sortOrder), archived_at: null, updated_at: new Date().toISOString() },
      { onConflict: 'slug' },
    )
  if (error) return { ok: false, error: error.message }

  done()
  return { ok: true }
}

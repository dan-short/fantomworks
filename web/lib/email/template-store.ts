import 'server-only'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { isStatus } from '@/lib/types'
import { DEFAULT_TEMPLATES, TEMPLATE_GROUPS, type EmailTemplate, type TemplateGroup } from './templates'

type Row = {
  slug: string
  label: string
  blurb: string
  template_group: string
  subject: string
  header: string
  body: string
  footer: string
  suggested_status: string | null
  sort_order: number
}

const COLS = 'slug, label, blurb, template_group, subject, header, body, footer, suggested_status, sort_order'

function toTemplate(row: Row): EmailTemplate {
  const group = TEMPLATE_GROUPS.includes(row.template_group as TemplateGroup)
    ? (row.template_group as TemplateGroup)
    : 'Move forward'
  return {
    id: row.slug,
    label: row.label,
    blurb: row.blurb,
    group,
    subject: row.subject,
    header: row.header,
    body: row.body,
    footer: row.footer,
    suggestedStatus: row.suggested_status && isStatus(row.suggested_status) ? row.suggested_status : null,
  }
}

export function toRow(t: EmailTemplate, sortOrder: number) {
  return {
    slug: t.id,
    label: t.label,
    blurb: t.blurb,
    template_group: t.group,
    subject: t.subject,
    header: t.header,
    body: t.body,
    footer: t.footer,
    suggested_status: t.suggestedStatus,
    sort_order: sortOrder,
  }
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  if (!isSupabaseConfigured) return DEFAULT_TEMPLATES

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select(COLS)
    .is('archived_at', null)
    .order('sort_order')

  if (error) {
    console.error('[templates] read failed, falling back to defaults', error.message)
    return DEFAULT_TEMPLATES
  }
  if (data && data.length > 0) return (data as Row[]).map(toTemplate)

  const { error: seedError } = await supabase
    .from('email_templates')
    .insert(DEFAULT_TEMPLATES.map((t, i) => toRow(t, i)))
  if (seedError) console.error('[templates] seed failed', seedError.message)
  return DEFAULT_TEMPLATES
}

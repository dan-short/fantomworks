import type { Metadata } from 'next'
import { getTemplates } from '@/lib/email/template-store'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { TemplateManager } from '@/components/fw/TemplateManager'

export const metadata: Metadata = {
  title: 'Email Templates — FantomWorks',
}

export default async function TemplatesPage() {
  const templates = await getTemplates()
  return <TemplateManager templates={templates} devMode={!isSupabaseConfigured} />
}

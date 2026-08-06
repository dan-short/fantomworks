import { notFound } from 'next/navigation'
import { getSubmission, getDetailStages } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { isEmailConfigured, staffMailFrom } from '@/lib/email/config'
import { getTemplates } from '@/lib/email/template-store'
import { getSentEmails } from '@/lib/email/history'
import { EmailComposer } from '@/components/fw/EmailComposer'

export default async function ComposeEmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadId = Number(id)
  if (!Number.isFinite(leadId)) notFound()

  const [lead, stages, templates, history] = await Promise.all([
    getSubmission(leadId),
    getDetailStages(leadId),
    getTemplates(),
    getSentEmails(leadId),
  ])
  if (!lead) notFound()

  return (
    <EmailComposer
      lead={lead}
      stages={stages}
      templates={templates}
      history={history}
      fromLabel={staffMailFrom}
      devMode={!isSupabaseConfigured || !isEmailConfigured}
    />
  )
}

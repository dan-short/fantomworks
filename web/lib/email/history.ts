import 'server-only'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type SentEmail = {
  id: number
  templateLabel: string | null
  toEmail: string
  subject: string
  bodyText: string
  sentAt: string | null
  sentBy: string | null
  sendError: string | null
}

const COLS = 'id, template_label, to_email, subject, body_text, sent_at, sent_by, send_error'

export async function getSentEmails(submissionId: number, limit = 10): Promise<SentEmail[]> {
  if (!isSupabaseConfigured) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('submission_emails')
    .select(COLS)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: r.id as number,
      templateLabel: (r.template_label as string | null) ?? null,
      toEmail: r.to_email as string,
      subject: r.subject as string,
      bodyText: (r.body_text as string | null) ?? '',
      sentAt: (r.sent_at as string | null) ?? null,
      sentBy: (r.sent_by as string | null) ?? null,
      sendError: (r.send_error as string | null) ?? null,
    }
  })
}

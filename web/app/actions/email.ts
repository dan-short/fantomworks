'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { devStore } from '@/lib/data'
import { isStatus, type SubmissionStatus } from '@/lib/types'
import { createResendClient } from '@/lib/email/client'
import { isEmailConfigured, staffMailFrom, staffMailReplyTo } from '@/lib/email/config'
import { composeHtml, composeText, isSendable, type EmailParts } from '@/lib/email/compose'

export type SendLeadEmailInput = EmailParts & {
  submissionId: number
  to: string
  templateSlug: string
  templateLabel: string
  applyStatus: SubmissionStatus | null
}

export type SendResult = { ok: true } | { ok: false; error: string }

export async function sendLeadEmail(input: SendLeadEmailInput): Promise<SendResult> {
  const parts: EmailParts = {
    subject: input.subject.trim(),
    header: input.header,
    body: input.body,
    footer: input.footer,
  }
  const to = input.to.trim()
  const applyStatus = input.applyStatus && isStatus(input.applyStatus) ? input.applyStatus : null

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, error: 'That is not a valid email address.' }
  if (!isSendable(parts)) return { ok: false, error: 'Add a subject and some content before sending.' }
  if (!isEmailConfigured) return { ok: false, error: 'Email is not configured — RESEND_API_KEY is missing.' }

  const text = composeText(parts)

  if (!isSupabaseConfigured) {
    devStore.update(input.submissionId, {
      email_attempt: new Date().toISOString(),
      ...(applyStatus ? { status: applyStatus, status_changed_at: new Date().toISOString() } : {}),
    })
    revalidatePath('/calls')
    return { ok: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sentBy = user?.email ?? null

  const { data: logRow } = await supabase
    .from('submission_emails')
    .insert({
      submission_id: input.submissionId,
      template_slug: input.templateSlug,
      template_label: input.templateLabel,
      to_email: to,
      from_email: staffMailFrom,
      subject: parts.subject,
      header: parts.header,
      body: parts.body,
      footer: parts.footer,
      body_text: text,
      sent_by: sentBy,
      status_applied: applyStatus,
    })
    .select('id')
    .single()

  const { data, error } = await createResendClient().emails.send({
    from: staffMailFrom,
    to: [to],
    replyTo: staffMailReplyTo,
    subject: parts.subject,
    html: composeHtml(parts),
    text,
  })

  if (error) {
    if (logRow) await supabase.from('submission_emails').update({ send_error: error.message }).eq('id', logRow.id)
    return { ok: false, error: error.message }
  }

  if (logRow) {
    await supabase
      .from('submission_emails')
      .update({ sent_at: new Date().toISOString(), provider_message_id: data?.id ?? null })
      .eq('id', logRow.id)
  }

  const patch: Record<string, unknown> = { email_attempt: new Date().toISOString() }
  if (applyStatus) patch.status = applyStatus
  const { error: updateError } = await supabase.from('submissions').update(patch).eq('id', input.submissionId)
  if (updateError) console.error('[email] sent but failed to update lead', input.submissionId, updateError.message)

  revalidatePath('/calls')
  return { ok: true }
}

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { mintConfirmToken } from '@/lib/confirm-token'
import { createResendClient } from './client'
import { isEmailConfigured, mailFrom, mailReplyTo, shopPhone, siteUrl } from './config'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const BODY = [
  'Thank you for your project submission. You have been added to the call log. If you have submitted a reasonable project with reasonable expectations, you should expect a return call typically within 2–4 weeks from Dan Short, as quickly as he can review the submissions and reach out. He is the sole reviewer and receives overwhelming requests.',
  `If you do not receive a response within four weeks, and you have accurately followed the guidelines of the project estimating tool, please call the shop during normal business hours at ${shopPhone} and inquire about your project.`,
  'If you submitted a project with an unrealistic budget based on the budget estimating tool, or you are requesting work that does not fit our shop because of year, make, or model, then you will receive a generic email stating we cannot take on your project. If you submit a project with an insulting budget, the submission will be deleted and you will not receive a response.',
  'Dan sometimes calls during the day but typically calls in the evenings between 6:00 PM and 9:30 PM EST. He will call you from a 757 area code. Only about 10% of those calls are answered because of call screening.',
  'He returns thousands of phone calls each year. If you are unable to answer when he calls and you do not return his call, he will move on to the next one. Because virtually every human in the USA has caller ID, he does not bother leaving voicemails. If you get a call from a 757 589-XXXX number in the evening, it is likely him. He may try you again on a different day according to your requested schedule, or he may email you. If he tries to contact you three times without an answer or a return call, he will delete the submission and move on.',
  'We appreciate your patience and look forward to speaking with you about your project. We strive to provide only the best in customer service, but please keep in mind we are a small crew and our ability to answer phones is limited by the personnel available.',
]

type Content = { subject: string; html: string; text: string }

export function confirmationEmail(firstName: string, vehicle: string, confirmUrl: string): Content {
  const name = firstName.trim() || 'there'
  const subject = vehicle ? `FantomWorks — we got your ${vehicle}` : 'FantomWorks — we got your submission'

  const intro = vehicle
    ? `${name}, we received your submission for the ${vehicle}.`
    : `${name}, we received your project submission.`

  const ask =
    'Before anything else, please confirm this is a good email address for you — it is how we will reach you if Dan cannot get you by phone.'

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:8px 4px">
<p style="margin:0 0 16px">${escapeHtml(intro)}</p>
<p style="margin:0 0 20px">${escapeHtml(ask)}</p>
<p style="margin:0 0 24px"><a href="${confirmUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:600">Confirm my submission</a></p>
<p style="margin:0 0 24px;font-size:13px;color:#555">If the button does not work, paste this into your browser:<br /><span style="word-break:break-all">${escapeHtml(confirmUrl)}</span></p>
${BODY.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join('\n')}
<p style="margin:24px 0 0">Sincerely,<br />The FantomWorks Team</p>
<p style="margin:16px 0 0;font-size:13px;color:#555">Replying to this email is fine — it reaches us directly.</p>
</div>`

  const text = [
    intro,
    '',
    ask,
    '',
    `Confirm here: ${confirmUrl}`,
    '',
    ...BODY.flatMap((p) => [p, '']),
    'Sincerely,',
    'The FantomWorks Team',
    '',
    'Replying to this email is fine — it reaches us directly.',
  ].join('\n')

  return { subject, html, text }
}

type SendParams = {
  submissionId: number
  email: string
  firstName: string
  vehicle: string
}

export async function sendSubmissionConfirmation({
  submissionId,
  email,
  firstName,
  vehicle,
}: SendParams): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured || !isSupabaseConfigured) return { ok: false, error: 'email not configured' }

  const admin = createAdminClient()
  const { token, tokenHash, expiresAt } = mintConfirmToken()

  const { data: row, error: insertError } = await admin
    .from('submission_confirmations')
    .insert({
      submission_id: submissionId,
      token_hash: tokenHash,
      email,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  const confirmUrl = `${siteUrl}/confirm/${token}`
  const { subject, html, text } = confirmationEmail(firstName, vehicle, confirmUrl)

  const { data, error } = await createResendClient().emails.send(
    {
      from: mailFrom,
      to: [email],
      replyTo: mailReplyTo,
      subject,
      html,
      text,
    },
    { idempotencyKey: `submission-confirmation/${submissionId}` },
  )

  if (error) {
    await admin.from('submission_confirmations').update({ send_error: error.message }).eq('id', row.id)
    return { ok: false, error: error.message }
  }

  await admin
    .from('submission_confirmations')
    .update({ sent_at: new Date().toISOString(), provider_message_id: data?.id ?? null })
    .eq('id', row.id)

  return { ok: true }
}

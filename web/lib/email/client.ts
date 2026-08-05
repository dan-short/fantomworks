import 'server-only'
import { Resend } from 'resend'

let client: Resend | null = null

export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('Sending email requires RESEND_API_KEY')
  if (!client) client = new Resend(apiKey)
  return client
}

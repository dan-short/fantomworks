export const mailFrom = process.env.MAIL_FROM ?? 'FantomWorks <fwmail@fantomworks.com>'
export const mailReplyTo = process.env.MAIL_REPLY_TO ?? 'webmaster@fantomworks.com'

export const staffMailFrom = process.env.MAIL_FROM_STAFF ?? 'Dan Short <drs@fantomworks.com>'
export const staffMailReplyTo = process.env.MAIL_REPLY_TO_STAFF ?? 'drs@fantomworks.com'

export const shopPhone = '(757) 216-1745'

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fantomworks.com').replace(/\/+$/, '')

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY)

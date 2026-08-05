import 'server-only'
import { createHash, randomBytes } from 'node:crypto'

export const CONFIRM_TOKEN_TTL_DAYS = 30

export function hashConfirmToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function mintConfirmToken() {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + CONFIRM_TOKEN_TTL_DAYS * 86_400_000)
  return { token, tokenHash: hashConfirmToken(token), expiresAt }
}

export function isValidTokenShape(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}

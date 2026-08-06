export type EmailParts = {
  subject: string
  header: string
  body: string
  footer: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function section(text: string): string[] {
  return paragraphs(text)
}

export function composeSections(parts: EmailParts): { header: string[]; body: string[]; footer: string[] } {
  return {
    header: section(parts.header),
    body: section(parts.body),
    footer: section(parts.footer),
  }
}

export function composeText(parts: EmailParts): string {
  const { header, body, footer } = composeSections(parts)
  return [...header, ...body, ...footer].join('\n\n')
}

export function composeHtml(parts: EmailParts): string {
  const { header, body, footer } = composeSections(parts)
  const para = (p: string) =>
    `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`
  const blocks = [...header.map(para), ...body.map(para), ...footer.map(para)].join('\n')
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:8px 4px">
${blocks}
</div>`
}

export function isSendable(parts: EmailParts): boolean {
  return Boolean(parts.subject.trim()) && composeText(parts).trim().length > 0
}

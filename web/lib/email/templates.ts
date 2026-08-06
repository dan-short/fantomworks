import { shopPhone } from './config'
import type { SubmissionStatus } from '@/lib/types'

export type TemplateGroup = 'Move forward' | 'Gather info' | 'Slow down' | 'Decline'

export type EmailTemplate = {
  id: string
  label: string
  blurb: string
  group: TemplateGroup
  subject: string
  header: string
  body: string
  footer: string
  suggestedStatus: SubmissionStatus | null
}

export type TemplateTokens = {
  first: string
  last: string
  name: string
  vehicle: string
  budget: string
  phone: string
  shop_phone: string
}

export const TOKENS: { key: keyof TemplateTokens; label: string }[] = [
  { key: 'first', label: 'First name' },
  { key: 'last', label: 'Last name' },
  { key: 'name', label: 'Full name' },
  { key: 'vehicle', label: 'Year make model' },
  { key: 'budget', label: 'Budget' },
  { key: 'phone', label: 'Their phone' },
  { key: 'shop_phone', label: 'Shop phone' },
]

const SIGNATURE = `Sincerely,\nDan Short\nFantomWorks\n{{shop_phone}}`

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'blank',
    label: 'Blank',
    blurb: 'Greeting and sign-off only — write the middle yourself.',
    group: 'Move forward',
    subject: 'FantomWorks — your {{vehicle}}',
    header: '{{first}},',
    body: '',
    footer: SIGNATURE,
    suggestedStatus: null,
  },
  {
    id: 'pursue',
    label: 'Pursue Build',
    blurb: 'We want the project. Opens the door to scheduling a real conversation.',
    group: 'Move forward',
    subject: 'FantomWorks — your {{vehicle}}',
    header:
      '{{first}},\n\nThanks for sending over the {{vehicle}}. I have reviewed your submission and this is the kind of project we would like to take on.',
    body:
      'Your budget and the work you described line up well enough that it is worth a real conversation. Before we go further I want to walk through the scope with you, confirm the condition of the car, and make sure we agree on where the money goes first.\n\nBring any additional photos, receipts, or history you have. The more I know going in, the more accurate the estimate will be.',
    footer: `We look forward to hearing from you.\n\n${SIGNATURE}`,
    suggestedStatus: 'pending',
  },
  {
    id: 'unreasonable',
    label: 'Unreasonable Expectations',
    blurb: 'The scope and the budget do not meet. Firm, not rude.',
    group: 'Slow down',
    subject: 'FantomWorks — your {{vehicle}} submission',
    header:
      '{{first}},\n\nThank you for your submission on the {{vehicle}}. I have reviewed it carefully, and I want to be straight with you rather than waste your time.',
    body:
      'The work you have described and the budget you submitted do not line up. A project of this scope, done to the standard we hold, costs considerably more than {{budget}}. We will not take a build we cannot finish properly, and we will not start one knowing it will stall halfway through.\n\nIf you want to revisit this, the path forward is to narrow the scope significantly — pick the two or three things that matter most to you and let the rest wait — or to plan for a budget that matches the work as described.',
    footer: `If you would like to talk through a smaller scope, call the shop at {{shop_phone}} during normal business hours.\n\n${SIGNATURE}`,
    suggestedStatus: 'possible',
  },
  {
    id: 'not-a-fit',
    label: 'Not Our Shop (year / make / model)',
    blurb: 'Good project, wrong shop — the car is outside what we work on.',
    group: 'Decline',
    subject: 'FantomWorks — your {{vehicle}}',
    header:
      '{{first}},\n\nThank you for thinking of FantomWorks for your {{vehicle}}.',
    body:
      'This particular car falls outside what our shop is set up to do well. We are a small crew, and we stay inside the years, makes, and models where we know the parts, the sourcing, and the pitfalls. Taking on a car we do not know would not serve you.\n\nI would rather tell you that now than six months into a build.',
    footer: `I hope you find the right shop for it — it deserves one.\n\n${SIGNATURE}`,
    suggestedStatus: 'archived',
  },
  {
    id: 'more-info',
    label: 'Need More Information',
    blurb: 'Cannot evaluate it yet. Asks for photos, condition, history.',
    group: 'Gather info',
    subject: 'FantomWorks — a few questions about your {{vehicle}}',
    header:
      '{{first}},\n\nI am looking at your submission for the {{vehicle}} and I need a bit more before I can give you a straight answer.',
    body:
      'Please send the following:\n\n- Clear photos of all four corners, the interior, the engine bay, and the underside if you can get to it\n- Any rust you know about, and where\n- Whether it runs and drives, and how recently\n- Any work already done, with receipts if you have them\n- What you want the finished car to be — a driver, a show car, or something in between',
    footer: `Reply to this email with what you have and I will pick it back up from there.\n\n${SIGNATURE}`,
    suggestedStatus: 'pending',
  },
  {
    id: 'schedule-call',
    label: 'Schedule a Call',
    blurb: 'Pin down a window to actually talk on the phone.',
    group: 'Gather info',
    subject: 'FantomWorks — finding a time to talk about your {{vehicle}}',
    header:
      '{{first}},\n\nI have been trying to reach you about the {{vehicle}} and would rather get you on the phone than keep trading messages.',
    body:
      'I typically call in the evenings between 6:00 PM and 9:30 PM EST, from a 757 area code. Reply with a couple of windows that work for you and I will call inside one of them.\n\nIf a different number is better than {{phone}}, send that along too.',
    footer: `Looking forward to speaking with you.\n\n${SIGNATURE}`,
    suggestedStatus: 'pending',
  },
  {
    id: 'estimate',
    label: 'Ballpark Estimate & Next Steps',
    blurb: 'Puts real numbers in front of them and names the next step.',
    group: 'Move forward',
    subject: 'FantomWorks — ballpark numbers for your {{vehicle}}',
    header:
      '{{first}},\n\nHere is where the {{vehicle}} lands based on what you have told me so far.',
    body:
      'This is a ballpark, not a quote. Real numbers come after the car is in front of us and we have had it apart far enough to see what is actually there.\n\n[Scope and rough figures]\n\nWhat almost always moves this number is rust, previous repair work done badly, and parts availability. None of those can be priced from photos.',
    footer: `If these figures work for you, the next step is getting the car scheduled in so we can look at it properly.\n\n${SIGNATURE}`,
    suggestedStatus: 'pending',
  },
  {
    id: 'waitlist',
    label: 'Shop at Capacity / Waitlist',
    blurb: 'Yes to the project, no to the timing. Keeps them warm.',
    group: 'Slow down',
    subject: 'FantomWorks — your {{vehicle}} and our current schedule',
    header:
      '{{first}},\n\nI like the {{vehicle}} project. The problem is timing, not the car.',
    body:
      'The shop is full right now, and I will not stack another build on top of the ones already in the bays — that is how projects sit untouched for months. I would rather be honest about the calendar than take your deposit and park your car.\n\nI am keeping your submission on the list. When a bay opens up I will reach out.',
    footer: `Thanks for your patience — we will be in touch.\n\n${SIGNATURE}`,
    suggestedStatus: 'possible',
  },
  {
    id: 'out-of-area',
    label: 'Distance & Transport',
    blurb: 'They are far out. Sets expectations on hauling and shop visits.',
    group: 'Gather info',
    subject: 'FantomWorks — logistics for your {{vehicle}}',
    header:
      '{{first}},\n\nBefore we go further on the {{vehicle}}, we should talk about distance.',
    body:
      'We are in Norfolk, Virginia. Getting your car here and back is on you, and enclosed transport both ways is a real line item that people tend to forget when they set a budget.\n\nIt also means you will not be dropping by to check on progress. We send photos and updates, but if being hands-on matters to you, a shop closer to home may serve you better.',
    footer: `If the logistics work on your end, let me know and we will keep going.\n\n${SIGNATURE}`,
    suggestedStatus: 'possible',
  },
  {
    id: 'unreachable',
    label: 'Unable to Reach You',
    blurb: 'Final attempt before the submission gets closed out.',
    group: 'Slow down',
    subject: 'FantomWorks — last try on your {{vehicle}}',
    header:
      '{{first}},\n\nI have tried to reach you about the {{vehicle}} without getting through.',
    body:
      'I return thousands of calls a year and cannot keep chasing one submission indefinitely. This is my last attempt before I close it out and move to the next project in the queue.\n\nIf you are still interested, reply to this email or call the shop at {{shop_phone}} during normal business hours. If I do not hear back, no hard feelings — I will assume the timing did not work out.',
    footer: SIGNATURE,
    suggestedStatus: 'possible',
  },
  {
    id: 'decline',
    label: 'Polite Decline',
    blurb: 'Generic no, no reason given. The catch-all.',
    group: 'Decline',
    subject: 'FantomWorks — your {{vehicle}} submission',
    header:
      '{{first}},\n\nThank you for submitting the {{vehicle}} to FantomWorks.',
    body:
      'After reviewing it, we are not able to take on your project. We are a small crew and can only accept a fraction of what comes through, so a great many good projects get turned down simply because we do not have the capacity to do them justice.',
    footer: `I wish you the best with it.\n\n${SIGNATURE}`,
    suggestedStatus: 'archived',
  },
]

export const TEMPLATE_GROUPS: TemplateGroup[] = ['Move forward', 'Gather info', 'Slow down', 'Decline']

export function tokensFor(lead: {
  first_name: string | null
  last_name: string | null
  year: string | null
  make: string | null
  model: string | null
  budget: number | null
  phone: string | null
}): TemplateTokens {
  const first = (lead.first_name ?? '').trim()
  const last = (lead.last_name ?? '').trim()
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(' ').trim()
  return {
    first: first || 'there',
    last,
    name: [first, last].filter(Boolean).join(' ') || 'there',
    vehicle: vehicle || 'project',
    budget: lead.budget != null ? `$${lead.budget.toLocaleString('en-US')}` : 'the budget you gave us',
    phone: lead.phone ?? 'the number we have on file',
    shop_phone: shopPhone,
  }
}

export function fillTokens(text: string, tokens: TemplateTokens): string {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in tokens ? tokens[key as keyof TemplateTokens] : whole,
  )
}

export function applyTemplate(t: EmailTemplate, tokens: TemplateTokens) {
  return {
    subject: fillTokens(t.subject, tokens),
    header: fillTokens(t.header, tokens),
    body: fillTokens(t.body, tokens),
    footer: fillTokens(t.footer, tokens),
  }
}

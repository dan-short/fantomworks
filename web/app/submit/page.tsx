import type { Metadata } from 'next'
import { SelfSubmissionForm } from '@/components/fw/SelfSubmissionForm'

export const metadata: Metadata = {
  title: 'Submit Your Project — FantomWorks',
  description: 'Tell us about your classic car project and we’ll be in touch.',
}

// Public, customer-facing project submission wizard. Unauthenticated — see the
// public allowlist in proxy.ts. The form owns its own .fw theme root + header.
export default function SubmitPage() {
  return <SelfSubmissionForm />
}

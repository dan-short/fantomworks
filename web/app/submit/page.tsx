import type { Metadata } from 'next'
import { SelfSubmissionForm } from '@/components/fw/SelfSubmissionForm'

export const metadata: Metadata = {
  title: 'Submit Your Project — FantomWorks',
  description: 'Tell us about your classic car project and we’ll be in touch.',
}

export default function SubmitPage() {
  return <SelfSubmissionForm />
}

import type { Metadata } from 'next'
import { OfficeSubmissionForm } from '@/components/fw/OfficeSubmissionForm'

export const metadata: Metadata = {
  title: 'New Lead · Office — FantomWorks',
  description: 'Staff quick-entry for a phoned-in or walk-in customer.',
}

export default function OfficeSubmissionPage() {
  return <OfficeSubmissionForm />
}

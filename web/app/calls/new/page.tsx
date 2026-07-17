import type { Metadata } from 'next'
import { OfficeSubmissionForm } from '@/components/fw/OfficeSubmissionForm'

export const metadata: Metadata = {
  title: 'New Lead · Office — FantomWorks',
  description: 'Staff quick-entry for a phoned-in or walk-in customer.',
}

// Staff-only office intake. Sits under /calls so it's behind the same auth as the
// Call Log console. The form owns its own .fw theme root and steel header.
export default function OfficeSubmissionPage() {
  return <OfficeSubmissionForm />
}

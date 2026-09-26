import type { Metadata } from 'next'
import { SelfSubmissionForm } from '@/components/fw/SelfSubmissionForm'
import { SUBMIT_URL, MAIN_SITE_ORIGIN, ORGANIZATION_ID, SHOP } from '@/lib/seo'

const title = 'Submit Your Project | FantomWorks Project Submission Form'

const description =
  'Submit your classic car project to FantomWorks. Tell the shop about your vehicle, your budget and the work you want done — Dan Short personally reviews every submission.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: SUBMIT_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  openGraph: {
    type: 'website',
    url: SUBMIT_URL,
    siteName: 'FantomWorks',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AutoRepair',
      '@id': ORGANIZATION_ID,
      name: SHOP.name,
      url: MAIN_SITE_ORIGIN,
      telephone: SHOP.telephone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SHOP.street,
        addressLocality: SHOP.city,
        addressRegion: SHOP.region,
        postalCode: SHOP.postalCode,
        addressCountry: SHOP.country,
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${SUBMIT_URL}#webpage`,
      url: SUBMIT_URL,
      name: title,
      description,
      inLanguage: 'en-US',
      isPartOf: { '@id': ORGANIZATION_ID },
      about: { '@id': ORGANIZATION_ID },
      significantLink: MAIN_SITE_ORIGIN,
      potentialAction: {
        '@type': 'CommunicateAction',
        name: 'Submit your project',
        target: SUBMIT_URL,
      },
    },
  ],
}

export default function SubmitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SelfSubmissionForm />
    </>
  )
}

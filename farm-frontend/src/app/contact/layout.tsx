import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact & Feedback | Farm Companion',
  description: 'Have a question, suggestion, or need help? Contact Farm Companion for support with our UK farm shops directory and seasonal produce guide.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact & Feedback | Farm Companion',
    description: 'Have a question, suggestion, or need help? Contact Farm Companion for support with our UK farm shops directory.',
    url: `${SITE_URL}/contact`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/og?title=Contact%20and%20Feedback&subtitle=Questions%20and%20corrections`,
        width: 1200,
        height: 630,
        alt: 'Contact Farm Companion - UK farm shops directory',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact & Feedback | Farm Companion',
    description: 'Have a question, suggestion, or need help? Contact Farm Companion for support with our UK farm shops directory.',
    images: [`${SITE_URL}/og?title=Contact%20and%20Feedback&subtitle=Questions%20and%20corrections`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

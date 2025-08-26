import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy | Farm Companion',
  description: 'Privacy policy for Farm Companion. Learn how we collect, use, and protect your data when using our UK farm shops directory and seasonal produce guide.',
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | Farm Companion',
    description: 'Privacy policy for Farm Companion. Learn how we collect, use, and protect your data.',
    url: `${SITE_URL}/privacy`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Privacy Policy - Farm Companion',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Farm Companion',
    description: 'Privacy policy for Farm Companion. Learn how we collect, use, and protect your data.',
    images: [`${SITE_URL}/og.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

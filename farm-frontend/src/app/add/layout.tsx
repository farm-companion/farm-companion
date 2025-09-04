import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Add Your Farm Shop | Farm Companion',
  description: 'Add your farm shop to our UK directory. Help customers find your fresh local produce, seasonal offerings, and authentic farm experiences.',
  alternates: {
    canonical: `${SITE_URL}/add`,
  },
  openGraph: {
    title: 'Add Your Farm Shop | Farm Companion',
    description: 'Add your farm shop to our UK directory. Help customers find your fresh local produce and authentic farm experiences.',
    url: `${SITE_URL}/add`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/add.jpg`,
        width: 1200,
        height: 630,
        alt: 'Add your farm shop - UK farm directory',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add Your Farm Shop | Farm Companion',
    description: 'Add your farm shop to our UK directory. Help customers find your fresh local produce and authentic farm experiences.',
    images: [`${SITE_URL}/add.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AddLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

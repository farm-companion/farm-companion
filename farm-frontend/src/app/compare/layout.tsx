import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Compare Farm Shops | Farm Companion',
  description: 'Compare farm shops side by side. View ratings, offerings, locations, and more to find the perfect farm shop for you.',
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: 'Compare Farm Shops | Farm Companion',
    description: 'Compare farm shops side by side to find your perfect local producer.',
    url: `${SITE_URL}/compare`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}

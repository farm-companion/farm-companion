import type { Metadata } from 'next'

import { PRODUCE } from '@/data/produce'
import { SITE_URL } from '@/lib/site'
import JsonLd from '@/components/JsonLd'
import { SeasonalPageClient } from '@/components/seasonal/SeasonalPageClient'

// Revalidate every 12 hours for seasonal data
export const revalidate = 43200

export const metadata: Metadata = {
  title: 'British Seasonal Produce Calendar | Farm Companion',
  description: 'Explore all 12 months of British seasonal produce. Find the freshest local fruits and vegetables at farm shops near you, with detailed guides for every season.',
  alternates: {
    canonical: `${SITE_URL}/seasonal`,
  },
  openGraph: {
    title: 'British Seasonal Produce Calendar | Farm Companion',
    description: 'Complete year-round guide to seasonal British produce. Discover what\'s fresh each month at UK farm shops.',
    url: `${SITE_URL}/seasonal`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/seasonal-header.jpg`,
        width: 1200,
        height: 630,
        alt: 'British seasonal produce calendar - UK farm shops',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'British Seasonal Produce Calendar | Farm Companion',
    description: 'Complete year-round guide to seasonal British produce at UK farm shops.',
    images: [`${SITE_URL}/seasonal-header.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function SeasonalPage() {
  const currentMonth = new Date().getMonth() + 1

  // CollectionPage + ItemList JSON-LD
  const seasonalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/seasonal#collection`,
    url: `${SITE_URL}/seasonal`,
    name: 'British Seasonal Produce Calendar',
    description: 'Complete year-round guide to seasonal produce available at UK farm shops',
    isPartOf: { '@id': `${SITE_URL}#website` },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Seasonal Produce',
      numberOfItems: PRODUCE.length,
      itemListOrder: 'http://schema.org/ItemListOrderAscending',
      itemListElement: PRODUCE.map((produce, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: produce.name,
          url: `${SITE_URL}/seasonal/${produce.slug}`,
          description: `British seasonal guide for ${produce.name}`,
        }
      }))
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <JsonLd data={seasonalJsonLd} />
      <SeasonalPageClient
        allProduce={PRODUCE}
        currentMonth={currentMonth}
      />
    </main>
  )
}

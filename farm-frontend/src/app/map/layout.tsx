import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmcompanion.co.uk'
const mapUrl = `${siteUrl}/map`
const itemCount = 1300 // consider deriving from your dataset at build time

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Farm Shop Map - Find Local Farms Near You',
  description:
    'Interactive map of 1,300+ UK farm shops. Find farm shops near you with fresh local produce, seasonal guides, and verified farm information. Search by location, county, or postcode.',
  keywords: [
    'farm shop map',
    'farm shops near me',
    'UK farm shop finder',
    'local farm map',
    'farm shop directory',
    'farm shop locator',
    'farm shops by county',
  ],
  alternates: {
    canonical: '/map',
  },
  openGraph: {
    type: 'website',
    url: mapUrl,
    siteName: 'Farm Companion',
    title: 'Farm Shop Map - Find Local Farms Near You',
    description:
      'Interactive map of 1,300+ UK farm shops. Find farm shops near you with fresh local produce and verified farm information.',
    images: [
      {
        url: `${siteUrl}/og?title=UK Farm Shop Map&subtitle=Find Farm Shops Near You&type=map`,
        width: 1200,
        height: 630,
        alt: 'Interactive UK farm shop map',
      },
    ],
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farm Shop Map - Find Local Farms Near You',
    description:
      'Interactive map of 1,300+ UK farm shops. Find farm shops near you with fresh local produce and verified farm information.',
    images: [`${siteUrl}/og?title=UK Farm Shop Map&subtitle=Find Farm Shops Near You&type=map`],
    // site: '@yourhandle', // optional
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
}

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // JSON-LD: WebSite (with SearchAction) + CollectionPage with ItemList
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: 'Farm Companion',
      description: 'Find farm shops across the UK.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${mapUrl}?query={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${mapUrl}#collection`,
      url: mapUrl,
      name: 'UK Farm Shops Directory',
      isPartOf: { '@id': `${siteUrl}#website` },
      description:
        'Comprehensive directory of UK farm shops with an interactive map.',
      mainEntity: {
        '@type': 'ItemList',
        name: 'UK Farm Shops',
        numberOfItems: itemCount,
        itemListOrder: 'http://schema.org/ItemListOrderAscending',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@type': 'GroceryStore', // or "Store" / "FoodEstablishment" depending on your listings
              name: 'UK Farm Shops (Map)',
              description:
                'Explore farm shops near you with fresh local produce.',
              url: mapUrl,
            },
          },
        ],
      },
    },
  ]

  return (
    <>
      {/* SEO: Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}

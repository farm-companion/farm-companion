import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { FarmShop } from '@/types/farm'
import { processFarmDescription } from '@/lib/seo-utils'
import FarmAnalytics from '@/components/FarmAnalytics'
import { getValidApprovedPhotosBySlug } from '@/lib/photos'
import { FarmPageClient } from '@/components/FarmPageClient'
import { getFarmBySlug } from '@/lib/farm-data'

// Revalidate every 6 hours for fresh farm data
export const revalidate = 21600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shop = await getFarmBySlug(slug)
  if (!shop) return { title: 'Farm shop not found' }
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  const url = `/shop/${encodeURIComponent(shop.slug)}`
  // Process farm description to extract keywords and clean for SEO
  const { cleanDescription, seoDescription } = processFarmDescription(shop.description || '')
  const description = cleanDescription 
    ? `${seoDescription.substring(0, 160)}...` 
    : `${shop.location.address}, ${shop.location.county} ${shop.location.postcode}`

  return {
    title: `${shop.name} · Farm Companion`,
    description: description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url: `${base}${url}`,
      title: shop.name,
      description: description,
      images: [
        {
          url: `${base}/og?farmName=${encodeURIComponent(shop.name)}&county=${encodeURIComponent(shop.location.county)}&type=farm`,
          width: 1200,
          height: 630,
          alt: `${shop.name} - Farm shop in ${shop.location.county}`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: shop.name,
      description: description,
      images: [`${base}/og?farmName=${encodeURIComponent(shop.name)}&county=${encodeURIComponent(shop.location.county)}&type=farm`],
    },
  }
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await getFarmBySlug(slug)
  if (!shop) notFound()

  // Fetch approved photos for this farm (only those that exist in blob storage)
  const approvedPhotos = await getValidApprovedPhotosBySlug(slug)

  const { name, location, contact, offerings, verified, hours } = shop
  const { cleanDescription, keywords } = processFarmDescription(shop.description || '')
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  const ghOwner = process.env.NEXT_PUBLIC_GH_OWNER || 'farm-companion'
  const ghRepo  = process.env.NEXT_PUBLIC_GH_REPO  || 'farm-frontend'
  const pageUrl = `${base}/shop/${encodeURIComponent(shop.slug)}`
  // Include page URL in the title so it's captured even when using forms
  const issueTitle = `Data fix: ${shop.name} (${shop.slug}) — ${pageUrl}`
  const issueUrl =
    `https://github.com/${ghOwner}/${ghRepo}/issues/new?` +
    `title=${encodeURIComponent(issueTitle)}` +
    `&labels=${encodeURIComponent('data,report')}` +
    `&template=data_fix.yml`

  // Enhanced JSON-LD (GroceryStore + BreadcrumbList)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'GroceryStore',
      '@id': `${base}/shop/${encodeURIComponent(shop.slug)}#store`,
      name: shop.name,
      url: `${base}/shop/${encodeURIComponent(shop.slug)}`,
      description: cleanDescription || `${shop.name} - Farm shop in ${shop.location.county}`,
      image: Array.isArray(shop.images) && shop.images.length > 0
        ? shop.images.slice(0, 3).map(img => typeof img === 'string' ? img : img.url)
        : undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: shop.location?.address || '',
        addressLocality: shop.location?.county || '',
        addressRegion: shop.location?.county || '',
        postalCode: shop.location?.postcode || '',
        addressCountry: 'GB'
      },
      geo: shop.location.lat && shop.location.lng ? {
        '@type': 'GeoCoordinates',
        latitude: shop.location.lat,
        longitude: shop.location.lng
      } : undefined,
      telephone: contact?.phone || undefined,
      email: contact?.email || undefined,
      sameAs: contact?.website ? [contact.website] : undefined,
      // Opening hours, if provided
      openingHoursSpecification:
        Array.isArray(shop.hours) && shop.hours.length
          ? shop.hours
              .filter(h => h.open && h.close && h.day)
              .map(h => ({
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: dayToSchema(h.day),
                opens: h.open,
                closes: h.close
              }))
          : undefined,
      // What they offer (keywords help discovery)
      keywords: Array.isArray(offerings) && offerings.length ? offerings.join(', ') : undefined,
      // Additional keywords from description
      ...(keywords.length > 0 && { additionalKeywords: keywords.join(', ') }),
      // Business type and verification
      ...(verified && { 
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'Verification',
          name: 'Verified Farm Shop'
        }
      }),
      // Serves cuisine type
      servesCuisine: 'British',
      // Price range
      priceRange: '££',
      // Payment accepted
      paymentAccepted: 'Cash, Credit Card, Debit Card',
      // Currencies accepted
      currenciesAccepted: 'GBP'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${base}/shop/${encodeURIComponent(shop.slug)}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: base
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Farm Shops',
          item: `${base}/shop`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: shop.name,
          item: `${base}/shop/${encodeURIComponent(shop.slug)}`
        }
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* SEO: LocalBusiness JSON-LD + Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmAnalytics slug={shop.slug} name={shop.name} />

      <FarmPageClient
        shop={shop}
        cleanDescription={cleanDescription}
        directionsUrl={directionsUrl}
        issueUrl={issueUrl}
        approvedPhotos={approvedPhotos}
      />
    </main>
  )
}

function dayToSchema(day: string) {
  // Map our "Mon" → "Monday" etc., fallback to undefined
  switch (day) {
    case 'Mon': return 'https://schema.org/Monday'
    case 'Tue': return 'https://schema.org/Tuesday'
    case 'Wed': return 'https://schema.org/Wednesday'
    case 'Thu': return 'https://schema.org/Thursday'
    case 'Fri': return 'https://schema.org/Friday'
    case 'Sat': return 'https://schema.org/Saturday'
    case 'Sun': return 'https://schema.org/Sunday'
    default: return undefined
  }
}

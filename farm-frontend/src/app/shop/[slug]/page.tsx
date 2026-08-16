import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { FarmShop } from '@/types/farm'
import { processFarmDescription } from '@/lib/seo-utils'
import FarmAnalytics from '@/components/FarmAnalytics'
import { FarmPageClient } from '@/components/FarmPageClient'
import { getFarmBySlug } from '@/lib/farm-data'
import { canClaimVisitable, isIndexable, type ClaimInput } from '@/lib/farm-claims'

// Revalidate every 6 hours for fresh farm data
export const revalidate = 21600

// Task 7 (region-first-verified-listings): gate input shared by
// generateMetadata and the page body so both agree on whether this page may
// claim visitability. Real-photo provenance is already resolved upstream:
// getFarmBySlug's hero selector returns only owner/admin/user photos and its
// gallery mapping excludes every ai_* row, so a present heroImage or
// gallery image here is never AI-generated.
function buildClaimInput(farm: FarmShop): ClaimInput {
  return {
    venueType: farm.venueType ?? null,
    venueVerifiedAt: farm.venueVerifiedAt ?? null,
    openingHours: farm.openingHours ?? null,
    phone: farm.contact?.phone ?? null,
    website: farm.contact?.website ?? null,
    description: farm.description ?? null,
    offerings: farm.offerings ?? [],
    hasRealImage: Boolean(farm.heroImage) || Boolean(farm.images?.length),
  }
}

// The only sentence an unverified page may say about visitability: it exists
// as a food producer, and access is unconfirmed.
function unverifiedDescription(county: string): string {
  return `A registered food producer in ${county || 'the UK'}. We have not confirmed whether it is open to visitors.`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shop = await getFarmBySlug(slug)
  if (!shop) return { title: 'Farm shop not found' }
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  const url = `/shop/${encodeURIComponent(shop.slug)}`
  const claimInput = buildClaimInput(shop)
  const canClaim = canClaimVisitable(claimInput)
  // Process farm description to extract keywords and clean for SEO
  const { cleanDescription, seoDescription } = processFarmDescription(shop.description || '')
  const description = !canClaim
    ? unverifiedDescription(shop.location.county)
    : cleanDescription
      ? `${seoDescription.substring(0, 160)}...`
      : `${shop.location.address}, ${shop.location.county} ${shop.location.postcode}`
  const imageAlt = canClaim
    ? `${shop.name} - Farm shop in ${shop.location.county}`
    : `${shop.name} in ${shop.location.county}`
  // canClaim=1 is the only thing that unlocks the "Farm Shop" label on the
  // shared /og card (see og/route.tsx); absent, the card names the farm and
  // county only.
  const ogImageUrl = `${base}/og?farmName=${encodeURIComponent(shop.name)}&county=${encodeURIComponent(shop.location.county)}&type=farm${canClaim ? '&canClaim=1' : ''}`

  return {
    title: `${shop.name} · Farm Companion`,
    description: description,
    alternates: { canonical: url },
    robots: isIndexable(claimInput)
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: 'website',
      url: `${base}${url}`,
      title: shop.name,
      description: description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: shop.name,
      description: description,
      images: [ogImageUrl],
    },
  }
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await getFarmBySlug(slug)
  if (!shop) notFound()

  const { name, location, contact, offerings, hours } = shop
  const claimInput = buildClaimInput(shop)
  const canClaim = canClaimVisitable(claimInput)
  const { cleanDescription: rawDescription, keywords } = processFarmDescription(shop.description || '')
  // Gate: an unverified page renders only the producer sentence, never the
  // raw description or any "farm shop" claim derived from it (JSON-LD
  // description and the on-page About section below both read this).
  const cleanDescription = canClaim ? rawDescription : unverifiedDescription(location.county)
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
      // A machine claim mirrors the prose claim: GroceryStore asserts public
      // retail access, so it is only used once that access is verified.
      '@type': canClaim ? 'GroceryStore' : 'Organization',
      '@id': `${base}/shop/${encodeURIComponent(shop.slug)}#store`,
      name: shop.name,
      url: `${base}/shop/${encodeURIComponent(shop.slug)}`,
      description: cleanDescription || `${shop.name} - Farm shop in ${shop.location.county}`,
      image: (() => {
        // Prefer the selected hero (real photo or Apothecary illustration)
        // first so search engines associate the canonical visual with the
        // page; fall back to gallery URLs when no hero exists yet (Slice 1.1.3b).
        const heroUrl = shop.heroImage?.url
        const galleryUrls = Array.isArray(shop.images)
          ? shop.images
              .map(img => typeof img === 'string' ? img : img.url)
              .filter((u): u is string => !!u && u !== heroUrl)
          : []
        const combined = heroUrl ? [heroUrl, ...galleryUrls] : galleryUrls
        return combined.length > 0 ? combined.slice(0, 3) : undefined
      })(),
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
      // Additional keywords from description. processFarmDescription always
      // appends 13 hardcoded "farm shop near me" style phrases whenever the
      // raw description is non-empty, so this is gated here rather than in
      // the shared helper: an unverified page must not repeat that claim.
      ...(canClaim && keywords.length > 0 && { additionalKeywords: keywords.join(', ') }),
      // Business type and verification. Gated on the claim gate, not the
      // legacy `verified` flag: `verified` is reserved for owner
      // confirmation of listing accuracy and is deliberately not read by
      // the claim gate (see venueVerifiedAt's schema comment).
      ...(canClaim && {
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'Verification',
          name: 'Verified Farm Shop'
        }
      }),
      // Commerce fields: only assert cuisine, price, payment and currency
      // once the page can claim visitability. Absent, not empty, when it
      // cannot.
      ...(canClaim && {
        servesCuisine: 'British',
        priceRange: '££',
        paymentAccepted: 'Cash, Credit Card, Debit Card',
        currenciesAccepted: 'GBP'
      })
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
    <main className="min-h-screen bg-paper">
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
        canClaim={canClaim}
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

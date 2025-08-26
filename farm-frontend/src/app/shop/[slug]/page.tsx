import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'node:fs/promises'
import path from 'node:path'
import Image from 'next/image'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star, 
  Navigation, 
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Share2,
  Map,
  Calendar
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { ObfuscatedEmail, ObfuscatedPhone } from '@/components/ObfuscatedContact'
import PhotoSubmissionForm from '@/components/PhotoSubmissionForm'
import { processFarmDescription } from '@/lib/seo-utils'
import FarmAnalytics from '@/components/FarmAnalytics'

// Revalidate every 6 hours for fresh farm data
export const revalidate = 21600

async function readFarms(): Promise<FarmShop[]> {
  const file = path.join(process.cwd(), 'public', 'data', 'farms.uk.json')
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw) as FarmShop[]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const farms = await readFarms()
  const shop = farms.find((f) => f.slug === slug)
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
  const farms = await readFarms()
  const shop = farms.find((f) => f.slug === slug)
  if (!shop) notFound()

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
      image: Array.isArray(shop.images) && shop.images.length > 0 ? shop.images.slice(0, 3) : undefined,
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
    <main className="min-h-screen bg-background-canvas">
      {/* SEO: LocalBusiness JSON-LD + Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmAnalytics slug={shop.slug} name={shop.name} />

      {/* Hero Section - PuredgeOS 3.0 Compliant */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background-surface via-background-canvas to-background-surface">
        {/* Sophisticated background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.02),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Navigation */}
          <div className="mb-8">
            <Link 
              href="/map" 
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-serum transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to map
            </Link>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              {verified && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Verified Farm</span>
                </div>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-heading mb-6 tracking-tight">
              {name}
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-lg text-text-muted mb-8">
              <MapPin className="w-5 h-5 text-serum" />
              <span>{location.address}, {location.county} {location.postcode}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-serum text-black px-8 py-4 rounded-xl font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
              <Link
                href={`/claim/${shop.slug}`}
                className="border-2 border-serum text-serum dark:text-serum px-8 py-4 rounded-xl font-semibold hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-200 inline-flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Claim This Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Conditional Image Gallery - Only appears when images exist */}
      {shop.images && shop.images.length > 0 && (
        <section className="py-12 bg-background-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shop.images.map((image, index) => (
                <div key={index} className="group relative overflow-hidden rounded-2xl bg-background-canvas shadow-premium border border-border-default/30">
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={image}
                      alt={`${name} - Photo ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* About Section */}
            {cleanDescription && (
              <section className="bg-background-surface rounded-2xl p-8 shadow-premium border border-border-default/30">
                <h2 className="text-2xl font-heading font-bold text-text-heading mb-6">
                  About {name}
                </h2>
                <div className="prose prose-lg max-w-none">
                  {cleanDescription.split('\n\n').map((paragraph, index) => (
                    <p 
                      key={index}
                      className={`text-text-muted leading-relaxed ${
                        index === 0 
                          ? 'text-lg font-medium text-text-heading mb-6' 
                          : 'text-base mb-4'
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {/* Professional call-to-action */}
                <div className="mt-8 pt-6 border-t border-border-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-serum rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-text-muted italic">
                      Visit us to experience authentic local produce and traditional farming values.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Offerings Section */}
            {offerings && offerings.length > 0 && (
              <section className="bg-background-surface rounded-2xl p-8 shadow-premium border border-border-default/30">
                <h2 className="text-2xl font-heading font-bold text-text-heading mb-6">
                  What We Offer
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {offerings.map((offering) => (
                    <div 
                      key={offering} 
                      className="flex items-center gap-2 p-3 rounded-xl bg-background-canvas border border-border-default/30"
                    >
                      <div className="w-2 h-2 bg-serum rounded-full" />
                      <span className="text-sm font-medium text-text-body">{offering}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Photo Submission Section */}
            <section className="bg-background-surface rounded-2xl p-8 shadow-premium border border-border-default/30">
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-heading font-bold text-text-heading">
                      Add Photos
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted group-open:hidden">Share your experience</span>
                      <span className="text-text-muted group-open:hidden">▼</span>
                      <span className="text-text-muted hidden group-open:inline">▲</span>
                    </div>
                  </div>
                </summary>
                <div className="mt-6 pt-6 border-t border-border-default">
                  <p className="text-text-muted mb-6">
                    Help other visitors by sharing photos of this farm shop. 
                    Your photos will be reviewed before being added to the page.
                  </p>
                  <PhotoSubmissionForm 
                    farmSlug={shop.slug} 
                    farmName={shop.name}
                  />
                </div>
              </details>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-background-surface rounded-2xl p-6 shadow-premium border border-border-default/30">
              <h3 className="text-lg font-heading font-semibold text-text-heading mb-4">
                Contact Information
              </h3>
              <div className="space-y-4">
                {contact?.phone && (
                  <ObfuscatedPhone phone={contact.phone} />
                )}
                {contact?.email && (
                  <ObfuscatedEmail email={contact.email} />
                )}
                {contact?.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-colors group"
                  >
                    <Globe className="w-5 h-5 text-serum" />
                    <span className="text-sm font-medium text-text-body group-hover:text-serum transition-colors">
                      Visit Website
                    </span>
                    <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
                  </a>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            {hours && hours.length > 0 && (
              <div className="bg-background-surface rounded-2xl p-6 shadow-premium border border-border-default/30">
                <h3 className="text-lg font-heading font-semibold text-text-heading mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-serum" />
                  Opening Hours
                </h3>
                <div className="space-y-2">
                  {hours.map((hour) => (
                    <div key={hour.day} className="flex justify-between items-center py-2 border-b border-border-default/30 last:border-b-0">
                      <span className="text-sm font-medium text-text-body">{hour.day}</span>
                      <span className="text-sm text-text-muted">
                        {hour.open} - {hour.close}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="bg-background-surface rounded-2xl p-6 shadow-premium border border-border-default/30">
              <h3 className="text-lg font-heading font-semibold text-text-heading mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-serum" />
                Explore More
              </h3>
              <div className="space-y-3">
                {location.county && (
                  <Link
                    href={`/counties/${location.county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-colors group"
                  >
                    <MapPin className="w-5 h-5 text-serum" />
                    <span className="text-sm font-medium text-text-body group-hover:text-serum transition-colors">
                      More in {location.county}
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-muted ml-auto" />
                  </Link>
                )}
                <Link
                  href={`/map?q=${encodeURIComponent(name)}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-colors group"
                >
                  <Map className="w-5 h-5 text-serum" />
                  <span className="text-sm font-medium text-text-body group-hover:text-serum transition-colors">
                    View on Map
                  </span>
                  <ArrowRight className="w-4 h-4 text-text-muted ml-auto" />
                </Link>
                <Link
                  href={`/map?lat=${location.lat}&lng=${location.lng}&radius=10`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-colors group"
                >
                  <MapPin className="w-5 h-5 text-serum" />
                  <span className="text-sm font-medium text-text-body group-hover:text-serum transition-colors">
                    Nearby Farms
                  </span>
                  <ArrowRight className="w-4 h-4 text-text-muted ml-auto" />
                </Link>
                <Link
                  href="/seasonal"
                  className="flex items-center gap-3 p-3 rounded-xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-colors group"
                >
                  <Calendar className="w-5 h-5 text-serum" />
                  <span className="text-sm font-medium text-text-body group-hover:text-serum transition-colors">
                    What&apos;s in Season
                  </span>
                  <ArrowRight className="w-4 h-4 text-text-muted ml-auto" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background-surface border-t border-border-default">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-xs text-text-muted text-center">
            Spot an issue with this listing?{' '}
            <a
              className="underline hover:no-underline hover:text-serum transition-colors"
              href={issueUrl}
              target="_blank"
              rel="nofollow ugc noopener noreferrer"
            >
              Report a fix ↗
            </a>
          </p>
        </div>
      </footer>
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

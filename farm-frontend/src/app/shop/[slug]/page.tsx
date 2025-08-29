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
  Calendar,
  Camera,
  Sparkles,
  Leaf
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { ObfuscatedEmail, ObfuscatedPhone } from '@/components/ObfuscatedContact'
import PhotoSubmissionForm from '@/components/PhotoSubmissionForm'
import { processFarmDescription } from '@/lib/seo-utils'
import FarmAnalytics from '@/components/FarmAnalytics'
import { getValidApprovedPhotosBySlug } from '@/lib/photos'
import PhotoGalleryWrapper from '@/components/PhotoGalleryWrapper'

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

      {/* Enhanced Hero Section - PuredgeOS 3.0 Premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background-surface via-background-canvas to-background-surface">
        {/* Sophisticated animated background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.04),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.03),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,31,35,0.02),transparent_70%)]" />
        
        {/* Floating accent elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-serum rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 right-20 w-1 h-1 bg-solar rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-serum rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          {/* Enhanced Navigation */}
          <div className="mb-12">
            <Link 
              href="/map" 
              className="inline-flex items-center gap-3 text-sm text-text-muted hover:text-serum transition-all duration-300 group bg-background-surface/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border-default/30 hover:border-serum/50"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to map
            </Link>
          </div>

          {/* Enhanced Hero Content */}
          <div className="text-center mb-16">
            {/* Premium verification badge */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {verified && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-6 py-3 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-lg backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Verified Farm Shop</span>
                  <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              )}
            </div>
            
            {/* Enhanced typography with premium styling */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-text-heading mb-8 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-text-heading via-serum to-text-heading bg-clip-text text-transparent">
                {name}
              </span>
            </h1>
            
            {/* Enhanced location display */}
            <div className="flex items-center justify-center gap-3 text-xl text-text-muted mb-12">
              <div className="p-2 bg-background-surface/50 backdrop-blur-sm rounded-full border border-border-default/30">
                <MapPin className="w-6 h-6 text-serum" />
              </div>
              <span className="font-medium">{location.address}, {location.county} {location.postcode}</span>
            </div>

            {/* Enhanced Action Buttons with premium styling */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="group bg-gradient-to-r from-serum to-teal-500 text-black px-10 py-5 rounded-2xl font-bold text-lg hover:from-teal-500 hover:to-serum transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
              >
                <Navigation className="w-6 h-6 transition-transform group-hover:scale-110" />
                Get Directions
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <Link
                href={`/claim/${shop.slug}`}
                className="group border-2 border-serum text-serum dark:text-serum px-10 py-5 rounded-2xl font-bold text-lg hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-300 inline-flex items-center justify-center gap-3 backdrop-blur-sm bg-background-surface/30 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
              >
                <Heart className="w-6 h-6 transition-transform group-hover:scale-110" />
                Claim This Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Image Gallery - Premium Display */}
      {shop.images && shop.images.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-background-surface to-background-canvas">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-text-heading mb-4 flex items-center justify-center gap-3">
                <Camera className="w-8 h-8 text-serum" />
                Gallery
              </h2>
              <p className="text-text-muted text-lg">Discover the beauty of {name}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {shop.images.map((image, index) => (
                <div key={index} className="group relative overflow-hidden rounded-3xl bg-background-canvas shadow-2xl border border-border-default/30 hover:border-serum/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={image}
                      alt={`${name} - Photo ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="bg-background-surface/90 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-sm font-medium text-text-heading">Photo {index + 1}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Community Photos Section - Hero Display */}
      {approvedPhotos.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-background-canvas to-background-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-background-surface rounded-3xl p-8 shadow-2xl border border-border-default/30">
              <PhotoGalleryWrapper photos={approvedPhotos} aspect="16/9" autoPlayMs={4000} />
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Enhanced Main Content Column */}
          <div className="lg:col-span-2 space-y-16">
            {/* Enhanced About Section */}
            {cleanDescription && (
              <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30">
                <h2 className="text-3xl font-heading font-bold text-text-heading mb-8 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-serum" />
                  About {name}
                </h2>
                <div className="prose prose-lg max-w-none">
                  {cleanDescription.split('\n\n').map((paragraph, index) => (
                    <p 
                      key={index}
                      className={`text-text-muted leading-relaxed ${
                        index === 0 
                          ? 'text-xl font-medium text-text-heading mb-8 leading-tight' 
                          : 'text-lg mb-6'
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {/* Enhanced call-to-action */}
                <div className="mt-12 pt-8 border-t border-border-default/50">
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-serum/10 to-teal-500/10 rounded-2xl border border-serum/20">
                    <div className="w-3 h-3 bg-serum rounded-full animate-pulse" />
                    <p className="text-lg font-medium text-text-heading italic">
                      Visit us to experience authentic local produce and traditional farming values.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Enhanced Offerings Section */}
            {offerings && offerings.length > 0 && (
              <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30">
                <h2 className="text-3xl font-heading font-bold text-text-heading mb-8 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-serum" />
                  What We Offer
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {offerings.map((offering) => (
                    <div 
                      key={offering} 
                      className="group flex items-center gap-3 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="w-3 h-3 bg-serum rounded-full group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">{offering}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Enhanced Photo Submission Section */}
            <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30">
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-heading font-bold text-text-heading flex items-center gap-3">
                      <Camera className="w-8 h-8 text-serum" />
                      Add Photos
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-text-muted group-open:hidden">Share your experience</span>
                      <div className="w-8 h-8 bg-background-canvas rounded-full flex items-center justify-center border border-border-default/30 group-hover:border-serum/50 transition-colors">
                        <span className="text-text-muted group-open:hidden">▼</span>
                        <span className="text-text-muted hidden group-open:inline">▲</span>
                      </div>
                    </div>
                  </div>
                </summary>
                <div className="mt-10 pt-8 border-t border-border-default/50">
                  <p className="text-text-muted text-lg mb-8">
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

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Contact Information */}
            <div className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 shadow-2xl border border-border-default/30">
              <h3 className="text-xl font-heading font-bold text-text-heading mb-6 flex items-center gap-3">
                <Phone className="w-6 h-6 text-serum" />
                Contact Information
              </h3>
              <div className="space-y-5">
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
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <Globe className="w-6 h-6 text-serum" />
                    <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">
                      Visit Website
                    </span>
                    <ExternalLink className="w-5 h-5 text-text-muted ml-auto group-hover:text-serum transition-colors" />
                  </a>
                )}
              </div>
            </div>

            {/* Enhanced Opening Hours */}
            {hours && hours.length > 0 && (
              <div className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 shadow-2xl border border-border-default/30">
                <h3 className="text-xl font-heading font-bold text-text-heading mb-6 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-serum" />
                  Opening Hours
                </h3>
                <div className="space-y-3">
                  {hours.map((hour) => (
                    <div key={hour.day} className="flex justify-between items-center py-3 border-b border-border-default/30 last:border-b-0">
                      <span className="text-sm font-semibold text-text-body">{hour.day}</span>
                      <span className="text-sm text-text-muted font-medium">
                        {hour.open} - {hour.close}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Navigation Links */}
            <div className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 shadow-2xl border border-border-default/30">
              <h3 className="text-xl font-heading font-bold text-text-heading mb-6 flex items-center gap-3">
                <Navigation className="w-6 h-6 text-serum" />
                Explore More
              </h3>
              <div className="space-y-4">
                {location.county && (
                  <Link
                    href={`/counties/${location.county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <MapPin className="w-6 h-6 text-serum" />
                    <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">
                      More in {location.county}
                    </span>
                    <ArrowRight className="w-5 h-5 text-text-muted ml-auto group-hover:text-serum transition-colors" />
                  </Link>
                )}
                <Link
                  href={`/map?q=${encodeURIComponent(name)}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300 transform hover:scale-105"
                >
                  <Map className="w-6 h-6 text-serum" />
                  <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">
                    View on Map
                  </span>
                  <ArrowRight className="w-5 h-5 text-text-muted ml-auto group-hover:text-serum transition-colors" />
                </Link>
                <Link
                  href={`/map?lat=${location.lat}&lng=${location.lng}&radius=10`}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300 transform hover:scale-105"
                >
                  <MapPin className="w-6 h-6 text-serum" />
                  <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">
                    Nearby Farms
                  </span>
                  <ArrowRight className="w-5 h-5 text-text-muted ml-auto group-hover:text-serum transition-colors" />
                </Link>
                <Link
                  href="/seasonal"
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300 transform hover:scale-105"
                >
                  <Calendar className="w-6 h-6 text-serum" />
                  <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">
                    What&apos;s in Season
                  </span>
                  <ArrowRight className="w-5 h-5 text-text-muted ml-auto group-hover:text-serum transition-colors" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-b from-background-surface to-background-canvas border-t border-border-default">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-sm text-text-muted text-center">
            Spot an issue with this listing?{' '}
            <a
              className="underline hover:no-underline hover:text-serum transition-colors font-medium"
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

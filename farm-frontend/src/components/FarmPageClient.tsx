'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Navigation,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Camera,
  Shield
} from 'lucide-react'
import type { FarmShop, FarmHeroImage } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { ObfuscatedEmail, ObfuscatedPhone } from './ObfuscatedContact'
import { StatusBadge } from './StatusBadge'

interface FarmPageClientProps {
  shop: FarmShop
  cleanDescription: string
  directionsUrl: string
  issueUrl: string
}

export function FarmPageClient({
  shop,
  cleanDescription,
  directionsUrl,
  issueUrl
}: FarmPageClientProps) {
  const { name, location, contact, offerings, verified, hours } = shop

  // Imagery law (design-law-reconciliation 2026-05-27, DESIGN_BRIEF §2): only a
  // real submitted photograph heroes the page. No AI illustration stands in for
  // a documentary photo of the farm. Absent a photo, the hero IS the name — the
  // typographic default below. (selectFarmHeroImage already returns only photos.)
  const heroImage: FarmHeroImage | null =
    shop.heroImage?.style === 'photo' ? shop.heroImage : null

  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-caption text-ink-muted">
            <Link href="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/map" className="hover:text-brand transition-colors">
              Map
            </Link>
            <span>/</span>
            <span className="font-medium text-ink">{name}</span>
          </nav>
        </div>
      </div>

      {/* Editorial Hero (Slice 1.1.3b)
       * Image branch: full-bleed Apothecary illustration or admin photo,
       * gradient overlay, serif title, county kicker.
       * Null branch: typography-led hero with serif title + vertical
       * line accents, no image. Pattern adapted from
       * src/components/best/editorial/EditorialHero.tsx and the header
       * block of src/components/best/EditorialArticle.tsx. */}
      {heroImage ? (
        <section className="relative h-[60vh] min-h-[420px] max-h-[720px] overflow-hidden bg-paper">
          <div className="absolute inset-0">
            <Image
              src={heroImage.url}
              alt={heroImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* Only real submitted photographs reach this branch; a firm
              * gradient anchors the title against varied photography. */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/75" />
          </div>
          <div className="relative h-full flex flex-col items-center justify-end pb-12 md:pb-20 text-center px-6">
            <div className="w-px h-10 md:h-14 bg-white/80 mb-7" aria-hidden="true" />
            <h1 className="font-clash text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white tracking-tight leading-[1.05] max-w-5xl drop-shadow-[0_4px_28px_rgba(0,0,0,0.85)]">
              {name}
            </h1>
            <p className="mt-5 text-sm md:text-base text-white tracking-[0.25em] uppercase font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
              {location.county}
            </p>
          </div>
        </section>
      ) : (
        /* Typographic default (DESIGN_BRIEF §6.1): the hero IS the name.
         * All-light Pitti Press — Clash Display ink on cream, sea-ink kicker,
         * hairline rules. This is the page, not a fallback. */
        <section className="bg-paper py-24 md:py-32">
          <div className="container mx-auto px-6 text-center max-w-4xl">
            <div className="w-px h-10 md:h-14 bg-[var(--border)] mx-auto mb-8" aria-hidden="true" />
            <p className="text-sm tracking-[0.25em] uppercase text-accent font-semibold mb-7">
              {location.county}
            </p>
            <h1 className="font-clash text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-ink tracking-tight leading-[1.0]">
              {name}
            </h1>
            <div className="w-px h-10 md:h-14 bg-[var(--border)] mx-auto mt-8" aria-hidden="true" />
          </div>
        </section>
      )}

      {/* Details Bar (post-hero): badges, address, Get Directions.
       * Replaces the badges/location/CTA block that used to live inside
       * the hero. Keeps the operator-critical Get Directions above the
       * fold on most viewports without competing with the hero title. */}
      <section className="border-b border-border bg-paper">
        <div className="container mx-auto px-4 py-5 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {verified && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent text-accent text-[13px] font-semibold">
                  <Shield className="h-4 w-4" />
                  Verified
                </div>
              )}
              <StatusBadge openingHours={hours} className="text-[13px] px-3 py-1.5" />
              <div className="flex items-center gap-2 text-caption text-ink-muted">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{location.address}, {location.county} {location.postcode}</span>
              </div>
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-none bg-brand text-brand-text text-sm font-semibold transition-colors duration-200 hover:bg-brand-hover active:scale-[0.98] flex-shrink-0"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {shop.images && Array.isArray(shop.images) && shop.images.length > 0 && shop.images.some(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('maps.googleapis.com/maps/api/place/photo')) && (
        <section className="py-8 md:py-12 bg-surface-2 border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="font-clash text-2xl font-semibold text-ink mb-6 flex items-center gap-2">
              <Camera className="h-6 w-6 text-ink-muted" />
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shop.images
                .map(img => getImageUrl(img))
                .filter((url): url is string => !!url && url.trim() !== '')
                .map((imageUrl, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-[2px] bg-surface border border-border"
                  >
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={imageUrl}
                        alt={`${name} - Photo ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          const container = target.closest('.group') as HTMLElement
                          if (container) {
                            container.style.display = 'none'
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Column */}
          <main className="lg:col-span-3 space-y-8">
            {/* About Section */}
            {cleanDescription && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-surface rounded-[2px] border border-border p-6 md:p-8"
              >
                <h2 className="font-clash text-2xl font-semibold text-ink mb-6">
                  About {name}
                </h2>
                <div className="space-y-4 max-w-[68ch]">
                  {cleanDescription.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      className={
                        index === 0
                          ? 'text-body font-medium text-ink leading-relaxed'
                          : 'text-body text-ink-muted leading-relaxed'
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Offerings */}
            {offerings && offerings.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-surface rounded-[2px] border border-border p-6 md:p-8"
              >
                <h2 className="font-clash text-2xl font-semibold text-ink mb-6">
                  What We Offer
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {offerings.map((offering) => (
                    <div
                      key={offering}
                      className="flex items-center gap-2 px-3 py-2 rounded-[2px] bg-surface-2 border border-border"
                    >
                      <CheckCircle className="h-4 w-4 text-brand flex-shrink-0" />
                      <span className="text-caption font-medium text-ink-muted">{offering}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Contact Information */}
              <div className="bg-surface rounded-[2px] border border-border p-6">
                <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-ink-muted" />
                  Contact
                </h3>
                <div className="space-y-3">
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
                      className="flex items-center gap-3 px-3 py-2 rounded-[2px] text-caption text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Visit Website</span>
                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-ink-muted" />
                    </a>
                  )}
                </div>
              </div>

              {/* Opening Hours */}
              {hours && hours.length > 0 && (
                <div className="bg-surface rounded-[2px] border border-border p-6">
                  <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-ink-muted" />
                    Opening Hours
                  </h3>
                  <div className="space-y-2">
                    {hours.map((hour) => (
                      <div key={hour.day} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                        <span className="text-caption font-medium text-ink">{hour.day}</span>
                        <span className="text-caption text-ink-muted">
                          {hour.open} - {hour.close}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="bg-surface rounded-[2px] border border-border p-6">
                <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-ink-muted" />
                  Explore More
                </h3>
                <div className="space-y-2">
                  {location.county && (
                    <Link
                      href={`/counties/${location.county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
                      className="block px-3 py-2 rounded-[2px] text-caption text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>More in {location.county}</span>
                        <ArrowRight className="h-4 w-4 text-ink-muted" />
                      </div>
                    </Link>
                  )}
                  <Link
                    href={`/map?q=${encodeURIComponent(name)}`}
                    className="block px-3 py-2 rounded-[2px] text-caption text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>View on Map</span>
                      <ArrowRight className="h-4 w-4 text-ink-muted" />
                    </div>
                  </Link>
                  <Link
                    href={`/map?lat=${location.lat}&lng=${location.lng}&radius=10`}
                    className="block px-3 py-2 rounded-[2px] text-caption text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Nearby Farms</span>
                      <ArrowRight className="h-4 w-4 text-ink-muted" />
                    </div>
                  </Link>
                  <Link
                    href="/seasonal"
                    className="block px-3 py-2 rounded-[2px] text-caption text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>What&apos;s in Season</span>
                      <ArrowRight className="h-4 w-4 text-ink-muted" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-2">
        <div className="container mx-auto px-4 py-8">
          <p className="text-caption text-ink-muted text-center">
            Spot an issue with this listing?{' '}
            <a
              className="underline hover:no-underline hover:text-brand transition-colors font-medium"
              href={issueUrl}
              target="_blank"
              rel="nofollow ugc noopener noreferrer"
            >
              Report a fix
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}

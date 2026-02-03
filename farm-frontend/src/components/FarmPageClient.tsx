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
  Heart,
  Camera,
  Shield
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { ObfuscatedEmail, ObfuscatedPhone } from './ObfuscatedContact'
import { StatusBadge } from './StatusBadge'
import PhotoSubmissionForm from './PhotoSubmissionForm'
import PhotoGalleryWrapper from './PhotoGalleryWrapper'

interface FarmPageClientProps {
  shop: FarmShop
  cleanDescription: string
  directionsUrl: string
  issueUrl: string
  approvedPhotos: any[]
}

export function FarmPageClient({
  shop,
  cleanDescription,
  directionsUrl,
  issueUrl,
  approvedPhotos
}: FarmPageClientProps) {
  const { name, location, contact, offerings, verified, hours } = shop

  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-caption text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/map" className="hover:text-brand-primary transition-colors">
              Map
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-6 flex-wrap"
            >
              {verified && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[13px] font-semibold border border-emerald-200 dark:border-emerald-700">
                  <Shield className="h-4 w-4" />
                  Verified
                </div>
              )}
              <StatusBadge openingHours={hours} className="text-[13px] px-3 py-1.5" />
            </motion.div>

            {/* Farm Name */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight"
            >
              {name}
            </motion.h1>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-2 text-body text-slate-600 dark:text-slate-400 mb-6"
            >
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span>{location.address}, {location.county} {location.postcode}</span>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-sm font-semibold transition-all duration-200 hover:bg-slate-800 dark:hover:bg-white hover:shadow-md active:scale-[0.98]"
              >
                <Navigation className="h-4 w-4" />
                Get Directions
              </a>
              <Link
                href={`/claim/${shop.slug}`}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 active:scale-[0.98]"
              >
                <Heart className="h-4 w-4" />
                Claim This Shop
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {shop.images && Array.isArray(shop.images) && shop.images.length > 0 && shop.images.some(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('maps.googleapis.com/maps/api/place/photo')) && (
        <section className="py-8 md:py-12 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Camera className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shop.images
                .map(img => getImageUrl(img))
                .filter((url): url is string => !!url && url.trim() !== '')
                .map((imageUrl, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
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

      {/* Community Photos */}
      {approvedPhotos.length > 0 && (
        <section className="py-8 md:py-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <PhotoGalleryWrapper photos={approvedPhotos} aspect="16/9" autoPlayMs={4000} />
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
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  About {name}
                </h2>
                <div className="space-y-4">
                  {cleanDescription.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      className={
                        index === 0
                          ? 'text-body font-medium text-slate-900 dark:text-slate-100 leading-relaxed'
                          : 'text-body text-slate-600 dark:text-slate-400 leading-relaxed'
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
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  What We Offer
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {offerings.map((offering) => (
                    <div
                      key={offering}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <CheckCircle className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      <span className="text-caption font-medium text-slate-700 dark:text-slate-300">{offering}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Photo Submission */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Camera className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      Add Photos
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-caption text-slate-600 dark:text-slate-400 group-open:hidden">Share your experience</span>
                      <span className="text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">&#9660;</span>
                    </div>
                  </div>
                </summary>
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-caption text-slate-600 dark:text-slate-400 mb-6">
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
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Contact Information */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-slate-600 dark:text-slate-400" />
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
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-caption text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Visit Website</span>
                      <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-slate-400 dark:text-slate-500" />
                    </a>
                  )}
                </div>
              </div>

              {/* Opening Hours */}
              {hours && hours.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Opening Hours
                  </h3>
                  <div className="space-y-2">
                    {hours.map((hour) => (
                      <div key={hour.day} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <span className="text-caption font-medium text-slate-900 dark:text-white">{hour.day}</span>
                        <span className="text-caption text-slate-600 dark:text-slate-400">
                          {hour.open} - {hour.close}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Explore More
                </h3>
                <div className="space-y-2">
                  {location.county && (
                    <Link
                      href={`/counties/${location.county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
                      className="block px-3 py-2 rounded-md text-caption text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>More in {location.county}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                    </Link>
                  )}
                  <Link
                    href={`/map?q=${encodeURIComponent(name)}`}
                    className="block px-3 py-2 rounded-md text-caption text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>View on Map</span>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  </Link>
                  <Link
                    href={`/map?lat=${location.lat}&lng=${location.lng}&radius=10`}
                    className="block px-3 py-2 rounded-md text-caption text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Nearby Farms</span>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  </Link>
                  <Link
                    href="/seasonal"
                    className="block px-3 py-2 rounded-md text-caption text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>What&apos;s in Season</span>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <p className="text-caption text-slate-600 dark:text-slate-400 text-center">
            Spot an issue with this listing?{' '}
            <a
              className="underline hover:no-underline hover:text-brand-primary transition-colors font-medium"
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

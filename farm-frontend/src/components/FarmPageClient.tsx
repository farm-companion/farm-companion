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
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Map,
  Calendar,
  Camera,
  Sparkles,
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { ObfuscatedEmail, ObfuscatedPhone } from './ObfuscatedContact'
import { StatusBadge } from './StatusBadge'
import PhotoSubmissionForm from './PhotoSubmissionForm'
import PhotoGalleryWrapper from './PhotoGalleryWrapper'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

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
  approvedPhotos,
}: FarmPageClientProps) {
  const { name, location, contact, offerings, verified, hours } = shop

  return (
    <>
      {/* Enhanced Hero Section - PuredgeOS 3.0 Premium with Animations */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background-surface via-background-canvas to-background-surface">
        {/* Sophisticated animated background patterns */}
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.04),transparent_50%)]" />
        <div
          className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.03),transparent_50%)]"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,31,35,0.02),transparent_70%)]" />

        {/* Floating accent elements */}
        <div
          className="absolute left-10 top-20 h-2 w-2 animate-bounce rounded-full bg-brand-primary opacity-60"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="bg-brand-secondary absolute right-20 top-32 h-1 w-1 animate-ping rounded-full opacity-40"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute bottom-40 left-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-brand-primary opacity-50"
          style={{ animationDelay: '2s' }}
        />

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          {/* Enhanced Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <Link
              href="/map"
              className="bg-background-surface/50 border-border-default/30 group inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm text-text-muted backdrop-blur-sm transition-colors duration-150 hover:border-brand-primary/50 hover:text-brand-primary"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to map
            </Link>
          </motion.div>

          {/* Enhanced Hero Content with Animations */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="mb-16 text-center"
          >
            {/* Premium verification badge and Status Badge */}
            <motion.div
              variants={fadeInUp}
              className="mb-8 flex flex-wrap items-center justify-center gap-4"
            >
              {verified && (
                <div className="flex items-center gap-3 rounded-full border border-success bg-success-light px-6 py-3 shadow-premium-lg backdrop-blur-sm dark:bg-success-dark">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-semibold text-success-dark dark:text-success-light">
                    Verified Farm Shop
                  </span>
                  <Sparkles className="h-4 w-4 text-success" />
                </div>
              )}
              {/* Real-time Status Badge */}
              <StatusBadge openingHours={hours} className="px-6 py-3 text-base shadow-lg" />
            </motion.div>

            {/* Enhanced typography with premium styling */}
            <motion.h1
              variants={fadeInUp}
              className="mb-8 font-heading text-5xl font-bold leading-tight tracking-tight text-text-heading md:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-text-heading via-brand-primary to-text-heading bg-clip-text text-transparent">
                {name}
              </span>
            </motion.h1>

            {/* Enhanced location display */}
            <motion.div
              variants={fadeInUp}
              className="mb-12 flex items-center justify-center gap-3 text-xl text-text-muted"
            >
              <div className="bg-background-surface/50 border-border-default/30 rounded-full border p-2 backdrop-blur-sm">
                <MapPin className="h-6 w-6 text-brand-primary" />
              </div>
              <span className="font-medium">
                {location.address}, {location.county} {location.postcode}
              </span>
            </motion.div>

            {/* Enhanced Action Buttons with premium styling */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col justify-center gap-6 sm:flex-row"
            >
              <motion.a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-brand-primary px-10 text-lg font-bold text-black shadow-premium-xl transition-[background-color,transform,box-shadow] duration-150 hover:bg-brand-primary/90 hover:shadow-premium-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Navigation className="h-6 w-6 transition-transform group-hover:scale-110" />
                Get Directions
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/claim/${shop.slug}`}
                  className="bg-background-surface/30 group inline-flex h-14 items-center justify-center gap-3 rounded-2xl border-2 border-brand-primary px-10 text-lg font-bold text-brand-primary backdrop-blur-sm transition-[background-color,border-color,color,transform,box-shadow] duration-150 hover:bg-brand-primary hover:text-black hover:shadow-premium-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <Heart className="h-6 w-6 transition-transform group-hover:scale-110" />
                  Claim This Shop
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Image Gallery with Animations */}
      {shop.images &&
        Array.isArray(shop.images) &&
        shop.images.length > 0 &&
        shop.images.some(
          (img) =>
            img &&
            typeof img === 'string' &&
            img.trim() !== '' &&
            !img.includes('maps.googleapis.com/maps/api/place/photo')
        ) && (
          <section className="bg-gradient-to-b from-background-surface to-background-canvas py-16">
            <div className="mx-auto max-w-7xl px-6">
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeInUp}
                className="mb-12 text-center"
              >
                <h2 className="mb-4 flex items-center justify-center gap-3 font-heading text-3xl font-bold text-text-heading">
                  <Camera className="h-8 w-8 text-brand-primary" />
                  Gallery
                </h2>
                <p className="text-lg text-text-muted">Discover the beauty of {name}</p>
              </motion.div>
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-100px' }}
                variants={staggerContainer}
                className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {shop.images
                  .filter((img) => img && typeof img === 'string' && img.trim() !== '')
                  .map((image, index) => (
                    <motion.div
                      key={index}
                      variants={staggerItem}
                      whileHover={{ scale: 1.05, y: -8 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="border-border-default/30 group relative overflow-hidden rounded-3xl border bg-background-canvas shadow-2xl hover:border-brand-primary/50"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={image}
                          alt={`${name} - Photo ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            const container = target.closest('.group') as HTMLElement
                            if (container) {
                              container.style.display = 'none'
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                          <div className="bg-background-surface/90 rounded-xl p-3 backdrop-blur-sm">
                            <p className="text-sm font-medium text-text-heading">
                              Photo {index + 1}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            </div>
          </section>
        )}

      {/* Community Photos Section */}
      {approvedPhotos.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-background-canvas to-background-surface py-16"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="border-border-default/30 rounded-3xl border bg-background-surface p-8 shadow-2xl">
              <PhotoGalleryWrapper photos={approvedPhotos} aspect="16/9" autoPlayMs={4000} />
            </div>
          </div>
        </motion.section>
      )}

      {/* Main Content with Animations */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="space-y-16 lg:col-span-2">
            {/* About Section */}
            {cleanDescription && (
              <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeInUp}
                className="border-border-default/30 rounded-3xl border bg-gradient-to-br from-background-surface to-background-canvas p-10 shadow-2xl"
              >
                <h2 className="mb-8 flex items-center gap-3 font-heading text-3xl font-bold text-text-heading">
                  <Sparkles className="h-8 w-8 text-brand-primary" />
                  About {name}
                </h2>
                <div className="prose prose-lg max-w-none">
                  {cleanDescription.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      className={`leading-relaxed text-text-muted ${
                        index === 0
                          ? 'mb-8 text-xl font-medium leading-tight text-text-heading'
                          : 'mb-6 text-lg'
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="border-border-default/50 mt-12 border-t pt-8">
                  <div className="flex items-center gap-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-6">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-brand-primary" />
                    <p className="text-lg font-medium italic text-text-heading">
                      Visit us to experience authentic local produce and traditional farming values.
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Offerings Section */}
            {offerings && offerings.length > 0 && (
              <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeInUp}
                className="border-border-default/30 rounded-3xl border bg-gradient-to-br from-background-surface to-background-canvas p-10 shadow-2xl"
              >
                <h2 className="mb-8 flex items-center gap-3 font-heading text-3xl font-bold text-text-heading">
                  <CheckCircle className="h-8 w-8 text-brand-primary" />
                  What We Offer
                </h2>
                <motion.div
                  variants={staggerContainer}
                  className="grid grid-cols-2 gap-4 md:grid-cols-3"
                >
                  {offerings.map((offering) => (
                    <motion.div
                      key={offering}
                      variants={staggerItem}
                      whileHover={{ scale: 1.05 }}
                      className="border-border-default/30 group flex items-center gap-3 rounded-2xl border bg-background-canvas p-4 transition-all duration-300 hover:border-brand-primary/50"
                    >
                      <div className="h-3 w-3 rounded-full bg-brand-primary transition-transform duration-300 group-hover:scale-125" />
                      <span className="text-sm font-semibold text-text-body transition-colors group-hover:text-brand-primary">
                        {offering}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}

            {/* Photo Submission Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="border-border-default/30 rounded-3xl border bg-gradient-to-br from-background-surface to-background-canvas p-10 shadow-2xl"
            >
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-3 font-heading text-3xl font-bold text-text-heading">
                      <Camera className="h-8 w-8 text-brand-primary" />
                      Add Photos
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-text-muted group-open:hidden">
                        Share your experience
                      </span>
                      <div className="border-border-default/30 flex h-8 w-8 items-center justify-center rounded-full border bg-background-canvas transition-colors group-hover:border-brand-primary/50">
                        <span className="text-text-muted group-open:hidden">▼</span>
                        <span className="hidden text-text-muted group-open:inline">▲</span>
                      </div>
                    </div>
                  </div>
                </summary>
                <div className="border-border-default/50 mt-10 border-t pt-8">
                  <p className="mb-8 text-lg text-text-muted">
                    Help other visitors by sharing photos of this farm shop. Your photos will be
                    reviewed before being added to the page.
                  </p>
                  <PhotoSubmissionForm farmSlug={shop.slug} farmName={shop.name} />
                </div>
              </details>
            </motion.section>
          </div>

          {/* Sidebar with Animations */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Contact Information */}
            <motion.div
              variants={staggerItem}
              className="border-border-default/30 rounded-3xl border bg-gradient-to-br from-background-surface to-background-canvas p-8 shadow-2xl"
            >
              <h3 className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-text-heading">
                <Phone className="h-6 w-6 text-brand-primary" />
                Contact Information
              </h3>
              <div className="space-y-5">
                {contact?.phone && <ObfuscatedPhone phone={contact.phone} />}
                {contact?.email && <ObfuscatedEmail email={contact.email} />}
                {contact?.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="border-border-default/30 group flex transform items-center gap-4 rounded-2xl border bg-background-canvas p-4 transition-all duration-300 hover:scale-105 hover:border-brand-primary/50"
                  >
                    <Globe className="h-6 w-6 text-brand-primary" />
                    <span className="text-sm font-semibold text-text-body transition-colors group-hover:text-brand-primary">
                      Visit Website
                    </span>
                    <ExternalLink className="ml-auto h-5 w-5 text-text-muted transition-colors group-hover:text-brand-primary" />
                  </a>
                )}
              </div>
            </motion.div>

            {/* Opening Hours */}
            {hours && hours.length > 0 && (
              <motion.div
                variants={staggerItem}
                className="border-border-default/30 rounded-3xl border bg-gradient-to-br from-background-surface to-background-canvas p-8 shadow-2xl"
              >
                <h3 className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-text-heading">
                  <Clock className="h-6 w-6 text-brand-primary" />
                  Opening Hours
                </h3>
                <div className="space-y-3">
                  {hours.map((hour) => (
                    <div
                      key={hour.day}
                      className="border-border-default/30 flex items-center justify-between border-b py-3 last:border-b-0"
                    >
                      <span className="text-sm font-semibold text-text-body">{hour.day}</span>
                      <span className="text-sm font-medium text-text-muted">
                        {hour.open} - {hour.close}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Navigation Links */}
            <motion.div
              variants={staggerItem}
              className="border-border-default/30 rounded-3xl border bg-gradient-to-br from-background-surface to-background-canvas p-8 shadow-2xl"
            >
              <h3 className="mb-6 flex items-center gap-3 font-heading text-xl font-bold text-text-heading">
                <Navigation className="h-6 w-6 text-brand-primary" />
                Explore More
              </h3>
              <div className="space-y-4">
                {location.county && (
                  <Link
                    href={`/counties/${location.county
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')}`}
                    className="border-border-default/30 group flex transform items-center gap-4 rounded-2xl border bg-background-canvas p-4 transition-all duration-300 hover:scale-105 hover:border-brand-primary/50"
                  >
                    <MapPin className="h-6 w-6 text-brand-primary" />
                    <span className="text-sm font-semibold text-text-body transition-colors group-hover:text-brand-primary">
                      More in {location.county}
                    </span>
                    <ArrowRight className="ml-auto h-5 w-5 text-text-muted transition-colors group-hover:text-brand-primary" />
                  </Link>
                )}
                <Link
                  href={`/map?q=${encodeURIComponent(name)}`}
                  className="border-border-default/30 group flex transform items-center gap-4 rounded-2xl border bg-background-canvas p-4 transition-all duration-300 hover:scale-105 hover:border-brand-primary/50"
                >
                  <Map className="h-6 w-6 text-brand-primary" />
                  <span className="text-sm font-semibold text-text-body transition-colors group-hover:text-brand-primary">
                    View on Map
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 text-text-muted transition-colors group-hover:text-brand-primary" />
                </Link>
                <Link
                  href={`/map?lat=${location.lat}&lng=${location.lng}&radius=10`}
                  className="border-border-default/30 group flex transform items-center gap-4 rounded-2xl border bg-background-canvas p-4 transition-all duration-300 hover:scale-105 hover:border-brand-primary/50"
                >
                  <MapPin className="h-6 w-6 text-brand-primary" />
                  <span className="text-sm font-semibold text-text-body transition-colors group-hover:text-brand-primary">
                    Nearby Farms
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 text-text-muted transition-colors group-hover:text-brand-primary" />
                </Link>
                <Link
                  href="/seasonal"
                  className="border-border-default/30 group flex transform items-center gap-4 rounded-2xl border bg-background-canvas p-4 transition-all duration-300 hover:scale-105 hover:border-brand-primary/50"
                >
                  <Calendar className="h-6 w-6 text-brand-primary" />
                  <span className="text-sm font-semibold text-text-body transition-colors group-hover:text-brand-primary">
                    What&apos;s in Season
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 text-text-muted transition-colors group-hover:text-brand-primary" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-default bg-gradient-to-b from-background-surface to-background-canvas">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-center text-sm text-text-muted">
            Spot an issue with this listing?{' '}
            <a
              className="font-medium underline transition-colors hover:text-brand-primary hover:no-underline"
              href={issueUrl}
              target="_blank"
              rel="nofollow ugc noopener noreferrer"
            >
              Report a fix ↗
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}

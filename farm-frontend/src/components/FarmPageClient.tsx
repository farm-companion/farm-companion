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
  Sparkles
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { ObfuscatedEmail, ObfuscatedPhone } from './ObfuscatedContact'
import { StatusBadge } from './StatusBadge'
import PhotoSubmissionForm from './PhotoSubmissionForm'
import PhotoGalleryWrapper from './PhotoGalleryWrapper'
import { FarmSeasonalProduce } from './FarmSeasonalProduce'
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
  approvedPhotos
}: FarmPageClientProps) {
  const { name, location, contact, offerings, verified, hours } = shop

  return (
    <>
      {/* Enhanced Hero Section - PuredgeOS 3.0 Premium with Animations */}
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <Link
              href="/map"
              className="inline-flex items-center gap-3 text-sm text-text-muted hover:text-serum transition-all duration-300 group bg-background-surface/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border-default/30 hover:border-serum/50"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to map
            </Link>
          </motion.div>

          {/* Enhanced Hero Content with Animations */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center mb-16"
          >
            {/* Premium verification badge and Status Badge */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-4 mb-8 flex-wrap"
            >
              {verified && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-6 py-3 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-lg backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Verified Farm Shop</span>
                  <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              )}
              {/* Real-time Status Badge */}
              <StatusBadge openingHours={hours} className="text-base px-6 py-3 shadow-lg" />
            </motion.div>

            {/* Enhanced typography with premium styling */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-text-heading mb-8 tracking-tight leading-tight"
            >
              <span className="bg-gradient-to-r from-text-heading via-serum to-text-heading bg-clip-text text-transparent">
                {name}
              </span>
            </motion.h1>

            {/* Enhanced location display */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-3 text-xl text-text-muted mb-12"
            >
              <div className="p-2 bg-background-surface/50 backdrop-blur-sm rounded-full border border-border-default/30">
                <MapPin className="w-6 h-6 text-serum" />
              </div>
              <span className="font-medium">{location.address}, {location.county} {location.postcode}</span>
            </motion.div>

            {/* Enhanced Action Buttons with premium styling */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <motion.a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-gradient-to-r from-serum to-teal-500 text-black px-10 py-5 rounded-2xl font-bold text-lg hover:from-teal-500 hover:to-serum transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl"
              >
                <Navigation className="w-6 h-6 transition-transform group-hover:scale-110" />
                Get Directions
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/claim/${shop.slug}`}
                  className="group border-2 border-serum text-serum dark:text-serum px-10 py-5 rounded-2xl font-bold text-lg hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-300 inline-flex items-center justify-center gap-3 backdrop-blur-sm bg-background-surface/30 hover:shadow-xl"
                >
                  <Heart className="w-6 h-6 transition-transform group-hover:scale-110" />
                  Claim This Shop
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Image Gallery with Animations */}
      {shop.images && Array.isArray(shop.images) && shop.images.length > 0 && shop.images.some(img => img && typeof img === 'string' && img.trim() !== '' && !img.includes('maps.googleapis.com/maps/api/place/photo')) && (
        <section className="py-16 bg-gradient-to-b from-background-surface to-background-canvas">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-heading font-bold text-text-heading mb-4 flex items-center justify-center gap-3">
                <Camera className="w-8 h-8 text-serum" />
                Gallery
              </h2>
              <p className="text-text-muted text-lg">Discover the beauty of {name}</p>
            </motion.div>
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {shop.images
                .filter(img => img && typeof img === 'string' && img.trim() !== '')
                .map((image, index) => (
                  <motion.div
                    key={index}
                    variants={staggerItem}
                    whileHover={{ scale: 1.05, y: -8 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="group relative overflow-hidden rounded-3xl bg-background-canvas shadow-2xl border border-border-default/30 hover:border-serum/50"
                  >
                    <div className="aspect-[4/3] relative">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="bg-background-surface/90 backdrop-blur-sm rounded-xl p-3">
                          <p className="text-sm font-medium text-text-heading">Photo {index + 1}</p>
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
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-16 bg-gradient-to-b from-background-canvas to-background-surface"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-background-surface rounded-3xl p-8 shadow-2xl border border-border-default/30">
              <PhotoGalleryWrapper photos={approvedPhotos} aspect="16/9" autoPlayMs={4000} />
            </div>
          </div>
        </motion.section>
      )}

      {/* Main Content with Animations */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-16">
            {/* About Section */}
            {cleanDescription && (
              <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30"
              >
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

                <div className="mt-12 pt-8 border-t border-border-default/50">
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-serum/10 to-teal-500/10 rounded-2xl border border-serum/20">
                    <div className="w-3 h-3 bg-serum rounded-full animate-pulse" />
                    <p className="text-lg font-medium text-text-heading italic">
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
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30"
              >
                <h2 className="text-3xl font-heading font-bold text-text-heading mb-8 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-serum" />
                  What We Offer
                </h2>
                <motion.div
                  variants={staggerContainer}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {offerings.map((offering) => (
                    <motion.div
                      key={offering}
                      variants={staggerItem}
                      whileHover={{ scale: 1.05 }}
                      className="group flex items-center gap-3 p-4 rounded-2xl bg-background-canvas border border-border-default/30 hover:border-serum/50 transition-all duration-300"
                    >
                      <div className="w-3 h-3 bg-serum rounded-full group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-sm font-semibold text-text-body group-hover:text-serum transition-colors">{offering}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}

            {/* Seasonal Produce Section */}
            {shop.produce && shop.produce.length > 0 && (
              <FarmSeasonalProduce produce={shop.produce} farmName={name} />
            )}

            {/* Photo Submission Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30"
            >
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
            </motion.section>
          </div>

          {/* Sidebar with Animations */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Contact Information */}
            <motion.div
              variants={staggerItem}
              className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 shadow-2xl border border-border-default/30"
            >
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
            </motion.div>

            {/* Opening Hours */}
            {hours && hours.length > 0 && (
              <motion.div
                variants={staggerItem}
                className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 shadow-2xl border border-border-default/30"
              >
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
              </motion.div>
            )}

            {/* Navigation Links */}
            <motion.div
              variants={staggerItem}
              className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 shadow-2xl border border-border-default/30"
            >
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
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
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
    </>
  )
}

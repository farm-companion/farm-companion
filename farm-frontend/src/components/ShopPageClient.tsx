'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Map, Calendar, ChevronRight } from 'lucide-react'
import type { CountySummary } from '@/lib/county-summary'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'
import BackToTop from './BackToTop'

interface ShopPageClientProps {
  counties: CountySummary[]
  /** Farms no county row can hold; they are on the map. */
  withoutCounty: number
  stats: any
}

/**
 * One row per county, linking to the page that lists its farms.
 *
 * This used to render a FarmCard for every farm in the county, which across
 * all counties meant all 3,504 of them in one document: 15.59 MB, 12.00 MB of
 * it markup. The farms are not lost, they are one click away at
 * /counties/[slug], which already lists them.
 */
function CountyRow({ county, slug, count }: CountySummary) {
  return (
    <Link
      href={`/counties/${slug}`}
      className="group flex items-center justify-between gap-4 rounded-lg border border-border-default p-4 transition-colors hover:border-brand hover:bg-surface-2"
    >
      <span className="text-[16px] font-heading font-semibold text-text-heading">
        {county}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-[16px] text-text-muted">
          {count} farm{count !== 1 ? 's' : ''}
        </span>
        <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}

export default function ShopPageClient({ counties, withoutCounty, stats }: ShopPageClientProps) {
  // The grouping and the `filteredFarms` state that used to live here are
  // gone. The state's setter was never called, so the whole 3,504-farm array
  // was serialised into the RSC payload to feed a filter that did not exist.
  // Grouping now happens on the server, in summariseByCounty.
  return (
    <>
      <BackToTop />

      <main className="min-h-screen bg-background-canvas dark:bg-gray-900">
        {/* Hero Section with Animations */}
        <section className="relative overflow-hidden bg-background-surface dark:bg-gray-800">
          {/* Sophisticated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-serum/5 via-transparent to-solar/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.03),transparent_50%)]" />

          <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-heading font-bold mb-6 text-text-heading dark:text-white"
              >
                UK Farm Shops Directory
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-heading md:text-2xl text-text-muted dark:text-gray-300 max-w-3xl mx-auto mb-8"
              >
                Browse {stats.farmCount}+ UK farm shops by county. Find fresh local produce,
                buy seasonal fruit and vegetables, and discover authentic farm experiences near you.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/map"
                  className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Map className="w-5 h-5" />
                  Explore Interactive Map
                </Link>
                <Link
                  href="/seasonal"
                  className="border-2 border-serum text-serum dark:text-serum px-8 py-4 rounded-lg font-semibold hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-200 inline-flex items-center justify-center gap-2 transform hover:scale-105"
                >
                  <Calendar className="w-5 h-5" />
                  What&apos;s in Season
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Animated Stats Section */}
        <section className="bg-background-canvas dark:bg-gray-900 border-b border-border-default">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            >
              <motion.div variants={staggerItem} className="group">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-4xl font-heading font-bold text-serum mb-2"
                >
                  {stats.farmCount}+
                </motion.div>
                <div className="text-text-muted dark:text-gray-400">Farm Shops</div>
              </motion.div>
              <motion.div variants={staggerItem} className="group">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-4xl font-heading font-bold text-serum mb-2"
                >
                  {stats.countyCount}
                </motion.div>
                <div className="text-text-muted dark:text-gray-400">Counties</div>
              </motion.div>
              <motion.div variants={staggerItem} className="group">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-4xl font-heading font-bold text-serum mb-2"
                >
                  100%
                </motion.div>
                <div className="text-text-muted dark:text-gray-400">Verified Farms</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Farm Directory with Animations */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading dark:text-white mb-4">
                Browse by County
              </h2>
              <p className="text-body text-text-muted dark:text-gray-300 max-w-2xl mx-auto">
                Find farm shops in your area with our comprehensive county-by-county directory.
              </p>
            </motion.div>

            {/* Deliberately not animated. staggerChildren is 0.1s and there
                are 285 rows, so a stagger here would leave the last county
                invisible for 28 seconds, and every row starts at opacity 0.
                A navigation index has to be readable on arrival, JavaScript
                or no JavaScript. */}
            {counties.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {counties.map((county) => (
                  <CountyRow key={county.slug} {...county} />
                ))}
              </div>
            ) : null}

            {/* The county rows cover 2,985 of 3,504 farms. Saying so, and
                saying where the rest are, beats letting the counts quietly
                disagree with the stat line above. All of them have
                coordinates, so the map holds every one. */}
            {withoutCounty > 0 ? (
              <p className="mt-8 text-center text-[16px] text-text-muted">
                {withoutCounty} more farm{withoutCounty !== 1 ? 's have' : ' has'} no county
                recorded yet.{' '}
                <Link href="/map" className="underline decoration-brand underline-offset-4 hover:text-brand">
                  Find {withoutCounty !== 1 ? 'them' : 'it'} on the map
                </Link>
                .
              </p>
            ) : null}

            {counties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-heading font-semibold text-text-heading dark:text-white mb-2">
                  No farm shops found
                </h3>
                <p className="text-text-muted dark:text-gray-400">
                  The directory could not be loaded. Try again shortly.
                </p>
              </motion.div>
            ) : null}
          </div>
        </section>
      </main>
    </>
  )
}

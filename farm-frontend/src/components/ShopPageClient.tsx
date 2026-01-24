'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Map, Calendar } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { FarmCard } from './FarmCard'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'
import BackToTop from './BackToTop'

interface ShopPageClientProps {
  farms: FarmShop[]
  stats: any
}

// County section component with animations
function CountySection({ county, farms }: { county: string; farms: FarmShop[] }) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      className="border-b border-border-default pb-8 last:border-b-0"
    >
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-between mb-6"
      >
        <h3 className="text-2xl font-heading font-semibold text-text-heading dark:text-white">
          {county}
        </h3>
        <span className="text-caption text-text-muted dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {farms.length} farm{farms.length !== 1 ? 's' : ''}
        </span>
      </motion.div>
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {farms.map((farm, index) => (
          <motion.div key={`${farm.id}-${county}-${index}`} variants={staggerItem}>
            <FarmCard
              farm={farm}
              showCompare={true}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default function ShopPageClient({ farms, stats }: ShopPageClientProps) {
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>(farms)

  // Group filtered farms by county for better organization
  const farmsByCounty = useMemo(() => {
    return filteredFarms.reduce((acc, farm) => {
      const county = farm.location.county || 'Other'
      if (!acc[county]) {
        acc[county] = []
      }
      acc[county].push(farm)
      return acc
    }, {} as Record<string, FarmShop[]>)
  }, [filteredFarms])

  const counties = Object.keys(farmsByCounty).sort()

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

            {counties.length > 0 ? (
              <div className="space-y-12">
                {counties.map((county) => (
                  <CountySection
                    key={county}
                    county={county}
                    farms={farmsByCounty[county]}
                  />
                ))}
              </div>
            ) : (
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
                  Try adjusting your search criteria or browse all farm shops.
                </p>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

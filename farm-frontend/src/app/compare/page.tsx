'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'
import { Button } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'

interface Farm {
  id: string
  name: string
  slug: string
  location: {
    address: string
    city: string
    county: string
    postcode: string
    lat: number
    lng: number
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  googleRating?: number
  verified?: boolean
  description?: string
  images?: Array<{ url: string; altText?: string }>
  hours?: any
  categories?: Array<{ category: { name: string; slug: string } }>
}

function ComparePageContent() {
  const searchParams = useSearchParams()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const farmIds = searchParams.get('farms')?.split(',') || []

    if (farmIds.length > 0) {
      fetchFarms(farmIds)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  async function fetchFarms(farmIds: string[]) {
    try {
      setLoading(true)
      const responses = await Promise.all(
        farmIds.map(id =>
          fetch(`/api/farms/${id}`).then(res => res.ok ? res.json() : null)
        )
      )
      setFarms(responses.filter(Boolean))
    } catch (error) {
      console.error('Failed to fetch farms:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-serum mx-auto mb-4"></div>
          <p className="text-text-muted">Loading farms...</p>
        </div>
      </div>
    )
  }

  if (farms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center max-w-md"
        >
          <h1 className="text-4xl font-bold mb-4">Compare Farm Shops</h1>
          <p className="text-text-muted mb-6">
            Select farms from the map or shop listing to compare them side-by-side.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/map">
              <Button>Browse Map</Button>
            </Link>
            <Link href="/shop">
              <Button variant="secondary">View All Shops</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-canvas py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Compare Farm Shops</h1>
          <p className="text-text-muted">Side-by-side comparison of {farms.length} farm shops</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {farms.map((farm) => (
            <motion.div
              key={farm.id}
              variants={staggerItem}
              className="bg-white rounded-lg shadow-premium overflow-hidden"
            >
              {/* Image */}
              {farm.images && farm.images.length > 0 && (
                <div className="relative h-48 bg-slate-200">
                  <img
                    src={farm.images[0].url}
                    alt={farm.images[0].altText || farm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{farm.name}</h2>
                    <p className="text-sm text-text-muted">{farm.location.city}, {farm.location.county}</p>
                  </div>
                  {farm.verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success-light text-success-dark font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <StatusBadge openingHours={farm.hours} />
                </div>

                {/* Comparison Metrics */}
                <div className="space-y-3">
                  <ComparisonMetric
                    label="Rating"
                    value={farm.googleRating ? `⭐ ${farm.googleRating.toFixed(1)}` : 'No rating'}
                  />

                  <ComparisonMetric
                    label="Location"
                    value={`${farm.location.city}, ${farm.location.postcode}`}
                  />

                  {farm.contact?.phone && (
                    <ComparisonMetric
                      label="Phone"
                      value={farm.contact.phone}
                    />
                  )}

                  {farm.categories && farm.categories.length > 0 && (
                    <ComparisonMetric
                      label="Categories"
                      value={`${farm.categories.length} categories`}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <Link href={`/shop/${farm.slug}`} className="flex-1">
                    <Button variant="secondary" className="w-full">View Details</Button>
                  </Link>
                  <Link
                    href={`https://www.google.com/maps/dir/?api=1&destination=${farm.location.lat},${farm.location.lng}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button className="w-full">Directions</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Add More Button */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mt-8 text-center"
        >
          <Link href="/shop">
            <Button variant="secondary" size="lg">
              + Add More Farms to Compare
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

function ComparisonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100">
      <span className="text-sm font-medium text-text-muted">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-serum mx-auto mb-4"></div>
          <p className="text-text-muted">Loading comparison...</p>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
}

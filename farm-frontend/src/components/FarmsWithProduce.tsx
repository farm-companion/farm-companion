'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight, Store, Loader2 } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface FarmsWithProduceProps {
  produceSlug: string
  produceName: string
}

interface FarmPreview {
  slug: string
  name: string
  county: string
  isPYO?: boolean
}

export function FarmsWithProduce({ produceSlug, produceName }: FarmsWithProduceProps) {
  const [farms, setFarms] = useState<FarmPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchFarms() {
      try {
        const res = await fetch(`/api/farms?produce=${produceSlug}&limit=6`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        // Map to preview format
        const previews: FarmPreview[] = data.farms?.map((f: FarmShop) => ({
          slug: f.slug,
          name: f.name,
          county: f.location?.county || 'UK',
          isPYO: f.produce?.find(p => p.slug === produceSlug)?.isPYO,
        })) || []

        setFarms(previews)
        setTotal(data.total || 0)
      } catch (err) {
        // Silent fail - section just won't show
        setFarms([])
      } finally {
        setLoading(false)
      }
    }

    fetchFarms()
  }, [produceSlug])

  // Don't render if no farms found
  if (!loading && farms.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-heading">
          Farms with {produceName}
        </h2>
        {total > 6 && (
          <Link
            href={`/map?produce=${produceSlug}`}
            className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors inline-flex items-center gap-1"
          >
            View all {total}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Finding farms...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Link
                key={farm.slug}
                href={`/shop/${farm.slug}`}
                className="group flex items-start gap-3 rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-fast ease-gentle-spring"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-heading group-hover:text-brand-primary transition-colors truncate">
                    {farm.name}
                  </h3>
                  <p className="text-sm text-text-muted truncate">{farm.county}</p>
                  {farm.isPYO && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                      Pick Your Own
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </Link>
            ))}
          </div>

          {/* CTA to view on map */}
          <div className="mt-4">
            <Link
              href={`/map?produce=${produceSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              View {total > 6 ? `all ${total} farms` : 'farms'} on map
            </Link>
          </div>
        </>
      )}
    </section>
  )
}

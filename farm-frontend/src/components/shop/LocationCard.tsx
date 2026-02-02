'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Navigation, Copy, Check, ExternalLink, Phone, Mail, Globe } from 'lucide-react'
import { getStaticMapUrl, hasStaticMapProvider, getStaticMapAttribution } from '@/lib/static-map'

interface LocationCardProps {
  /** Farm location data */
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    county: string
    postcode: string
  }
  /** Optional contact info */
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  /** Farm name for map labels */
  farmName: string
  /** Show static map image (requires API key) */
  showStaticMap?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Generate Google Maps directions URL
 */
function getDirectionsUrl(lat: number, lng: number, name: string): string {
  const destination = encodeURIComponent(`${name}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${destination}`
}

/**
 * LocationCard Component
 *
 * Interactive location display for shop profiles with:
 * - Visual map preview
 * - One-tap directions
 * - Copy address functionality
 * - Contact information
 */
export function LocationCard({
  location,
  contact,
  farmName,
  showStaticMap = true,
  className = '',
}: LocationCardProps) {
  const [copied, setCopied] = useState(false)
  const [mapError, setMapError] = useState(false)

  const fullAddress = [
    location.address,
    location.city,
    location.county,
    location.postcode
  ].filter(Boolean).join(', ')

  // Generate static map URL if provider is available
  const staticMapUrl = showStaticMap && hasStaticMapProvider() && !mapError
    ? getStaticMapUrl({
        lat: location.lat,
        lng: location.lng,
        zoom: 14,
        width: 400,
        height: 200,
        style: 'streets',
        showMarker: true,
      })
    : null

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = fullAddress
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const directionsUrl = getDirectionsUrl(location.lat, location.lng, farmName)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`

  return (
    <div className={`bg-white dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden ${className}`}>
      {/* Map Preview */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-[2/1] bg-slate-100 dark:bg-white/[0.04] group overflow-hidden"
      >
        {/* Static map image (when available) */}
        {staticMapUrl ? (
          <>
            <Image
              src={staticMapUrl}
              alt={`Map showing location of ${farmName}`}
              fill
              className="object-cover"
              sizes="400px"
              onError={() => setMapError(true)}
              unoptimized // External URL
            />
            {/* Attribution */}
            <div className="absolute bottom-1 right-1 text-[10px] text-white/80 bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
              {getStaticMapAttribution()}
            </div>
          </>
        ) : (
          <>
            {/* Placeholder map with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-emerald-100 dark:from-primary-900/20 dark:to-emerald-900/20" />

            {/* Map pin icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 bg-white dark:bg-[#1E1E21] rounded-full shadow-lg dark:shadow-none dark:border dark:border-white/[0.08] group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/5 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-caption font-medium text-white bg-slate-900/80 dark:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            View on Map
          </span>
        </div>
      </a>

      {/* Address Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-caption font-semibold dark:font-medium text-slate-900 dark:text-zinc-50 mb-1">
              Location
            </h3>
            <p className="text-caption text-slate-600 dark:text-zinc-300 leading-relaxed">
              {fullAddress}
            </p>
          </div>
          <button
            onClick={handleCopyAddress}
            className="flex-shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.10] text-slate-600 dark:text-zinc-300 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Directions Button */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center justify-center gap-2 w-full py-2.5 px-4
            bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-400
            text-white rounded-lg
            text-caption font-medium dark:font-normal
            transition-colors
            shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.2)]
          "
        >
          <Navigation className="w-4 h-4" />
          Get Directions
        </a>

        {/* Contact Info */}
        {contact && (contact.phone || contact.email || contact.website) && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2.5 text-caption text-slate-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2.5 text-caption text-slate-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
            {contact.website && (
              <a
                href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-caption text-slate-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact location display for cards/lists
 */
export function LocationCompact({
  location,
  className = '',
}: Pick<LocationCardProps, 'location' | 'className'>) {
  const displayLocation = location.city
    ? `${location.city}, ${location.county}`
    : location.county

  return (
    <div className={`flex items-center gap-1.5 text-caption text-slate-600 dark:text-zinc-300 ${className}`}>
      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{displayLocation}</span>
    </div>
  )
}

/**
 * Distance indicator with location
 */
export function LocationWithDistance({
  location,
  distance,
  className = '',
}: Pick<LocationCardProps, 'location' | 'className'> & { distance?: number }) {
  const displayLocation = location.city || location.county

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`
    }
    return `${km.toFixed(1)}km`
  }

  return (
    <div className={`flex items-center gap-2 text-caption ${className}`}>
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate">{displayLocation}</span>
      </div>
      {distance !== undefined && (
        <>
          <span className="text-slate-300 dark:text-zinc-600">·</span>
          <span className="text-primary-600 dark:text-primary-400 font-medium dark:font-normal whitespace-nowrap">
            {formatDistance(distance)}
          </span>
        </>
      )}
    </div>
  )
}

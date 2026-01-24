'use client'

import { useState } from 'react'
import { Phone, Navigation, Globe, Share2, Copy, Check } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface QuickActionsProps {
  farm: FarmShop
  className?: string
  variant?: 'compact' | 'full'
}

export default function QuickActions({ farm, className = '', variant = 'full' }: QuickActionsProps) {
  const [copied, setCopied] = useState(false)

  // Generate URLs using existing patterns from codebase
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${farm.location.lat},${farm.location.lng}`
  const phoneUrl = farm.contact?.phone ? `tel:${farm.contact.phone}` : null
  const emailUrl = farm.contact?.email ? `mailto:${farm.contact.email}` : null
  const websiteUrl = farm.contact?.website || null

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: farm.name,
      text: `Check out ${farm.name} - a local farm shop in ${farm.location.county}`,
      url: `${window.location.origin}/shop/${farm.slug}`
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    const address = `${farm.location.address}, ${farm.location.county} ${farm.location.postcode}`
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Call Button */}
        {phoneUrl && (
          <a
            href={phoneUrl}
            className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            aria-label={`Call ${farm.name}`}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}

        {/* Directions Button */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          aria-label={`Get directions to ${farm.name}`}
        >
          <Navigation className="w-4 h-4" />
        </a>

        {/* Website Button */}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            aria-label={`Visit ${farm.name} website`}
          >
            <Globe className="w-4 h-4" />
          </a>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          aria-label={`Share ${farm.name}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Actions Row */}
      <div className="flex gap-2">
        {/* Call Button */}
        {phoneUrl && (
          <a
            href={phoneUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-200 font-medium"
            aria-label={`Call ${farm.name}`}
          >
            <Phone className="w-5 h-5" />
            <span className="hidden sm:inline">Call</span>
          </a>
        )}

        {/* Directions Button */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-200 font-medium"
          aria-label={`Get directions to ${farm.name}`}
        >
          <Navigation className="w-5 h-5" />
          <span className="hidden sm:inline">Directions</span>
        </a>
      </div>

      {/* Secondary Actions Row */}
      <div className="flex gap-2">
        {/* Website Button */}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all duration-200 font-medium"
            aria-label={`Visit ${farm.name} website`}
          >
            <Globe className="w-5 h-5" />
            <span className="hidden sm:inline">Website</span>
          </a>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 font-medium"
          aria-label={`Share ${farm.name}`}
        >
          {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Address Copy Button */}
      <button
        onClick={handleCopyAddress}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200 text-caption"
        aria-label="Copy address to clipboard"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        <span className="truncate">
          {copied ? 'Address copied!' : `${farm.location.address}, ${farm.location.county}`}
        </span>
      </button>
    </div>
  )
}

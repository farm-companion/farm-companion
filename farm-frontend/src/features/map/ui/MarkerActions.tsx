'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Phone, Globe, Clock, Navigation, Share2, Heart } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'

interface MarkerActionsProps {
  farm: FarmShop | null
  isVisible: boolean
  onClose: () => void
  onNavigate: (farm: FarmShop) => void
  onFavorite: (farmId: string) => void
  onShare: (farm: FarmShop) => void
  userLocation: { latitude: number; longitude: number } | null
  isDesktop?: boolean
}

export default function MarkerActions({
  farm,
  isVisible,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  userLocation,
  isDesktop = false
}: MarkerActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-expand after a short delay for better UX
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsExpanded(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsExpanded(false)
    }
  }, [isVisible])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }
    
    if (isVisible) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  // Calculate distance if user location available
  const getDistance = () => {
    if (!userLocation || !farm?.location) return null

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      farm.location.lat,
      farm.location.lng
    )

    return formatDistance(distance)
  }

  if (!farm || !isVisible) {
    return null
  }

  const distance = getDistance()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Marker Actions Sheet */}
      <div
        ref={containerRef}
        className={`fixed bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          isDesktop 
            ? 'right-4 top-4 w-80 rounded-lg' // Desktop: right side panel
            : `bottom-0 left-0 right-0 rounded-t-3xl ${isExpanded ? 'translate-y-0' : 'translate-y-full'}` // Mobile: bottom sheet
        }`}
        style={{
          maxHeight: isDesktop ? '70vh' : '80vh',
          minHeight: isDesktop ? 'auto' : '200px'
        }}
      >
        {/* Drag Handle - Mobile Only */}
        {!isDesktop && (
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        )}

        {/* Farm Header */}
        <div className="px-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-heading font-semibold text-gray-900 dark:text-white mb-1">
                {farm.name}
              </h3>
              <div className="flex items-center text-caption text-gray-600 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {farm.location.address}, {farm.location.city}
                </span>
              </div>
              {distance && (
                <div className="text-caption text-gray-500 dark:text-gray-400">
                  {distance} away
                </div>
              )}
            </div>
            
            {/* Favorite Button */}
            <button
              onClick={() => onFavorite(farm.id)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Add to favorites"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Navigate */}
            <button
              onClick={() => onNavigate(farm)}
              className="flex items-center justify-center p-3 bg-serum text-black rounded-xl font-medium hover:bg-serum/90 transition-colors"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Navigate
            </button>
            
            {/* Share */}
            <button
              onClick={() => onShare(farm)}
              className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </button>
          </div>

          {/* Farm Details */}
          <div className="space-y-3">
            {/* Contact Info */}
            {farm.contact?.phone && (
              <div className="flex items-center text-caption text-gray-600 dark:text-gray-300">
                <Phone className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                <span>{farm.contact.phone}</span>
              </div>
            )}
            
            {/* Website */}
            {farm.contact?.website && (
              <div className="flex items-center text-caption text-gray-600 dark:text-gray-300">
                <Globe className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                <a 
                  href={farm.contact.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-serum hover:underline"
                >
                  Visit website
                </a>
              </div>
            )}
            
            {/* Hours */}
            {farm.hours && farm.hours.length > 0 && (
              <div className="flex items-start text-caption text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Opening Hours</div>
                  {farm.hours.map((hour, index) => (
                    <div key={index} className="text-captionall">
                      {hour.day}: {hour.open === '24 hours' ? '24 hours' : `${hour.open} - ${hour.close}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
            

          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}

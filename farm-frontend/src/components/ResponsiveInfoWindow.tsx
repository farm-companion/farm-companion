'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { Phone } from 'lucide-react'
import { Globe } from 'lucide-react'
import { Navigation } from 'lucide-react'
import { X } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface ResponsiveInfoWindowProps {
  selectedFarm: FarmShop | null
  userLoc: { lat: number; lng: number } | null
  onClose: () => void
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  markerPosition?: { x: number; y: number } | null
}

export default function ResponsiveInfoWindow({ 
  selectedFarm, 
  userLoc, 
  onClose, 
  calculateDistance,
  markerPosition
}: ResponsiveInfoWindowProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Animate in when farm is selected
  useEffect(() => {
    if (selectedFarm) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [selectedFarm])

  if (!selectedFarm || !selectedFarm.location?.lat || !selectedFarm.location?.lng) {
    return null
  }

  return (
    <>
      {/* Mobile: Bottom sheet overlay */}
      {isMobile && (
        <div className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>

          
          {/* Bottom sheet with pointed top */}
          <div className={`absolute bottom-0 left-0 right-0 bg-background-surface rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
            isVisible ? 'translate-y-0' : 'translate-y-full'
          }`} style={{ clipPath: 'polygon(0 20px, 50% 0, 100% 20px, 100% 100%, 0 100%)' }}>
            {/* Pointed top indicator - positioned precisely below marker */}
            <div 
              className="absolute top-0 transform -translate-y-full flex justify-center"
              style={{ 
                left: markerPosition ? `${markerPosition.x}px` : '50%',
                transform: markerPosition ? `translate(-50%, -100%)` : 'translate(-50%, -100%)'
              }}
            >
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-background-surface"></div>
            </div>
            
            {/* Content */}
            <div className="px-6 pt-4 pb-6">
              {/* Scrollable content area */}
              <div className="max-h-[50vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-text-heading text-xl mb-2 break-words">
                    {selectedFarm.name}
                  </h3>
                  <div className="flex items-center gap-2 text-text-muted">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {selectedFarm.location.county || 'UK'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-background-canvas hover:bg-background-surface transition-colors duration-200 flex-shrink-0 ml-3"
                >
                  <X className="w-5 h-5 text-text-heading" />
                </button>
              </div>

              {/* Distance from user */}
              {userLoc && (
                <div className="mb-4 p-3 bg-solar/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-solar rounded-full"></div>
                    <span className="text-sm font-medium text-text-heading">
                      {calculateDistance(
                        userLoc.lat, userLoc.lng,
                        selectedFarm.location.lat, selectedFarm.location.lng
                      ).toFixed(1)} km away
                    </span>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-serum/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-serum" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-heading font-medium mb-1 break-words">
                      {selectedFarm.location.address}
                    </p>
                    {selectedFarm.location.county && (
                      <p className="text-sm text-text-muted break-words">
                        {selectedFarm.location.county}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              {(selectedFarm.contact?.phone || selectedFarm.contact?.website) && (
                <div className="mb-6 space-y-3">
                  {selectedFarm.contact?.phone && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-serum/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-serum" />
                      </div>
                      <a 
                        href={`tel:${selectedFarm.contact.phone}`}
                        className="text-sm text-text-heading hover:text-serum transition-colors duration-200 break-all"
                      >
                        {selectedFarm.contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedFarm.contact?.website && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-serum/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-serum" />
                      </div>
                      <a 
                        href={selectedFarm.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-text-heading hover:text-serum transition-colors duration-200 break-all"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}

              </div>
              
              {/* Action buttons - always visible outside scrollable area */}
              <div className="flex gap-3 mt-4">
                <a
                  href={`/shop/${selectedFarm.slug}`}
                  className="flex-1 bg-serum text-black px-6 py-4 rounded-xl font-semibold hover:bg-serum/90 transition-all duration-200 text-center text-sm"
                >
                  View Details
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFarm.location.lat},${selectedFarm.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-background-canvas text-text-heading px-6 py-4 rounded-xl font-medium hover:bg-background-surface transition-all duration-200 text-sm border border-border-default/30"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Traditional info window (handled by Google Maps) */}
      {!isMobile && null}
    </>
  )
}

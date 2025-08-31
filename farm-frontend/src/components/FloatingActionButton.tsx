'use client'

import { useState, useEffect } from 'react'
import { Plus, X, MapPin, Phone, Share2 } from 'lucide-react'
import { HapticButton } from './HapticFeedback'

interface FloatingActionButtonProps {
  mainIcon?: React.ComponentType<{ className?: string }>
  mainAction?: () => void
  secondaryActions?: Array<{
    id: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    action: () => void
    color?: string
  }>
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export default function FloatingActionButton({
  mainIcon: MainIcon = Plus,
  mainAction,
  secondaryActions = [],
  className = '',
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Auto-hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleMainClick = () => {
    if (secondaryActions.length > 0) {
      setIsExpanded(!isExpanded)
    } else if (mainAction) {
      mainAction()
    }
  }

  const handleSecondaryClick = (action: () => void) => {
    action()
    setIsExpanded(false)
  }

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]} ${className}`}>
      {/* Secondary actions */}
      {secondaryActions.map((action, index) => (
        <div
          key={action.id}
          className={`absolute transition-all duration-300 ease-out ${
            isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          style={{
            transform: isExpanded 
              ? `translateY(-${(index + 1) * 60}px)` 
              : 'translateY(0)',
            transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
          }}
        >
          <HapticButton
            onClick={() => handleSecondaryClick(action.action)}
            hapticType="light"
            className={`
              w-12 h-12 rounded-full shadow-lg flex items-center justify-center
              transition-all duration-200 hover:scale-110
              ${action.color || 'bg-serum hover:bg-serum/90'}
              text-white
            `}
            aria-label={action.label}
          >
            <action.icon className="w-5 h-5" />
          </HapticButton>
        </div>
      ))}

      {/* Main FAB */}
      <HapticButton
        onClick={handleMainClick}
        hapticType="medium"
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300 ease-out hover:scale-110
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
          bg-serum hover:bg-serum/90 text-white
        `}
        aria-label={secondaryActions.length > 0 ? 'Toggle actions' : 'Main action'}
      >
        <div className="transition-transform duration-300">
          {isExpanded ? (
            <X className="w-6 h-6" />
          ) : (
            <MainIcon className="w-6 h-6" />
          )}
        </div>
      </HapticButton>
    </div>
  )
}

// Predefined FAB configurations
export const createMapFAB = (onAddFarm: () => void, onShareLocation: () => void, onCallSupport: () => void) => (
  <FloatingActionButton
    mainIcon={Plus}
    mainAction={onAddFarm}
    secondaryActions={[
      {
        id: 'share-location',
        icon: Share2,
        label: 'Share Location',
        action: onShareLocation,
        color: 'bg-blue-500 hover:bg-blue-600'
      },
      {
        id: 'call-support',
        icon: Phone,
        label: 'Call Support',
        action: onCallSupport,
        color: 'bg-green-500 hover:bg-green-600'
      }
    ]}
  />
)

export const createFarmListFAB = (onAddFarm: () => void, onMapView: () => void) => (
  <FloatingActionButton
    mainIcon={Plus}
    mainAction={onAddFarm}
    secondaryActions={[
      {
        id: 'map-view',
        icon: MapPin,
        label: 'Map View',
        action: onMapView,
        color: 'bg-purple-500 hover:bg-purple-600'
      }
    ]}
  />
)

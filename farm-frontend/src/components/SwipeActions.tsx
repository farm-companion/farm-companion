'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, Star, Share2, Phone, MapPin } from 'lucide-react'

interface SwipeAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void
}

interface SwipeActionsProps {
  children: React.ReactNode
  actions: SwipeAction[]
  threshold?: number // Distance to trigger action
  className?: string
}

export default function SwipeActions({
  children,
  actions,
  threshold = 80,
  className = ''
}: SwipeActionsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    setStartX(touch.clientX)
    setIsDragging(true)
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    
    const touch = e.touches[0]
    const currentX = touch.clientX
    const deltaX = startX - currentX // Negative for left swipe
    
    // Only allow left swipe (reveal actions)
    if (deltaX > 0) {
      e.preventDefault()
      const distance = Math.min(deltaX, threshold * 2)
      setDragDistance(distance)
    }
  }, [isDragging, startX, threshold])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    
    if (dragDistance >= threshold) {
      // Snap to revealed state
      setDragDistance(threshold)
      setIsRevealed(true)
    } else {
      // Snap back to closed state
      setDragDistance(0)
      setIsRevealed(false)
    }
  }, [dragDistance, threshold])

  // Handle action click
  const handleActionClick = useCallback((action: SwipeAction) => {
    action.action()
    // Close after action
    setDragDistance(0)
    setIsRevealed(false)
  }, [])

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Calculate action widths
  const actionWidth = threshold / actions.length

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Actions background */}
      <div className="absolute top-0 right-0 bottom-0 flex">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`flex items-center justify-center transition-colors duration-200 ${
              action.color
            }`}
            style={{
              width: `${actionWidth}px`,
              minHeight: '100%'
            }}
            aria-label={action.label}
          >
            <action.icon className="w-5 h-5 text-white" />
          </button>
        ))}
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="relative bg-background-canvas transition-transform duration-200"
        style={{
          transform: `translateX(-${dragDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Predefined action sets
export const createFarmActions = (
  onCall: () => void,
  onDirections: () => void,
  onShare: () => void,
  onFavorite: () => void
): SwipeAction[] => [
  {
    id: 'call',
    label: 'Call',
    icon: Phone,
    color: 'bg-green-500 hover:bg-green-600',
    action: onCall
  },
  {
    id: 'directions',
    label: 'Directions',
    icon: MapPin,
    color: 'bg-blue-500 hover:bg-blue-600',
    action: onDirections
  },
  {
    id: 'share',
    label: 'Share',
    icon: Share2,
    color: 'bg-purple-500 hover:bg-purple-600',
    action: onShare
  },
  {
    id: 'favorite',
    label: 'Favorite',
    icon: Star,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    action: onFavorite
  }
]

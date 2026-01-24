'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number // Distance in pixels to trigger refresh
  maxPull?: number // Maximum pull distance
  className?: string
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
  className = ''
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [lastY, setLastY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtTop = useRef(false)

  // Check if we're at the top of the scrollable area
  const checkIfAtTop = useCallback(() => {
    if (!containerRef.current) return false
    const element = containerRef.current
    return element.scrollTop <= 0
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return
    
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setLastY(touch.clientY)
    isAtTop.current = checkIfAtTop()
  }, [isRefreshing, checkIfAtTop])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing || !isAtTop.current) return
    
    const touch = e.touches[0]
    const currentY = touch.clientY
    const deltaY = currentY - startY
    
    // Only allow downward pull when at top
    if (deltaY > 0 && isAtTop.current) {
      e.preventDefault()
      
      const pullAmount = Math.min(deltaY * 0.5, maxPull) // Dampen the pull
      setPullDistance(pullAmount)
      setIsPulling(pullAmount > 10)
    }
    
    setLastY(currentY)
  }, [isRefreshing, startY, maxPull])

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return
    
    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true)
      setPullDistance(0)
      setIsPulling(false)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull to refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    } else {
      // Reset without refresh
      setPullDistance(0)
      setIsPulling(false)
    }
  }, [isRefreshing, pullDistance, threshold, onRefresh])

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

  // Calculate rotation for the refresh icon
  const iconRotation = Math.min((pullDistance / threshold) * 180, 180)

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity duration-200 ${
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          height: `${Math.max(pullDistance, 60)}px`,
          transform: `translateY(-${Math.max(pullDistance, 60)}px)`
        }}
      >
        <div className="flex flex-col items-center space-y-2">
          <RefreshCw 
            className={`w-6 h-6 text-serum transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? 'rotate(0deg)' : `rotate(${iconRotation}deg)`
            }}
          />
          <span className="text-caption text-text-muted">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

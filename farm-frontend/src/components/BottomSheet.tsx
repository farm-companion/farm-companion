'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface BottomSheetProps {
  children: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
  className?: string
  snapPoints?: number[] // Heights in pixels
  defaultSnap?: number // Index of default snap point
  onHeightChange?: (height: number) => void
  /** NEW: do not capture touches outside visible sheet content */
  nonBlocking?: boolean
}

export default function BottomSheet({
  children,
  isOpen = true,
  onClose,
  className = '',
  snapPoints = [200, 400, 600],
  defaultSnap = 1,
  onHeightChange,
  nonBlocking = false // default safe
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startHeight, setStartHeight] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const currentHeight = snapPoints[currentSnap]

  // Notify parent of height changes
  useEffect(() => {
    onHeightChange?.(currentHeight)
  }, [currentHeight, onHeightChange])

  // Handle touch/mouse events for dragging
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true)
    setStartY(clientY)
    setStartHeight(currentHeight)
  }, [currentHeight])

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return

    const deltaY = startY - clientY
    const newHeight = Math.max(0, startHeight + deltaY)
    
    // Find closest snap point
    let closestSnap = 0
    let minDistance = Math.abs(newHeight - snapPoints[0])
    
    snapPoints.forEach((height, index) => {
      const distance = Math.abs(newHeight - height)
      if (distance < minDistance) {
        minDistance = distance
        closestSnap = index
      }
    })

    setCurrentSnap(closestSnap)
  }, [isDragging, startY, startHeight, snapPoints])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
    
    // If dragged to bottom, close
    if (currentSnap === 0) {
      onClose?.()
    }
  }, [currentSnap, onClose])

  // Touch events
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === dragRef.current) {
        handleStart(e.touches[0].clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault()
        handleMove(e.touches[0].clientY)
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        handleEnd()
      }
    }

    const dragElement = dragRef.current
    if (dragElement) {
      dragElement.addEventListener('touchstart', handleTouchStart, { passive: false })
      dragElement.addEventListener('touchmove', handleTouchMove, { passive: false })
      dragElement.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (dragElement) {
        dragElement.removeEventListener('touchstart', handleTouchStart)
        dragElement.removeEventListener('touchmove', handleTouchMove)
        dragElement.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleStart, handleMove, handleEnd, isDragging])

  // Mouse events
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === dragRef.current) {
        handleStart(e.clientY)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientY)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        handleEnd()
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const dragElement = dragRef.current
    if (dragElement) {
      dragElement.addEventListener('mousedown', handleMouseDown)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (dragElement) {
        dragElement.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [handleStart, handleMove, handleEnd, isDragging])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (e.key === 'ArrowUp' && currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1)
      } else if (e.key === 'ArrowDown' && currentSnap > 0) {
        setCurrentSnap(currentSnap - 1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentSnap, snapPoints.length, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fc-sheet-root" 
      data-nonblocking={nonBlocking ? 'true' : 'false'}
    >
      {/* Backdrop / overlay */}
      <div className="fc-sheet-backdrop" aria-hidden />

      {/* Visible sheet container */}
      <div
        ref={sheetRef}
        className={`fc-sheet-content ${className}`}
        style={{
          height: `${currentHeight}px`,
          transform: `translateY(${isDragging ? 0 : 0}px)`
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Farm list"
      >
        {/* Drag Handle */}
        <div
          ref={dragRef}
          className="fc-sheet-grip"
          role="button"
          tabIndex={0}
          aria-label="Drag to resize"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setCurrentSnap(currentSnap === 0 ? 1 : 0)
            }
          }}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Snap Point Indicators */}
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          {snapPoints.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSnap(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSnap ? 'bg-serum' : 'bg-gray-300'
              }`}
              aria-label={`Snap to ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

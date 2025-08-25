// Advanced Gesture Recognition
// Apple-level gesture controls for mobile interactions

import React from 'react'

interface GestureConfig {
  minSwipeDistance?: number
  maxSwipeTime?: number
  velocityThreshold?: number
  preventDefault?: boolean
}

interface GestureCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: () => void
  onPanStart?: (x: number, y: number) => void
  onPanMove?: (x: number, y: number, deltaX: number, deltaY: number) => void
  onPanEnd?: (x: number, y: number, velocity: { x: number; y: number }) => void
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

class GestureRecognizer {
  private element: HTMLElement
  private config: GestureConfig
  private callbacks: GestureCallbacks
  private isListening = false
  
  private startPoint: TouchPoint | null = null
  private currentPoint: TouchPoint | null = null
  private touchStartTime = 0
  private longPressTimer: NodeJS.Timeout | null = null
  private isLongPress = false

  constructor(
    element: HTMLElement,
    callbacks: GestureCallbacks,
    config: GestureConfig = {}
  ) {
    this.element = element
    this.callbacks = callbacks
    this.config = {
      minSwipeDistance: 50,
      maxSwipeTime: 300,
      velocityThreshold: 0.3,
      preventDefault: true,
      ...config
    }
  }

  start(): void {
    if (this.isListening) return
    this.isListening = true

    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false })
  }

  stop(): void {
    if (!this.isListening) return
    this.isListening = false

    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchmove', this.handleTouchMove)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
    this.element.removeEventListener('touchcancel', this.handleTouchCancel)

    this.reset()
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.config.preventDefault) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    this.startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
    this.currentPoint = { ...this.startPoint }
    this.touchStartTime = Date.now()
    this.isLongPress = false

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true
      this.callbacks.onLongPress?.()
    }, 500)

    this.callbacks.onPanStart?.(this.startPoint.x, this.startPoint.y)
  }

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.startPoint || !this.currentPoint) return

    const touch = e.touches[0]
    const newPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    const deltaX = newPoint.x - this.startPoint.x
    const deltaY = newPoint.y - this.startPoint.y

    // Cancel long press if moved
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
    }

    this.currentPoint = newPoint
    this.callbacks.onPanMove?.(newPoint.x, newPoint.y, deltaX, deltaY)
  }

  private handleTouchEnd = (_e: TouchEvent): void => {
    if (!this.startPoint || !this.currentPoint) return

    const endTime = Date.now()
    const duration = endTime - this.touchStartTime
    const deltaX = this.currentPoint.x - this.startPoint.x
    const deltaY = this.currentPoint.y - this.startPoint.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Calculate velocity
    const velocityX = deltaX / duration
    const velocityY = deltaY / duration
    const _velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY)

    // Determine gesture type
    if (distance >= (this.config.minSwipeDistance || 50) && 
        duration <= (this.config.maxSwipeTime || 300)) {
      
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
      
      if (isHorizontal) {
        if (deltaX > 0) {
          this.callbacks.onSwipeRight?.()
        } else {
          this.callbacks.onSwipeLeft?.()
        }
      } else {
        if (deltaY > 0) {
          this.callbacks.onSwipeDown?.()
        } else {
          this.callbacks.onSwipeUp?.()
        }
      }
    } else if (distance < 10 && duration < 200 && !this.isLongPress) {
      // Tap gesture
      this.callbacks.onTap?.()
    }

    this.callbacks.onPanEnd?.(this.currentPoint.x, this.currentPoint.y, {
      x: velocityX,
      y: velocityY
    })

    this.reset()
  }

  private handleTouchCancel = (): void => {
    this.reset()
  }

  private reset(): void {
    this.startPoint = null
    this.currentPoint = null
    this.touchStartTime = 0
    this.isLongPress = false
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }
}

// Utility functions for common gesture patterns
export const createSwipeToClose = (
  element: HTMLElement,
  onClose: () => void,
  config?: GestureConfig & { onDragStart?: () => void; onDragEnd?: () => void }
): GestureRecognizer => {
  return new GestureRecognizer(element, {
    onSwipeLeft: onClose,
    onPanStart: () => {
      config?.onDragStart?.()
    },
    onPanMove: (x, y, deltaX) => {
      // Follow finger with spring-back effect
      if (deltaX < 0) {
        const progress = Math.min(Math.abs(deltaX) / 100, 1)
        element.style.transform = `translateX(${deltaX * 0.3}px)`
        element.style.opacity = `${1 - progress * 0.3}`
      }
    },
    onPanEnd: (x, y, velocity) => {
      config?.onDragEnd?.()
      // Auto-close if velocity is high enough
      if (velocity.x < -(config?.velocityThreshold || 0.3)) {
        onClose()
      } else {
        // Spring back
        element.style.transform = ''
        element.style.opacity = ''
      }
    }
  }, config)
}

export const createEdgeSwipeToOpen = (
  element: HTMLElement,
  onOpen: () => void,
  config?: GestureConfig
): GestureRecognizer => {
  return new GestureRecognizer(element, {
    onSwipeRight: onOpen,
    onPanMove: (x, y, deltaX) => {
      // Show preview of menu opening
      if (deltaX > 0 && x < 50) {
        const progress = Math.min(deltaX / 100, 1)
        // Trigger preview animation
      }
    }
  }, config)
}

// Hook for React components
export const useGesture = (
  elementRef: React.RefObject<HTMLElement>,
  callbacks: GestureCallbacks,
  config?: GestureConfig
) => {
  const [recognizer, setRecognizer] = React.useState<GestureRecognizer | null>(null)

  React.useEffect(() => {
    if (!elementRef.current) return

    const newRecognizer = new GestureRecognizer(elementRef.current, callbacks, config)
    newRecognizer.start()
    setRecognizer(newRecognizer)

    return () => {
      newRecognizer.stop()
    }
  }, [elementRef, callbacks, config])

  return recognizer
}

export default GestureRecognizer

'use client'

import { useEffect, useState } from 'react'

interface TransitionIndicatorProps {
  isVisible: boolean
  duration?: number
  onComplete?: () => void
}

export default function TransitionIndicator({ 
  isVisible, 
  duration = 1200, 
  onComplete 
}: TransitionIndicatorProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setShouldRender(false)
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setShouldRender(false)
    }
  }, [isVisible, duration, onComplete])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm z-50 transition-all duration-300 ease-out">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Outer timing circle */}
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-serum/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="176"
              strokeDashoffset="176"
              className="text-serum"
              style={{
                animation: `dash ${duration}ms ease-in-out forwards`
              }}
            />
          </svg>
          
          {/* Inner pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-serum/20 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

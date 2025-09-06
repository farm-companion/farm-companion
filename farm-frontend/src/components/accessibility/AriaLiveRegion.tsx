'use client'

import React from 'react'
import { useAriaLiveRegion } from '@/lib/accessibility'

interface AriaLiveRegionProps {
  className?: string
}

export function AriaLiveRegion({ className = '' }: AriaLiveRegionProps) {
  const { message, politeness } = useAriaLiveRegion()

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    >
      {message}
    </div>
  )
}

// Hook for components to announce messages
export function useAnnouncement() {
  const { announce } = useAriaLiveRegion()
  return announce
}

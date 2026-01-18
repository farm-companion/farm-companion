/**
 * Mobile-First Utilities
 * Helper functions for mobile-optimized development
 */

import { tokens } from './tokens'

/**
 * Check if device prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if device is low-end (for performance optimization)
 */
export const isLowEndDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false

  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) return true

  // Check connection speed
  const connection = (navigator as any).connection
  if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true
  }

  return false
}

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Check if device is desktop
 */
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024
}

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
  if (typeof window === 'undefined') return 'md'

  const width = window.innerWidth

  if (width < 375) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  if (width < 1536) return 'xl'
  return '2xl'
}

/**
 * Mobile-first responsive value helper
 * Usage: responsive({ mobile: '16px', tablet: '18px', desktop: '20px' })
 */
export const responsive = <T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  default?: T
}): T => {
  const breakpoint = getCurrentBreakpoint()

  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return values.mobile ?? values.default as T
  }

  if (breakpoint === 'md') {
    return values.tablet ?? values.mobile ?? values.default as T
  }

  return values.desktop ?? values.tablet ?? values.mobile ?? values.default as T
}

/**
 * Touch target size validator
 * Ensures touch targets meet 48x48px minimum
 */
export const isTouchTargetValid = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect()
  return rect.width >= 48 && rect.height >= 48
}

/**
 * Safe area insets (for iPhone notch, etc.)
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const style = getComputedStyle(document.documentElement)

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  }
}

/**
 * Viewport height (accounting for mobile browser chrome)
 * Use this instead of 100vh on mobile
 */
export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0
  return window.innerHeight
}

/**
 * Check if device supports hover
 */
export const supportsHover = (): boolean => {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/**
 * Check if device supports touch
 */
export const supportsTouch = (): boolean => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Thumb zone checker (for one-handed mobile use)
 * Bottom third of screen is thumb-friendly zone
 */
export const isInThumbZone = (element: HTMLElement): boolean => {
  if (typeof window === 'undefined') return false

  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const thumbZoneStart = (viewportHeight * 2) / 3

  return rect.top >= thumbZoneStart
}

/**
 * Mobile-optimized scroll behavior
 */
export const smoothScrollTo = (elementId: string, offset = 0) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const y = element.getBoundingClientRect().top + window.pageYOffset + offset

  window.scrollTo({
    top: y,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

/**
 * Prevent body scroll (for modals)
 */
export const preventBodyScroll = (prevent: boolean) => {
  if (typeof document === 'undefined') return

  if (prevent) {
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${window.innerWidth - document.body.clientWidth}px`
  } else {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}

/**
 * Debounce function for resize/scroll handlers
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance-critical handlers
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Mobile-friendly focus management
 */
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstFocusable = focusableElements[0] as HTMLElement
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)

  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Generate responsive class names
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Mobile-first media query helper
 */
export const mq = {
  xs: `@media (min-width: ${tokens.breakpoints.xs})`,
  sm: `@media (min-width: ${tokens.breakpoints.sm})`,
  md: `@media (min-width: ${tokens.breakpoints.md})`,
  lg: `@media (min-width: ${tokens.breakpoints.lg})`,
  xl: `@media (min-width: ${tokens.breakpoints.xl})`,
  '2xl': `@media (min-width: ${tokens.breakpoints['2xl']})`,
  touch: '@media (hover: none) and (pointer: coarse)',
  hover: '@media (hover: hover) and (pointer: fine)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  darkMode: '@media (prefers-color-scheme: dark)',
}

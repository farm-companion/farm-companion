// Accessibility Utilities for WCAG 2.2 AA Compliance
// PuredgeOS 3.0 Compliant Accessibility Management

import { useEffect, useRef, useState } from 'react'

// ARIA Live Region Hook
export function useAriaLiveRegion() {
  const [message, setMessage] = useState<string>('')
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite')

  const announce = (text: string, level: 'polite' | 'assertive' = 'polite') => {
    setPoliteness(level)
    setMessage(text)
    
    // Clear message after announcement
    setTimeout(() => setMessage(''), 1000)
  }

  return { message, politeness, announce }
}

// Focus Management Hook
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  return { focusRef, trapFocus, restoreFocus, saveFocus }
}

// Keyboard Navigation Hook
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true)
        document.body.classList.add('keyboard-user')
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
      document.body.classList.remove('keyboard-user')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return { isKeyboardUser }
}

// Screen Reader Detection Hook
export function useScreenReader() {
  const [isScreenReader, setIsScreenReader] = useState(false)

  useEffect(() => {
    // Check for screen reader indicators
    const checkScreenReader = () => {
      const hasAriaLive = document.querySelector('[aria-live]')
      const hasScreenReaderClass = document.body.classList.contains('sr-only')
      const hasScreenReaderText = document.querySelector('.sr-only')
      
      setIsScreenReader(!!(hasAriaLive || hasScreenReaderClass || hasScreenReaderText))
    }

    checkScreenReader()
    
    // Check periodically for screen reader usage
    const interval = setInterval(checkScreenReader, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return { isScreenReader }
}

// Color Contrast Utilities
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color)
    if (!rgb) return 0
    
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const luminance1 = getLuminance(color1)
  const luminance2 = getLuminance(color2)
  
  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function isColorContrastCompliant(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(color1, color2)
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}

// ARIA Utilities
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

export function createAriaDescribedBy(...ids: string[]): string {
  return ids.filter(Boolean).join(' ')
}

export function createAriaLabelledBy(...ids: string[]): string {
  return ids.filter(Boolean).join(' ')
}

// Focus Utilities
export function focusElement(element: HTMLElement | null): void {
  if (element) {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

export function focusFirstFocusable(container: HTMLElement): void {
  const focusable = container.querySelector(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement
  
  focusElement(focusable)
}

export function focusLastFocusable(container: HTMLElement): void {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  const lastElement = focusable[focusable.length - 1] as HTMLElement
  focusElement(lastElement)
}

// Announcement Utilities
export function announceToScreenReader(message: string, level: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', level)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Validation Utilities
export function validateAriaLabel(element: HTMLElement): boolean {
  const ariaLabel = element.getAttribute('aria-label')
  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  const textContent = element.textContent?.trim()
  
  return !!(ariaLabel || ariaLabelledBy || textContent)
}

export function validateAriaDescribedBy(element: HTMLElement): boolean {
  const ariaDescribedBy = element.getAttribute('aria-describedby')
  if (!ariaDescribedBy) return true
  
  const describedElements = ariaDescribedBy.split(' ').map(id => document.getElementById(id))
  return describedElements.every(el => el !== null)
}

// Skip Link Utilities
export function createSkipLink(target: string, text: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a')
  skipLink.href = target
  skipLink.textContent = text
  skipLink.className = 'skip-link'
  skipLink.setAttribute('tabindex', '1')
  
  return skipLink
}

// Landmark Utilities
export function ensureLandmarks(): void {
  // Ensure main landmark exists
  if (!document.querySelector('main, [role="main"]')) {
    const main = document.createElement('main')
    main.id = 'main-content'
    document.body.appendChild(main)
  }
  
  // Ensure navigation landmarks exist
  const navs = document.querySelectorAll('nav, [role="navigation"]')
  if (navs.length > 0) {
    navs.forEach((nav, index) => {
      if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
        nav.setAttribute('aria-label', `Navigation ${index + 1}`)
      }
    })
  }
}

// High Contrast Mode Detection
export function useHighContrastMode(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)')
      setIsHighContrast(mediaQuery.matches)
    }

    checkHighContrast()
    
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    mediaQuery.addEventListener('change', checkHighContrast)
    
    return () => mediaQuery.removeEventListener('change', checkHighContrast)
  }, [])

  return isHighContrast
}

// Reduced Motion Detection
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
    }

    checkReducedMotion()
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', checkReducedMotion)
    
    return () => mediaQuery.removeEventListener('change', checkReducedMotion)
  }, [])

  return prefersReducedMotion
}

// Accessibility Error Reporting
export function reportAccessibilityError(error: string, element?: HTMLElement): void {
  console.error(`Accessibility Error: ${error}`, element)
  
  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service
    // reportError({ type: 'accessibility', message: error, element })
  }
}

// WCAG 2.2 AA Compliance Checker
export function checkWCAGCompliance(element: HTMLElement): {
  compliant: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Check for proper heading structure
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length > 0) {
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.toLowerCase().replace('h', '')))
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        issues.push('Heading levels are skipped')
        break
      }
    }
  }

  // Check for images without alt text
  const images = element.querySelectorAll('img')
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      issues.push('Image missing alt text')
    }
  })

  // Check for form labels
  const inputs = element.querySelectorAll('input, textarea, select')
  inputs.forEach(input => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    if (!id || (!ariaLabel && !ariaLabelledBy && !document.querySelector(`label[for="${id}"]`))) {
      issues.push('Form input missing label')
    }
  })

  // Check for proper ARIA attributes
  const interactiveElements = element.querySelectorAll('button, a, input, select, textarea')
  interactiveElements.forEach(el => {
    if (!validateAriaLabel(el as HTMLElement)) {
      issues.push('Interactive element missing accessible name')
    }
  })

  return {
    compliant: issues.length === 0,
    issues
  }
}

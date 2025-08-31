'use client'

import { useCallback } from 'react'

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

interface HapticFeedbackProps {
  children: React.ReactNode
  onHaptic?: (type: HapticType) => void
}

// Haptic feedback utility
export const useHaptic = () => {
  const trigger = useCallback((type: HapticType = 'light') => {
    // Check if haptic feedback is supported
    if ('vibrate' in navigator) {
      let pattern: number | number[]
      
      switch (type) {
        case 'light':
          pattern = 10
          break
        case 'medium':
          pattern = 20
          break
        case 'heavy':
          pattern = 30
          break
        case 'success':
          pattern = [10, 50, 10]
          break
        case 'warning':
          pattern = [20, 50, 20]
          break
        case 'error':
          pattern = [30, 100, 30]
          break
        default:
          pattern = 10
      }
      
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.warn('Haptic feedback failed:', error)
      }
    }
  }, [])

  return { trigger }
}

// Haptic feedback provider component
export default function HapticFeedback({ children, onHaptic }: HapticFeedbackProps) {
  const { trigger } = useHaptic()

  const handleHaptic = useCallback((type: HapticType) => {
    trigger(type)
    onHaptic?.(type)
  }, [trigger, onHaptic])

  return (
    <div onHaptic={handleHaptic}>
      {children}
    </div>
  )
}

// Haptic button component
interface HapticButtonProps {
  onClick: () => void
  hapticType?: HapticType
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function HapticButton({ 
  onClick, 
  hapticType = 'light', 
  children, 
  className = '',
  disabled = false 
}: HapticButtonProps) {
  const { trigger } = useHaptic()

  const handleClick = () => {
    if (!disabled) {
      trigger(hapticType)
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}

// Haptic link component
interface HapticLinkProps {
  href: string
  hapticType?: HapticType
  children: React.ReactNode
  className?: string
}

export function HapticLink({ 
  href, 
  hapticType = 'light', 
  children, 
  className = '' 
}: HapticLinkProps) {
  const { trigger } = useHaptic()

  const handleClick = () => {
    trigger(hapticType)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}

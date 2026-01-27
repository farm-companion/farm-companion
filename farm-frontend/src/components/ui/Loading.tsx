'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Loading Components Collection
 *
 * Provides various loading indicators with smooth animations
 * and accessibility support.
 */

// =============================================================================
// SPINNER
// =============================================================================

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'white'
  className?: string
  label?: string
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const strokeMap = {
  xs: 2,
  sm: 2,
  md: 2.5,
  lg: 3,
  xl: 3,
}

const variantColors = {
  default: 'text-zinc-400 dark:text-zinc-500',
  primary: 'text-cyan-500 dark:text-cyan-400',
  white: 'text-white',
}

export function Spinner({ size = 'md', variant = 'default', className, label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        className={cn(sizeMap[size], variantColors[variant], 'animate-spin')}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={strokeMap[size]}
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
}

// =============================================================================
// LOADING DOTS
// =============================================================================

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const dotSizeMap = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center gap-1', className)}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn(
            dotSizeMap[size],
            'rounded-full bg-current'
          )}
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

// =============================================================================
// PULSE RING
// =============================================================================

interface PulseRingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const pulseSizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

export function PulseRing({ size = 'md', className }: PulseRingProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('relative', pulseSizeMap[size], className)}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-500/50"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.7, 0.2, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.2,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-cyan-500" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}

// =============================================================================
// PROGRESS BAR
// =============================================================================

interface ProgressBarProps {
  value?: number
  indeterminate?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'success'
  className?: string
  label?: string
}

const progressSizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const progressVariantMap = {
  default: 'bg-zinc-500',
  primary: 'bg-cyan-500',
  success: 'bg-green-500',
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  size = 'md',
  variant = 'primary',
  className,
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Loading progress'}
      className={cn('w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700', progressSizeMap[size], className)}
    >
      {indeterminate ? (
        <motion.div
          className={cn('h-full rounded-full', progressVariantMap[variant])}
          initial={{ x: '-100%', width: '30%' }}
          animate={{ x: '400%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <motion.div
          className={cn('h-full rounded-full', progressVariantMap[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  )
}

// =============================================================================
// LOADING OVERLAY
// =============================================================================

interface LoadingOverlayProps {
  visible: boolean
  message?: string
  blur?: boolean
  className?: string
  children?: React.ReactNode
}

export function LoadingOverlay({
  visible,
  message,
  blur = true,
  className,
  children,
}: LoadingOverlayProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
          className={cn(
            'absolute inset-0 z-50 flex flex-col items-center justify-center',
            blur ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm' : 'bg-white/90 dark:bg-zinc-900/90',
            className
          )}
        >
          {children || (
            <>
              <Spinner size="lg" variant="primary" />
              {message && (
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// LOADING PLACEHOLDER
// =============================================================================

interface LoadingPlaceholderProps {
  icon?: React.ReactNode
  message?: string
  submessage?: string
  className?: string
}

export function LoadingPlaceholder({
  icon,
  message = 'Loading...',
  submessage,
  className,
}: LoadingPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {icon || <Spinner size="lg" variant="primary" />}
      <p className="mt-4 text-base font-medium text-zinc-900 dark:text-zinc-100">
        {message}
      </p>
      {submessage && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {submessage}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// SKELETON SHIMMER (CSS-based for performance)
// =============================================================================

interface ShimmerProps {
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function Shimmer({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className,
}: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-zinc-200 dark:bg-zinc-700',
        roundedMap[rounded],
        className
      )}
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 50%, transparent)',
        }}
      />
    </div>
  )
}

export default {
  Spinner,
  LoadingDots,
  PulseRing,
  ProgressBar,
  LoadingOverlay,
  LoadingPlaceholder,
  Shimmer,
}

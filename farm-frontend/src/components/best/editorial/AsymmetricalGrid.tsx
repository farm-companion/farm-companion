/**
 * AsymmetricalGrid Component
 *
 * Staggered asymmetry layout (40%/60%) with large white-space gutters.
 * Follows "The Luxury of Space" principle.
 */

import { ReactNode } from 'react'

interface AsymmetricalGridProps {
  children: ReactNode
  className?: string
}

export function AsymmetricalGrid({ children, className = '' }: AsymmetricalGridProps) {
  return (
    <div
      className={`
        grid gap-y-16 md:gap-y-24
        ${className}
      `}
      style={{
        gridTemplateColumns: 'repeat(12, 1fr)',
        columnGap: 'clamp(1.5rem, 4vw, 4rem)',
      }}
    >
      {children}
    </div>
  )
}

// Grid item wrapper for asymmetric placement
interface GridItemProps {
  children: ReactNode
  variant?: 'wide' | 'narrow' | 'full' | 'left' | 'right'
  className?: string
}

export function GridItem({ children, variant = 'wide', className = '' }: GridItemProps) {
  const variantStyles = {
    // 60% width, left-aligned
    wide: 'col-span-12 md:col-span-7 md:col-start-1',
    // 40% width, right-aligned
    narrow: 'col-span-12 md:col-span-5 md:col-start-8',
    // Full width
    full: 'col-span-12',
    // Left side with offset
    left: 'col-span-12 md:col-span-6 md:col-start-1',
    // Right side with offset
    right: 'col-span-12 md:col-span-6 md:col-start-7',
  }

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}

// Re-export GridItem
AsymmetricalGrid.Item = GridItem

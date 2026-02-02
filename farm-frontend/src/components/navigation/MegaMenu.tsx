'use client'

/**
 * MegaMenu Component
 *
 * Hover-triggered dropdown for navigation items.
 * Provides a larger preview area for content discovery.
 *
 * Design System Compliance:
 * - Spacing: 8px grid
 * - Animation: fade-in only (150ms)
 * - Touch targets: 44px minimum
 * - Glass surface with blur
 */

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MegaMenuProps {
  /** Trigger label */
  label: string
  /** Link href for the trigger */
  href: string
  /** Menu content */
  children: ReactNode
  /** Whether header is in inverted mode */
  inverted?: boolean
  /** Additional trigger class names */
  className?: string
}

export function MegaMenu({
  label,
  href,
  children,
  inverted = false,
  className = '',
}: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    // Small delay before closing to allow moving to dropdown
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <Link
        href={href}
        className={cn(
          'px-4 py-2 rounded-lg text-[12px] font-semibold dark:font-medium uppercase tracking-[0.06em] transition-all duration-200',
          inverted
            ? 'text-white hover:text-white hover:bg-white/20'
            : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-white/[0.04]',
          isOpen && !inverted && 'bg-zinc-100 dark:bg-white/[0.04]',
          isOpen && inverted && 'bg-white/20',
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
      </Link>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50',
            'min-w-[320px] p-4 rounded-xl',
            'border border-slate-200/80 dark:border-white/[0.08]',
            'bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl',
            'shadow-xl dark:shadow-none',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
          role="menu"
        >
          {/* Specular highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent dark:block hidden pointer-events-none rounded-t-xl" />
          {children}
        </div>
      )}
    </div>
  )
}

export default MegaMenu

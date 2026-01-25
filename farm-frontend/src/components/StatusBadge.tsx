'use client'

import { getFarmStatus, getStatusColorClass } from '@/lib/farm-status'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations'

interface StatusBadgeProps {
  openingHours?: unknown // Accepts any format, normalized internally
  className?: string
  showIcon?: boolean
}

/**
 * StatusBadge Component
 *
 * Displays real-time farm status (Open Now, Closed, etc.)
 * with color-coded styling.
 */
export function StatusBadge({ openingHours, className = '', showIcon = true }: StatusBadgeProps) {
  const status = getFarmStatus(openingHours)

  // Don't render if status is unknown
  if (status.status === 'unknown') {
    return null
  }

  const colorClass = getStatusColorClass(status)
  const icon = status.status === 'open' ? '●' : '○'

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-small font-medium ${colorClass} ${className}`}
    >
      {showIcon && <span className="text-[10px]">{icon}</span>}
      <span>{status.message}</span>
    </motion.div>
  )
}

/**
 * Compact version for use in cards/lists with background for visibility
 */
export function StatusBadgeCompact({ openingHours, className = '' }: StatusBadgeProps) {
  const status = getFarmStatus(openingHours)

  if (status.status === 'unknown') {
    return null
  }

  const isOpen = status.status === 'open'
  const icon = isOpen ? '●' : '○'
  const text = isOpen ? 'Open' : 'Closed'

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        backdrop-blur-sm shadow-sm
        ${isOpen
          ? 'bg-emerald-500/90 text-white'
          : 'bg-slate-900/80 text-slate-200'
        }
        ${className}
      `}
    >
      <span className={`text-[8px] ${isOpen ? 'text-emerald-200' : 'text-red-400'}`}>{icon}</span>
      {text}
    </span>
  )
}

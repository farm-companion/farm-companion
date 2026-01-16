'use client'

import { getFarmStatus, getStatusColorClass, type OpeningHours } from '@/lib/farm-status'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations'

interface StatusBadgeProps {
  openingHours?: OpeningHours
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {showIcon && <span className="text-[10px]">{icon}</span>}
      <span>{status.message}</span>
    </motion.div>
  )
}

/**
 * Compact version for use in lists
 */
export function StatusBadgeCompact({ openingHours, className = '' }: StatusBadgeProps) {
  const status = getFarmStatus(openingHours)

  if (status.status === 'unknown') {
    return null
  }

  const icon = status.status === 'open' ? '●' : '○'
  const text = status.status === 'open' ? 'Open' : 'Closed'
  const colorClass = status.status === 'open' ? 'text-success' : 'text-error'

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass} ${className}`}>
      <span className="text-[8px]">{icon}</span>
      {text}
    </span>
  )
}

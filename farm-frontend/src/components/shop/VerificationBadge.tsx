'use client'

import { useState } from 'react'
import { CheckCircle2, ShieldCheck, ShieldQuestion, Info } from 'lucide-react'

/**
 * Verification status levels for farm shops
 */
export type VerificationLevel = 'verified' | 'claimed' | 'unverified'

interface VerificationBadgeProps {
  /** Verification status from FarmShop.verified field */
  verified?: boolean | string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show label text alongside icon */
  showLabel?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Determine verification level from various input formats
 */
function getVerificationLevel(verified?: boolean | string): VerificationLevel {
  if (verified === true || verified === 'true' || verified === 'verified') {
    return 'verified'
  }
  if (verified === 'claimed' || verified === 'pending') {
    return 'claimed'
  }
  return 'unverified'
}

const VERIFICATION_CONFIG: Record<VerificationLevel, {
  icon: typeof CheckCircle2
  label: string
  description: string
  bgLight: string
  bgDark: string
  textLight: string
  textDark: string
  borderLight: string
  borderDark: string
}> = {
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    description: 'This farm shop has been verified by our team. Contact details, location, and offerings are confirmed accurate.',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/20',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-400',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800/50',
  },
  claimed: {
    icon: CheckCircle2,
    label: 'Claimed',
    description: 'This listing has been claimed by the business owner. Verification is pending.',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-400',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800/50',
  },
  unverified: {
    icon: ShieldQuestion,
    label: 'Unverified',
    description: 'This listing has not yet been verified. Information may be outdated.',
    bgLight: 'bg-slate-50',
    bgDark: 'dark:bg-white/[0.04]',
    textLight: 'text-slate-600',
    textDark: 'dark:text-zinc-400',
    borderLight: 'border-slate-200',
    borderDark: 'dark:border-white/[0.08]',
  },
}

const SIZE_CONFIG = {
  sm: {
    icon: 'w-3.5 h-3.5',
    text: 'text-small',
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-caption',
    padding: 'px-2.5 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-body',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
}

/**
 * VerificationBadge Component
 *
 * Displays farm shop verification status with visual hierarchy:
 * - Verified: Green shield with checkmark (highest trust)
 * - Claimed: Amber checkmark (business owner claimed, pending verification)
 * - Unverified: Gray question shield (no verification yet)
 *
 * Includes tooltip with explanation on hover/focus.
 */
export function VerificationBadge({
  verified,
  size = 'md',
  showLabel = true,
  className = '',
}: VerificationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const level = getVerificationLevel(verified)
  const config = VERIFICATION_CONFIG[level]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className={`
          inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding}
          ${config.bgLight} ${config.bgDark}
          ${config.textLight} ${config.textDark}
          border ${config.borderLight} ${config.borderDark}
          rounded-full font-medium ${sizeConfig.text}
          transition-all duration-200
          hover:shadow-sm dark:hover:shadow-none
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          dark:focus:ring-offset-[#050505]
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`verification-tooltip-${level}`}
      >
        <Icon className={sizeConfig.icon} aria-hidden="true" />
        {showLabel && <span>{config.label}</span>}
        <Info className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-60`} aria-hidden="true" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          id={`verification-tooltip-${level}`}
          role="tooltip"
          className={`
            absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
            w-64 p-3 rounded-lg
            bg-white dark:bg-[#1E1E21]
            border border-slate-200 dark:border-white/[0.08]
            shadow-lg dark:shadow-none
            text-small text-slate-700 dark:text-zinc-300
            animate-fade-in
          `}
        >
          <div className="flex items-start gap-2 mb-1.5">
            <Icon className={`w-4 h-4 ${config.textLight} ${config.textDark} flex-shrink-0 mt-0.5`} />
            <span className={`font-semibold dark:font-medium ${config.textLight} ${config.textDark}`}>
              {config.label}
            </span>
          </div>
          <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
            {config.description}
          </p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-white dark:bg-[#1E1E21] border-b border-r border-slate-200 dark:border-white/[0.08] rotate-45 -translate-y-1" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact icon-only verification indicator
 */
export function VerificationIcon({
  verified,
  size = 'md',
  className = '',
}: Omit<VerificationBadgeProps, 'showLabel'>) {
  const level = getVerificationLevel(verified)
  const config = VERIFICATION_CONFIG[level]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex ${config.textLight} ${config.textDark} ${className}`}
      title={`${config.label}: ${config.description}`}
    >
      <Icon className={sizeConfig.icon} aria-label={config.label} />
    </span>
  )
}

/**
 * Verification status for use in lists/cards
 */
export function VerificationStatus({
  verified,
  className = '',
}: Pick<VerificationBadgeProps, 'verified' | 'className'>) {
  const level = getVerificationLevel(verified)
  const config = VERIFICATION_CONFIG[level]
  const Icon = config.icon

  // Only show for verified/claimed status (skip unverified)
  if (level === 'unverified') return null

  return (
    <span
      className={`inline-flex items-center gap-1 text-small ${config.textLight} ${config.textDark} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="font-medium dark:font-normal">{config.label}</span>
    </span>
  )
}

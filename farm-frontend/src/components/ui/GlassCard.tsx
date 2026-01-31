'use client'

import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  depth?: 'shallow' | 'medium' | 'deep'
  variant?: 'default' | 'frosted' | 'gradient'
}

const depthStyles = {
  shallow: {
    blur: 'backdrop-blur-sm',
    shadow: 'shadow-sm shadow-slate-200/30 dark:shadow-slate-900/30',
    hoverShadow: 'hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-slate-900/50',
  },
  medium: {
    blur: 'backdrop-blur-md',
    shadow: 'shadow-md shadow-slate-200/40 dark:shadow-slate-900/40',
    hoverShadow: 'hover:shadow-xl hover:shadow-slate-300/40 dark:hover:shadow-slate-900/60',
  },
  deep: {
    blur: 'backdrop-blur-xl backdrop-saturate-150',
    shadow: 'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
    hoverShadow: 'hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-slate-900/70',
  },
}

const variantStyles = {
  default: 'bg-white/70 dark:bg-slate-900/70',
  frosted: 'bg-white/50 dark:bg-slate-900/50',
  gradient: 'bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-800/40',
}

export function GlassCard({
  children,
  className,
  hover = true,
  depth = 'medium',
  variant = 'default',
}: GlassCardProps) {
  const depthConfig = depthStyles[depth]
  const variantStyle = variantStyles[variant]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        variantStyle,
        depthConfig.blur,
        // Multi-layer border
        'border border-white/50 dark:border-slate-700/50',
        'ring-1 ring-slate-200/20 dark:ring-slate-700/20',
        depthConfig.shadow,
        // Transitions
        'transition-all duration-300 ease-out',
        // Hover effects
        hover && [
          depthConfig.hoverShadow,
          'hover:border-white/80 dark:hover:border-slate-600/80',
          'hover:ring-2 hover:ring-serum/10',
          'hover:-translate-y-0.5',
        ],
        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Specialized glass card variants
export function FrostedPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-white/40 dark:bg-slate-900/40',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-white/60 dark:border-slate-700/40',
        'shadow-lg shadow-slate-200/30 dark:shadow-slate-900/50',
        className
      )}
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {children}
    </div>
  )
}

export function GlassButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden px-4 py-2 rounded-lg',
        'bg-white/60 dark:bg-slate-800/60',
        'backdrop-blur-md',
        'border border-white/50 dark:border-slate-700/50',
        'shadow-sm shadow-slate-200/30 dark:shadow-slate-900/30',
        'text-slate-700 dark:text-slate-200 font-medium',
        'transition-all duration-200',
        'hover:bg-white/80 dark:hover:bg-slate-800/80',
        'hover:shadow-md hover:shadow-slate-200/40 dark:hover:shadow-slate-900/50',
        'hover:border-serum/30',
        'active:scale-[0.98]',
        className
      )}
    >
      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      <span className="relative z-10">{children}</span>
    </button>
  )
}

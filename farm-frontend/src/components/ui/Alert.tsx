/**
 * Alert Component
 *
 * Alert banners for displaying important information, warnings, errors, and success messages
 * Supports dismissible alerts with optional icons and actions
 */

'use client'

import React, { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInDown } from '@/lib/animations'
import { X, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const alertVariants = cva(
  [
    'relative flex gap-3 p-4 rounded-lg border',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        info: [
          'bg-blue-50 dark:bg-blue-950',
          'border-blue-200 dark:border-blue-800',
          'text-blue-900 dark:text-blue-100',
        ],
        success: [
          'bg-green-50 dark:bg-green-950',
          'border-green-200 dark:border-green-800',
          'text-green-900 dark:text-green-100',
        ],
        warning: [
          'bg-yellow-50 dark:bg-yellow-950',
          'border-yellow-200 dark:border-yellow-800',
          'text-yellow-900 dark:text-yellow-100',
        ],
        error: [
          'bg-red-50 dark:bg-red-950',
          'border-red-200 dark:border-red-800',
          'text-red-900 dark:text-red-100',
        ],
        default: [
          'bg-background-surface',
          'border-border-default',
          'text-text-body',
        ],
      },
      size: {
        sm: 'text-sm p-3',
        md: 'text-base p-4',
        lg: 'text-lg p-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  default: Info,
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Alert title (optional)
   */
  title?: string
  /**
   * Custom icon (overrides default variant icon)
   */
  icon?: React.ReactNode
  /**
   * Hide the icon
   */
  hideIcon?: boolean
  /**
   * Make the alert dismissible
   */
  dismissible?: boolean
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void
  /**
   * Action button or element to display
   */
  action?: React.ReactNode
  /**
   * Apply animation on mount
   */
  animate?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      size,
      title,
      icon,
      hideIcon = false,
      dismissible = false,
      onDismiss,
      action,
      animate = true,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    const Icon = iconMap[variant || 'default']

    const AlertComponent = animate ? motion.div : 'div'
    const animationProps = animate
      ? {
          variants: fadeInDown,
          initial: 'initial',
          animate: 'animate',
          exit: 'exit',
        }
      : {}

    return (
      <AnimatePresence>
        {isVisible && (
          <AlertComponent
            ref={ref}
            role="alert"
            className={cn(alertVariants({ variant, size }), className)}
            {...(animationProps as any)}
            {...(props as any)}
          >
            {!hideIcon && (
              <div className="flex-shrink-0 mt-0.5">
                {icon || <Icon className="w-5 h-5" />}
              </div>
            )}

            <div className="flex-1 space-y-1">
              {title && (
                <h5 className="font-semibold leading-tight">{title}</h5>
              )}
              {children && (
                <div className={cn('leading-relaxed', title && 'text-sm')}>
                  {children}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 flex-shrink-0">
              {action && <div className="mt-0.5">{action}</div>}

              {dismissible && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'rounded-md p-1 transition-colors',
                    'hover:bg-black/10 dark:hover:bg-white/10',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    variant === 'info' && 'focus:ring-blue-500',
                    variant === 'success' && 'focus:ring-green-500',
                    variant === 'warning' && 'focus:ring-yellow-500',
                    variant === 'error' && 'focus:ring-red-500'
                  )}
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </AlertComponent>
        )}
      </AnimatePresence>
    )
  }
)

Alert.displayName = 'Alert'

/**
 * Alert Title component for consistent styling
 */
export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
))

AlertTitle.displayName = 'AlertTitle'

/**
 * Alert Description component for consistent styling
 */
export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm leading-relaxed', className)}
    {...props}
  />
))

AlertDescription.displayName = 'AlertDescription'

export { Alert, alertVariants }

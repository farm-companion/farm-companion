import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const dividerVariants = cva('', {
  variants: {
    orientation: {
      horizontal: 'w-full h-px',
      vertical: 'h-full w-px'
    },
    variant: {
      solid: 'bg-gray-200 dark:bg-gray-800',
      dashed: 'border-dashed border-t border-gray-200 dark:border-gray-800',
      dotted: 'border-dotted border-t border-gray-200 dark:border-gray-800'
    },
    spacing: {
      none: '',
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-6',
      xl: 'my-8'
    }
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
    spacing: 'md'
  }
})

interface DividerProps extends VariantProps<typeof dividerVariants> {
  label?: string
  className?: string
}

/**
 * Divider component for visual separation
 *
 * @example
 * ```tsx
 * // Simple horizontal divider
 * <Divider />
 *
 * // Divider with label
 * <Divider label="or" />
 *
 * // Dashed divider with custom spacing
 * <Divider variant="dashed" spacing="lg" />
 *
 * // Vertical divider
 * <Divider orientation="vertical" />
 * ```
 */
export function Divider({
  orientation,
  variant,
  spacing,
  label,
  className
}: DividerProps) {
  if (label && orientation === 'horizontal') {
    return (
      <div className={`relative flex items-center ${spacing === 'none' ? '' : `my-${spacing}`} ${className || ''}`}>
        <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
        <span className="flex-shrink mx-4 text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
      </div>
    )
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation || undefined}
      className={dividerVariants({ orientation, variant, spacing, className })}
    />
  )
}

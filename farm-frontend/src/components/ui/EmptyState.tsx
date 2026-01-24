import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Button } from './Button'

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center py-12 px-6',
  {
    variants: {
      size: {
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
)

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
  }
  className?: string
}

/**
 * EmptyState component for displaying empty states with optional action
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Search className="w-12 h-12" />}
 *   title="No farms found"
 *   description="Try adjusting your search or filters"
 *   action={{
 *     label: "Clear filters",
 *     onClick: () => clearFilters()
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size,
  className
}: EmptyStateProps) {
  return (
    <div className={emptyStateVariants({ size, className })}>
      {icon && (
        <div className="mb-4 text-text-muted">
          {icon}
        </div>
      )}

      <h3 className="text-heading font-semibold text-text-heading mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-text-body max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

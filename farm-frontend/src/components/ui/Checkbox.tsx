'use client'

/**
 * Checkbox Component
 *
 * Accessible checkbox with indeterminate state support.
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={isChecked}
 *   onCheckedChange={setIsChecked}
 *   label="Accept terms and conditions"
 * />
 *
 * // With description
 * <Checkbox
 *   checked={subscribed}
 *   onCheckedChange={setSubscribed}
 *   label="Subscribe to newsletter"
 *   description="Get weekly updates about new farms"
 * />
 *
 * // Indeterminate state
 * <Checkbox
 *   checked="indeterminate"
 *   onCheckedChange={handleChange}
 *   label="Select all"
 * />
 * ```
 */

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked?: boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  className?: string
  id?: string
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className,
  id,
}: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'peer h-5 w-5 shrink-0 rounded-sm border border-slate-900',
          'ring-offset-white focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-slate-950 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50',
          'dark:border-slate-50 dark:ring-offset-slate-950',
          'dark:focus-visible:ring-slate-300',
          'dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900'
        )}
      >
        <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
          {checked === 'indeterminate' ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {(label || description) && (
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium leading-none',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                'cursor-pointer'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}

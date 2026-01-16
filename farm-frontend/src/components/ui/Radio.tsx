'use client'

/**
 * Radio Group Component
 *
 * Accessible radio button group for single selection.
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   value={deliveryMethod}
 *   onValueChange={setDeliveryMethod}
 *   options={[
 *     { value: 'pickup', label: 'Pick up from farm', description: 'Free' },
 *     { value: 'delivery', label: 'Home delivery', description: '£5.00' }
 *   ]}
 * />
 *
 * // Horizontal layout
 * <RadioGroup
 *   orientation="horizontal"
 *   value={size}
 *   onValueChange={setSize}
 *   options={[
 *     { value: 'small', label: 'Small' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'large', label: 'Large' }
 *   ]}
 * />
 * ```
 */

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  options: RadioOption[]
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export function RadioGroup({
  value,
  onValueChange,
  options,
  disabled = false,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      orientation={orientation}
      className={cn(
        'grid gap-3',
        orientation === 'horizontal' && 'grid-flow-col auto-cols-fr',
        className
      )}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-start space-x-3">
          <RadioGroupPrimitive.Item
            value={option.value}
            id={option.value}
            disabled={option.disabled}
            className={cn(
              'aspect-square h-5 w-5 rounded-full border border-slate-900 text-slate-900',
              'ring-offset-white focus:outline-none focus-visible:ring-2',
              'focus-visible:ring-slate-950 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'data-[state=checked]:border-slate-900',
              'dark:border-slate-50 dark:text-slate-50',
              'dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
              'dark:data-[state=checked]:border-slate-50'
            )}
          >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
              <Circle className="h-2.5 w-2.5 fill-current text-current" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>

          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={option.value}
              className={cn(
                'text-sm font-medium leading-none',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                'cursor-pointer'
              )}
            >
              {option.label}
            </label>
            {option.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </RadioGroupPrimitive.Root>
  )
}

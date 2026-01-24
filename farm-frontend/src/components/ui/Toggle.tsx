'use client'

/**
 * Toggle (Switch) Component
 *
 * Accessible toggle switch for boolean state.
 *
 * @example
 * ```tsx
 * <Toggle
 *   checked={darkMode}
 *   onCheckedChange={setDarkMode}
 *   label="Dark mode"
 * />
 *
 * // With description
 * <Toggle
 *   checked={notifications}
 *   onCheckedChange={setNotifications}
 *   label="Push notifications"
 *   description="Receive alerts about new farms near you"
 * />
 *
 * // Compact size
 * <Toggle
 *   size="sm"
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 *   label="Enable feature"
 * />
 * ```
 */

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export interface ToggleProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md'
  className?: string
  id?: string
}

export function Toggle({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className,
  id,
}: ToggleProps) {
  const generatedId = React.useId()
  const toggleId = id || generatedId

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      {(label || description) && (
        <div className="flex-1 space-y-1">
          {label && (
            <label
              htmlFor={toggleId}
              className={cn(
                'text-caption font-medium leading-none',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                'cursor-pointer'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-caption text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}

      <SwitchPrimitive.Root
        id={toggleId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
          'transition-colors focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200',
          'dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950',
          'dark:data-[state=checked]:bg-slate-50 dark:data-[state=unchecked]:bg-slate-800',
          size === 'sm' && 'h-5 w-9',
          size === 'md' && 'h-6 w-11'
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block rounded-full bg-white shadow-lg ring-0',
            'transition-transform data-[state=unchecked]:translate-x-0',
            'dark:bg-slate-950',
            size === 'sm' && 'h-4 w-4 data-[state=checked]:translate-x-4',
            size === 'md' && 'h-5 w-5 data-[state=checked]:translate-x-5'
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  )
}

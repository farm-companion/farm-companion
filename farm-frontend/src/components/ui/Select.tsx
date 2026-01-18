'use client'

/**
 * Select Component
 *
 * Accessible dropdown select built on Radix UI with search functionality.
 * Supports single selection, custom styling, and keyboard navigation.
 *
 * @example
 * ```tsx
 * <Select
 *   value={selectedCounty}
 *   onValueChange={setSelectedCounty}
 *   placeholder="Select a county"
 *   options={[
 *     { value: 'essex', label: 'Essex' },
 *     { value: 'kent', label: 'Kent' },
 *     { value: 'sussex', label: 'Sussex' }
 *   ]}
 * />
 *
 * // With search
 * <Select
 *   searchable
 *   value={value}
 *   onValueChange={setValue}
 *   placeholder="Search counties..."
 *   options={counties}
 * />
 *
 * // Disabled state
 * <Select disabled placeholder="Not available" options={[]} />
 * ```
 */

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  searchable?: boolean
  className?: string
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Select an option',
  options,
  disabled = false,
  searchable = false,
  className,
}: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery, searchable])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setSearchQuery('')
        }
      }}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm',
          'text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-800',
          'hover:border-brand-primary/30 transition-all duration-150',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selectedOption?.label || placeholder}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl text-neutral-900 dark:text-white shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          position="popper"
          sideOffset={5}
        >
          {searchable && (
            <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
              <Search className="mr-3 h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-8 w-full rounded-lg bg-transparent text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <SelectPrimitive.Viewport className="p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none',
                    'focus:bg-brand-primary/10 focus:text-brand-primary',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    'transition-colors duration-100'
                  )}
                >
                  <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-brand-primary" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

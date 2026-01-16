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
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
          'placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus:ring-slate-300',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selectedOption?.label || placeholder}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50'
          )}
          position="popper"
          sideOffset={5}
        >
          {searchable && (
            <div className="flex items-center border-b border-slate-200 px-3 py-2 dark:border-slate-800">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <SelectPrimitive.Viewport className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                    'focus:bg-slate-100 focus:text-slate-900',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    'dark:focus:bg-slate-800 dark:focus:text-slate-50'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
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

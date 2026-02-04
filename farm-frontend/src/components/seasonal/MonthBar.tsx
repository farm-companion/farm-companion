'use client'

import { useRef, useEffect } from 'react'

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
]

interface MonthBarProps {
  currentMonth: number
  selectedMonth: number
  onMonthSelect: (month: number) => void
}

/**
 * Sticky month selector bar. Always visible below the navbar.
 * On mobile, horizontally scrollable with the current month centred.
 */
export function MonthBar({ currentMonth, selectedMonth, onMonthSelect }: MonthBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Centre the current month on mount (mobile horizontal scroll)
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const active = activeRef.current
      const offset = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [selectedMonth])

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-[#EDEDED] shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 md:justify-center"
          role="tablist"
          aria-label="Month selector"
        >
          {/* Fade indicators for mobile scroll */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent md:hidden z-10" />

          {MONTHS.map(month => {
            const isSelected = month.value === selectedMonth
            const isCurrent = month.value === currentMonth

            return (
              <button
                key={month.value}
                ref={isSelected ? activeRef : undefined}
                role="tab"
                aria-selected={isSelected}
                aria-label={`${month.label}${isCurrent ? ' (current month)' : ''}`}
                onClick={() => onMonthSelect(month.value)}
                className={`
                  relative flex-shrink-0 px-4 py-2 rounded-full text-[15px] font-medium
                  transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center
                  ${isSelected
                    ? 'bg-[#2D5016] text-white'
                    : isCurrent
                      ? 'border-2 border-[#2D5016] text-[#2D5016]'
                      : 'text-[#5C5C5C] hover:bg-[#F5F5F5]'
                  }
                `}
              >
                <span className="hidden sm:inline">{month.label}</span>
                <span className="sm:hidden">{month.short}</span>
              </button>
            )
          })}

          {/* Fade indicator right */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent md:hidden z-10" />
        </div>
      </div>
    </div>
  )
}

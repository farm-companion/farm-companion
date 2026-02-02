'use client'

import { useMemo, useState, useEffect } from 'react'

interface MonthWheelProps {
  selectedMonth: number // 1-12
  onMonthSelect: (month: number) => void
  highlightedMonths?: number[] // Months to highlight (e.g., in-season months)
  peakMonths?: number[] // Peak months shown with special styling
  size?: number // SVG size in pixels
  className?: string
}

const MONTHS = [
  { value: 1, label: 'Jan', full: 'January' },
  { value: 2, label: 'Feb', full: 'February' },
  { value: 3, label: 'Mar', full: 'March' },
  { value: 4, label: 'Apr', full: 'April' },
  { value: 5, label: 'May', full: 'May' },
  { value: 6, label: 'Jun', full: 'June' },
  { value: 7, label: 'Jul', full: 'July' },
  { value: 8, label: 'Aug', full: 'August' },
  { value: 9, label: 'Sep', full: 'September' },
  { value: 10, label: 'Oct', full: 'October' },
  { value: 11, label: 'Nov', full: 'November' },
  { value: 12, label: 'Dec', full: 'December' },
]

// Season colors
const SEASON_COLORS = {
  winter: '#6C7A89', // Dec, Jan, Feb
  spring: '#A8E6CF', // Mar, Apr, May
  summer: '#FFD93D', // Jun, Jul, Aug
  autumn: '#DD6B55', // Sep, Oct, Nov
}

function getSeasonColor(month: number): string {
  if ([12, 1, 2].includes(month)) return SEASON_COLORS.winter
  if ([3, 4, 5].includes(month)) return SEASON_COLORS.spring
  if ([6, 7, 8].includes(month)) return SEASON_COLORS.summer
  return SEASON_COLORS.autumn
}

/**
 * MonthWheel Component
 *
 * Circular month selector with:
 * - 12 month segments arranged in a wheel
 * - Season color coding
 * - Highlighted months for produce availability
 * - Current month indicator
 */
export function MonthWheel({
  selectedMonth,
  onMonthSelect,
  highlightedMonths = [],
  peakMonths = [],
  size = 280,
  className = '',
}: MonthWheelProps) {
  const [currentMonth, setCurrentMonth] = useState(1) // Default for SSR

  useEffect(() => {
    setCurrentMonth(new Date().getMonth() + 1)
  }, [])

  // Calculate segment paths
  const segments = useMemo(() => {
    const centerX = size / 2
    const centerY = size / 2
    const outerRadius = size / 2 - 8
    const innerRadius = size / 2 - 50
    const labelRadius = size / 2 - 30

    return MONTHS.map((month, index) => {
      // Calculate angles (start from top, go clockwise)
      const startAngle = (index * 30 - 90) * (Math.PI / 180)
      const endAngle = ((index + 1) * 30 - 90) * (Math.PI / 180)
      const midAngle = (startAngle + endAngle) / 2

      // Calculate arc points
      const x1 = centerX + outerRadius * Math.cos(startAngle)
      const y1 = centerY + outerRadius * Math.sin(startAngle)
      const x2 = centerX + outerRadius * Math.cos(endAngle)
      const y2 = centerY + outerRadius * Math.sin(endAngle)
      const x3 = centerX + innerRadius * Math.cos(endAngle)
      const y3 = centerY + innerRadius * Math.sin(endAngle)
      const x4 = centerX + innerRadius * Math.cos(startAngle)
      const y4 = centerY + innerRadius * Math.sin(startAngle)

      // Label position
      const labelX = centerX + labelRadius * Math.cos(midAngle)
      const labelY = centerY + labelRadius * Math.sin(midAngle)

      // Create path
      const path = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4}
        Z
      `

      const isHighlighted = highlightedMonths.includes(month.value)
      const isPeak = peakMonths.includes(month.value)
      const isSelected = month.value === selectedMonth
      const isCurrent = month.value === currentMonth

      return {
        ...month,
        path,
        labelX,
        labelY,
        isHighlighted,
        isPeak,
        isSelected,
        isCurrent,
        seasonColor: getSeasonColor(month.value),
      }
    })
  }, [size, selectedMonth, highlightedMonths, peakMonths, currentMonth])

  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-0"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-200 dark:text-slate-700"
        />

        {/* Month segments */}
        {segments.map((segment) => (
          <g key={segment.value}>
            {/* Segment path */}
            <path
              d={segment.path}
              className={`
                cursor-pointer transition-all duration-200
                ${segment.isSelected
                  ? 'fill-primary-500 dark:fill-primary-600'
                  : segment.isPeak
                    ? 'fill-amber-400 dark:fill-amber-500'
                    : segment.isHighlighted
                      ? 'fill-primary-200 dark:fill-primary-800'
                      : 'fill-slate-100 dark:fill-slate-800'
                }
                ${!segment.isSelected ? 'hover:fill-primary-100 dark:hover:fill-primary-900' : ''}
              `}
              stroke="white"
              strokeWidth="2"
              onClick={() => onMonthSelect(segment.value)}
            />

            {/* Month label */}
            <text
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`
                text-[11px] font-semibold pointer-events-none select-none
                ${segment.isSelected
                  ? 'fill-white'
                  : segment.isPeak
                    ? 'fill-amber-900'
                    : segment.isHighlighted
                      ? 'fill-primary-700 dark:fill-primary-300'
                      : 'fill-slate-500 dark:fill-slate-400'
                }
              `}
            >
              {segment.label}
            </text>

            {/* Current month indicator */}
            {segment.isCurrent && (
              <circle
                cx={segment.labelX}
                cy={segment.labelY - 12}
                r={3}
                className="fill-primary-600 dark:fill-primary-400"
              />
            )}
          </g>
        ))}

        {/* Center circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 55}
          className="fill-white dark:fill-slate-900"
        />

        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900 dark:fill-slate-100 text-[14px] font-bold"
        >
          {MONTHS[selectedMonth - 1].full}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-500 dark:fill-slate-400 text-[11px]"
        >
          {highlightedMonths.length > 0
            ? `${highlightedMonths.filter(m => m === selectedMonth).length > 0 ? 'In season' : 'Not in season'}`
            : 'Select month'
          }
        </text>
      </svg>

      {/* Legend */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-small whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-800" />
          <span className="text-slate-600 dark:text-slate-400">In season</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-slate-600 dark:text-slate-400">Peak</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact month selector as an alternative to the wheel.
 */
export function MonthSelector({
  selectedMonth,
  onMonthSelect,
  highlightedMonths = [],
  peakMonths = [],
  className = '',
}: Omit<MonthWheelProps, 'size'>) {
  const [currentMonth, setCurrentMonth] = useState(1) // Default for SSR

  useEffect(() => {
    setCurrentMonth(new Date().getMonth() + 1)
  }, [])

  return (
    <div className={`flex flex-wrap justify-center gap-1.5 ${className}`}>
      {MONTHS.map((month) => {
        const isHighlighted = highlightedMonths.includes(month.value)
        const isPeak = peakMonths.includes(month.value)
        const isSelected = month.value === selectedMonth
        const isCurrent = month.value === currentMonth

        return (
          <button
            key={month.value}
            onClick={() => onMonthSelect(month.value)}
            className={`
              relative w-10 h-10 rounded-lg text-small font-semibold
              transition-all duration-200 hover:scale-105
              ${isSelected
                ? 'bg-primary-500 text-white shadow-md'
                : isPeak
                  ? 'bg-amber-400 text-amber-900'
                  : isHighlighted
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
          >
            {month.label}
            {isCurrent && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}

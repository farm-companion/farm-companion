'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { getFarmStatus, formatOpeningHours, type FarmStatus } from '@/lib/farm-status'

interface OperatingStatusProps {
  /** Opening hours in array or object format */
  hours?: unknown
  /** Show full weekly schedule */
  showSchedule?: boolean
  /** Additional CSS classes */
  className?: string
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Calculate time remaining until next status change
 */
function getTimeRemaining(targetTime: string): { hours: number; minutes: number; text: string } | null {
  const now = new Date()
  const [hour, min] = targetTime.split(':').map(Number)

  const target = new Date()
  target.setHours(hour, min, 0, 0)

  // If target time is earlier than now, it's for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  const diffMs = target.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) {
    return {
      hours: 0,
      minutes: diffMins,
      text: `${diffMins} min${diffMins !== 1 ? 's' : ''}`
    }
  }

  const hours = Math.floor(diffMins / 60)
  const minutes = diffMins % 60

  if (minutes === 0) {
    return { hours, minutes: 0, text: `${hours}hr${hours !== 1 ? 's' : ''}` }
  }

  return { hours, minutes, text: `${hours}hr ${minutes}min` }
}

/**
 * Parse opening hours to weekly schedule format
 */
function parseWeeklySchedule(hours: unknown): Array<{
  day: string
  shortDay: string
  open: string
  close: string
  closed: boolean
  isToday: boolean
}> {
  const today = new Date().getDay()
  const schedule: Array<{
    day: string
    shortDay: string
    open: string
    close: string
    closed: boolean
    isToday: boolean
  }> = []

  // Handle array format
  if (Array.isArray(hours)) {
    const dayMap = new Map<number, { open: string; close: string; closed?: boolean }>()

    for (const item of hours) {
      if (item && typeof item === 'object' && 'day' in item) {
        const dayName = String(item.day).toLowerCase()
        const dayIndex = DAY_NAMES.findIndex(d => d.toLowerCase() === dayName)
        if (dayIndex !== -1) {
          dayMap.set(dayIndex, {
            open: item.open || '',
            close: item.close || '',
            closed: item.closed === true
          })
        }
      }
    }

    for (let i = 0; i < 7; i++) {
      const dayData = dayMap.get(i)
      schedule.push({
        day: DAY_NAMES[i],
        shortDay: SHORT_DAYS[i],
        open: dayData?.open || '',
        close: dayData?.close || '',
        closed: dayData?.closed || !dayData,
        isToday: i === today
      })
    }
  }
  // Handle object format with numeric keys
  else if (hours && typeof hours === 'object') {
    const hoursObj = hours as Record<string, { open: string; close: string; closed?: boolean }>
    for (let i = 0; i < 7; i++) {
      const dayData = hoursObj[String(i)]
      schedule.push({
        day: DAY_NAMES[i],
        shortDay: SHORT_DAYS[i],
        open: dayData?.open || '',
        close: dayData?.close || '',
        closed: dayData?.closed || !dayData,
        isToday: i === today
      })
    }
  }
  // No hours data
  else {
    for (let i = 0; i < 7; i++) {
      schedule.push({
        day: DAY_NAMES[i],
        shortDay: SHORT_DAYS[i],
        open: '',
        close: '',
        closed: true,
        isToday: i === today
      })
    }
  }

  return schedule
}

/**
 * Format time for display (12-hour format)
 */
function formatTime(time: string): string {
  if (!time) return ''
  const [hour, min] = time.split(':').map(Number)
  const period = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour % 12 || 12
  return min === 0 ? `${displayHour}${period}` : `${displayHour}:${min.toString().padStart(2, '0')}${period}`
}

/**
 * OperatingStatus Component
 *
 * Enhanced status display for shop profile pages showing:
 * - Current open/closed status with countdown
 * - Today's hours prominently displayed
 * - Expandable weekly schedule
 * - Visual indicators for status changes
 */
export function OperatingStatus({
  hours,
  showSchedule = true,
  className = '',
}: OperatingStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState<FarmStatus | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; text: string } | null>(null)

  // Update status every minute
  useEffect(() => {
    function updateStatus() {
      const newStatus = getFarmStatus(hours)
      setStatus(newStatus)

      if (newStatus.nextChange?.time) {
        setTimeRemaining(getTimeRemaining(newStatus.nextChange.time))
      } else {
        setTimeRemaining(null)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [hours])

  if (!status) return null

  const schedule = parseWeeklySchedule(hours)
  const todaySchedule = schedule.find(s => s.isToday)
  const isOpen = status.status === 'open'
  const isClosingSoon = isOpen && timeRemaining && timeRemaining.hours === 0 && timeRemaining.minutes <= 30

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {/* Main Status Card */}
      <div
        className={`
          p-4 transition-colors
          ${isOpen
            ? isClosingSoon
              ? 'bg-amber-50 dark:bg-amber-900/20'
              : 'bg-emerald-50 dark:bg-emerald-900/20'
            : 'bg-slate-100 dark:bg-[#121214]'
          }
        `}
      >
        {/* Status Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <div className="relative">
              <div
                className={`
                  w-3 h-3 rounded-full
                  ${isOpen
                    ? isClosingSoon
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-400 dark:bg-zinc-500'
                  }
                `}
              />
              {isOpen && (
                <div
                  className={`
                    absolute inset-0 w-3 h-3 rounded-full animate-ping
                    ${isClosingSoon ? 'bg-amber-500' : 'bg-emerald-500'}
                  `}
                  style={{ animationDuration: '2s' }}
                />
              )}
            </div>

            {/* Status Text */}
            <span
              className={`
                text-body font-semibold dark:font-medium
                ${isOpen
                  ? isClosingSoon
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-zinc-300'
                }
              `}
            >
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>

          {/* Time Remaining Badge */}
          {timeRemaining && (
            <div
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-small
                ${isOpen
                  ? isClosingSoon
                    ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-400'
                }
              `}
            >
              {isOpen ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Closes in {timeRemaining.text}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  <span>Opens in {timeRemaining.text}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Today's Hours */}
        {todaySchedule && !todaySchedule.closed && (
          <div className="flex items-center gap-2 text-caption text-slate-600 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>
              Today: <strong className="text-slate-800 dark:text-zinc-200">{formatTime(todaySchedule.open)} - {formatTime(todaySchedule.close)}</strong>
            </span>
          </div>
        )}
        {todaySchedule?.closed && (
          <div className="flex items-center gap-2 text-caption text-slate-500 dark:text-zinc-500">
            <Clock className="w-4 h-4" />
            <span>Closed today</span>
          </div>
        )}
      </div>

      {/* Expandable Schedule */}
      {showSchedule && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              w-full flex items-center justify-between px-4 py-2.5
              bg-white dark:bg-[#0A0A0A]
              border-t border-slate-200 dark:border-white/[0.06]
              text-caption text-slate-600 dark:text-zinc-400
              hover:bg-slate-50 dark:hover:bg-white/[0.02]
              transition-colors
            "
          >
            <span className="font-medium dark:font-normal">Weekly Schedule</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="bg-white dark:bg-[#0A0A0A] border-t border-slate-200 dark:border-white/[0.06]">
              {schedule.map((day, index) => (
                <div
                  key={day.day}
                  className={`
                    flex items-center justify-between px-4 py-2
                    ${index < 6 ? 'border-b border-slate-100 dark:border-white/[0.04]' : ''}
                    ${day.isToday ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                  `}
                >
                  <span
                    className={`
                      text-caption
                      ${day.isToday
                        ? 'font-semibold dark:font-medium text-primary-700 dark:text-primary-400'
                        : 'text-slate-600 dark:text-zinc-400'
                      }
                    `}
                  >
                    {day.shortDay}
                    {day.isToday && <span className="ml-1 text-small">(Today)</span>}
                  </span>
                  <span
                    className={`
                      text-caption
                      ${day.closed
                        ? 'text-slate-400 dark:text-zinc-600'
                        : day.isToday
                          ? 'font-medium text-primary-700 dark:text-primary-400'
                          : 'text-slate-700 dark:text-zinc-300'
                      }
                    `}
                  >
                    {day.closed ? 'Closed' : `${formatTime(day.open)} - ${formatTime(day.close)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Compact operating status for cards
 */
export function OperatingStatusCompact({
  hours,
  className = '',
}: Pick<OperatingStatusProps, 'hours' | 'className'>) {
  const [status, setStatus] = useState<FarmStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setStatus(getFarmStatus(hours))
  }, [hours])

  // SSR: render nothing to avoid hydration mismatch
  if (!mounted || !status || status.status === 'unknown') return null

  const isOpen = status.status === 'open'

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-small
        ${isOpen
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400'
        }
        ${className}
      `}
    >
      <div
        className={`
          w-1.5 h-1.5 rounded-full
          ${isOpen ? 'bg-emerald-500' : 'bg-slate-400'}
        `}
      />
      <span className="font-medium dark:font-normal">
        {isOpen ? 'Open' : 'Closed'}
      </span>
    </div>
  )
}

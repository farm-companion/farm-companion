'use client'

import { useState, useCallback } from 'react'
import { Clock, Copy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

interface DayHours {
  day: DayOfWeek
  open?: string
  close?: string
  closed?: boolean
}

interface OpeningHoursBuilderProps {
  value: DayHours[]
  onChange: (hours: DayHours[]) => void
  className?: string
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

// Common opening hour presets for UK farm shops
const TIME_PRESETS = [
  { label: '9-5', open: '09:00', close: '17:00' },
  { label: '8-6', open: '08:00', close: '18:00' },
  { label: '10-4', open: '10:00', close: '16:00' },
  { label: '9-1', open: '09:00', close: '13:00' },
]

/**
 * Opening Hours Builder component
 * User-friendly interface for setting shop opening hours
 */
export function OpeningHoursBuilder({
  value,
  onChange,
  className,
}: OpeningHoursBuilderProps) {
  const [copiedFrom, setCopiedFrom] = useState<DayOfWeek | null>(null)

  const updateDay = useCallback(
    (day: DayOfWeek, updates: Partial<DayHours>) => {
      onChange(
        value.map((h) =>
          h.day === day ? { ...h, ...updates, closed: updates.closed ?? false } : h
        )
      )
    },
    [value, onChange]
  )

  const setDayClosed = useCallback(
    (day: DayOfWeek) => {
      onChange(
        value.map((h) =>
          h.day === day ? { day, closed: true, open: undefined, close: undefined } : h
        )
      )
    },
    [value, onChange]
  )

  const applyPreset = useCallback(
    (day: DayOfWeek, preset: { open: string; close: string }) => {
      onChange(
        value.map((h) =>
          h.day === day ? { day, open: preset.open, close: preset.close, closed: false } : h
        )
      )
    },
    [value, onChange]
  )

  const copyToAll = useCallback(
    (fromDay: DayOfWeek) => {
      const source = value.find((h) => h.day === fromDay)
      if (!source) return

      setCopiedFrom(fromDay)
      setTimeout(() => setCopiedFrom(null), 1500)

      onChange(
        value.map((h) => ({
          day: h.day,
          open: source.open,
          close: source.close,
          closed: source.closed,
        }))
      )
    },
    [value, onChange]
  )

  const copyToWeekdays = useCallback(
    (fromDay: DayOfWeek) => {
      const source = value.find((h) => h.day === fromDay)
      if (!source) return

      setCopiedFrom(fromDay)
      setTimeout(() => setCopiedFrom(null), 1500)

      const weekdays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      onChange(
        value.map((h) =>
          weekdays.includes(h.day)
            ? { day: h.day, open: source.open, close: source.close, closed: source.closed }
            : h
        )
      )
    },
    [value, onChange]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            const preset = TIME_PRESETS[0]
            onChange(DAYS.map((day) => ({ day, open: preset.open, close: preset.close })))
          }}
          className="px-3 py-1.5 text-small bg-serum/10 text-serum rounded-lg hover:bg-serum/20 transition-colors"
        >
          Set all to 9-5
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(
              DAYS.map((day) =>
                ['Sat', 'Sun'].includes(day)
                  ? { day, closed: true }
                  : { day, open: '09:00', close: '17:00' }
              )
            )
          }}
          className="px-3 py-1.5 text-small bg-background-surface text-text-body rounded-lg hover:bg-background-canvas transition-colors border border-border-default"
        >
          Weekdays only
        </button>
        <button
          type="button"
          onClick={() => onChange(DAYS.map((day) => ({ day, closed: true })))}
          className="px-3 py-1.5 text-small bg-background-surface text-text-muted rounded-lg hover:bg-background-canvas transition-colors border border-border-default"
        >
          Clear all
        </button>
      </div>

      {/* Day Rows */}
      {value.map((dayHours) => {
        const isClosed = dayHours.closed
        const hasHours = dayHours.open && dayHours.close

        return (
          <div
            key={dayHours.day}
            className={cn(
              'flex flex-wrap items-center gap-3 p-3 rounded-lg transition-colors',
              isClosed
                ? 'bg-red-50/50 dark:bg-red-950/20'
                : hasHours
                ? 'bg-green-50/50 dark:bg-green-950/20'
                : 'bg-background-canvas'
            )}
          >
            {/* Day Label */}
            <div className="w-20 flex-shrink-0">
              <span className="font-medium text-text-heading text-caption">
                {DAY_LABELS[dayHours.day]}
              </span>
            </div>

            {/* Status / Time Inputs */}
            {isClosed ? (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-caption text-red-600 font-medium">Closed</span>
                <button
                  type="button"
                  onClick={() => updateDay(dayHours.day, { closed: false, open: '09:00', close: '17:00' })}
                  className="ml-auto text-small text-serum hover:underline"
                >
                  Set hours
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-wrap items-center gap-2">
                {/* Time Inputs */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <input
                    type="time"
                    value={dayHours.open || ''}
                    onChange={(e) => updateDay(dayHours.day, { open: e.target.value })}
                    className="w-28 px-2 py-1.5 text-caption rounded border border-border-default bg-background-surface focus:outline-none focus:ring-1 focus:ring-serum"
                  />
                  <span className="text-text-muted">to</span>
                  <input
                    type="time"
                    value={dayHours.close || ''}
                    onChange={(e) => updateDay(dayHours.day, { close: e.target.value })}
                    className="w-28 px-2 py-1.5 text-caption rounded border border-border-default bg-background-surface focus:outline-none focus:ring-1 focus:ring-serum"
                  />
                </div>

                {/* Preset Buttons */}
                <div className="flex gap-1">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(dayHours.day, preset)}
                      className={cn(
                        'px-2 py-1 text-small rounded transition-colors',
                        dayHours.open === preset.open && dayHours.close === preset.close
                          ? 'bg-serum text-black'
                          : 'bg-background-surface text-text-muted hover:bg-background-canvas border border-border-default'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 ml-auto">
                  {hasHours && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyToAll(dayHours.day)}
                        className="p-1.5 text-text-muted hover:text-serum hover:bg-serum/10 rounded transition-colors"
                        title="Copy to all days"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {copiedFrom === dayHours.day && (
                        <span className="text-small text-green-600">Copied!</span>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setDayClosed(dayHours.day)}
                    className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                    title="Mark as closed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Summary */}
      <div className="pt-3 border-t border-border-default">
        <p className="text-small text-text-muted">
          {value.filter((h) => h.open && h.close && !h.closed).length} days with hours set,{' '}
          {value.filter((h) => h.closed).length} days closed
        </p>
      </div>
    </div>
  )
}

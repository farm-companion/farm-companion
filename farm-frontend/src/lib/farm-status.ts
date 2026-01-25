/**
 * Farm Status Utilities
 *
 * Real-time status indicators for farms based on opening hours.
 * Shows "Open Now", "Closed", "Opens at X" with smart messaging.
 */

export interface OpeningHours {
  [key: number]: {
    open: string // "09:00"
    close: string // "17:00"
    closed?: boolean
  }
}

// Array format from API: [{day: 'Monday', open: '09:00', close: '17:00'}, ...]
export interface OpeningHoursArrayItem {
  day: string
  open: string
  close: string
  closed?: boolean
}

export interface FarmStatus {
  status: 'open' | 'closed' | 'unknown'
  message: string
  nextChange?: {
    time: string // "17:00"
    action: 'opens' | 'closes'
  }
  color: 'success' | 'error' | 'info'
}

// Map day names to numbers (0 = Sunday)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6
}

/**
 * Normalize opening hours from various formats to the expected object format
 */
function normalizeOpeningHours(input: unknown): OpeningHours | null {
  if (!input) return null

  // Already in object format with numeric keys
  if (typeof input === 'object' && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>
    // Check if it has numeric keys (0-6)
    if (Object.keys(obj).some(k => /^[0-6]$/.test(k))) {
      return obj as OpeningHours
    }
  }

  // Array format: [{day: 'Monday', open: '09:00', close: '17:00'}, ...]
  if (Array.isArray(input)) {
    const result: OpeningHours = {}
    for (const item of input) {
      if (item && typeof item === 'object' && 'day' in item && 'open' in item && 'close' in item) {
        const dayName = String(item.day).toLowerCase()
        const dayNum = DAY_NAME_TO_NUMBER[dayName]
        if (dayNum !== undefined) {
          result[dayNum] = {
            open: String(item.open),
            close: String(item.close),
            closed: item.closed === true
          }
        }
      }
    }
    if (Object.keys(result).length > 0) {
      return result
    }
  }

  return null
}

/**
 * Get current farm status based on opening hours
 * @param openingHours - Farm opening hours (object or array format)
 * @returns FarmStatus object with status, message, and styling
 */
export function getFarmStatus(openingHours?: unknown): FarmStatus {
  // Normalize input to expected format
  const normalizedHours = normalizeOpeningHours(openingHours)

  // No hours provided or couldn't parse
  if (!normalizedHours || Object.keys(normalizedHours).length === 0) {
    return {
      status: 'unknown',
      message: 'Hours not available',
      color: 'info'
    }
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
  const currentTime = now.getHours() * 60 + now.getMinutes() // Minutes since midnight

  const todayHours = normalizedHours[currentDay]

  // Closed today
  if (!todayHours || todayHours.closed) {
    const nextOpen = getNextOpenTime(normalizedHours, now)
    if (nextOpen) {
      return {
        status: 'closed',
        message: `Closed today • Opens ${nextOpen.day} at ${nextOpen.time}`,
        nextChange: {
          time: nextOpen.time,
          action: 'opens'
        },
        color: 'error'
      }
    }
    return {
      status: 'closed',
      message: 'Closed today',
      color: 'error'
    }
  }

  // Parse opening and closing times
  const [openHour, openMin] = todayHours.open.split(':').map(Number)
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number)
  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin

  // Currently open
  if (currentTime >= openTime && currentTime < closeTime) {
    const closingSoon = closeTime - currentTime <= 60 // Within 1 hour of closing

    if (closingSoon) {
      return {
        status: 'open',
        message: `Open now • Closes at ${todayHours.close}`,
        nextChange: {
          time: todayHours.close,
          action: 'closes'
        },
        color: 'success'
      }
    }

    return {
      status: 'open',
      message: `Open now • Until ${todayHours.close}`,
      nextChange: {
        time: todayHours.close,
        action: 'closes'
      },
      color: 'success'
    }
  }

  // Opens later today
  if (currentTime < openTime) {
    return {
      status: 'closed',
      message: `Opens today at ${todayHours.open}`,
      nextChange: {
        time: todayHours.open,
        action: 'opens'
      },
      color: 'error'
    }
  }

  // Closed for today (past closing time)
  const nextOpen = getNextOpenTime(normalizedHours, now)
  if (nextOpen) {
    return {
      status: 'closed',
      message: `Closed • Opens ${nextOpen.day} at ${nextOpen.time}`,
      nextChange: {
        time: nextOpen.time,
        action: 'opens'
      },
      color: 'error'
    }
  }

  return {
    status: 'closed',
    message: 'Closed',
    color: 'error'
  }
}

/**
 * Find the next time the farm opens
 * @param openingHours - Farm opening hours
 * @param fromDate - Date to start searching from
 * @returns Object with day name and opening time, or null if not found
 */
function getNextOpenTime(
  openingHours: OpeningHours,
  fromDate: Date
): { day: string; time: string } | null {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const currentDay = fromDate.getDay()
  const currentTime = fromDate.getHours() * 60 + fromDate.getMinutes()

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const dayToCheck = (currentDay + i) % 7
    const hours = openingHours[dayToCheck]

    if (hours && !hours.closed) {
      const dayName = i === 1 ? 'tomorrow' : dayNames[dayToCheck]
      return {
        day: dayName,
        time: hours.open
      }
    }
  }

  return null
}

/**
 * Format opening hours for display
 * @param openingHours - Farm opening hours (any format)
 * @returns Formatted string like "Mon-Fri 9am-5pm, Sat-Sun 10am-4pm"
 */
export function formatOpeningHours(openingHours?: unknown): string {
  const normalized = normalizeOpeningHours(openingHours)
  if (!normalized || Object.keys(normalized).length === 0) {
    return 'Hours not available'
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ranges: Array<{ days: string; hours: string }> = []

  let currentRange: { start: number; end: number; hours: string } | null = null

  for (let day = 0; day < 7; day++) {
    const hours = normalized[day]
    const hoursStr = hours && !hours.closed ? `${formatTime(hours.open)}-${formatTime(hours.close)}` : 'Closed'

    if (currentRange && currentRange.hours === hoursStr) {
      // Extend current range
      currentRange.end = day
    } else {
      // Save previous range
      if (currentRange) {
        const daysStr =
          currentRange.start === currentRange.end
            ? dayNames[currentRange.start]
            : `${dayNames[currentRange.start]}-${dayNames[currentRange.end]}`
        ranges.push({ days: daysStr, hours: currentRange.hours })
      }
      // Start new range
      currentRange = { start: day, end: day, hours: hoursStr }
    }
  }

  // Save final range
  if (currentRange) {
    const daysStr =
      currentRange.start === currentRange.end
        ? dayNames[currentRange.start]
        : `${dayNames[currentRange.start]}-${dayNames[currentRange.end]}`
    ranges.push({ days: daysStr, hours: currentRange.hours })
  }

  return ranges.map(r => `${r.days} ${r.hours}`).join(', ')
}

/**
 * Format time from 24-hour to 12-hour format
 * @param time - Time in "HH:MM" format
 * @returns Formatted time like "9am" or "5:30pm"
 */
function formatTime(time: string): string {
  const [hourStr, minStr] = time.split(':')
  const hour = parseInt(hourStr)
  const min = parseInt(minStr)

  const period = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour % 12 || 12

  if (min === 0) {
    return `${displayHour}${period}`
  }

  return `${displayHour}:${minStr}${period}`
}

/**
 * Check if farm is currently open (simple boolean check)
 * @param openingHours - Farm opening hours (any format)
 * @returns true if open, false otherwise
 */
export function isCurrentlyOpen(openingHours?: unknown): boolean {
  const status = getFarmStatus(openingHours)
  return status.status === 'open'
}

/**
 * Get farm status color class for Tailwind
 * @param status - Farm status object
 * @returns Tailwind color class
 */
export function getStatusColorClass(status: FarmStatus): string {
  switch (status.color) {
    case 'success':
      return 'bg-success text-white'
    case 'error':
      return 'bg-error text-white'
    case 'info':
      return 'bg-info text-white'
    default:
      return 'bg-slate-500 text-white'
  }
}

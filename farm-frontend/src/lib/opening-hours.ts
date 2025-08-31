export interface OpeningHours {
  day: string
  open: string
  close: string
}

export function isCurrentlyOpen(hours: OpeningHours[]): boolean {
  if (!hours || hours.length === 0) return false

  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  const todayHours = hours.find(h => h.day.toLowerCase() === currentDay)
  if (!todayHours) return false

  // Handle special cases like "Closed" or "24 hours"
  if (todayHours.open.toLowerCase() === 'closed' || todayHours.close.toLowerCase() === 'closed') {
    return false
  }

  if (todayHours.open.toLowerCase() === '24 hours' || todayHours.close.toLowerCase() === '24 hours') {
    return true
  }

  // Normal time comparison
  const openTime = todayHours.open
  const closeTime = todayHours.close

  // Handle overnight hours (e.g., 22:00 - 06:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime
  }

  return currentTime >= openTime && currentTime <= closeTime
}

export function getNextOpeningTime(hours: OpeningHours[]): string | null {
  if (!hours || hours.length === 0) return null

  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const currentDayIndex = dayNames.indexOf(currentDay)

  // Check today first
  const todayHours = hours.find(h => h.day.toLowerCase() === currentDay)
  if (todayHours && todayHours.open.toLowerCase() !== 'closed') {
    if (todayHours.open.toLowerCase() === '24 hours') return null // Always open
    
    const openTime = todayHours.open
    const closeTime = todayHours.close
    
    if (closeTime < openTime) {
      // Overnight hours - check if we're in the open period
      if (currentTime >= todayHours.open || currentTime <= todayHours.close) {
        return null // Currently open
      }
    } else {
      if (currentTime < todayHours.open) {
        return `Opens today at ${todayHours.open}`
      }
      if (currentTime > todayHours.close) {
        // Closed for today, find next opening
      }
    }
  }

  // Find next opening day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7
    const nextDay = dayNames[nextDayIndex]
    const nextDayHours = hours.find(h => h.day.toLowerCase() === nextDay)
    
    if (nextDayHours && nextDayHours.open.toLowerCase() !== 'closed') {
      const dayName = nextDay.charAt(0).toUpperCase() + nextDay.slice(1)
      return `Opens ${dayName} at ${nextDayHours.open}`
    }
  }

  return null
}

export function formatOpeningStatus(hours: OpeningHours[]): {
  isOpen: boolean
  status: string
  nextOpening?: string
} {
  const open = isCurrentlyOpen(hours)
  const nextOpening = getNextOpeningTime(hours)

  if (open) {
    return {
      isOpen: true,
      status: 'Open now'
    }
  }

  if (nextOpening) {
    return {
      isOpen: false,
      status: 'Closed',
      nextOpening
    }
  }

  return {
    isOpen: false,
    status: 'Opening hours not available'
  }
}

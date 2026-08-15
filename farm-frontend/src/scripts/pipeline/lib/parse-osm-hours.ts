// OSM `opening_hours` to the OpeningHours shape the site already consumes.
//
// Deliberately supports a narrow subset and returns null for everything else.
// A wrong "Open now" badge sends someone on a wasted drive, which is the exact
// failure this product exists to prevent, so an unparseable string is silence
// rather than a guess. Unsupported on purpose: seasonal ranges (Apr-Sep),
// public holidays (PH), open-ended times (09:00+), variable times
// (sunrise-sunset), and free text.
import type { OpeningHours } from '@/lib/opening-hours'

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const

const OSM_DAY_INDEX: Readonly<Record<string, number>> = {
  Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6,
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const RULE = /^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/

/** Expand "Mo-We" or "Sa,Su" or "Mo" into day indices. Null if unrecognised. */
function expandDays(spec: string): number[] | null {
  const out: number[] = []
  for (const part of spec.split(',')) {
    const range = part.split('-')
    if (range.length === 1) {
      const i = OSM_DAY_INDEX[range[0]]
      if (i === undefined) return null
      out.push(i)
    } else if (range.length === 2) {
      const from = OSM_DAY_INDEX[range[0]]
      const to = OSM_DAY_INDEX[range[1]]
      if (from === undefined || to === undefined) return null
      for (let i = from; ; i = (i + 1) % 7) {
        out.push(i)
        if (i === to) break
      }
    } else {
      return null
    }
  }
  return out
}

/**
 * Parse an OSM opening_hours string.
 * Returns null when the value uses syntax outside the supported subset.
 * Later rules override earlier ones for the same day, matching OSM semantics.
 */
export function parseOsmHours(raw: string | undefined): OpeningHours[] | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null

  if (value === '24/7') {
    return DAYS.map((day) => ({ day, open: '00:00', close: '23:59' }))
  }

  const byDay = new Map<number, { open: string; close: string }>()
  for (const rule of value.split(';')) {
    const trimmed = rule.trim()
    if (!trimmed) continue
    const m = RULE.exec(trimmed)
    if (!m) return null
    const [, daySpec, open, close] = m
    if (!TIME.test(open) || !TIME.test(close)) return null
    const days = expandDays(daySpec)
    if (days === null) return null
    for (const d of days) byDay.set(d, { open, close })
  }

  if (byDay.size === 0) return null
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([i, t]) => ({ day: DAYS[i], open: t.open, close: t.close }))
}

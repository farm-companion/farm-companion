// Two decisions the farm page makes before it renders anything, kept out of
// the component so they can be tested.
//
// 374 of the site's 431 search clicks land on /shop/[slug], almost all from
// someone typing one business name. They arrive knowing the name and wanting
// three things: where it is, when it is open, and whether it is worth going.
// The page could answer none of them for an unverified farm, which is 3,303 of
// 3,504 of them.

export interface HoursInput {
  canClaim: boolean
  hours: unknown
}

export type HoursStatus =
  | { kind: 'known'; hours: Array<{ day: string; open: string; close: string }> }
  | { kind: 'unconfirmed'; label: string }

const UNCONFIRMED = 'Opening hours not confirmed'

/**
 * An hour range tells the public they may turn up and be served, so it stays
 * behind the claim gate. Absent hours are stated rather than omitted: a reader
 * who sees nothing cannot tell a shop with no hours from a page that never
 * had them.
 */
export function hoursStatus({ canClaim, hours }: HoursInput): HoursStatus {
  if (!canClaim) return { kind: 'unconfirmed', label: UNCONFIRMED }
  if (!Array.isArray(hours) || hours.length === 0) {
    return { kind: 'unconfirmed', label: UNCONFIRMED }
  }
  const usable = hours.filter(
    (h): h is { day: string; open: string; close: string } =>
      Boolean(h) && typeof h === 'object' && 'day' in h && 'open' in h && 'close' in h,
  )
  if (usable.length === 0) return { kind: 'unconfirmed', label: UNCONFIRMED }
  return { kind: 'known', hours: usable }
}

export interface MapInput {
  canClaim: boolean
  lat: number | null | undefined
  lng: number | null | undefined
}

export interface MapActionResult {
  href: string
  label: string
}

/**
 * Verbs that would turn a locational link into an invitation. The postal
 * address is already in plain text above this link, so hiding the link
 * protects nobody; the claim lives in the label.
 */
export const BANNED_MAP_VERBS: readonly string[] = [
  'visit', 'directions', 'go to', 'travel', 'drive', 'come', 'shop at',
]

export function mapAction({ canClaim, lat, lng }: MapInput): MapActionResult | null {
  if (lat == null || lng == null) return null
  return canClaim
    ? {
        href: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        label: 'Get directions',
      }
    : {
        href: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        label: 'Show on map',
      }
}

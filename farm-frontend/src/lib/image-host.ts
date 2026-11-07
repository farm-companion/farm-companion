// Which hosts may serve an approved image.
//
// An approved row is one the site is willing to show. If its bytes live on a
// host we do not control, the row can rot without anything telling us: on
// 2026-02-01 a generation run wrote 86 farm images pointing at the Runware
// CDN, Runware later evicted the files, and those pages served 404 heroes
// until a manual sweep found them in November.
//
// The rule is therefore not "is it reachable" (that needs the network) but
// "is it ours" (that is a string, and a string can be asserted in CI).

/**
 * Host suffixes we control. Suffix rather than exact match because the object
 * store is bucket-per-subdomain, so every bucket is a distinct hostname under
 * the same provider domain.
 */
export const OWN_IMAGE_HOST_SUFFIXES = [
  'your-objectstorage.com',
  'farmcompanion.co.uk',
] as const

/**
 * True when the URL's bytes are ours to keep. A relative path is ours by
 * definition: it is served from this app.
 */
export function isOwnImageHost(url: string): boolean {
  if (url.startsWith('/')) return true
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    // An unparseable URL is not a host we control, and saying "yes" here
    // would let a malformed row through the one check meant to catch it.
    return false
  }
  return OWN_IMAGE_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  )
}

export interface HostCheckable {
  url: string
  status: string
}

/**
 * The approved rows whose bytes are hot-linked to someone else's host.
 * Non-approved rows are excluded on purpose: a pending row is a candidate,
 * and candidates are allowed to point anywhere until ingest.
 */
export function hotlinkedApproved<T extends HostCheckable>(rows: readonly T[]): T[] {
  return rows.filter((row) => row.status === 'approved' && !isOwnImageHost(row.url))
}

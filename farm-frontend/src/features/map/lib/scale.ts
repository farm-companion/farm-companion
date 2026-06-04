/**
 * Pure metric scale-bar math for the map control cluster.
 *
 * Extracted from the old ScaleBar component so the computation is unit-
 * testable without a GL context (same pattern as classifyDeclutter). Metric
 * only: the map ships with unit="metric" and nothing else consumes the
 * imperial/nautical paths.
 */

export interface ScaleBarResult {
  /** Bar width in CSS pixels (always <= maxWidth) */
  width: number
  /** Human label, e.g. "200 m" or "2 km" */
  label: string
}

// Clean step values in meters, largest-first match below maxWidth.
const METRIC_STEPS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500,
  1000, 2000, 5000, 10000, 20000, 50000, 100000,
]

/**
 * Compute the widest clean metric scale bar that fits in maxWidth pixels at
 * the given latitude and zoom. Returns null for inputs that produce no valid
 * scale (non-finite values, poles, out-of-range latitudes).
 */
export function computeScaleBar(
  latitude: number,
  zoom: number,
  maxWidth = 100,
): ScaleBarResult | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(zoom)) return null
  // cos(90deg) is ~6e-17 in floating point, not 0, so range-check explicitly.
  if (Math.abs(latitude) >= 90) return null

  // Web Mercator ground resolution at the equator is 156543.03 m/px at z0.
  const metersPerPixel =
    (156543.03 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom)
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return null

  const maxMeters = maxWidth * metersPerPixel

  let step = METRIC_STEPS[0]
  for (const candidate of METRIC_STEPS) {
    if (candidate <= maxMeters) step = candidate
    else break
  }

  const width = Math.max(1, Math.round(step / metersPerPixel))
  const label = step >= 1000 ? `${step / 1000} km` : `${step} m`

  return { width, label }
}

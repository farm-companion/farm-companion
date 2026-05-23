// OPTIONAL opening-hours seam. OFF by default (GOOGLE_HOURS_SEAM env flag).
// Discovery and photos via Google are explicitly out of scope.
import { PIPELINE_CONFIG } from '../config'

export async function maybeFetchHours(
  _farmName: string,
  _opts: { fetcher?: typeof fetch } = {},
): Promise<string | null> {
  if (!PIPELINE_CONFIG.google.hoursSeamEnabled) return null
  // Intentionally a no-op until the flag is enabled by an operator decision.
  // When enabled, fetch hours-only and tag the field source 'google'.
  return null
}

import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'

/**
 * Map Declutter: turn the recolored basemap into a calm canvas.
 *
 * recolorMap (lib/map-theme) only repaints layers. This module reduces NOISE so
 * the map reads like Komoot rather than a busy reference map: it hides POIs,
 * pushes small place and road labels to higher zooms, and thins roads to
 * zoom-scaled hairlines (minor roads thinnest, majors a touch heavier). Towns,
 * cities, regions, countries, water, and the major route network stay, but the
 * UK overview reads calm because every road is a hairline there and only fills
 * in as you zoom in.
 *
 * Like classifyLayer, classifyDeclutter is pure and id/source-layer based, so it
 * survives style-version drift and is unit-testable without a GL context.
 * declutterMap applies the actions on the map `load` event, right after
 * recolorMap, and swallows per-layer errors so one odd layer cannot abort the
 * whole pass.
 */

export type DeclutterAction =
  | { kind: 'hide' }
  | { kind: 'demote'; minzoom: number }
  | { kind: 'thin' }
  | { kind: 'thinMajor' }
  | { kind: 'rename'; minzoom?: number; padding?: number }
  | null

interface MinimalLayer {
  id: string
  type: string
  'source-layer'?: string
}

// Minor roads collapse to a hairline that grows slightly as you zoom in.
const THIN_WIDTH: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  6,
  0.3,
  11,
  0.6,
  16,
  1.2,
]
const THIN_OPACITY = 0.55

// Major routes stay visible but start as a hairline at the overview, so the
// motorway network no longer dominates the UK view; it fills in when zoomed.
const MAJOR_WIDTH: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  5,
  0.4,
  8,
  0.9,
  12,
  2,
]

// Small settlements and road names only earn a label once you zoom in.
const PLACE_MIN_ZOOM = 9
const ROAD_LABEL_MIN_ZOOM = 11

// Sea and country names arrive as multilingual slash-piles ("North Sea /
// Nordsee / Noordzee / ..."). Collapse to the English name, falling back to
// the latin transliteration, then the raw name.
const ENGLISH_NAME: ExpressionSpecification = [
  'coalesce',
  ['get', 'name:en'],
  ['get', 'name:latin'],
  ['get', 'name'],
]

// Collision-box inflation for sea point labels: large enough that the two
// duplicate "North Sea" points (~45px apart at the UK overview) suppress each
// other, like the tall multilingual labels used to do by accident.
const WATER_LABEL_PADDING = 48

/**
 * Decide how to quiet an OpenMapTiles layer, or null to leave it alone. The
 * action expresses intent; declutterMap maps it to the concrete GL call.
 */
export function classifyDeclutter(layer: MinimalLayer): DeclutterAction {
  const hay = `${layer.id} ${layer['source-layer'] ?? ''}`.toLowerCase()

  if (layer.type === 'symbol') {
    // POIs and house numbers add the most noise and the least value here.
    // Match "poi" only as a layer-name token so it never fires on "water_point".
    if (/(?:^|[ _-])poi(?:[ _-]|\d|$)|housenumber/.test(hay)) return { kind: 'hide' }
    // Road and junction name labels return when zoomed in.
    if (/transportation_name|road_label|motorway_junction|junction/.test(hay)) {
      return { kind: 'demote', minzoom: ROAD_LABEL_MIN_ZOOM }
    }
    // Small settlements return when zoomed in; town/city/region/country stay.
    if (/place_other|village|hamlet|suburb|neighbourhood|neighborhood|isolated|locality|\bisland\b|allotments|quarter/.test(hay)) {
      return { kind: 'demote', minzoom: PLACE_MIN_ZOOM }
    }
    // Sea and country labels stay, but in one language instead of six. Seas
    // carry several duplicate label points (and a line twin), and the tall
    // multilingual piles used to collide each other away; short names no
    // longer do, so the line twin waits for detail zoom and point labels get
    // an inflated collision box to re-suppress their duplicates.
    if (/water_name/.test(hay)) {
      return /line/.test(hay)
        ? { kind: 'rename', minzoom: PLACE_MIN_ZOOM }
        : { kind: 'rename', padding: WATER_LABEL_PADDING }
    }
    if (/country/.test(hay)) return { kind: 'rename' }
    return null
  }

  if (layer.type === 'line') {
    if (!/road|highway|transportation|street/.test(hay)) return null
    if (/rail/.test(hay)) return null // leave railways to recolor only
    if (/motorway|trunk|primary/.test(hay)) return { kind: 'thinMajor' }
    if (/minor|secondary|tertiary|service|track|path|link/.test(hay)) {
      return { kind: 'thin' }
    }
    return null
  }

  return null
}

/**
 * Quiet every classifiable layer of the loaded style. Call on the map `load`
 * event, after recolorMap. Do not re-read getStyle() to verify afterwards;
 * trust the render.
 */
export function declutterMap(map: MapLibreMap): void {
  const layers = map.getStyle()?.layers
  if (!layers) return

  for (const layer of layers) {
    const action = classifyDeclutter(layer as MinimalLayer)
    if (!action) continue

    try {
      switch (action.kind) {
        case 'hide':
          map.setLayoutProperty(layer.id, 'visibility', 'none')
          break
        case 'demote':
          map.setLayerZoomRange(layer.id, action.minzoom, 24)
          break
        case 'thin':
          map.setPaintProperty(layer.id, 'line-width', THIN_WIDTH)
          map.setPaintProperty(layer.id, 'line-opacity', THIN_OPACITY)
          break
        case 'thinMajor':
          map.setPaintProperty(layer.id, 'line-width', MAJOR_WIDTH)
          break
        case 'rename':
          map.setLayoutProperty(layer.id, 'text-field', ENGLISH_NAME)
          if (action.minzoom !== undefined) {
            map.setLayerZoomRange(layer.id, action.minzoom, 24)
          }
          if (action.padding !== undefined) {
            map.setLayoutProperty(layer.id, 'text-padding', action.padding)
          }
          break
      }
    } catch {
      // One unsupported layer must not abort the whole declutter pass.
    }
  }
}

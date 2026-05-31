import type { Map as MapLibreMap } from 'maplibre-gl'

/**
 * Map Theme: runtime recolor of a vector basemap to the Pitti Press brand.
 *
 * The basemap (OpenFreeMap Positron, OpenMapTiles schema) ships as a neutral
 * grey style. Rather than self-host an authored style, we walk the loaded
 * style layers and repaint each by ROLE (land/water/park/road/label) using the
 * brand palette. This keeps a custom look with no API key and no request caps.
 *
 * Classification is purely id/source-layer based so it survives style-version
 * drift and is unit-testable without a real GL context. `recolorMap` applies
 * the colors; it guards `text-color` behind text-field presence (setting it on
 * an icon-only symbol layer throws) and swallows per-layer paint errors so one
 * unsupported layer never aborts the whole pass.
 */

export type LayerRole =
  | 'land'
  | 'water'
  | 'park'
  | 'building'
  | 'majorRoad'
  | 'minorRoad'
  | 'boundary'
  | 'label'

export interface MapPalette {
  land: string
  water: string
  park: string
  building: string
  majorRoad: string
  minorRoad: string
  boundary: string
  label: string
  labelHalo: string
  brand: string
}

// Values mirror harvest-theme.css tokens (light column of the redesign spec).
export const MAP_PALETTE_LIGHT: MapPalette = {
  land: '#F2EBDA', // paper token, Cream
  water: '#AFC6D6', // muted Sea Ink (full #1F3A5F is too heavy as a fill)
  park: '#E8E1D0', // map-park token, warm stone (never green)
  building: '#E7DFCC', // hairline above land
  majorRoad: '#57534E', // ink-muted token, engraved primary routes
  minorRoad: '#E7E5E4', // border token, faint hairline
  boundary: '#CDC4AF', // dashed admin, quieter than roads
  label: '#0F0E0C', // ink token, Loam
  labelHalo: '#F2EBDA', // paper halo for legibility on any fill
  brand: '#D33A2C', // brand token, Vermilion (selected stamp, used by pins)
}

// Dark column. ThemeProvider currently forces light, so this stays ready.
export const MAP_PALETTE_DARK: MapPalette = {
  land: '#15120D',
  water: '#243240', // muted from #6FA0D9 (that bright tone is a label/line color)
  park: '#23201A',
  building: '#1E1A13',
  majorRoad: '#A8A29E',
  minorRoad: 'rgba(255,255,255,0.08)',
  boundary: '#3A352B',
  label: '#F4F1EA',
  labelHalo: '#15120D',
  brand: '#FF6B5B',
}

interface MinimalLayer {
  id: string
  type: string
  'source-layer'?: string
}

/**
 * Map an OpenMapTiles-schema layer to a brand role, or null to leave it alone.
 * The role decides the COLOR; the caller decides the paint PROPERTY from the
 * layer's own `type` (fill-color vs line-color vs background-color vs text).
 */
export function classifyLayer(layer: MinimalLayer): LayerRole | null {
  const hay = `${layer.id} ${layer['source-layer'] ?? ''}`.toLowerCase()

  if (layer.type === 'background') return 'land'
  // All text labels share the ink color; icon-only symbols are guarded out in
  // recolorMap (they have no text-field, so text-color is never applied).
  if (layer.type === 'symbol') return 'label'

  if (/water|waterway|ocean|\bsea\b|river|lake|reservoir/.test(hay)) return 'water'

  if (layer.type === 'fill') {
    if (/building/.test(hay)) return 'building'
    if (/park|wood|grass|forest|landcover|landuse|cemeter|pitch|golf|garden|farmland|meadow|scrub|wetland|sand|beach/.test(hay)) {
      return 'park'
    }
    return null
  }

  if (layer.type === 'line') {
    if (/boundary|admin/.test(hay)) return 'boundary'
    if (/motorway|trunk|primary|major/.test(hay)) return 'majorRoad'
    if (/road|highway|transportation|street|rail|path|track|bridge|tunnel|pier|aeroway|ferry/.test(hay)) {
      return 'minorRoad'
    }
    return null
  }

  return null
}

function colorForRole(role: LayerRole, palette: MapPalette): string {
  switch (role) {
    case 'land':
      return palette.land
    case 'water':
      return palette.water
    case 'park':
      return palette.park
    case 'building':
      return palette.building
    case 'majorRoad':
      return palette.majorRoad
    case 'minorRoad':
      return palette.minorRoad
    case 'boundary':
      return palette.boundary
    case 'label':
      return palette.label
  }
}

/** True when next-themes has flipped <html> to the dark class. */
export function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/**
 * Repaint every classifiable layer of the loaded style to the brand palette.
 * Call on the map `load` event (and on theme flip). Do NOT re-read getStyle()
 * afterwards to verify, because paint reads are stale; trust the render.
 */
export function recolorMap(map: MapLibreMap, isDark = false): void {
  const palette = isDark ? MAP_PALETTE_DARK : MAP_PALETTE_LIGHT
  const layers = map.getStyle()?.layers
  if (!layers) return

  for (const layer of layers) {
    const role = classifyLayer(layer as MinimalLayer)
    if (!role) continue
    const color = colorForRole(role, palette)

    try {
      switch (layer.type) {
        case 'background':
          map.setPaintProperty(layer.id, 'background-color', color)
          break
        case 'fill':
          map.setPaintProperty(layer.id, 'fill-color', color)
          if (role === 'building') {
            map.setPaintProperty(layer.id, 'fill-opacity', isDark ? 0.4 : 0.5)
          }
          break
        case 'line':
          map.setPaintProperty(layer.id, 'line-color', color)
          break
        case 'symbol': {
          // text-color is only valid where the layer renders text; setting it
          // on an icon-only layer throws. getLayoutProperty is the safe probe.
          if (map.getLayoutProperty(layer.id, 'text-field')) {
            map.setPaintProperty(layer.id, 'text-color', color)
            map.setPaintProperty(layer.id, 'text-halo-color', palette.labelHalo)
          }
          break
        }
      }
    } catch {
      // One unsupported paint set must not abort the whole recolor pass.
    }
  }
}

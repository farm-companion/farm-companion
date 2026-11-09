/**
 * Map plates: a two-ink fragment of the landscape around a farm.
 *
 * The plate is the variable element in the Rotocalco Press card system. A mid
 * century poster house printed one background plate and overprinted different
 * type per city; here the plate is the farm's own coastline, lanes and water,
 * so several hundred farms give several hundred compositions from one template
 * without a bespoke illustration for each.
 *
 * Drawn from OpenStreetMap via Overpass. OSM data is ODbL, so anything rendered
 * from it is a Produced Work and must carry attribution: see `PLATE_ATTRIBUTION`
 * and render it on any surface that shows a plate.
 *
 * This module is pure. `buildOverpassQuery` makes the request text and
 * `renderPlate` turns a response into SVG; neither performs I/O, so both are
 * testable without the network. Fetching belongs to the caller, and should be
 * a pre-generation step rather than a per-request one: Overpass is a shared
 * free service with a strict fair-use policy.
 */

export const PLATE_ATTRIBUTION = '© OpenStreetMap contributors'

const PAPER = '#F2EBDA'
const INK = '#0F0E0C'
const SEA_INK = '#1F3A5F'
const VERMILION = '#D33A2C'

/** Metres per degree of latitude. Close enough at plate scale. */
const M_PER_DEG_LAT = 111_320

/** Stroke weight per road class, in viewport units at a 1200 m plate. */
const ROAD_WEIGHT: Record<string, number> = {
  motorway: 9,
  trunk: 8,
  primary: 7,
  secondary: 5.5,
  tertiary: 4.5,
  unclassified: 3,
  residential: 3,
}

export interface LatLng {
  lat: number
  lon: number
}

/** The subset of an Overpass `out geom` element this module reads. */
export interface OverpassWay {
  type: string
  geometry?: LatLng[]
  tags?: Record<string, string>
}

/** Classes dropped first when a plate is too dense to read small. */
const MINOR_ROADS = new Set(['residential', 'unclassified'])

/**
 * Above this many drawable ways, the minor lanes are dropped. Measured, not
 * guessed: at 108px wide, the width of a feed thumbnail, a Cornish town at 345
 * ways and a fen town at 679 both collapsed into grey noise, while a Cotswold
 * village at 208 stayed legible.
 */
const DENSITY_LIMIT = 240

/** Weights are authored against a 630-unit plate and scale with the frame. */
const REFERENCE_EDGE = 630

export interface PlateOptions {
  lat: number
  lon: number
  /** Half-width of the plate on the ground, in metres. */
  radiusM?: number
  width: number
  height: number
  /**
   * 'auto' drops minor roads once the plate passes DENSITY_LIMIT, 'full' keeps
   * everything, 'spare' always drops them. Default 'auto'.
   */
  detail?: 'auto' | 'full' | 'spare'
  /**
   * Credit written into the SVG's `<title>`. Defaults to the ODbL attribution,
   * because a plate is normally rendered from OpenStreetMap and must carry it.
   *
   * Pass `null` ONLY for invented geometry holding no OSM data, such as the
   * map placeholder: claiming the attribution there would be a false
   * provenance claim, and false credit devalues the real one everywhere else.
   */
  attribution?: string | null
}

export function buildOverpassQuery(lat: number, lon: number, radiusM = 1200): string {
  const dLat = radiusM / M_PER_DEG_LAT
  const dLon = radiusM / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180))
  const bbox = [lat - dLat, lon - dLon, lat + dLat, lon + dLon]
    .map((n) => n.toFixed(6))
    .join(',')
  const roads = Object.keys(ROAD_WEIGHT).join('|')
  return [
    '[out:json][timeout:25];',
    '(',
    `  way["highway"~"^(${roads})$"](${bbox});`,
    `  way["natural"="coastline"](${bbox});`,
    `  way["natural"="water"](${bbox});`,
    `  way["waterway"~"^(river|stream|canal)$"](${bbox});`,
    ');',
    'out geom;',
  ].join('\n')
}

/**
 * Equirectangular projection centred on the plate. At a 1 km square the error
 * against a proper projection is well under a pixel, and the alternative costs
 * a dependency for no visible gain.
 */
export function makeProjector(opts: PlateOptions) {
  const radiusM = opts.radiusM ?? 1200
  const mPerDegLon = M_PER_DEG_LAT * Math.cos((opts.lat * Math.PI) / 180)
  // Cover the longer edge so the plate always fills its frame.
  const scale = Math.max(opts.width, opts.height) / (radiusM * 2)

  return (point: LatLng): [number, number] => {
    const eastM = (point.lon - opts.lon) * mPerDegLon
    const northM = (point.lat - opts.lat) * M_PER_DEG_LAT
    return [opts.width / 2 + eastM * scale, opts.height / 2 - northM * scale]
  }
}

function toPath(geometry: LatLng[], project: (p: LatLng) => [number, number]): string {
  return geometry
    .map((point, index) => {
      const [x, y] = project(point)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

interface Drawn {
  d: string
  stroke?: string
  strokeWidth?: number
  fill?: string
}

/** Sort so water sits under the road network and the coastline reads as an edge. */
function classify(way: OverpassWay, project: (p: LatLng) => [number, number]): Drawn | null {
  if (!way.geometry || way.geometry.length < 2) return null
  const tags = way.tags ?? {}
  const d = toPath(way.geometry, project)

  if (tags.natural === 'water') {
    return { d: `${d} Z`, fill: SEA_INK }
  }
  if (tags.natural === 'coastline') {
    return { d, stroke: SEA_INK, strokeWidth: 6 }
  }
  if (tags.waterway) {
    return { d, stroke: SEA_INK, strokeWidth: tags.waterway === 'river' ? 6 : 3 }
  }
  if (tags.highway && ROAD_WEIGHT[tags.highway]) {
    return { d, stroke: INK, strokeWidth: ROAD_WEIGHT[tags.highway] }
  }
  return null
}

const LAYER_ORDER = [SEA_INK, INK]

export interface RenderedPlate {
  svg: string
  /** How many OSM ways made it onto the plate. Zero means open country. */
  featureCount: number
}

function isMinorRoad(way: OverpassWay): boolean {
  const highway = way.tags?.highway
  return highway !== undefined && MINOR_ROADS.has(highway)
}

export function renderPlate(ways: OverpassWay[], opts: PlateOptions): RenderedPlate {
  const project = makeProjector(opts)
  const weightScale = Math.max(opts.width, opts.height) / REFERENCE_EDGE

  const detail = opts.detail ?? 'auto'

  // Classify once per way and carry the result. `classify` calls `toPath`,
  // which projects and formats every point, so running it in the filter and
  // again in the map doubled that work for the whole plate: on the dense
  // cases measured above, 345 and 679 ways, that is thousands of wasted
  // coordinate transforms. Output is unchanged.
  const candidates = ways
    .map((way) => ({ way, item: classify(way, project) }))
    .filter((entry): entry is { way: OverpassWay; item: Drawn } => entry.item !== null)

  const dropMinor =
    detail === 'spare' || (detail === 'auto' && candidates.length > DENSITY_LIMIT)

  const drawn = (dropMinor ? candidates.filter((entry) => !isMinorRoad(entry.way)) : candidates)
    .map(({ item }) => ({
      ...item,
      strokeWidth: item.strokeWidth ? item.strokeWidth * weightScale : undefined,
    }))

  // Fills first, then strokes by layer, so roads cross water rather than vanish.
  const fills = drawn.filter((item) => item.fill)
  const strokes = drawn.filter((item) => item.stroke)
  strokes.sort(
    (a, b) => LAYER_ORDER.indexOf(a.stroke!) - LAYER_ORDER.indexOf(b.stroke!)
  )

  const body = [
    ...fills.map((item) => `<path d="${item.d}" fill="${item.fill}"/>`),
    ...strokes.map(
      (item) =>
        `<path d="${item.d}" fill="none" stroke="${item.stroke}" stroke-width="${item.strokeWidth!.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  ].join('')

  // The farm itself: the one vermilion stamp on the plate.
  const markerR = Math.max(10, Math.min(opts.width, opts.height) * 0.035)
  const marker =
    `<circle cx="${opts.width / 2}" cy="${opts.height / 2}" r="${markerR + 4}" fill="${PAPER}"/>` +
    `<circle cx="${opts.width / 2}" cy="${opts.height / 2}" r="${markerR}" fill="${VERMILION}"/>`

  const credit = opts.attribution === undefined ? PLATE_ATTRIBUTION : opts.attribution

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">` +
    `<title>${escapeXml(credit ?? 'Illustrative map, not a real location')}</title>` +
    `<rect width="${opts.width}" height="${opts.height}" fill="${PAPER}"/>` +
    body +
    marker +
    `</svg>`

  return { svg, featureCount: drawn.length }
}

/**
 * A plate shape, ready to be rebuilt as an element by a renderer that cannot
 * load an SVG file.
 *
 * Satori, which draws the OG cards, renders inline `<path>` and `<circle>`
 * children but silently drops an `<img>` holding an SVG data URI: the card
 * came back with a blank plate and no error. So the card reads the stored
 * plate back into shapes and inlines them, which is the same mechanism the
 * mark and the fallback sunrise already use in that route.
 */
export interface PlateShape {
  kind: 'path' | 'circle'
  d?: string
  cx?: number
  cy?: number
  r?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))
  return match ? match[1] : undefined
}

const num = (value: string | undefined): number | undefined =>
  value === undefined ? undefined : Number(value)

/**
 * Read a plate SVG back into shapes. The background rect is deliberately
 * dropped: the card already paints its own paper, and a second opaque rect
 * would cover the composition it sits on.
 */
export function parsePlate(svg: string): PlateShape[] {
  const shapes: PlateShape[] = []

  for (const [tag] of svg.matchAll(/<path\b[^>]*\/>/g)) {
    const d = attr(tag, 'd')
    if (!d) continue
    shapes.push({
      kind: 'path',
      d,
      fill: attr(tag, 'fill'),
      stroke: attr(tag, 'stroke'),
      strokeWidth: num(attr(tag, 'stroke-width')),
    })
  }

  for (const [tag] of svg.matchAll(/<circle\b[^>]*\/>/g)) {
    shapes.push({
      kind: 'circle',
      cx: num(attr(tag, 'cx')),
      cy: num(attr(tag, 'cy')),
      r: num(attr(tag, 'r')),
      fill: attr(tag, 'fill'),
    })
  }

  return shapes
}

/**
 * Plate slugs are farm slugs: lowercase, digits and hyphens, nothing else.
 *
 * This is a security boundary, not tidiness. A plate slug is interpolated into
 * a URL path, and URL normalisation collapses `..` segments while a `#` ends
 * the path early, so `../../api/thing#` turns `/images/plates/<slug>.svg` into
 * `/api/thing` with the `.svg` suffix discarded as a fragment. Anything that
 * is not plainly a slug is refused.
 */
const PLATE_SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/

export function isPlateSlug(value: string): boolean {
  return PLATE_SLUG.test(value)
}

/**
 * The farms that actually have a generated plate in `public/images/plates`.
 *
 * Without this every farm page put `plate=<slug>` on its card URL, so roughly
 * 3,500 of 3,508 card renders fetched a file that does not exist, waited for
 * the 404 and then drew the sunrise. The card still falls back, so this is not
 * correctness; it is 3,500 pointless round trips on a path social crawlers hit.
 *
 * Kept in step with the directory by a test, because a list that silently goes
 * stale is worse than no list: a farm whose plate exists would stop asking for
 * it. `scripts/generate-map-plates-batch.ts` writes the files; add the slug
 * here in the same commit.
 */
export const PLATE_SLUGS: ReadonlySet<string> = new Set([
  'argal-farm-shop',
  'baileys-country-store-and-farm-shop',
  'bosavern-community-farm',
  'boscastle-farm-shop-cafe',
  'celtic-produce',
  'chypraze-farm-butchery-and-shop',
  'colwith-farm-shop',
  'coombeshead-farm',
])

/** True when asking the card for this farm's plate is worth the request. */
export function hasPlate(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && PLATE_SLUGS.has(slug)
}

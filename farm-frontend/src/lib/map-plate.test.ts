import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildOverpassQuery,
  makeProjector,
  renderPlate,
  parsePlate,
  isPlateSlug,
  PLATE_ATTRIBUTION,
  type OverpassWay,
} from './map-plate'

const CORNWALL = { lat: 50.1897, lon: -5.3747 }
const PLATE = { ...CORNWALL, radiusM: 1200, width: 430, height: 630 }

test('the bbox narrows with latitude, so a UK plate is not stretched east to west', () => {
  const query = buildOverpassQuery(CORNWALL.lat, CORNWALL.lon, 1200)
  const bbox = query.match(/\(([-\d.]+,[-\d.]+,[-\d.]+,[-\d.]+)\)/)
  assert.ok(bbox, 'no bbox found in the query')
  const [south, west, north, east] = bbox[1].split(',').map(Number)

  const latSpan = north - south
  const lonSpan = east - west
  // At 50 degrees north a degree of longitude is ~0.64 of a degree of latitude,
  // so the longitude span must be correspondingly wider for a square on the ground.
  assert.ok(lonSpan > latSpan * 1.4, `lon span ${lonSpan} not widened against lat span ${latSpan}`)
  assert.ok(lonSpan < latSpan * 1.8, `lon span ${lonSpan} widened too far`)
})

test('the requested feature classes are all in the query', () => {
  const query = buildOverpassQuery(CORNWALL.lat, CORNWALL.lon)
  for (const needle of ['highway', 'natural"="coastline', 'natural"="water', 'waterway']) {
    assert.ok(query.includes(needle), `query is missing ${needle}`)
  }
  assert.ok(query.includes('out geom;'), 'query must ask for inline geometry')
})

test('the centre point projects to the centre of the plate', () => {
  const project = makeProjector(PLATE)
  const [x, y] = project(CORNWALL)
  assert.ok(Math.abs(x - PLATE.width / 2) < 0.001, `x ${x}`)
  assert.ok(Math.abs(y - PLATE.height / 2) < 0.001, `y ${y}`)
})

test('north is up and east is right', () => {
  const project = makeProjector(PLATE)
  const [, northY] = project({ lat: CORNWALL.lat + 0.005, lon: CORNWALL.lon })
  const [eastX] = project({ lat: CORNWALL.lat, lon: CORNWALL.lon + 0.005 })
  assert.ok(northY < PLATE.height / 2, 'moving north must decrease y')
  assert.ok(eastX > PLATE.width / 2, 'moving east must increase x')
})

const FIXTURE: OverpassWay[] = [
  {
    type: 'way',
    tags: { highway: 'primary' },
    geometry: [
      { lat: 50.185, lon: -5.38 },
      { lat: 50.194, lon: -5.37 },
    ],
  },
  {
    type: 'way',
    tags: { natural: 'water' },
    geometry: [
      { lat: 50.188, lon: -5.379 },
      { lat: 50.189, lon: -5.377 },
      { lat: 50.187, lon: -5.376 },
    ],
  },
  { type: 'way', tags: { highway: 'residential' }, geometry: [{ lat: 50.19, lon: -5.374 }] },
  { type: 'way', tags: { building: 'yes' }, geometry: [] },
]

test('renders only the classes it understands, and counts them', () => {
  const { svg, featureCount } = renderPlate(FIXTURE, PLATE)
  // The single-point residential way and the untagged building are both dropped.
  assert.equal(featureCount, 2)
  assert.ok(svg.startsWith('<svg'), 'must be an svg document')
  assert.ok(svg.includes(`viewBox="0 0 430 630"`), 'viewBox must match the requested size')
})

test('water is filled beneath roads, not stroked over them', () => {
  const { svg } = renderPlate(FIXTURE, PLATE)
  const waterAt = svg.indexOf('fill="#1F3A5F"')
  const roadAt = svg.indexOf('stroke="#0F0E0C"')
  assert.ok(waterAt > -1 && roadAt > -1, 'expected both a water fill and a road stroke')
  assert.ok(waterAt < roadAt, 'water must be painted before roads')
})

test('the farm is marked in vermilion at the centre, on a paper halo', () => {
  const { svg } = renderPlate(FIXTURE, PLATE)
  assert.ok(svg.includes('fill="#D33A2C"'), 'missing the vermilion marker')
  const halo = svg.lastIndexOf('fill="#F2EBDA"')
  const marker = svg.lastIndexOf('fill="#D33A2C"')
  assert.ok(halo < marker, 'the paper halo must sit under the marker')
})

test('every plate carries its ODbL attribution by default', () => {
  const { svg } = renderPlate(FIXTURE, PLATE)
  assert.ok(svg.includes(PLATE_ATTRIBUTION), 'OSM attribution is required on a Produced Work')
})

test('invented geometry can refuse the attribution rather than claim it falsely', () => {
  const { svg } = renderPlate(FIXTURE, { ...PLATE, attribution: null })
  assert.ok(!svg.includes(PLATE_ATTRIBUTION), 'a synthetic plate must not credit OSM')
  assert.ok(svg.includes('<title>'), 'it still needs an accessible title')
  assert.ok(svg.includes('not a real location'))
})

test('open country renders a valid, empty plate rather than throwing', () => {
  const { svg, featureCount } = renderPlate([], PLATE)
  assert.equal(featureCount, 0)
  assert.ok(svg.includes('<svg') && svg.includes('</svg>'))
  assert.ok(svg.includes('fill="#D33A2C"'), 'the farm marker must still be drawn')
})

/** 300 minor lanes plus one A road: a dense town centre. */
function denseTown(): OverpassWay[] {
  const ways: OverpassWay[] = [
    {
      type: 'way',
      tags: { highway: 'primary' },
      geometry: [
        { lat: 50.185, lon: -5.38 },
        { lat: 50.194, lon: -5.37 },
      ],
    },
  ]
  for (let i = 0; i < 300; i += 1) {
    ways.push({
      type: 'way',
      tags: { highway: 'residential' },
      geometry: [
        { lat: 50.186 + i * 0.00002, lon: -5.379 },
        { lat: 50.186 + i * 0.00002, lon: -5.377 },
      ],
    })
  }
  return ways
}

test('a dense plate drops its minor lanes, which turn to noise at thumbnail size', () => {
  const dense = renderPlate(denseTown(), PLATE)
  assert.equal(dense.featureCount, 1, 'only the primary road should survive')
})

test('a sparse plate keeps everything', () => {
  const sparse = denseTown().slice(0, 50)
  const { featureCount } = renderPlate(sparse, PLATE)
  assert.equal(featureCount, 50, 'nothing should be dropped below the density limit')
})

test('detail can be forced either way', () => {
  const full = renderPlate(denseTown(), { ...PLATE, detail: 'full' })
  assert.equal(full.featureCount, 301, 'full must keep every lane')
  const spare = renderPlate(denseTown().slice(0, 50), { ...PLATE, detail: 'spare' })
  assert.equal(spare.featureCount, 1, 'spare must drop lanes even on a sparse plate')
})

test('stroke weights scale with the frame, so a Pinterest plate is not hairlines', () => {
  const card = renderPlate(FIXTURE, PLATE)
  const pin = renderPlate(FIXTURE, { ...PLATE, width: 1000, height: 1500 })
  const weightOf = (svg: string) => Number(svg.match(/stroke-width="([\d.]+)"/)![1])
  assert.ok(
    weightOf(pin.svg) > weightOf(card.svg) * 2,
    `pin weight ${weightOf(pin.svg)} should scale up from card weight ${weightOf(card.svg)}`
  )
})

test('a rendered plate parses back into the shapes it was drawn from', () => {
  const { svg } = renderPlate(FIXTURE, PLATE)
  const shapes = parsePlate(svg)

  const paths = shapes.filter((s) => s.kind === 'path')
  const circles = shapes.filter((s) => s.kind === 'circle')
  // Two features from the fixture, and the marker is a halo plus a dot.
  assert.equal(paths.length, 2, 'expected the water fill and the road stroke')
  assert.equal(circles.length, 2, 'expected the paper halo and the vermilion dot')

  const road = paths.find((s) => s.stroke === '#0F0E0C')
  assert.ok(road, 'road not found')
  assert.ok(road.d!.startsWith('M'), 'path data must survive the round trip')
  assert.equal(typeof road.strokeWidth, 'number', 'stroke width must parse as a number')
})

test('the background rect is dropped, so a plate cannot paint over the card', () => {
  const { svg } = renderPlate(FIXTURE, PLATE)
  assert.ok(svg.includes('<rect'), 'the stored plate does have a background')
  const shapes = parsePlate(svg)
  assert.ok(
    shapes.every((s) => s.kind !== 'path' || s.d !== undefined),
    'no rect should survive as a shape'
  )
  assert.equal(shapes.filter((s) => s.fill === '#F2EBDA' && s.kind === 'path').length, 0)
})

test('parsing tolerates a file that opens with the ODbL comment', () => {
  const { svg } = renderPlate(FIXTURE, PLATE)
  const asStored = `<!-- ${PLATE_ATTRIBUTION} -->\n${svg}\n`
  assert.equal(parsePlate(asStored).length, parsePlate(svg).length)
})

test('real farm slugs are accepted', () => {
  for (const slug of [
    'boscastle-farm-shop-cafe',
    'argal-farm-shop',
    'chypraze-farm-butchery-and-shop',
    'a',
    'farm123',
  ]) {
    assert.equal(isPlateSlug(slug), true, `${slug} should be accepted`)
  }
})

test('anything that could escape the plates directory is refused', () => {
  const attacks = [
    '../../api/health#',          // normalises to /api/health, .svg becomes a fragment
    '../../../robots.txt#',
    '..%2F..%2Fapi',
    '/etc/passwd',
    'slug/../../other',
    'slug#frag',
    'slug?query=1',
    'slug.svg',                    // a dot is never part of a slug
    'https://evil.example.com/x',
    'Slug-With-Caps',
    '',
    'a'.repeat(101),
    'slug with spaces',
    'slug%00',
  ]
  for (const attack of attacks) {
    assert.equal(isPlateSlug(attack), false, `${JSON.stringify(attack)} should be refused`)
  }
})

test('the placeholder getPlaceholderMapUrl promises is actually there', () => {
  // lib/static-map.ts returns '/images/map-placeholder.svg'. It returned that
  // for a file that had never existed; nothing called the function, so nothing
  // caught it. Built now by scripts/build-map-placeholder.ts.
  const path = join(process.cwd(), 'public', 'images', 'map-placeholder.svg')
  assert.ok(existsSync(path), `missing: ${path}`)

  const svg = readFileSync(path, 'utf8')
  const shapes = parsePlate(svg)
  assert.ok(shapes.length >= 5, `expected a drawn map, got ${shapes.length} shapes`)
  assert.ok(
    shapes.some((s) => s.kind === 'circle' && s.fill === '#D33A2C'),
    'the vermilion marker should be present, so it reads as a map',
  )
  assert.ok(
    !svg.includes(PLATE_ATTRIBUTION),
    'invented geometry must not claim OpenStreetMap as its source',
  )
})

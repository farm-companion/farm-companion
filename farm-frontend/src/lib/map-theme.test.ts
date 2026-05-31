// Tests for lib/map-theme classifyLayer. Run via: npm run test:unit
//
// Fixtures use real OpenFreeMap Positron layer ids (OpenMapTiles schema) so the
// role mapping is verified against the actual basemap, not invented names.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { classifyLayer, type LayerRole } from './map-theme'

const cases: Array<[string, { id: string; type: string; 'source-layer'?: string }, LayerRole | null]> = [
  ['background -> land', { id: 'background', type: 'background' }, 'land'],
  ['water fill -> water', { id: 'water', type: 'fill', 'source-layer': 'water' }, 'water'],
  ['waterway line -> water', { id: 'waterway', type: 'line', 'source-layer': 'waterway' }, 'water'],
  ['park fill -> park', { id: 'park', type: 'fill', 'source-layer': 'park' }, 'park'],
  ['landcover_wood -> park', { id: 'landcover_wood', type: 'fill', 'source-layer': 'landcover' }, 'park'],
  ['landuse_residential -> park', { id: 'landuse_residential', type: 'fill', 'source-layer': 'landuse' }, 'park'],
  ['building -> building', { id: 'building', type: 'fill', 'source-layer': 'building' }, 'building'],
  ['motorway inner -> majorRoad', { id: 'highway_motorway_inner', type: 'line', 'source-layer': 'transportation' }, 'majorRoad'],
  ['major casing -> majorRoad', { id: 'highway_major_casing', type: 'line', 'source-layer': 'transportation' }, 'majorRoad'],
  ['minor -> minorRoad', { id: 'highway_minor', type: 'line', 'source-layer': 'transportation' }, 'minorRoad'],
  ['path -> minorRoad', { id: 'highway_path', type: 'line', 'source-layer': 'transportation' }, 'minorRoad'],
  ['railway -> minorRoad', { id: 'railway', type: 'line', 'source-layer': 'transportation' }, 'minorRoad'],
  ['boundary_2 -> boundary', { id: 'boundary_2', type: 'line', 'source-layer': 'boundary' }, 'boundary'],
  ['place label -> label', { id: 'label_city', type: 'symbol', 'source-layer': 'place' }, 'label'],
  ['water name label -> label', { id: 'water_name_point_label', type: 'symbol', 'source-layer': 'water_name' }, 'label'],
  ['unknown fill -> null', { id: 'aeroway-area', type: 'fill', 'source-layer': 'aeroway' }, null],
  ['raster relief -> null', { id: 'ne2_shaded', type: 'raster' }, null],
]

for (const [label, layer, expected] of cases) {
  test(`classifyLayer: ${label}`, () => {
    assert.equal(classifyLayer(layer), expected)
  })
}

test('classifyLayer: water labels are ink, not water (symbol wins over water match)', () => {
  // A symbol layer whose id contains "water" must still be a text label, so its
  // text reads in ink, not painted with the water fill color.
  assert.equal(classifyLayer({ id: 'water_name_line_label', type: 'symbol' }), 'label')
})

test('classifyLayer: minor highway is not misread as major', () => {
  // "highway_minor" contains neither motorway/trunk/primary/major; the order of
  // checks must not let the generic road match shadow the major/minor split.
  assert.equal(classifyLayer({ id: 'highway_minor', type: 'line' }), 'minorRoad')
})

// Tests for lib/map-declutter classifyDeclutter. Run via: npm run test:unit
//
// Fixtures use real OpenFreeMap Positron layer ids (OpenMapTiles schema) so the
// declutter decisions are verified against the actual basemap, not invented names.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { classifyDeclutter, type DeclutterAction } from './map-declutter'

const cases: Array<[string, { id: string; type: string; 'source-layer'?: string }, DeclutterAction]> = [
  ['poi -> hide', { id: 'poi_z16', type: 'symbol', 'source-layer': 'poi' }, { kind: 'hide' }],
  ['poi label -> hide', { id: 'poi_label', type: 'symbol', 'source-layer': 'poi' }, { kind: 'hide' }],
  ['housenumber -> hide', { id: 'housenumber', type: 'symbol', 'source-layer': 'housenumber' }, { kind: 'hide' }],
  ['road label -> demote 11', { id: 'road_label', type: 'symbol', 'source-layer': 'transportation_name' }, { kind: 'demote', minzoom: 11 }],
  ['motorway junction -> demote 11', { id: 'highway-name-motorway_junction', type: 'symbol' }, { kind: 'demote', minzoom: 11 }],
  ['place_village -> demote 9', { id: 'place_village', type: 'symbol', 'source-layer': 'place' }, { kind: 'demote', minzoom: 9 }],
  ['place_other -> demote 9', { id: 'place_other', type: 'symbol', 'source-layer': 'place' }, { kind: 'demote', minzoom: 9 }],
  ['place_suburb -> demote 9', { id: 'place_suburb', type: 'symbol', 'source-layer': 'place' }, { kind: 'demote', minzoom: 9 }],
  ['place_town -> keep', { id: 'place_town', type: 'symbol', 'source-layer': 'place' }, null],
  ['place_city -> keep', { id: 'place_city', type: 'symbol', 'source-layer': 'place' }, null],
  ['place_state -> keep', { id: 'place_state', type: 'symbol', 'source-layer': 'place' }, null],
  ['place_country -> keep', { id: 'place_country_other', type: 'symbol', 'source-layer': 'place' }, null],
  ['water name -> keep', { id: 'water_name_point', type: 'symbol', 'source-layer': 'water_name' }, null],
  ['road_minor -> thin', { id: 'road_minor', type: 'line', 'source-layer': 'transportation' }, { kind: 'thin' }],
  ['road_secondary_tertiary -> thin', { id: 'road_secondary_tertiary', type: 'line', 'source-layer': 'transportation' }, { kind: 'thin' }],
  ['road_service_track -> thin', { id: 'road_service_track', type: 'line', 'source-layer': 'transportation' }, { kind: 'thin' }],
  ['road_path -> thin', { id: 'road_path', type: 'line', 'source-layer': 'transportation' }, { kind: 'thin' }],
  ['road_motorway -> thinMajor', { id: 'road_motorway', type: 'line', 'source-layer': 'transportation' }, { kind: 'thinMajor' }],
  ['road_trunk_primary -> thinMajor', { id: 'road_trunk_primary', type: 'line', 'source-layer': 'transportation' }, { kind: 'thinMajor' }],
  ['road_major_rail -> keep (rail beats major)', { id: 'road_major_rail', type: 'line', 'source-layer': 'transportation' }, null],
  ['waterway line -> keep', { id: 'waterway', type: 'line', 'source-layer': 'waterway' }, null],
  ['background -> keep', { id: 'background', type: 'background' }, null],
  ['building fill -> keep', { id: 'building', type: 'fill', 'source-layer': 'building' }, null],
]

for (const [label, layer, expected] of cases) {
  test(`classifyDeclutter: ${label}`, () => {
    assert.deepEqual(classifyDeclutter(layer), expected)
  })
}

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseOverpass } from './overpass'

const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/overpass-sample.json'), 'utf8'))

test('parses shop=farm nodes into candidates with source ids', () => {
  const out = parseOverpass(fixture)
  const river = out.find((c) => c.sourceId === 'node:1234')
  assert.ok(river)
  assert.equal(river?.source, 'osm')
  assert.equal(river?.name, 'Riverford Farm Shop')
  assert.equal(river?.postcode, 'TQ11 0JU')
  assert.equal(river?.latitude, 50.5008)
  assert.equal(river?.openingHoursRaw, 'Mo-Sa 09:00-17:00')
})

test('uses way center for lat/lng', () => {
  const out = parseOverpass(fixture)
  const way = out.find((c) => c.sourceId === 'way:5678')
  assert.equal(way?.latitude, 51.1)
  assert.equal(way?.longitude, -1.2)
})

test('ignores non-farm elements', () => {
  const out = parseOverpass(fixture)
  assert.equal(out.find((c) => c.sourceId === 'node:9999'), undefined)
})

test('parseOverpass drops a mis-tagged chain store (Farmfoods)', () => {
  const res = {
    elements: [
      { type: 'way', id: 292181031, center: { lat: 52.6, lon: 1.28 }, tags: {
        shop: 'farm', name: 'farmfoods', old_name: 'Carpetright',
        website: 'https://www.farmfoods.co.uk/store-finder.php?branch_code=690',
      } },
      { type: 'node', id: 1, lat: 51, lon: -1, tags: { shop: 'farm', name: 'Newton Farm Foods' } },
    ],
  }
  const out = parseOverpass(res as unknown as Parameters<typeof parseOverpass>[0])
  assert.equal(out.find((c) => c.sourceId === 'way:292181031'), undefined)
  assert.ok(out.find((c) => c.name === 'Newton Farm Foods'))
})

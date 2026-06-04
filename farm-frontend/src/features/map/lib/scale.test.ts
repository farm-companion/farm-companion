// Tests for computeScaleBar (pure metric scale-bar math extracted from the
// old ScaleBar component for the S3 control cluster). Run via: npm run
// test:unit. Fixtures hand-computed from metersPerPixel =
// 156543.03 * cos(lat) / 2^zoom with maxWidth 100.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { computeScaleBar } from './scale'

const fixtures: Array<[lat: number, zoom: number, width: number, label: string]> = [
  [51.5, 12, 84, '2 km'],   // London, city zoom
  [51.5, 15, 67, '200 m'],  // London, street zoom
  [54.5, 6, 70, '100 km'],  // UK overview
  [51.5, 18, 54, '20 m'],   // max zoom
  [0, 0, 1, '100 km'],      // equator, world zoom (clamped to largest step)
]

for (const [lat, zoom, width, label] of fixtures) {
  test(`computeScaleBar: lat ${lat} zoom ${zoom} -> ${width}px "${label}"`, () => {
    const result = computeScaleBar(lat, zoom)
    assert.ok(result)
    assert.equal(result.width, width)
    assert.equal(result.label, label)
  })
}

test('computeScaleBar: bar never exceeds maxWidth', () => {
  for (let zoom = 0; zoom <= 18; zoom += 0.5) {
    const result = computeScaleBar(54.5, zoom, 100)
    assert.ok(result)
    assert.ok(result.width <= 100, `zoom ${zoom}: width ${result.width} > 100`)
    assert.ok(result.width >= 1, `zoom ${zoom}: width ${result.width} < 1`)
  }
})

test('computeScaleBar: custom maxWidth respected', () => {
  const result = computeScaleBar(51.5, 12, 60)
  assert.ok(result)
  assert.ok(result.width <= 60)
})

test('computeScaleBar: labels are clean metric values', () => {
  for (let zoom = 3; zoom <= 18; zoom++) {
    const result = computeScaleBar(51.5, zoom)
    assert.ok(result)
    assert.match(result.label, /^\d+(\.\d+)? (m|km)$/)
  }
})

const invalid: Array<[lat: number, zoom: number, name: string]> = [
  [NaN, 12, 'NaN latitude'],
  [51.5, NaN, 'NaN zoom'],
  [51.5, Infinity, 'infinite zoom'],
  [90, 12, 'pole (zero meters per pixel)'],
  [120, 12, 'latitude out of range (negative cosine)'],
]

for (const [lat, zoom, name] of invalid) {
  test(`computeScaleBar: ${name} -> null`, () => {
    assert.equal(computeScaleBar(lat, zoom), null)
  })
}

// Tests for shared/lib/geo. Run via: pnpm test:unit
//
// Covers calculateDistance (Haversine), formatDistance, sortByDistance,
// calculateBearing, isWithinBounds. Floating-point comparisons use
// tolerances generous enough to absorb IEEE-754 noise but tight enough
// to catch unit-conversion or formula-transcription bugs.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateDistance,
  formatDistance,
  sortByDistance,
  calculateBearing,
  isWithinBounds,
} from './geo'

const closeTo = (actual: number, expected: number, tolerance: number, label: string) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ~${expected} (±${tolerance}), got ${actual}`
  )
}

test('calculateDistance: a point to itself is 0 km', () => {
  assert.equal(calculateDistance(51.5074, -0.1278, 51.5074, -0.1278), 0)
})

test('calculateDistance: London to Paris ≈ 344 km', () => {
  // Well-known great-circle distance ~343-344 km
  const d = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522)
  closeTo(d, 344, 3, 'London→Paris')
})

test('calculateDistance: symmetric (dist(A,B) === dist(B,A))', () => {
  const ab = calculateDistance(40.7128, -74.006, 34.0522, -118.2437)
  const ba = calculateDistance(34.0522, -118.2437, 40.7128, -74.006)
  assert.equal(ab, ba)
})

test('calculateDistance: antipodal points (0,0)→(0,180) ≈ half circumference', () => {
  const d = calculateDistance(0, 0, 0, 180)
  // Half circumference = π * R ≈ 20015 km
  closeTo(d, 20015, 5, 'antipodal')
})

test('formatDistance: sub-kilometre rounds to whole metres', () => {
  assert.equal(formatDistance(0.5), '500m')
  assert.equal(formatDistance(0.123), '123m')
})

test('formatDistance: 0.999 km still formats as metres (< 1 boundary)', () => {
  assert.equal(formatDistance(0.999), '999m')
})

test('formatDistance: >= 1 km formats with one decimal', () => {
  assert.equal(formatDistance(1), '1.0km')
  assert.equal(formatDistance(1.5), '1.5km')
  assert.equal(formatDistance(42.83), '42.8km')
})

test('sortByDistance: sorts ascending and attaches distance property', () => {
  const items = [
    { id: 'far',    location: { lat: 60, lng: 10 } },
    { id: 'close',  location: { lat: 51.51, lng: -0.13 } },
    { id: 'medium', location: { lat: 48.86, lng: 2.35 } },
  ]
  const sorted = sortByDistance(items, 51.5074, -0.1278)
  assert.deepEqual(sorted.map((i) => i.id), ['close', 'medium', 'far'])
  // Distance attached and monotonically non-decreasing
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i].distance >= sorted[i - 1].distance)
  }
})

test('sortByDistance: empty input returns empty array', () => {
  assert.deepEqual(sortByDistance([], 0, 0), [])
})

test('calculateBearing: due north ≈ 0°', () => {
  const b = calculateBearing(0, 0, 1, 0)
  // Bearing wraps; allow either ~0 or ~360 to be safe
  const wrapped = b > 180 ? 360 - b : b
  closeTo(wrapped, 0, 0.5, 'due north')
})

test('calculateBearing: due east ≈ 90°', () => {
  closeTo(calculateBearing(0, 0, 0, 1), 90, 0.5, 'due east')
})

test('calculateBearing: due south ≈ 180°', () => {
  closeTo(calculateBearing(1, 0, 0, 0), 180, 0.5, 'due south')
})

test('calculateBearing: due west ≈ 270°', () => {
  closeTo(calculateBearing(0, 1, 0, 0), 270, 0.5, 'due west')
})

test('calculateBearing: returns range [0, 360)', () => {
  const samples = [
    calculateBearing(51.5, -0.13, 48.86, 2.35),
    calculateBearing(0, 0, -1, -1),
    calculateBearing(89, 0, -89, 180),
  ]
  for (const b of samples) {
    assert.ok(b >= 0 && b < 360, `bearing ${b} out of [0,360)`)
  }
})

test('isWithinBounds: point inside bounding box', () => {
  const bounds = { north: 55, south: 50, east: 5, west: -5 }
  assert.equal(isWithinBounds(52, 0, bounds), true)
})

test('isWithinBounds: boundary is inclusive', () => {
  const bounds = { north: 55, south: 50, east: 5, west: -5 }
  assert.equal(isWithinBounds(55, 5, bounds), true)
  assert.equal(isWithinBounds(50, -5, bounds), true)
})

test('isWithinBounds: outside on any axis returns false', () => {
  const bounds = { north: 55, south: 50, east: 5, west: -5 }
  assert.equal(isWithinBounds(49.99, 0, bounds), false)
  assert.equal(isWithinBounds(55.01, 0, bounds), false)
  assert.equal(isWithinBounds(52, -5.01, bounds), false)
  assert.equal(isWithinBounds(52, 5.01, bounds), false)
})

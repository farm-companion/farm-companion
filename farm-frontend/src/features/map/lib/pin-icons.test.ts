import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateStatusMarkerSVG,
  generateDotMarkerSVG,
  FULL_ICON_ZOOM,
  DEFAULT_PIN,
  STATUS_COLORS,
  SELECTED_COLOR,
} from './pin-icons'

// M3b: the selected pin is the single chromatic stamp — its body is Vermilion
// (--brand), overriding the open/closed/unknown body colour. Hover stays a
// glow (handled in the shells), so only selection drives the body swap.
test('SELECTED_COLOR is the Vermilion brand token', () => {
  assert.equal(SELECTED_COLOR, '#D33A2C')
})

test('selected pin renders the Vermilion body, overriding the open state', () => {
  const svg = generateStatusMarkerSVG(DEFAULT_PIN, true, 36, true)
  assert.ok(svg.includes(`fill="${SELECTED_COLOR}"`), 'expected Vermilion body fill')
  assert.ok(!svg.includes(`fill="${STATUS_COLORS.open}"`), 'open colour must not appear')
})

test('unselected open pin keeps the Sea Ink open body', () => {
  const svg = generateStatusMarkerSVG(DEFAULT_PIN, true, 36, false)
  assert.ok(svg.includes(`fill="${STATUS_COLORS.open}"`), 'expected open body fill')
  assert.ok(!svg.includes(SELECTED_COLOR), 'Vermilion must not leak onto unselected pins')
})

test('selected param defaults to false (back-compat with 3-arg callers)', () => {
  const svg = generateStatusMarkerSVG(DEFAULT_PIN, false, 36)
  assert.ok(svg.includes(`fill="${STATUS_COLORS.closed}"`), 'expected closed body fill')
  assert.ok(!svg.includes(SELECTED_COLOR))
})

// M3 two-tier: zoomed out -> plain status dots (calm, de-cluttered), zoomed in
// -> full branded icons. The dot is painted small inside the same size-px SVG
// viewport so the tap target is unchanged (mobile-safe).
test('FULL_ICON_ZOOM is the town-level bloom threshold', () => {
  assert.equal(FULL_ICON_ZOOM, 12)
})

test('dot marker carries open state and has no category silhouette', () => {
  const svg = generateDotMarkerSVG(true, 36, false)
  assert.ok(svg.includes(`fill="${STATUS_COLORS.open}"`), 'expected open body fill')
  assert.ok(!svg.includes('<path'), 'dot has no silhouette path')
  assert.ok(svg.includes('<circle'), 'dot is a circle')
})

test('closed/unknown dots use the matching status colour', () => {
  assert.ok(generateDotMarkerSVG(false, 36).includes(`fill="${STATUS_COLORS.closed}"`))
  assert.ok(generateDotMarkerSVG(null, 36).includes(`fill="${STATUS_COLORS.unknown}"`))
})

test('selected dot is Vermilion, overriding open state', () => {
  const svg = generateDotMarkerSVG(true, 36, true)
  assert.ok(svg.includes(`fill="${SELECTED_COLOR}"`), 'expected Vermilion dot')
  assert.ok(!svg.includes(`fill="${STATUS_COLORS.open}"`))
})

test('dot keeps the full size viewport so the hit area is unchanged', () => {
  const svg = generateDotMarkerSVG(true, 36)
  assert.ok(svg.includes('width="36"') && svg.includes('height="36"'), 'viewport stays 36px')
})

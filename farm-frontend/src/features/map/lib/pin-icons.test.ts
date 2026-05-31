import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateStatusMarkerSVG,
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

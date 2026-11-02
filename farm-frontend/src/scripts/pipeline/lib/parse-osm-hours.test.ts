import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOsmHours } from './parse-osm-hours'

test('parses a weekday range', () => {
  assert.deepEqual(parseOsmHours('Mo-We 09:00-17:00'), [
    { day: 'Monday', open: '09:00', close: '17:00' },
    { day: 'Tuesday', open: '09:00', close: '17:00' },
    { day: 'Wednesday', open: '09:00', close: '17:00' },
  ])
})

test('parses a full week, the most common real value', () => {
  const out = parseOsmHours('Mo-Su 09:00-17:00')
  assert.equal(out?.length, 7)
  assert.equal(out?.[0].day, 'Monday')
  assert.equal(out?.[6].day, 'Sunday')
})

test('parses semicolon-separated rules and a comma day list', () => {
  assert.equal(parseOsmHours('Mo-Sa 09:00-17:00; Su 10:00-16:00')?.length, 7)
  assert.deepEqual(parseOsmHours('Sa,Su 10:00-16:00'), [
    { day: 'Saturday', open: '10:00', close: '16:00' },
    { day: 'Sunday', open: '10:00', close: '16:00' },
  ])
})

test('parses 24/7 as every day', () => {
  const out = parseOsmHours('24/7')
  assert.equal(out?.length, 7)
  assert.deepEqual(out?.[0], { day: 'Monday', open: '00:00', close: '23:59' })
})

test('a later rule overrides an earlier one for the same day', () => {
  const out = parseOsmHours('Mo-Su 09:00-17:00; Su 11:00-15:00')
  assert.deepEqual(out?.find((h) => h.day === 'Sunday'), {
    day: 'Sunday', open: '11:00', close: '15:00',
  })
})

// --- Rejection: unsupported syntax must yield null, never a partial parse ---
test('rejects seasonal, holiday, and open-ended syntax', () => {
  assert.equal(parseOsmHours('Apr-Sep Mo-Su 09:00-18:00'), null)
  assert.equal(parseOsmHours('Mo-Sa 09:00-17:00; PH off'), null)
  assert.equal(parseOsmHours('Mo-Fr 09:00+'), null)
  assert.equal(parseOsmHours('sunrise-sunset'), null)
  assert.equal(parseOsmHours('by appointment'), null)
})

test('rejects empty, undefined, and malformed input', () => {
  assert.equal(parseOsmHours(undefined), null)
  assert.equal(parseOsmHours(''), null)
  assert.equal(parseOsmHours('Mo-We'), null)
  assert.equal(parseOsmHours('Xx-Yy 09:00-17:00'), null)
  assert.equal(parseOsmHours('Mo 25:00-17:00'), null)
})

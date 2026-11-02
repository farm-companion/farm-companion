import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hoursStatus, mapAction, BANNED_MAP_VERBS } from './farm-page-actions'

const HOURS = [{ day: 'Mon', open: '09:00', close: '17:00' }]

// --- hours: the reader must be able to tell "closed" from "we don't know" ---
// No row in the database holds parsed opening hours, so today every farm page
// takes the unconfirmed branch. Rendering nothing leaves the reader unable to
// distinguish a shop with no hours from a page that never had them.

test('a verified farm with hours reports them', () => {
  const s = hoursStatus({ canClaim: true, hours: HOURS })
  assert.equal(s.kind, 'known')
  assert.deepEqual(s.kind === 'known' ? s.hours : null, HOURS)
})

test('an unverified farm never reports hours, even holding them', () => {
  // The claim gate governs here too: an hour range asserts the public may turn
  // up and be served. This is the existing canClaim gate on the hours block,
  // moved somewhere it can be tested.
  assert.equal(hoursStatus({ canClaim: false, hours: HOURS }).kind, 'unconfirmed')
})

test('absent, empty and malformed hours all read as unconfirmed', () => {
  for (const hours of [undefined, null, [], 'Mon 9-5', {}] as unknown[]) {
    assert.equal(hoursStatus({ canClaim: true, hours: hours as never }).kind, 'unconfirmed', String(hours))
  }
})

test('unconfirmed says so rather than rendering nothing', () => {
  const s = hoursStatus({ canClaim: true, hours: [] })
  assert.equal(s.kind, 'unconfirmed')
  assert.match(s.kind === 'unconfirmed' ? s.label : '', /not confirmed/i)
})

// --- the map link: locational, not an invitation --------------------------
// The postal address is already in plain text on the page, so withholding a
// map link protects nobody. The claim lives in the label, not the link.

test('a verified farm is invited to travel there', () => {
  const a = mapAction({ canClaim: true, lat: 51.7, lng: -4.3 })
  assert.ok(a)
  assert.equal(a.label, 'Get directions')
  assert.match(a.href, /maps\/dir/)
})

test('an unverified farm is shown where the address is, not invited', () => {
  const a = mapAction({ canClaim: false, lat: 51.7, lng: -4.3 })
  assert.ok(a)
  assert.equal(a.label, 'Show on map')
  assert.match(a.href, /maps\/search/)
  assert.doesNotMatch(a.href, /maps\/dir/)
})

test('no unverified label may carry a visitability verb', () => {
  const action = mapAction({ canClaim: false, lat: 51.7, lng: -4.3 })
  assert.ok(action)
  const { label } = action
  for (const verb of BANNED_MAP_VERBS) {
    assert.doesNotMatch(label, new RegExp(verb, 'i'), verb)
  }
})

test('a farm with no coordinates offers no map link at all', () => {
  assert.equal(mapAction({ canClaim: true, lat: null, lng: null }), null)
  assert.equal(mapAction({ canClaim: false, lat: undefined, lng: undefined }), null)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractWebsiteSignals } from './website-signals'

// Fixtures are excerpts from pages actually fetched on 2026-10-31 while
// researching the 46 Cornwall rows that carry a website.

test('a real opening-hours table is read off the page', () => {
  // boscastlefarmshop.co.uk
  const s = extractWebsiteSignals(`
    Saturday
    Sunday: 9am - 5pm
    Monday: 9am - 5pm
    Tuesday: 9am - 5pm
  `)
  assert.ok(s.hours.length >= 3, JSON.stringify(s.hours))
  assert.ok(s.hours.some((h) => /Sunday: 9am - 5pm/.test(h)))
  assert.equal(s.blocked, false)
})

test('abbreviated and 24-hour formats are read too', () => {
  const s = extractWebsiteSignals('Mon-Fri 8.30 - 17:00\nSat 9am-1pm')
  assert.ok(s.hours.length >= 2, JSON.stringify(s.hours))
})

test('days without a clock time are still captured', () => {
  const s = extractWebsiteSignals('We are open Monday to Saturday for farm gate sales.')
  assert.ok(s.hours.some((h) => /open Monday to Saturday/i.test(h)), JSON.stringify(s.hours))
})

test('retail and visit language is labelled', () => {
  const s = extractWebsiteSignals(
    'Our farm shop and cafe are open to the public. Free parking. Visit us for pick-your-own.',
  )
  for (const label of ['farm shop', 'open to the public', 'visit us', 'cafe or restaurant', 'parking', 'pick your own']) {
    assert.ok(s.positive.includes(label), `missing ${label}: ${s.positive.join(', ')}`)
  }
  assert.deepEqual(s.negative, [])
})

test('language arguing against public access is labelled', () => {
  const wholesale = extractWebsiteSignals('We supply wholesale only to the trade.')
  assert.ok(wholesale.negative.includes('wholesale only'))
  assert.equal(wholesale.blocked, false, 'a real page saying wholesale is not a blocked fetch')

  const appt = extractWebsiteSignals('Collections by appointment.')
  assert.ok(appt.negative.includes('by appointment'))
})

test('a blocked fetch is reported as blocked, never as absence of evidence', () => {
  // The three Facebook URLs in the Cornwall set all return this.
  const fb = extractWebsiteSignals('Forgotten account? Log in to Facebook to continue.')
  assert.equal(fb.blocked, true)
  assert.ok(fb.negative.includes('BLOCKED: login wall'))

  // tregullasfarm.co.uk was serving this.
  const down = extractWebsiteSignals('503 Service Temporarily Unavailable\nnginx')
  assert.equal(down.blocked, true)

  // Three Cornwall rows store a directory URL as their website. A directory's
  // page about a farm is not evidence about that farm.
  for (const page of [
    '[ukmapi.com](/) Discover Categories Countries',          // farm-fort
    '![](//edan.io/images/category/farm_shop_768_2.jpg) Farm shop',  // pentruse-farm-shop
    '[![BigBarn](https://www.bigbarn.co.uk/images/logo.png)] Discover local food', // chypraze
  ]) {
    const d = extractWebsiteSignals(page)
    assert.equal(d.blocked, true, page.slice(0, 30))
    assert.ok(d.negative.includes('BLOCKED: third-party directory'))
  }
})

test('an empty or silent page yields nothing rather than a guess', () => {
  const s = extractWebsiteSignals('')
  assert.deepEqual(s, { hours: [], positive: [], negative: [], blocked: false })
})

test('hours are deduplicated and capped', () => {
  const s = extractWebsiteSignals(Array(40).fill('Monday: 9am - 5pm').join('\n'))
  assert.equal(s.hours.length, 1)
})

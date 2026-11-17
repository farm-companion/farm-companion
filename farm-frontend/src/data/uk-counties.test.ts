import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugifyCounty } from '../lib/county-slug'
import { UK_COUNTIES, UK_COUNTY_NAMES, isCanonicalCounty } from './uk-counties'
import { COUNTY_ALIASES, canonicalCounty } from './county-aliases'

// The taxonomy is only safe if these hold. Each one, broken, is a live bug:
// an alias pointing nowhere is a 308 into a 404, and two counties sharing a
// slug is one county page silently serving the other's farms.

test('canonical list has no duplicate names', () => {
  assert.equal(UK_COUNTY_NAMES.size, UK_COUNTIES.length)
})

test('every canonical county has a distinct slug', () => {
  const bySlug = new Map<string, string>()
  for (const { name } of UK_COUNTIES) {
    const slug = slugifyCounty(name)
    assert.ok(slug.length > 0, `${name} slugifies to nothing`)
    const clash = bySlug.get(slug)
    assert.equal(clash, undefined, `${name} and ${clash} both slugify to ${slug}`)
    bySlug.set(slug, name)
  }
})

test('every alias resolves to a canonical county', () => {
  for (const [from, to] of Object.entries(COUNTY_ALIASES)) {
    assert.ok(isCanonicalCounty(to), `alias ${from} -> ${to}, which is not canonical`)
  }
})

test('no alias key is itself canonical', () => {
  // A canonical name that is also an alias key would be folded away by the
  // migration and redirected off its own page.
  for (const from of Object.keys(COUNTY_ALIASES)) {
    assert.equal(isCanonicalCounty(from), false, `${from} is both canonical and an alias`)
  }
})

test('the fold is idempotent', () => {
  for (const from of Object.keys(COUNTY_ALIASES)) {
    const once = canonicalCounty(from)
    assert.equal(canonicalCounty(once), once, `${from} folds twice`)
  }
})

test('no alias slug collides with a different canonical slug', () => {
  // An alias whose slug equals a canonical county's slug needs no redirect,
  // but it must be that same county, or the redirect would be wrong.
  const canonBySlug = new Map(UK_COUNTIES.map((c) => [slugifyCounty(c.name), c.name]))
  for (const [from, to] of Object.entries(COUNTY_ALIASES)) {
    const shadowed = canonBySlug.get(slugifyCounty(from))
    if (shadowed !== undefined) {
      assert.equal(shadowed, to, `${from} shares a slug with ${shadowed} but folds to ${to}`)
    }
  }
})

test('canonicalCounty passes through canonical names unchanged', () => {
  for (const { name } of UK_COUNTIES) {
    assert.equal(canonicalCounty(name), name)
  }
})

test('nation counts match the statutory lists', () => {
  const byNation = new Map<string, number>()
  for (const { nation } of UK_COUNTIES) byNation.set(nation, (byNation.get(nation) ?? 0) + 1)
  // England: 48 ceremonial counties + the Isles of Scilly.
  assert.equal(byNation.get('England'), 49)
  assert.equal(byNation.get('Scotland'), 32)
  assert.equal(byNation.get('Wales'), 22)
  assert.equal(byNation.get('Northern Ireland'), 11)
})

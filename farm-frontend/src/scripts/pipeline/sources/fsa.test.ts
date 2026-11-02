import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFsa, fetchFsaPage, FARM_BUSINESS_TYPE_ID, FSA_QUERIES } from './fsa'

const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/fsa-sample.json'), 'utf8'))

test('parses farm-relevant establishments with FHRSID source id', () => {
  const out = parseFsa(fixture)
  const river = out.find((c) => c.sourceId === '12345')
  assert.ok(river)
  assert.equal(river?.source, 'fsa')
  assert.equal(river?.postcode, 'TQ11 0JU')
  assert.equal(river?.county, 'South Hams')
  assert.equal(river?.latitude, 50.5008)
})

test('filters out clearly non-farm business types', () => {
  const out = parseFsa(fixture)
  assert.equal(out.find((c) => c.sourceId === '67890'), undefined)
})

test('excludes establishments with a missing business type', () => {
  const res = { establishments: [{ FHRSID: 111, BusinessName: 'No Type Co', PostCode: 'AA1 1AA' }] }
  const out = parseFsa(res as unknown as Parameters<typeof parseFsa>[0])
  assert.equal(out.length, 0)
})

test('excludes fishing vessels filed under a farm-relevant business type', () => {
  // FSA registers commercial fishing vessels under "Farmers/growers" (id 7838).
  const vessels = [
    { FHRSID: 201, BusinessName: 'Intrepid SR2', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 202, BusinessName: 'Beachy Head NN 748', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 203, BusinessName: 'FV Lady Sophie', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 204, BusinessName: 'MFV Eventide', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 205, BusinessName: 'Green Eye BD58 (Vessel)', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 206, BusinessName: 'Cari - Fishing Vessel', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 207, BusinessName: 'Argosy Fishing Limited', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 208, BusinessName: 'Good One Fishing', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
  ]
  const out = parseFsa({ establishments: vessels } as unknown as Parameters<typeof parseFsa>[0])
  assert.equal(out.length, 0)
})

test('keeps genuine farm names that are not vessels', () => {
  const farms = [
    { FHRSID: 301, BusinessName: 'Riverford Farm Shop', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 302, BusinessName: 'Hill Farm Eggs', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 303, BusinessName: 'Gilcombe Farm Dairy Raw', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
  ]
  const out = parseFsa({ establishments: farms } as unknown as Parameters<typeof parseFsa>[0])
  assert.equal(out.length, 3)
})

test('parseFsa drops retail chains mis-filed under Farmers/growers', () => {
  const res = { establishments: [
    { FHRSID: 301, BusinessName: 'Tesco Superstore', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 302, BusinessName: 'Carnagh House Off Licence & NISA', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 303, BusinessName: 'River Cottage Farm Shop', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
  ] }
  const out = parseFsa(res as unknown as Parameters<typeof parseFsa>[0])
  assert.equal(out.find((c) => c.sourceId === '301'), undefined)
  assert.equal(out.find((c) => c.sourceId === '302'), undefined)
  assert.ok(out.find((c) => c.sourceId === '303'))
})

test('fetchFsaPage filters by the farm businessTypeId (an unfiltered query is 403d)', async () => {
  let seenUrl = ''
  const fetcher = (async (url: string) => {
    seenUrl = url
    return new Response(JSON.stringify({ establishments: [] }), { status: 200 })
  }) as unknown as typeof fetch
  await fetchFsaPage(1, { fetcher, minDelayMs: 0 })
  assert.match(seenUrl, new RegExp(`businessTypeId=${FARM_BUSINESS_TYPE_ID}`))
})

// The retail-category queries, added 2026-10-31. Measured that day: 7838
// "Farmers/growers" holds 16 establishments named "farm shop" nationally, while
// the public-facing categories hold 1,143. The producer category was never
// where the farm shops were.

const est = (o: Record<string, unknown>) =>
  ({ establishments: [{ FHRSID: 1, PostCode: 'AA1 1AA', ...o }] }) as unknown as Parameters<typeof parseFsa>[0]

test('the query set reaches the public-facing categories, not only 7838', () => {
  const ids = FSA_QUERIES.map((q) => q.businessTypeId)
  assert.ok(ids.includes(FARM_BUSINESS_TYPE_ID), 'the producer category stays, for continuity')
  for (const id of [4613, 1, 7844]) {
    assert.ok(ids.includes(id), `missing businessTypeId ${id}`)
  }
  // Every broad query must be name-filtered. Unfiltered, 4613 alone is 120,983
  // records nationally and the FSA 403s the request anyway.
  for (const q of FSA_QUERIES) {
    if (q.businessTypeId !== FARM_BUSINESS_TYPE_ID) {
      assert.ok(q.name, `${q.label} has no name filter`)
    }
  }
})

test('a name-filtered query puts the name in the URL, encoded', async () => {
  let seen = ''
  const fetcher = (async (url: string) => {
    seen = url
    return { ok: true, status: 200, json: async () => ({ establishments: [] }) }
  }) as unknown as typeof fetch
  const q = FSA_QUERIES.find((x) => x.name === 'farm shop')
  assert.ok(q)
  await fetchFsaPage(1, { fetcher, minDelayMs: 0, query: q })
  assert.match(seen, new RegExp(`businessTypeId=${q!.businessTypeId}`))
  assert.match(seen, /name=farm%20shop/)
})

test('with no query it still asks for the producer category, unchanged', async () => {
  let seen = ''
  const fetcher = (async (url: string) => {
    seen = url
    return { ok: true, status: 200, json: async () => ({ establishments: [] }) }
  }) as unknown as typeof fetch
  await fetchFsaPage(1, { fetcher, minDelayMs: 0 })
  assert.match(seen, new RegExp(`businessTypeId=${FARM_BUSINESS_TYPE_ID}`))
  assert.doesNotMatch(seen, /name=/)
})

test('a broad category needs a farm name, so the high street cannot leak in', () => {
  // The whole risk of querying 4613: it holds every corner shop in the country.
  for (const name of ['Hayle Convenience Store', 'Premier Stores', 'Spar']) {
    assert.equal(parseFsa(est({ BusinessName: name, BusinessType: 'Retailers - other' })).length, 0, name)
  }
  assert.equal(parseFsa(est({ BusinessName: 'Lobbs Farm Shop', BusinessType: 'Retailers - other' })).length, 1)
})

test('a cafe or takeaway counts only when its name carries a farm signal', () => {
  // Abu Aaliyah's scope rule: if it sells food to the public on site, include
  // it. A farm shop cafe qualifies; the village pub does not.
  assert.equal(parseFsa(est({ BusinessName: 'St Kew Farmshop Cafe', BusinessType: 'Restaurant/Cafe/Canteen' })).length, 1)
  assert.equal(parseFsa(est({ BusinessName: 'The Red Lion', BusinessType: 'Restaurant/Cafe/Canteen' })).length, 0)
  assert.equal(parseFsa(est({ BusinessName: "Farmer Shaun's", BusinessType: 'Takeaway/sandwich shop' })).length, 1)
  assert.equal(parseFsa(est({ BusinessName: 'Golden Dragon', BusinessType: 'Takeaway/sandwich shop' })).length, 0)
})

test('the producer categories still pass on type alone, as before', () => {
  // No name gate here: this is existing behaviour and must not regress.
  assert.equal(parseFsa(est({ BusinessName: 'Higher Barn', BusinessType: 'Farmers/growers' })).length, 1)
  assert.equal(parseFsa(est({ BusinessName: 'Treleague Dairy', BusinessType: 'Manufacturers/packers' })).length, 1)
})

test('business type and rating date survive into the candidate', () => {
  // These two fields are what make an FSA record evidence rather than a lead:
  // the category says public-facing, the date says when it last traded.
  const out = parseFsa(est({
    BusinessName: 'Pendower Farm Shop',
    BusinessType: 'Retailers - other',
    RatingDate: '2025-07-07',
    RatingValue: '5',
  }))
  assert.equal(out.length, 1)
  const raw = out[0].raw as Record<string, unknown>
  assert.equal(raw.BusinessType, 'Retailers - other')
  assert.equal(raw.RatingDate, '2025-07-07')
})

test('an unknown business type is still refused', () => {
  assert.equal(parseFsa(est({ BusinessName: 'Farm Pharmacy', BusinessType: 'Hospitals/Childcare/Caring Premises' })).length, 0)
})

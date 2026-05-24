import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFsa, fetchFsaPage, FARM_BUSINESS_TYPE_ID } from './fsa'

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

test('fetchFsaPage filters by the farm businessTypeId (an unfiltered query is 403d)', async () => {
  let seenUrl = ''
  const fetcher = (async (url: string) => {
    seenUrl = url
    return new Response(JSON.stringify({ establishments: [] }), { status: 200 })
  }) as unknown as typeof fetch
  await fetchFsaPage(1, { fetcher, minDelayMs: 0 })
  assert.match(seenUrl, new RegExp(`businessTypeId=${FARM_BUSINESS_TYPE_ID}`))
})

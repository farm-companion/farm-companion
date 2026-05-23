import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFsa } from './fsa'

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

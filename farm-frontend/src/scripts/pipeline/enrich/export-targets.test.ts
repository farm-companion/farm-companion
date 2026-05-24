import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTargets, loadTargets, type FarmRow } from './export-targets'

function row(partial: Partial<FarmRow> = {}): FarmRow {
  return {
    id: 'f1', slug: 'darts-farm', name: 'Darts Farm', website: null, phone: null,
    city: null, county: null, postcode: null, description: null, categories: [], ...partial,
  }
}

test('a farm with a website becomes a scrape target with a populated fact sheet', () => {
  const t = buildTargets([row({ id: 'f1', website: 'https://dartsfarm.co.uk', county: 'Devon', categories: [{ category: { slug: 'farm-shops' } }, { category: { slug: 'dairy' } }] })])
  assert.equal(t.length, 1)
  assert.equal(t[0].id, 'f1') // carries the Farm primary key for the enrich update locator
  assert.equal(t[0].scrape, true)
  assert.equal(t[0].website, 'https://dartsfarm.co.uk')
  assert.equal(t[0].factSheet.county, 'Devon')
  assert.deepEqual(t[0].factSheet.categories, ['farm-shops', 'dairy'])
})

test('a farm with no website is a thin target (scrape:false)', () => {
  const t = buildTargets([row({ website: null, county: 'Highland' })])
  assert.equal(t[0].scrape, false)
  assert.equal(t[0].factSheet.county, 'Highland')
})

test('a social-media-only website is not scraped', () => {
  const t = buildTargets([row({ website: 'https://www.facebook.com/somefarm' })])
  assert.equal(t[0].scrape, false)
})

test('loadTargets queries description-less farms and honours the limit', async () => {
  const calls: any[] = []
  const prisma = {
    farm: {
      findMany: async (args: any) => { calls.push(args); return [row({ website: 'https://x.co.uk' })] },
    },
  }
  const targets = await loadTargets(prisma as any, { limit: 25 })
  assert.equal(targets.length, 1)
  assert.equal(calls[0].take, 25)
  // selects description-less rows (null or empty)
  const where = JSON.stringify(calls[0].where)
  assert.ok(where.includes('description'))
})

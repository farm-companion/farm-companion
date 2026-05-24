import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ChangeSet } from '../types'
import { applyChangeSet } from './07-load'

function mockPrisma(existingImages: { url: string }[] = []) {
  const calls: { op: string; args: unknown }[] = []
  return {
    calls,
    farm: {
      create: async (args: unknown) => { calls.push({ op: 'create', args }); return { id: 'new-id' } },
      update: async (args: unknown) => { calls.push({ op: 'update', args }); return { id: 'upd' } },
    },
    category: {
      findMany: async () => [
        { id: 'cat-farm-shops', slug: 'farm-shops' },
        { id: 'cat-organic', slug: 'organic' },
      ],
    },
    farmCategory: {
      upsert: async (args: unknown) => { calls.push({ op: 'fc-upsert', args }); return {} },
    },
    image: {
      findMany: async () => existingImages,
      create: async (args: unknown) => { calls.push({ op: 'img-create', args }); return {} },
    },
  }
}

const changeSet: ChangeSet = [
  { action: 'create', matchKey: null, slug: 'a', osmId: 'node:1', fields: [{ field: 'name', from: null, to: 'A', reason: 'create' }], provenanceNext: { name: { source: 'osm', at: 'x' } } },
  { action: 'update', matchKey: 'b', slug: 'b', targetId: 'row-b', fields: [{ field: 'address', from: 'old', to: 'new', reason: 'r' }], provenanceNext: {} },
  { action: 'noop', matchKey: 'c', slug: 'c', targetId: 'row-c', fields: [], provenanceNext: {} },
]

test('dry-run performs ZERO writes', async () => {
  const prisma = mockPrisma()
  const report = await applyChangeSet(changeSet, prisma as never, { apply: false })
  assert.equal(prisma.calls.length, 0)
  assert.equal(report.created, 1)
  assert.equal(report.updated, 1)
  assert.equal(report.noop, 1)
})

test('apply performs create+update but never touches noop rows', async () => {
  const prisma = mockPrisma()
  await applyChangeSet(changeSet, prisma as never, { apply: true })
  const ops = prisma.calls.map((c) => c.op).sort()
  assert.deepEqual(ops, ['create', 'update'])
})

test('update is located by primary-key id (targetId), not slug', async () => {
  const prisma = mockPrisma()
  await applyChangeSet(changeSet, prisma as never, { apply: true })
  const updateCall = prisma.calls.find((c) => c.op === 'update')
  assert.deepEqual((updateCall?.args as { where: unknown }).where, { id: 'row-b' })
})

test('create persists slug and osmId', async () => {
  const prisma = mockPrisma()
  await applyChangeSet(changeSet, prisma as never, { apply: true })
  const createCall = prisma.calls.find((c) => c.op === 'create')
  const data = (createCall?.args as { data: Record<string, unknown> }).data
  assert.equal(data.slug, 'a')
  assert.equal(data.osmId, 'node:1')
  assert.equal(data.name, 'A')
})

test('idempotent re-run: an all-noop change set writes nothing even with --apply', async () => {
  const prisma = mockPrisma()
  const allNoop: ChangeSet = changeSet.map((c) => ({ ...c, action: 'noop' as const, fields: [] }))
  await applyChangeSet(allNoop, prisma as never, { apply: true })
  assert.equal(prisma.calls.length, 0)
})

test('update missing targetId is recorded as an error, not a crash', async () => {
  const prisma = mockPrisma()
  const bad: ChangeSet = [{ action: 'update', matchKey: 'x', slug: 'x', fields: [{ field: 'name', from: 'a', to: 'b', reason: 'r' }], provenanceNext: {} }]
  const report = await applyChangeSet(bad, prisma as never, { apply: true })
  assert.equal(report.errors, 1)
  assert.equal(prisma.calls.length, 0)
})

test('create with no slug (unnamed candidate) is a skip, not an error', async () => {
  const prisma = mockPrisma()
  const cs: ChangeSet = [{ action: 'create', matchKey: null, fields: [{ field: 'website', from: null, to: 'https://x', reason: 'c' }], provenanceNext: {} }]
  const report = await applyChangeSet(cs, prisma as never, { apply: true })
  assert.equal(report.skipped, 1)
  assert.equal(report.errors, 0)
  assert.equal(report.created, 0)
  assert.equal(prisma.calls.filter((c) => c.op === 'create').length, 0)
})

test('apply: create links its categories (known slugs only) and counts them', async () => {
  const prisma = mockPrisma()
  const cs: ChangeSet = [{
    action: 'create', matchKey: null, slug: 'a', osmId: 'node:1',
    categories: ['farm-shops', 'organic', 'unknown-slug'],
    fields: [{ field: 'name', from: null, to: 'A', reason: 'create' }],
    provenanceNext: {},
  }]
  const report = await applyChangeSet(cs, prisma as never, { apply: true })
  const links = prisma.calls.filter((c) => c.op === 'fc-upsert')
  // farm-shops + organic resolve; unknown-slug is skipped
  assert.equal(links.length, 2)
  assert.equal(report.categoriesLinked, 2)
})

test('apply: update links categories against the existing row id (targetId)', async () => {
  const prisma = mockPrisma()
  const cs: ChangeSet = [{
    action: 'update', matchKey: 'b', slug: 'b', targetId: 'row-b',
    categories: ['farm-shops'],
    fields: [{ field: 'address', from: 'old', to: 'new', reason: 'r' }],
    provenanceNext: {},
  }]
  await applyChangeSet(cs, prisma as never, { apply: true })
  const link = prisma.calls.find((c) => c.op === 'fc-upsert')
  assert.ok(link)
  // the link must target the existing row id, and the resolved category id
  assert.deepEqual((link?.args as { where: { farmId_categoryId: unknown } }).where.farmId_categoryId, { farmId: 'row-b', categoryId: 'cat-farm-shops' })
})

test('dry-run: categories are counted but NO farmCategory.upsert calls happen', async () => {
  const prisma = mockPrisma()
  const cs: ChangeSet = [{
    action: 'create', matchKey: null, slug: 'a', categories: ['farm-shops', 'organic'],
    fields: [{ field: 'name', from: null, to: 'A', reason: 'c' }], provenanceNext: {},
  }]
  const report = await applyChangeSet(cs, prisma as never, { apply: false })
  assert.equal(prisma.calls.filter((c) => c.op === 'fc-upsert').length, 0)
  assert.equal(prisma.calls.filter((c) => c.op === 'create').length, 0)
  assert.equal(report.categoriesLinked, 2)
})

const ccImg = (url: string) => ({ url, source: 'geograph' as const, license: 'CC-BY-SA-2.0', attribution: 'Jane Doe', sourceUrl: 'https://geograph/1', score: 5 })

test('apply create: CC images are created as pending/cc/non-hero and counted', async () => {
  const prisma = mockPrisma()
  const cs: ChangeSet = [{
    action: 'create', matchKey: null, slug: 'a', osmId: 'node:1',
    images: [ccImg('https://img/1.jpg'), ccImg('https://img/2.jpg')],
    fields: [{ field: 'name', from: null, to: 'A', reason: 'c' }], provenanceNext: {},
  }]
  const report = await applyChangeSet(cs, prisma as never, { apply: true })
  const creates = prisma.calls.filter((c) => c.op === 'img-create')
  assert.equal(creates.length, 2)
  assert.equal(report.imagesAttached, 2)
  const data = (creates[0].args as { data: Record<string, unknown> }).data
  assert.equal(data.uploadedBy, 'cc')
  assert.equal(data.status, 'pending')
  assert.equal(data.isHero, false)
  assert.equal(data.source, 'geograph')
  assert.equal(data.license, 'CC-BY-SA-2.0')
  assert.equal(data.farmId, 'new-id')
})

test('apply update: only NEW image urls are created (dedupe vs existing)', async () => {
  const prisma = mockPrisma([{ url: 'https://img/1.jpg' }]) // already present
  const cs: ChangeSet = [{
    action: 'update', matchKey: 'b', slug: 'b', targetId: 'row-b',
    images: [ccImg('https://img/1.jpg'), ccImg('https://img/2.jpg')],
    fields: [{ field: 'address', from: 'old', to: 'new', reason: 'r' }], provenanceNext: {},
  }]
  const report = await applyChangeSet(cs, prisma as never, { apply: true })
  const creates = prisma.calls.filter((c) => c.op === 'img-create')
  assert.equal(creates.length, 1) // only img/2
  assert.equal((creates[0].args as { data: { url: string; farmId: string } }).data.url, 'https://img/2.jpg')
  assert.equal((creates[0].args as { data: { farmId: string } }).data.farmId, 'row-b')
  assert.equal(report.imagesAttached, 1)
})

test('dry-run: images counted but NO img-create calls', async () => {
  const prisma = mockPrisma()
  const cs: ChangeSet = [{
    action: 'create', matchKey: null, slug: 'a', images: [ccImg('https://img/1.jpg')],
    fields: [{ field: 'name', from: null, to: 'A', reason: 'c' }], provenanceNext: {},
  }]
  const report = await applyChangeSet(cs, prisma as never, { apply: false })
  assert.equal(prisma.calls.filter((c) => c.op === 'img-create').length, 0)
  assert.equal(report.imagesAttached, 1)
})

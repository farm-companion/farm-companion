import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ChangeSet } from '../types'
import { applyChangeSet } from './07-load'

function mockPrisma() {
  const calls: { op: string; args: unknown }[] = []
  return {
    calls,
    farm: {
      create: async (args: unknown) => { calls.push({ op: 'create', args }); return { id: 'new' } },
      update: async (args: unknown) => { calls.push({ op: 'update', args }); return { id: 'upd' } },
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

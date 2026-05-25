import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { buildEnrichChange, enrichOne, runEnrichContent } from './08-enrich-content'
import type { EnrichTarget } from './export-targets'
import type { ChangeSet } from '../types'

function target(partial: Partial<EnrichTarget> = {}): EnrichTarget {
  return {
    id: 'farm-1',
    slug: 'dales-farm-shop',
    name: 'Dales Farm Shop',
    website: 'https://dales.example',
    scrape: true,
    factSheet: { name: 'Dales Farm Shop', county: 'Yorkshire', categories: ['farm-shops', 'dairy'], website: 'https://dales.example' },
    ...partial,
  }
}

// Sequenced mock fetcher: extraction call first, phrasing call second.
function seqFetcher(contents: string[]) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  let i = 0
  const f = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    const content = contents[Math.min(i++, contents.length - 1)]
    return { ok: true, status: 200, headers: new Headers(), json: async () => ({ content: [{ type: 'text', text: content }] }) } as unknown as Response
  }) as unknown as typeof fetch
  return { f, calls }
}

test('buildEnrichChange produces a description-only update located by targetId with derived provenance', () => {
  const change = buildEnrichChange(target(), { slug: 'dales-farm-shop', description: 'A grounded line.', grounded: true, reason: 'validated' })
  assert.equal(change.action, 'update')
  assert.equal(change.enriched, true) // 07-load uses this to stamp lastEnrichedAt + run the never-clobber guard
  assert.equal(change.targetId, 'farm-1')
  assert.equal(change.fields.length, 1)
  assert.equal(change.fields[0].field, 'description')
  assert.equal(change.fields[0].to, 'A grounded line.')
  assert.equal(change.fields[0].reason, 'enrich:validated')
  assert.equal(change.provenanceNext.description?.source, 'derived')
})

test('buildEnrichChange encodes the validator fail code in the reason for fallbacks', () => {
  const change = buildEnrichChange(target(), { slug: 's', description: 'fb', grounded: false, reason: 'invention_marker' })
  assert.equal(change.fields[0].reason, 'enrich:fallback:invention_marker')
})

test('enrichOne skips DeepSeek for thin (non-scrape) targets and returns an honest fallback', async () => {
  const { f, calls } = seqFetcher(['unused'])
  const out = await enrichOne(target({ scrape: false }), '', { fetcher: f, apiKey: 'k' })
  assert.equal(calls.length, 0)
  assert.equal(out.grounded, false)
  assert.equal(out.reason, 'no_corpus')
  assert.ok(out.description.includes('Dales Farm Shop'))
})

test('enrichOne ships validated DeepSeek prose when it grounds in the fact sheet', async () => {
  const { f } = seqFetcher([
    '{"products":["dairy"],"facilities":[]}',
    'Dales Farm Shop is a farm shop in Yorkshire selling dairy.',
  ])
  const out = await enrichOne(target(), 'Dales Farm Shop in Yorkshire sells dairy produce.', { fetcher: f, apiKey: 'k' })
  assert.equal(out.grounded, true)
  assert.equal(out.reason, 'validated')
  assert.equal(out.description, 'Dales Farm Shop is a farm shop in Yorkshire selling dairy.')
})

test('enrichOne credits extracted facts as grounding (product not in the raw corpus)', async () => {
  const { f } = seqFetcher([
    '{"products":["asparagus"],"facilities":[]}',
    'Dales Farm Shop in Yorkshire sells asparagus.',
  ])
  // corpus does NOT contain "asparagus"; only the extracted facts do.
  const out = await enrichOne(target(), 'Dales Farm Shop is in Yorkshire.', { fetcher: f, apiKey: 'k' })
  assert.equal(out.grounded, true)
  assert.equal(out.reason, 'validated')
})

test('enrichOne derives categories from extracted facts', async () => {
  const { f } = seqFetcher([
    '{"products":["beef","cheese"],"facilities":["cafe"]}',
    'Dales Farm Shop in Yorkshire sells beef and cheese.',
  ])
  const out = await enrichOne(target(), 'Dales Farm Shop in Yorkshire sells beef and cheese with a cafe.', { fetcher: f, apiKey: 'k' })
  assert.ok(out.categories?.includes('meat-producers'))
  assert.ok(out.categories?.includes('cheese-makers'))
  assert.ok(out.categories?.includes('farm-cafes'))
})

test('enrichOne rejects invented prose and falls back to an honest line', async () => {
  const { f } = seqFetcher([
    '{"products":[],"facilities":[]}',
    'Dales Farm Shop is a family-run farm shop in Yorkshire.',
  ])
  const out = await enrichOne(target(), 'Dales Farm Shop in Yorkshire.', { fetcher: f, apiKey: 'k' })
  assert.equal(out.grounded, false)
  assert.equal(out.reason, 'invention_marker')
  assert.ok(!/family-run/i.test(out.description))
})

test('enrichOne degrades to a fallback (not a crash) on a transient DeepSeek error', async () => {
  const throwFetcher = (async () => { throw new Error('network down') }) as unknown as typeof fetch
  const out = await enrichOne(target(), 'Dales Farm Shop in Yorkshire sells dairy produce.', { fetcher: throwFetcher, apiKey: 'k' })
  assert.equal(out.grounded, false)
  assert.equal(out.reason, 'deepseek_error')
  assert.ok(out.description.includes('Dales Farm Shop'))
})

test('enrichOne rethrows a systemic DeepSeek billing/auth error (HTTP 402) so the run aborts loudly', async () => {
  const billingFetcher = (async () => ({ ok: false, status: 402, headers: new Headers(), json: async () => ({}) }) as unknown as Response) as unknown as typeof fetch
  await assert.rejects(
    enrichOne(target(), 'Dales Farm Shop in Yorkshire sells dairy produce.', { fetcher: billingFetcher, apiKey: 'k' }),
    /402/,
  )
})

test('runEnrichContent fails fast on a stale targets file (target without id)', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'enrich-'))
  try {
    // A pre-`id` targets file (Slice 2 shape): no `id`, so updates would have no locator.
    writeFileSync(resolve(dir, '_targets.json'), JSON.stringify([{ slug: 'x', name: 'X', website: null, scrape: false, factSheet: { name: 'X', categories: [] } }]))
    await assert.rejects(runEnrichContent({ dir }), /enrich:targets/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('runEnrichContent reads targets + corpus and writes a loadable changeset', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'enrich-'))
  try {
    const t = target()
    writeFileSync(resolve(dir, '_targets.json'), JSON.stringify([t]))
    writeFileSync(resolve(dir, 'dales-farm-shop.json'), JSON.stringify({ slug: t.slug, status: 'ok', markdown: 'Dales Farm Shop in Yorkshire sells dairy produce.' }))
    const { f } = seqFetcher([
      '{"products":["dairy"],"facilities":[]}',
      'Dales Farm Shop is a farm shop in Yorkshire selling dairy.',
    ])
    const changeSet = await runEnrichContent({ dir, fetcher: f, apiKey: 'k' })
    assert.equal(changeSet.length, 1)
    assert.equal(changeSet[0].targetId, 'farm-1')
    const written = JSON.parse(readFileSync(resolve(dir, '_enrich-changeset.json'), 'utf8')) as ChangeSet
    assert.equal(written.length, 1)
    assert.equal(written[0].fields[0].field, 'description')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

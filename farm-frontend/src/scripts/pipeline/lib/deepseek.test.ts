import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractFacts, phraseDescription, phraseMaxTokens } from './deepseek'
import type { FactSheet } from '../enrich/validate'

function factSheet(partial: Partial<FactSheet> = {}): FactSheet {
  return { name: 'Riverford Farm Shop', categories: ['farm-shops'], ...partial }
}

// Mock fetcher that records requests and returns a chat-completion shape.
function mockFetcher(content: string) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const f = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ choices: [{ message: { content } }] }),
    } as unknown as Response
  }) as unknown as typeof fetch
  return { f, calls }
}

function body(calls: Array<{ init: RequestInit }>): any {
  return JSON.parse(calls[0].init.body as string)
}

test('phraseDescription posts low-temperature deepseek-chat and returns the content', async () => {
  const { f, calls } = mockFetcher('Riverford Farm Shop is a farm shop in Devon.')
  const out = await phraseDescription(factSheet({ county: 'Devon' }), { products: [], facilities: [] }, { fetcher: f, apiKey: 'k' })
  assert.equal(out, 'Riverford Farm Shop is a farm shop in Devon.')
  const b = body(calls)
  assert.equal(b.model, 'deepseek-chat')
  assert.ok(b.temperature <= 0.2)
})

test('phraseDescription prompt carries fact-sheet values and banned-word hints', async () => {
  const { f, calls } = mockFetcher('ok')
  await phraseDescription(factSheet({ county: 'Devon', categories: ['farm-shops', 'dairy'] }), { products: ['cheese'], facilities: [] }, { fetcher: f, apiKey: 'k' })
  const prompt = JSON.stringify(body(calls).messages)
  assert.ok(prompt.includes('Devon'))
  assert.ok(prompt.includes('Riverford Farm Shop'))
  assert.ok(/family-run/i.test(prompt)) // banned-word hint echoed from validator
})

test('phraseDescription sends the API key as a bearer token', async () => {
  const { f, calls } = mockFetcher('ok')
  await phraseDescription(factSheet(), { products: [], facilities: [] }, { fetcher: f, apiKey: 'secret-key' })
  const auth = new Headers(calls[0].init.headers).get('authorization')
  assert.equal(auth, 'Bearer secret-key')
})

test('phraseMaxTokens scales with facts and is capped', () => {
  const thin = phraseMaxTokens(factSheet())
  const rich = phraseMaxTokens(factSheet({ city: 'A', county: 'B', postcode: 'C', website: 'd', phone: 'e', categories: ['farm-shops', 'dairy', 'fruit', 'eggs'] }))
  assert.ok(rich > thin)
  assert.ok(rich <= 512)
  assert.ok(thin >= 160)
})

test('extractFacts parses a JSON object from the content', async () => {
  const json = '{"openingHours":"Mon-Sat 9-5","phone":"01803 762059","products":["eggs","honey"],"facilities":["cafe"],"organic":true}'
  const { f } = mockFetcher(json)
  const facts = await extractFacts('some scraped text mentioning eggs and a cafe', { fetcher: f, apiKey: 'k' })
  assert.deepEqual(facts.products, ['eggs', 'honey'])
  assert.deepEqual(facts.facilities, ['cafe'])
  assert.equal(facts.phone, '01803 762059')
  assert.equal(facts.organic, true)
})

test('extractFacts tolerates ```json fenced content', async () => {
  const fenced = '```json\n{"products":["eggs"],"facilities":[]}\n```'
  const { f } = mockFetcher(fenced)
  const facts = await extractFacts('eggs for sale', { fetcher: f, apiKey: 'k' })
  assert.deepEqual(facts.products, ['eggs'])
})

test('extractFacts returns empty facts on unparseable content (no crash)', async () => {
  const { f } = mockFetcher('I could not find any structured data, sorry.')
  const facts = await extractFacts('text', { fetcher: f, apiKey: 'k' })
  assert.deepEqual(facts.products, [])
  assert.deepEqual(facts.facilities, [])
})

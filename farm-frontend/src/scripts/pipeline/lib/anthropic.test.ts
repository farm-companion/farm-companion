import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractFacts, phraseDescription } from './anthropic'
import type { FactSheet } from '../enrich/validate'

function factSheet(partial: Partial<FactSheet> = {}): FactSheet {
  return { name: 'Riverford Farm Shop', categories: ['farm-shops'], ...partial }
}

// Mock fetcher returning the Anthropic Messages API shape: { content: [{type:'text', text}] }.
function mockFetcher(text: string) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const f = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ content: [{ type: 'text', text }] }),
    } as unknown as Response
  }) as unknown as typeof fetch
  return { f, calls }
}

const body = (calls: Array<{ init: RequestInit }>): any => JSON.parse(calls[0].init.body as string)
const header = (calls: Array<{ init: RequestInit }>, name: string): string | null =>
  new Headers(calls[0].init.headers as HeadersInit).get(name)

test('phraseDescription posts to the Anthropic messages API: claude model, top-level system, user message, low temp', async () => {
  const { f, calls } = mockFetcher('Riverford Farm Shop is a farm shop in Devon.')
  const out = await phraseDescription(factSheet({ county: 'Devon' }), { products: [], facilities: [] }, { fetcher: f, apiKey: 'k' })
  assert.equal(out, 'Riverford Farm Shop is a farm shop in Devon.')
  const b = body(calls)
  assert.match(b.model, /claude/)
  assert.ok(b.temperature <= 0.2)
  assert.ok(typeof b.system === 'string' && b.system.length > 0) // system is a top-level param, not a message
  assert.equal(b.messages[0].role, 'user')
  assert.ok(b.max_tokens > 0) // required by Anthropic
  assert.equal(header(calls, 'x-api-key'), 'k')
  assert.ok(header(calls, 'anthropic-version'))
})

test('phraseDescription prompt carries fact-sheet values and a banned-word hint', async () => {
  const { f, calls } = mockFetcher('ok')
  await phraseDescription(factSheet({ county: 'Devon', categories: ['farm-shops', 'dairy'] }), { products: ['cheese'], facilities: [] }, { fetcher: f, apiKey: 'k' })
  const b = body(calls)
  const text = `${b.system}\n${b.messages[0].content}`
  assert.match(text, /Devon/)
  assert.match(text, /cheese/)
  assert.match(text, /family-run/i) // a banned hint echoed into the system prompt
})

test('extractFacts parses JSON from the Anthropic content text', async () => {
  const { f } = mockFetcher('{"products":["cheese"],"facilities":["cafe"],"organic":true}')
  const facts = await extractFacts('corpus', { fetcher: f, apiKey: 'k' })
  assert.deepEqual(facts.products, ['cheese'])
  assert.deepEqual(facts.facilities, ['cafe'])
  assert.equal(facts.organic, true)
})

test('extractFacts tolerates a fenced/preamble response and never crashes', async () => {
  const { f } = mockFetcher('here you go:\n```json\n{"products":[],"facilities":[]}\n```')
  const facts = await extractFacts('corpus', { fetcher: f, apiKey: 'k' })
  assert.deepEqual(facts.products, [])
})

test('a missing ANTHROPIC_API_KEY throws', async () => {
  const { f } = mockFetcher('x')
  const prev = process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  try {
    await assert.rejects(extractFacts('c', { fetcher: f }), /ANTHROPIC_API_KEY/)
  } finally {
    if (prev !== undefined) process.env.ANTHROPIC_API_KEY = prev
  }
})

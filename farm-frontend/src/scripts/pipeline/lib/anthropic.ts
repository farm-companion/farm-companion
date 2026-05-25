// Anthropic (Claude) client: the same PHRASING + verbatim-EXTRACTION seam as
// the DeepSeek client, swapped in behind extractFacts/phraseDescription. The
// deterministic validator (enrich/validate.ts) remains the authority over
// anything that ships. The prompts and parsers are model-agnostic and shared
// with deepseek.ts. `fetcher` is injectable for tests (see anthropic.test.ts).
//
// NOTE: Anthropic puts the system prompt in a top-level `system` param (not a
// message), requires `max_tokens`, authenticates with `x-api-key` +
// `anthropic-version`, and returns text under `content[].text`.
import { fetchWithRetry, type FetchOptions } from './http'
import {
  EXTRACTION_SYSTEM, PHRASING_SYSTEM, factBullets, parseFacts, phraseMaxTokens,
  type ExtractedFacts,
} from './deepseek'
import type { FactSheet } from '../enrich/validate'

const ENDPOINT = process.env.ANTHROPIC_ENDPOINT ?? 'https://api.anthropic.com/v1/messages'
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
const API_VERSION = '2023-06-01'

export interface AnthropicOptions extends FetchOptions {
  apiKey?: string
  endpoint?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

interface AnthropicResponse { content?: Array<{ type: string; text?: string }> }

async function chat(system: string, userContent: string, temperature: number, maxTokens: number, opts: AnthropicOptions): Promise<string> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
  const res = await fetchWithRetry<AnthropicResponse>(
    opts.endpoint ?? ENDPOINT,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: opts.model ?? MODEL,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: userContent }],
      }),
    },
    { fetcher: opts.fetcher, maxAttempts: opts.maxAttempts },
  )
  return (res.content?.find((b) => b.type === 'text')?.text ?? '').trim()
}

export async function extractFacts(corpus: string, opts: AnthropicOptions = {}): Promise<ExtractedFacts> {
  const content = await chat(EXTRACTION_SYSTEM, corpus, opts.temperature ?? 0, opts.maxTokens ?? 700, opts)
  return parseFacts(content)
}

export async function phraseDescription(fs: FactSheet, facts: ExtractedFacts, opts: AnthropicOptions = {}): Promise<string> {
  return chat(PHRASING_SYSTEM, factBullets(fs, facts), opts.temperature ?? 0.1, opts.maxTokens ?? phraseMaxTokens(fs), opts)
}

// DeepSeek client: a PHRASING + verbatim-EXTRACTION engine, never a content
// source. Two closed-world calls, both low temperature. The deterministic
// validator (enrich/validate.ts) remains the authority over anything that
// reaches the DB. `fetcher` is injectable for tests (see deepseek.test.ts).
import { fetchWithRetry, type FetchOptions } from './http'
import { BANNED_WORD_HINTS, type FactSheet } from '../enrich/validate'

const ENDPOINT = process.env.DEEPSEEK_ENDPOINT ?? 'https://api.deepseek.com/chat/completions'
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'

/** Facts surfaced from the corpus by the extraction pass. Verbatim-only. */
export interface ExtractedFacts {
  openingHours?: string | null
  phone?: string | null
  products: string[]
  facilities: string[]
  organic?: boolean
}

export interface DeepSeekOptions extends FetchOptions {
  apiKey?: string
  endpoint?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

interface ChatMessage { role: 'system' | 'user'; content: string }
interface ChatResponse { choices?: Array<{ message?: { content?: string } }> }

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function factCount(fs: FactSheet): number {
  return (fs.city ? 1 : 0) + (fs.county ? 1 : 0) + (fs.postcode ? 1 : 0) +
    (fs.website ? 1 : 0) + (fs.phone ? 1 : 0) + fs.categories.length
}

/** Fact-scaled token ceiling: thin farms get short replies, rich farms more. */
export function phraseMaxTokens(fs: FactSheet): number {
  return clamp(120 + 40 * factCount(fs), 160, 512)
}

async function chat(messages: ChatMessage[], temperature: number, maxTokens: number, opts: DeepSeekOptions): Promise<string> {
  const apiKey = opts.apiKey ?? process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set')
  const res = await fetchWithRetry<ChatResponse>(
    opts.endpoint ?? ENDPOINT,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: opts.model ?? MODEL, messages, temperature, max_tokens: maxTokens, stream: false }),
    },
    { fetcher: opts.fetcher, maxAttempts: opts.maxAttempts },
  )
  return res.choices?.[0]?.message?.content?.trim() ?? ''
}

const EXTRACTION_SYSTEM =
  'You extract facts that are stated verbatim on a farm-shop web page. ' +
  'Return ONLY a JSON object: {"openingHours":string|null,"phone":string|null,' +
  '"products":string[],"facilities":string[],"organic":boolean}. ' +
  'Include a value ONLY if it is explicitly present on the page. If absent, use null or []. ' +
  'Do not infer, summarise marketing language, or guess. No prose, JSON only.'

export async function extractFacts(corpus: string, opts: DeepSeekOptions = {}): Promise<ExtractedFacts> {
  const content = await chat(
    [{ role: 'system', content: EXTRACTION_SYSTEM }, { role: 'user', content: corpus }],
    opts.temperature ?? 0,
    opts.maxTokens ?? 700,
    opts,
  )
  return parseFacts(content)
}

function parseFacts(content: string): ExtractedFacts {
  const empty: ExtractedFacts = { products: [], facilities: [] }
  const txt = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = txt.indexOf('{')
  const end = txt.lastIndexOf('}')
  if (start < 0 || end < 0) return empty
  try {
    const o = JSON.parse(txt.slice(start, end + 1)) as Record<string, unknown>
    return {
      openingHours: typeof o.openingHours === 'string' ? o.openingHours : null,
      phone: typeof o.phone === 'string' ? o.phone : null,
      products: Array.isArray(o.products) ? o.products.filter((x): x is string => typeof x === 'string') : [],
      facilities: Array.isArray(o.facilities) ? o.facilities.filter((x): x is string => typeof x === 'string') : [],
      organic: typeof o.organic === 'boolean' ? o.organic : undefined,
    }
  } catch {
    return empty
  }
}

const PHRASING_SYSTEM =
  'You rephrase a fixed list of facts about a UK farm shop into 1-3 plain, factual sentences. ' +
  'Use ONLY the facts in the INPUT. Do NOT add history, dates, ownership, awards, opinions, ' +
  'or any place not listed. If the facts are thin, write fewer/shorter sentences - there is no minimum length. ' +
  `Do not use words like: ${BANNED_WORD_HINTS.join(', ')}. Output the description only, no preamble.`

function factBullets(fs: FactSheet, facts: ExtractedFacts): string {
  const lines = [
    `Name: ${fs.name}`,
    `Location: ${[fs.city, fs.county].filter(Boolean).join(', ') || 'unknown'}`,
    `Categories: ${fs.categories.join(', ') || 'none'}`,
    `Products: ${facts.products.join(', ') || 'none listed'}`,
    `Facilities: ${facts.facilities.join(', ') || 'none listed'}`,
    `Opening hours: ${facts.openingHours ?? 'unknown'}`,
  ]
  return `INPUT (facts only):\n${lines.join('\n')}`
}

export async function phraseDescription(fs: FactSheet, facts: ExtractedFacts, opts: DeepSeekOptions = {}): Promise<string> {
  return chat(
    [{ role: 'system', content: PHRASING_SYSTEM }, { role: 'user', content: factBullets(fs, facts) }],
    opts.temperature ?? 0.1,
    opts.maxTokens ?? phraseMaxTokens(fs),
    opts,
  )
}

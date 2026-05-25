// Stage 08 (enrich): turn a scraped corpus + DB fact sheet into a validated
// description per farm. DeepSeek PHRASES facts and EXTRACTS verbatim facts;
// the deterministic validator (validate.ts) is the authority over anything
// that ships. Rejected prose falls back to an honest, fact-only brief line.
// Thin (no usable website) targets skip DeepSeek entirely to save API cost.
// Produces a description-only ChangeSet; no DB writes happen here.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../lib/log'
import { extractFacts, phraseDescription, type AnthropicOptions } from '../lib/anthropic'
import { buildFallback, validateDescription, type GroundingContext } from './validate'
import { deriveCategories } from './derive-categories'
import type { EnrichTarget } from './export-targets'
import type { ChangeSet, FarmChange } from '../types'

/** A scrape corpus artifact (written by farm-pipeline/src/scrape_sidecar.py). */
export interface CorpusArtifact {
  slug: string
  status: 'ok' | 'empty' | 'no_website' | 'robots_blocked' | 'fetch_error'
  markdown: string
}

export interface EnrichOutcome {
  slug: string
  description: string
  grounded: boolean // true = validated model prose; false = honest fallback
  reason: string    // 'validated' | 'no_corpus' | 'deepseek_error' | a ValidationFailCode
  categories?: string[] // slugs derived from extracted facts (corpus path only)
}

export interface EnrichOptions extends AnthropicOptions {
  dir?: string
  limit?: number
  /** Cap corpus chars sent to extraction (cost guard); grounding uses the full text. */
  maxCorpusChars?: number
}

const DEFAULT_MAX_CORPUS_CHARS = 16000

/** Build the description-only update change for one target (pure). */
export function buildEnrichChange(target: EnrichTarget, outcome: EnrichOutcome): FarmChange {
  const reason = outcome.grounded ? 'enrich:validated' : `enrich:fallback:${outcome.reason}`
  return {
    action: 'update',
    matchKey: target.slug,
    slug: target.slug,
    targetId: target.id,
    enriched: true,
    ...(outcome.categories && outcome.categories.length > 0 ? { categories: outcome.categories } : {}),
    fields: [{ field: 'description', from: null, to: outcome.description, reason }],
    provenanceNext: { description: { source: 'derived', at: new Date().toISOString() } },
  }
}

/** Extract -> phrase -> validate one target. Falls back to an honest line on reject. */
export async function enrichOne(target: EnrichTarget, corpus: string, opts: EnrichOptions = {}): Promise<EnrichOutcome> {
  const text = corpus.trim()
  if (!target.scrape || !text) {
    return { slug: target.slug, description: buildFallback(target.factSheet), grounded: false, reason: 'no_corpus' }
  }
  const cap = opts.maxCorpusChars ?? DEFAULT_MAX_CORPUS_CHARS
  try {
    const facts = await extractFacts(text.slice(0, cap), opts)
    const categories = deriveCategories(target.factSheet, facts)
    const candidate = await phraseDescription(target.factSheet, facts, opts)
    // The extracted facts are verbatim-from-corpus, so credit them as grounding
    // (covers product/facility terms the model phrased from).
    const groundText = [corpus, facts.products.join(' '), facts.facilities.join(' ')].join('\n')
    const ground: GroundingContext = { corpusText: groundText, factSheet: target.factSheet }
    const verdict = validateDescription(candidate, ground)
    if (verdict.ok) return { slug: target.slug, description: candidate, grounded: true, reason: 'validated', categories }
    // Log the rejected prose so the run is auditable (why grounding failed).
    log('info', 'enrich rejected candidate', { slug: target.slug, code: verdict.code, snippet: candidate.slice(0, 120) })
    return { slug: target.slug, description: buildFallback(target.factSheet), grounded: false, reason: verdict.code, categories }
  } catch (e) {
    // Auth/billing errors are systemic (bad key, no credit), not per-farm: rethrow
    // so the run aborts loudly instead of silently degrading every farm to a
    // fallback line. Any other failure (transient network/5xx) degrades this one
    // farm to an honest fallback and lets the batch continue.
    if (e instanceof Error && /HTTP (400|401|402|403)\b/.test(e.message)) throw e
    return { slug: target.slug, description: buildFallback(target.factSheet), grounded: false, reason: 'deepseek_error' }
  }
}

/** Read a scrape corpus artifact for a slug; '' when missing, unreadable, or not ok. */
function readCorpus(dir: string, slug: string): string {
  const path = resolve(dir, `${slug}.json`)
  if (!existsSync(path)) return ''
  try {
    const art = JSON.parse(readFileSync(path, 'utf8')) as CorpusArtifact
    return art.status === 'ok' ? (art.markdown ?? '') : ''
  } catch {
    return ''
  }
}

export async function runEnrichContent(opts: EnrichOptions = {}): Promise<ChangeSet> {
  const dir = opts.dir ?? resolve(process.cwd(), '.enrichment')
  const targets = JSON.parse(readFileSync(resolve(dir, '_targets.json'), 'utf8')) as EnrichTarget[]
  const slice = opts.limit ? targets.slice(0, opts.limit) : targets

  // Fail fast (before any DeepSeek spend) on a stale targets file: without `id`,
  // every change would lack a targetId and 07-load would reject the whole batch.
  const missing = slice.find((t) => !t.id)
  if (missing) {
    throw new Error(`enrich target "${missing.slug}" has no id; re-run "pnpm enrich:targets" (this targets file predates the id field).`)
  }

  const changeSet: ChangeSet = []
  let grounded = 0
  let fallback = 0
  for (const [i, target] of slice.entries()) {
    const corpus = readCorpus(dir, target.slug)
    const outcome = await enrichOne(target, corpus, opts)
    if (outcome.grounded) grounded++
    else fallback++
    changeSet.push(buildEnrichChange(target, outcome))
    if ((i + 1) % 50 === 0) log('info', 'enrich-content progress', { done: i + 1, total: slice.length, grounded, fallback })
  }

  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '_enrich-changeset.json'), JSON.stringify(changeSet, null, 2))
  log('info', 'enrich-content complete', { total: changeSet.length, grounded, fallback })
  return changeSet
}

// CLI: `tsx src/scripts/pipeline/enrich/08-enrich-content.ts [--limit=N]`
if (import.meta.url === `file://${process.argv[1]}`) {
  void (async () => {
    const { config } = await import('dotenv')
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    config({ path: resolve(process.cwd(), '.env') })
    const limitArg = process.argv.find((a) => a.startsWith('--limit='))
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined
    await runEnrichContent({ limit })
  })()
}

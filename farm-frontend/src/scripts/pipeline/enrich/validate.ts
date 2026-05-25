// Deterministic description validator: the trust anchor for content backfill.
// DeepSeek phrases facts; THIS decides whether a candidate may ship. Pure, no
// I/O, exhaustively unit-tested. A candidate ships only if every claim grounds
// in the scraped corpus or the DB fact sheet. Invention markers fail outright.

export interface FactSheet {
  name: string
  city?: string | null
  county?: string | null
  postcode?: string | null
  categories: string[] // slugs: 'farm-shops', 'dairy', 'vegetables', ...
  website?: string | null
  phone?: string | null
}

export interface GroundingContext {
  corpusText: string // cleaned scraped markdown; '' when no website/scrape
  factSheet: FactSheet
}

export type ValidationFailCode =
  | 'empty' | 'markup' | 'name_only' | 'too_short' | 'too_long'
  | 'invention_marker' | 'ungrounded_facility' | 'ungrounded_place' | 'ungrounded_claim'

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationFailCode; detail: string }

const MIN_CHARS = 12

/**
 * Phrases that signal fabrication. Rejected even when present in the corpus:
 * a grounded factual line never needs heritage/award/superlative language, and
 * these are the exact signature of the retired marketing-prompt's hallucinations.
 */
export const INVENTION_MARKERS: ReadonlyArray<RegExp> = [
  /\bfamily[- ]run\b/i,
  /\bfamily[- ]owned\b/i,
  /\btraditional values\b/i,
  /\bgenerations?\b/i,
  /\bheritage\b/i,
  /\b(since|established|est\.?|founded)\b/i,
  /\bfor (over|more than)\b/i,
  /\baward[- ]winning\b/i,
  /\bvoted\b/i,
  /\bbest in\b/i,
  /\b(finest|premium|renowned|famous|beloved|stunning|nestled|boasts)\b/i,
  /\bpride ourselves\b/i,
  /\bpassionate\b/i,
]

/**
 * Human-readable echo of the invention markers, for the DeepSeek phrasing
 * prompt ("do not use words like ..."). The validator regexes remain the
 * authority; this only nudges the model away from rejectable output.
 */
export const BANNED_WORD_HINTS: ReadonlyArray<string> = [
  'family-run', 'family-owned', 'established', 'since', 'founded', 'heritage',
  'traditional values', 'generations', 'award-winning', 'voted', 'best in',
  'finest', 'premium', 'renowned', 'famous', 'nestled', 'passionate',
]

/** Facility/product nouns that must be grounded (corpus, or a mapped category). */
export const FACILITY_PRODUCT_NOUNS: ReadonlyArray<string> = [
  'cafe', 'cafe', 'restaurant', 'tearoom', 'butchery', 'butcher', 'bakery',
  'deli', 'delicatessen', 'nursery', 'vineyard', 'winery', 'brewery',
  'distillery', 'orchard', 'creamery', 'campsite', 'glamping', 'maze',
  'dairy', 'cheese', 'milk', 'meat', 'beef', 'lamb', 'pork', 'poultry',
  'vegetables', 'fruit', 'eggs', 'honey', 'flowers', 'wine', 'cider',
]

/** Noun -> category slug that grounds it without a corpus mention. */
const NOUN_TO_CATEGORY: Record<string, string> = {
  dairy: 'dairy', cheese: 'dairy', milk: 'dairy',
  meat: 'meat', beef: 'meat', lamb: 'meat', pork: 'meat', poultry: 'meat',
  vegetables: 'vegetables', fruit: 'fruit', eggs: 'eggs', honey: 'honey',
  flowers: 'flowers',
}

/** Generic structural/factual words (>=4 chars) that need no grounding. */
const WHITELIST: ReadonlySet<string> = new Set([
  'farm', 'shop', 'shops', 'store', 'sells', 'sell', 'selling', 'offers',
  'offer', 'offering', 'stocks', 'stocking', 'located', 'based', 'near',
  'with', 'from', 'also', 'range', 'including', 'visit', 'open', 'goods',
  'items', 'product', 'products', 'produce', 'fresh', 'local', 'area',
  'this', 'that', 'their', 'they', 'sale', 'available', 'farmshop',
  // Safe, neutral descriptors/connectives (cannot form a harmful invented claim
  // on their own; specific claims are still gated by the checks above).
  'selection', 'variety', 'seasonal', 'locally', 'sourced', 'quality',
  'alongside', 'featuring', 'options', 'choice', 'wide', 'onsite',
  'daily', 'weekly', 'plus', 'well', 'serving', 'features',
])

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
function tokens(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean)
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function factCount(fs: FactSheet, corpus: string): number {
  return (fs.city ? 1 : 0) + (fs.county ? 1 : 0) + (fs.postcode ? 1 : 0) +
    (fs.website ? 1 : 0) + (fs.phone ? 1 : 0) + fs.categories.length +
    (corpus.trim() ? 2 : 0)
}
function maxChars(fs: FactSheet, corpus: string): number {
  // Allow 1-3 real sentences; fact-rich corpus farms get more headroom.
  return clamp(120 + 80 * factCount(fs, corpus), 200, 600)
}

/** Tokens that need no grounding: whitelist + every fact-sheet value's words. */
function allowedTokens(fs: FactSheet): Set<string> {
  const out = new Set<string>(WHITELIST)
  for (const v of [fs.name, fs.city, fs.county, fs.postcode]) {
    if (v) for (const t of tokens(v)) out.add(t)
  }
  for (const slug of fs.categories) for (const t of slug.split('-')) out.add(t)
  return out
}

/** Capitalized words that are NOT sentence-initial (proxy for place names). */
function midSentenceCapitalized(candidate: string): Set<string> {
  const out = new Set<string>()
  const re = /(?<=[a-z0-9,]\s)([A-Z][a-zA-Z]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(candidate)) !== null) out.add(m[1].toLowerCase())
  return out
}

export function validateDescription(candidate: string, ground: GroundingContext): ValidationResult {
  const fs = ground.factSheet
  const corpus = normalize(ground.corpusText)
  const c = candidate.trim()

  if (!c) return { ok: false, code: 'empty', detail: 'blank' }
  if (/[<>]|\]\(|https?:\/\/|www\./i.test(candidate) || /\p{Extended_Pictographic}/u.test(candidate)) {
    return { ok: false, code: 'markup', detail: 'contains markup/link/emoji' }
  }
  if (normalize(c) === normalize(fs.name)) return { ok: false, code: 'name_only', detail: 'name only' }
  if (c.length < MIN_CHARS) return { ok: false, code: 'too_short', detail: `${c.length} chars` }
  if (c.length > maxChars(fs, ground.corpusText)) return { ok: false, code: 'too_long', detail: `${c.length} chars` }

  for (const marker of INVENTION_MARKERS) {
    if (marker.test(candidate)) return { ok: false, code: 'invention_marker', detail: marker.source }
  }
  for (const year of candidate.match(/\b(1[89]\d{2}|20\d{2})\b/g) ?? []) {
    if (!corpus.includes(year)) return { ok: false, code: 'invention_marker', detail: `year ${year}` }
  }

  const corpusTokens = new Set(tokens(corpus))
  const allowed = allowedTokens(fs)
  const lower = candidate.toLowerCase()

  for (const noun of FACILITY_PRODUCT_NOUNS) {
    if (!new RegExp(`\\b${noun}s?\\b`).test(lower)) continue
    const cat = NOUN_TO_CATEGORY[noun]
    const grounded = corpus.includes(noun) || (cat ? fs.categories.includes(cat) : false)
    if (!grounded) return { ok: false, code: 'ungrounded_facility', detail: noun }
  }

  const caps = midSentenceCapitalized(candidate)
  for (const tok of tokens(candidate)) {
    if (tok.length < 4) continue
    if (allowed.has(tok) || corpusTokens.has(tok)) continue
    if (caps.has(tok)) return { ok: false, code: 'ungrounded_place', detail: tok }
    return { ok: false, code: 'ungrounded_claim', detail: tok }
  }

  return { ok: true }
}

/** Honest brief line built ONLY from facts. Passes the validator by construction. */
export function buildFallback(fs: FactSheet): string {
  const place = fs.city || fs.county
  const products = fs.categories
    .map((s) => NOUN_TO_CATEGORY[s.replace(/s$/, '')] ? s : null)
    .filter((s): s is string => s !== null && s !== 'farm-shops')
  let line = place ? `${fs.name} is a farm shop in ${place}` : `${fs.name} is a farm shop`
  if (products.length > 0) line += `, selling ${products.join(', ')}`
  return line + '.'
}

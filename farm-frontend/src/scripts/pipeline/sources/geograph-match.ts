// Does this Geograph photo depict this business?
//
// The existing fetcher ranks candidates by metres from the farm coordinate,
// which is why Friday Street Farm Shop ended up with a photo titled "Retro
// emporium" while "Friday Street Farm Shop" sat in the same response. Distance
// says where the camera stood; it says nothing about the subject.
//
// Geograph titles are written by the photographer and are consistently
// descriptive, so the title is the signal. Measured against a hand-labelled
// set of 100 farms (src/scripts/pipeline/fixtures/geograph-gold.json): naive
// token overlap matched 40% of farms and was wrong about 60% of those,
// attaching a police station to a chip shop and a wood to a venison farm.
//
// Three things separated the true matches in that set:
//   1. Every distinctive word of the business name appears in the title.
//   2. A retail word appears, so the subject is the premises and not the
//      fields around it. "Uppergate Farm" is farmland; "Uppergate Farm Shop"
//      is a shop.
//   3. No distancing phrase sits in front of the name. "Stockleigh Pomeroy:
//      by Thorne's Farm Shop" is a photo of somewhere near Thorne's, and
//      "Liverton Farm from Salterton Road" is a view towards a field.
//
// This module is pure and does no I/O, so it is tested against the fixture
// without the network.

/**
 * Words that carry no identifying power for a UK farm business. Nearly every
 * row contains several of them, so a match on these is a match on nothing.
 */
const GENERIC_NAME_WORDS = new Set([
  'farm', 'farms', 'shop', 'shops', 'farmshop', 'the', 'and', 'at', 'of',
  'ltd', 'limited', 'co', 'company', 'produce', 'food', 'foods', 'fresh',
  'local', 'store', 'stores', 'market', 'nursery', 'nurseries', 'garden',
  'gardens', 'centre', 'center', 'butchers', 'butcher', 'dairy', 'organics',
  'organic', 'cafe', 'tea', 'rooms', 'room', 'kitchen', 'estate', 'estates',
  'house', 'hall', 'barn', 'bistro', 'deli', 'son', 'sons', 'larder',
  'venison', 'honey', 'eggs', 'meats', 'meat', 'pyo',
])

/**
 * The subject is a place of business, not the land around it. "Vineyard" and
 * "orchard" are deliberately absent: they name a field, and the held-out
 * sample proved it, matching "Ancre Hill Vineyard" to a photo of an empty
 * fenced paddock.
 */
const RETAIL_WORDS = [
  'farm shop', 'farmshop', 'farm store', 'shop', 'market', 'restaurant',
  'butcher', 'deli', 'cafe', 'café', 'tea room', 'tearoom', 'food hall',
  'foodhall', 'farmers market', "farmers' market", 'creamery', 'dairy',
  'winery', 'brewery', 'nurseries', 'nursery', 'pick your own',
]

/**
 * Things that belong to a business without being it. When the title leads
 * with one of these the photograph is of the car park, the sign or the
 * shelter, and using it as the farm's picture shows a patch of tarmac.
 *
 * Found on the held-out sample, which these cost four of fourteen matches:
 * "Car Park, at Ben's Farmshop", "Unused picnic shelter, Allington Farm
 * Shop", "High Royd farm shop sign".
 */
const APPURTENANCES = [
  'car park', 'carpark', 'parking', 'sign', 'signpost', 'nameplate',
  'picnic shelter', 'shelter', 'bus stop', 'postbox', 'post box', 'gate',
  'gateway', 'fingerpost', 'noticeboard', 'notice board', 'milestone',
  'bench', 'bin', 'layby', 'lay by', 'footpath', 'bridleway', 'driveway',
]

/**
 * Phrases that mean "this photograph is taken from, or points towards, the
 * thing named" rather than "this is the thing named". Only counted when they
 * sit in front of the business name, so "Cwmcerrig Farm Shop, near Gorslas"
 * is kept while "by Thorne's Farm Shop" is not.
 */
const DISTANCING = [
  'by', 'from', 'near', 'nr', 'towards', 'toward', 'view to', 'view of',
  'view from', 'looking', 'approach', 'approaching', 'track to', 'road to',
  'lane to', 'path to', 'footpath to', 'turning for', 'site of', 'former',
  'opposite', 'behind', 'above', 'below', 'across from', 'outskirts',
]

export interface PhotoCandidate {
  title: string
  tags?: string
}

export interface MatchResult {
  /** True when the photo is judged to depict the business. */
  depicts: boolean
  /** Why, so a reviewer can accept or reject without opening two tabs. */
  reason: string
  /** Distinctive words of the business name found in the title. */
  matchedTokens: string[]
  /** The retail word that fixed the subject as premises, if any. */
  retailWord: string | null
  /** The distancing phrase that disqualified it, if any. */
  distancedBy: string | null
  /** The appurtenance that turned out to be the real subject, if any. */
  subjectIs: string | null
}

const NO_MATCH = (reason: string): MatchResult => ({
  depicts: false,
  reason,
  matchedTokens: [],
  retailWord: null,
  distancedBy: null,
  subjectIs: null,
})

/** Geograph titles are prefixed with the grid square, as in "SO7804 : ...". */
export function stripGridPrefix(title: string): string {
  return title.replace(/^\s*[A-Z]{1,2}\d{2,4}\s*:\s*/, '').trim()
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’']/g, '') // Gibson's and Gibsons must match
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** The words of a business name that actually identify it. */
export function distinctiveTokens(businessName: string): string[] {
  return normalise(businessName)
    .split(' ')
    .filter((word) => word.length > 2 && !GENERIC_NAME_WORDS.has(word))
}

/**
 * Whole words only. Substring matching let "Trentham Shopping Village" pass
 * as a shop, which is a retail park and not this farm's shop; normalise()
 * collapses everything to single spaces, so padded containment is enough to
 * match multi-word phrases like "farm shop" while keeping the boundaries.
 */
function findRetailWord(normalisedTitle: string): string | null {
  const padded = ` ${normalisedTitle} `
  for (const word of RETAIL_WORDS) {
    if (padded.includes(` ${normalise(word)} `)) return word
  }
  return null
}

/**
 * The leading noun phrase is the subject of the photograph. Geograph titles
 * are written subject-first, so "Car Park, at Ben's Farmshop" is a car park
 * and "Ben's Farmshop" is the shop.
 */
function findAppurtenance(normalisedTitle: string): string | null {
  // Whole-word, anywhere in the title. An earlier version only looked before
  // the business name and then tried to split on a comma, which never fired:
  // normalise() has already turned punctuation into spaces, so "High Royd
  // farm shop sign, Hoylandswaine" arrives with nothing to split on.
  //
  // Looking anywhere is deliberately conservative. It costs the occasional
  // genuine photo that happens to mention a gate, and it buys precision,
  // which is the asymmetry that matters here.
  const padded = ` ${normalisedTitle} `
  for (const thing of APPURTENANCES) {
    if (padded.includes(` ${thing} `)) return thing
  }
  return null
}

/**
 * A distancing phrase only disqualifies when it comes before the name. The
 * text after the business name is usually the village, where "near" is
 * ordinary and harmless.
 */
function findDistancing(normalisedTitle: string, firstTokenAt: number): string | null {
  const before = normalisedTitle.slice(0, firstTokenAt)
  const padded = ` ${before} `
  for (const phrase of DISTANCING) {
    if (padded.includes(` ${phrase} `)) return phrase
  }
  return null
}

/**
 * Judge one candidate. Tags are used only as supporting evidence: Geograph's
 * "Farm shop" category appeared on fewer than one in twenty nearby photos in
 * the sample, so it cannot carry a match on its own, but it does satisfy the
 * retail requirement when the title's wording does not.
 */
export function matchPhoto(businessName: string, candidate: PhotoCandidate): MatchResult {
  const tokens = distinctiveTokens(businessName)
  if (tokens.length === 0) {
    // "Farm Shop" as a business name has nothing to match on. Admitting these
    // would attach any nearby farm shop, including a different business.
    return NO_MATCH('business name has no distinctive words')
  }

  const title = normalise(stripGridPrefix(candidate.title))
  const missing = tokens.filter((token) => !title.includes(token))
  if (missing.length > 0) {
    return NO_MATCH(`title is missing ${missing.join(', ')}`)
  }

  const firstTokenAt = Math.min(...tokens.map((token) => title.indexOf(token)))
  const distancedBy = findDistancing(title, firstTokenAt)
  if (distancedBy) {
    return {
      depicts: false,
      reason: `"${distancedBy}" before the name: a view towards it, not of it`,
      matchedTokens: tokens,
      retailWord: null,
      distancedBy,
      subjectIs: null,
    }
  }

  const subjectIs = findAppurtenance(title)
  if (subjectIs) {
    return {
      depicts: false,
      reason: `the subject is the ${subjectIs}, not the premises`,
      matchedTokens: tokens,
      retailWord: null,
      distancedBy: null,
      subjectIs,
    }
  }

  const hasFarmShopTag = (candidate.tags ?? '').includes('Farm shop')
  const retailWord = findRetailWord(title) ?? (hasFarmShopTag ? 'tag:Farm shop' : null)
  if (!retailWord) {
    return {
      depicts: false,
      reason: 'names the place but not a premises: likely the land, not the shop',
      matchedTokens: tokens,
      retailWord: null,
      distancedBy: null,
      subjectIs: null,
    }
  }

  return {
    depicts: true,
    reason: `title names ${tokens.join(' ')} and a ${retailWord}`,
    matchedTokens: tokens,
    retailWord,
    distancedBy: null,
    subjectIs: null,
  }
}

/** The best candidate for a farm, or null when none depicts it. */
export function bestMatch(
  businessName: string,
  candidates: readonly PhotoCandidate[]
): { candidate: PhotoCandidate; match: MatchResult } | null {
  for (const candidate of candidates) {
    const match = matchPhoto(businessName, candidate)
    if (match.depicts) return { candidate, match }
  }
  return null
}

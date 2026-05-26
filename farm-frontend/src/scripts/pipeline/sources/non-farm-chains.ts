// farm-frontend/src/scripts/pipeline/sources/non-farm-chains.ts
// Detection of national retail/supermarket chains that are NOT farm shops
// but leak into the FSA "Farmers/growers" feed and OSM shop=farm tags.
//
// PRECISE signals only. We never substring-match a chain name against a farm
// name: real farms collide ("Aldis Farm Shop", "Spalding", "Sparkle-Ness",
// "Mr Alasdair Marshall"). Instead we match whole normalized TOKENS (so
// "aldis" never equals "aldi") and known chain WEB DOMAINS (which do not
// collide the way names do). Mirrors the isVesselName() filter in fsa.ts.

// Single-word chain identifiers, normalized (lowercase, apostrophes removed).
const CHAIN_NAME_TOKENS: ReadonlySet<string> = new Set([
  'farmfoods', 'tesco', 'asda', 'sainsburys', 'aldi', 'lidl', 'iceland',
  'morrisons', 'waitrose', 'nisa', 'spar', 'costcutter', 'budgens', 'londis',
  'greggs', 'poundland', 'poundstretcher',
])

// Multi-word chain identifiers, matched as whole space-bounded phrases.
const CHAIN_NAME_PHRASES: readonly string[] = [
  'premier stores', 'heron foods', 'one stop', 'marks and spencer',
  'whole foods market', 'co op food',
]

// Registrable chain web domains, matched against the OSM website tag host.
const CHAIN_DOMAINS: readonly string[] = [
  'farmfoods.co.uk', 'tesco.com', 'asda.com', 'sainsburys.co.uk', 'aldi.co.uk',
  'lidl.co.uk', 'iceland.co.uk', 'morrisons.com', 'waitrose.com',
  'nisalocally.co.uk', 'spar.co.uk', 'costcutter.co.uk', 'premier-stores.co.uk',
  'heronfoods.com', 'budgens.co.uk', 'londis.co.uk', 'marksandspencer.com',
  'greggs.co.uk',
]

/** Lowercase, drop apostrophes, & -> "and", collapse non-alphanumerics to single spaces. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** True when a business name is a known non-farm chain (token or phrase match). */
export function isChainName(name: string | undefined): boolean {
  if (!name) return false
  const nrm = normalizeName(name)
  if (!nrm) return false
  const tokens = new Set(nrm.split(' '))
  for (const token of CHAIN_NAME_TOKENS) {
    if (tokens.has(token)) return true
  }
  const padded = ` ${nrm} `
  return CHAIN_NAME_PHRASES.some((phrase) => padded.includes(` ${phrase} `))
}

/** True when a website URL belongs to a known chain domain. */
export function isChainWebsite(url: string | undefined): boolean {
  if (!url) return false
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return false
  }
  return CHAIN_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

/** Combined reject predicate for an ingest candidate. */
export function isNonFarmChain(c: {
  name?: string
  website?: string
  tags?: Record<string, string>
}): boolean {
  if (isChainName(c.name)) return true
  if (isChainWebsite(c.website)) return true
  const t = c.tags ?? {}
  const brand = (t.brand || t.operator || '').trim()
  return brand ? isChainName(brand) : false
}

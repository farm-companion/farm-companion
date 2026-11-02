import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { slugifyCounty, deslugifyCounty } from './county-slug'

// Five county names carry punctuation, and a slug that replaces only
// whitespace leaves it in place. The sitemap then declared
// /counties/newry%2C-mourne-and-down while the route resolves its slugs
// through slugifyCounty and serves /counties/newry-mourne-and-down, so five
// counties 404'd from the sitemap and from the /counties index. The crawl of
// 1 Nov 2026 found 9 such 404s; Search Console reported 18 under "Not found".
const PUNCTUATED: ReadonlyArray<readonly [string, string]> = [
  ['Newry, Mourne and Down', 'newry-mourne-and-down'],
  ['Armagh City, Banbridge and Craigavon', 'armagh-city-banbridge-and-craigavon'],
  ['Bournemouth, Christchurch and Poole', 'bournemouth-christchurch-and-poole'],
  ['Comhairle nan Eilean Siar (Western Isles)', 'comhairle-nan-eilean-siar-western-isles'],
  ["King's Lynn and West Norfolk", 'king-s-lynn-and-west-norfolk'],
]

test('every punctuated county slugifies to the slug its route serves', () => {
  // Each right-hand value was confirmed to return 200 on the running server.
  for (const [name, slug] of PUNCTUATED) {
    assert.equal(slugifyCounty(name), slug, name)
  }
})

test('a slug survives a round trip through the URL', () => {
  // The slug must contain nothing a URL would encode, or the sitemap and the
  // route disagree again.
  for (const [name] of PUNCTUATED) {
    const slug = slugifyCounty(name)
    assert.equal(encodeURIComponent(slug), slug, name)
  }
})

test('already-hyphenated counties are unchanged', () => {
  for (const name of ['Stoke-on-Trent', 'Stockton-on-Tees', 'Newcastle-Under-Lyme']) {
    assert.equal(slugifyCounty(name), name.toLowerCase())
  }
})

test('an absent county yields no slug rather than a fake one', () => {
  // /counties/unknown-county was linked from the county index and 404s. An
  // empty slug is falsy, so a caller can drop the link instead of inventing it.
  assert.equal(slugifyCounty(''), '')
  assert.equal(slugifyCounty('   '), '')
})

test('deslugify is the display inverse for simple names', () => {
  assert.equal(deslugifyCounty('devon'), 'Devon')
  assert.equal(deslugifyCounty('west-yorkshire'), 'West Yorkshire')
})

// --- inventory lock -------------------------------------------------------
// A county URL must come from slugifyCounty. Five separate ad-hoc copies had
// drifted, which is why the sitemap and the pages disagreed.

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

/** file -> expected whitespace-only slug lines beside a /counties/ reference. */
const LOCKED: Record<string, number> = {
  // Dead: no importer. Left as-is rather than edited blind; delete on sight.
  'src/lib/schema-generators.ts': 1,
}

test('no live module builds a county URL with its own slug rule', () => {
  const AD_HOC = String.raw`replace(/\s+/g, '-')`
  const found: Record<string, number> = {}
  for (const file of walk(join(process.cwd(), 'src'))) {
    const src = readFileSync(file, 'utf8')
    if (!src.includes('/counties/')) continue
    const n = src.split('\n').filter((l) => l.includes(AD_HOC)).length
    if (n > 0) found[relative(process.cwd(), file)] = n
  }

  const added = Object.keys(found).filter((f) => !(f in LOCKED))
  assert.deepEqual(
    added,
    [],
    `County URL built with an ad-hoc slug in:\n  ${added.join('\n  ')}\n` +
      `Use slugifyCounty from @/lib/county-slug.`,
  )
  for (const [file, expected] of Object.entries(LOCKED)) {
    assert.equal(found[file] ?? 0, expected, `${file}: locked at ${expected}`)
  }
})

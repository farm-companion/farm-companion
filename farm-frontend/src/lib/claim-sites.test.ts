import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// An inventory lock, not a style rule.
//
// The claim gate lives in farm-claims.ts, but nothing stopped a new surface
// from writing "X is a farm shop in Y" without consulting it. The final review
// of spec/region-first-verified-listings found the gate installed on one door
// of eight for exactly that reason, and four of the eleven sites it had to
// enumerate by hand sat in modules with no importers.
//
// So this counts the lines that put a claim literal beside an interpolated farm
// field and pins the total per file. Adding one fails here, which forces a
// human to decide whether the new site is gated. It cannot tell gated from
// ungated by itself; that is the point. It makes the question unskippable.
//
// When you legitimately add or remove a site, update the map in the same commit
// and say in the message why the new line is safe.

const FARM_FIELD = /(farm|shop)\.(name|county|slug|town|city)/
const CLAIM = /farm ?shop/i

/** file -> expected claim-site lines. Every entry is justified. */
const LOCKED: Record<string, number> = {
  // Gated: caption and title both sit inside canClaimVisitable ternaries.
  'src/lib/enhanced-sitemap.ts': 2,
  // Gated: imageAlt on a canClaim ternary, plus the JSON-LD description whose
  // `||` fallback can only fire when canClaim is true (cleanDescription is
  // already the gated value and is never empty when unverified).
  'src/app/shop/[slug]/page.tsx': 2,
  // Gated: the directory's LocalBusiness description.
  'src/app/shop/page.tsx': 1,
  // Gated: the share sentence.
  'src/features/map/ui/FarmPreviewCard.tsx': 1,
  // Dead: no importer. Left as-is rather than edited blind; delete on sight.
  'src/scripts/generate-farm-images.ts': 1,
  'src/lib/schema-generators.ts': 1,
  'src/components/QuickActions.tsx': 1,
  // Dead: reachable only via seo-middleware.ts, which nothing imports.
  'src/lib/seo-optimizer.ts': 1,
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, out)
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function inventory(): Record<string, number> {
  const root = join(process.cwd(), 'src')
  const found: Record<string, number> = {}
  for (const file of walk(root)) {
    const key = relative(process.cwd(), file)
    let n = 0
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (FARM_FIELD.test(line) && CLAIM.test(line)) n++
    }
    if (n > 0) found[key] = n
  }
  return found
}

test('no new surface claims a farm shop without passing the gate', () => {
  const found = inventory()
  const added = Object.keys(found).filter((f) => !(f in LOCKED))
  assert.deepEqual(
    added,
    [],
    `New claim site(s) found. Gate each on canClaimVisitable from @/lib/farm-claims, ` +
      `then add it to LOCKED in this file:\n  ${added.join('\n  ')}`,
  )
  for (const [file, expected] of Object.entries(LOCKED)) {
    const actual = found[file] ?? 0
    assert.equal(
      actual,
      expected,
      `${file}: ${actual} claim site(s), locked at ${expected}. ` +
        `If this is a deliberate change, update LOCKED in the same commit.`,
    )
  }
})

test('the gate module itself states no claim', () => {
  // farm-claims.ts holds the template regex and the producer sentence. Neither
  // may interpolate a farm field beside a claim, or the gate would emit the
  // very sentence it exists to suppress.
  const src = readFileSync(join(process.cwd(), 'src/lib/farm-claims.ts'), 'utf8')
  for (const line of src.split('\n')) {
    assert.ok(
      !(FARM_FIELD.test(line) && CLAIM.test(line)),
      `farm-claims.ts must not build a claim sentence: ${line.trim()}`,
    )
  }
})

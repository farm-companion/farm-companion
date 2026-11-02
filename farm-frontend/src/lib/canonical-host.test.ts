import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// An inventory lock on the canonical host, not a style rule.
//
// The site is served from www.farmcompanion.co.uk; the apex 308-redirects to
// it. Six page files hardcoded the apex host instead of SITE_URL, so every
// county, category and best page told Google its canonical lived on a host that
// redirects away. Search Console reported 283 pages as "Alternative page with
// proper canonical" against 285 county pages: the whole county navigation layer
// excluded itself from the index through one wrong string.
//
// So this counts the lines holding the apex host and pins the total per file.
// A new one fails here, which forces a human to decide whether that line is an
// identity signal Google reads (canonical, og:url, JSON-LD url/@id/item, where
// the apex is wrong) or merely a human-facing link or a user-agent string.
const APEX = 'https://' + 'farmcompanion.co.uk'

/** file -> expected apex-host lines. Every entry is justified. */
const LOCKED: Record<string, number> = {
  // Fine: a User-Agent identifier for Nominatim, not a URL Google reads.
  'src/lib/geocoding.ts': 2,
  // Fine: links in outbound email. A human following them gets one 308.
  'src/services/email.service.ts': 2,
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

test('no page declares its identity on the apex host', () => {
  const root = join(process.cwd(), 'src')
  const found: Record<string, number> = {}
  for (const file of walk(root)) {
    const n = readFileSync(file, 'utf8').split('\n').filter((l) => l.includes(APEX)).length
    if (n > 0) found[relative(process.cwd(), file)] = n
  }

  const added = Object.keys(found).filter((f) => !(f in LOCKED))
  assert.deepEqual(
    added,
    [],
    `Apex host hardcoded in:\n  ${added.join('\n  ')}\n` +
      `Use SITE_URL from @/lib/site for anything Google reads as identity ` +
      `(canonical, og:url, JSON-LD url/@id/item). If the line is not an ` +
      `identity signal, add the file to LOCKED in this file with the reason.`,
  )
  for (const [file, expected] of Object.entries(LOCKED)) {
    const actual = found[file] ?? 0
    assert.equal(actual, expected, `${file}: ${actual} apex reference(s), locked at ${expected}.`)
  }
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { glob } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

/**
 * The root layout declares `title.template: '%s · Farm Companion'`, so Next
 * appends the brand to every child segment's `metadata.title` itself. A page
 * that also writes the brand into its own title gets it twice. Measured on
 * the dev server before this test existed:
 *
 *   /privacy              Privacy Policy | Farm Companion · Farm Companion
 *   /shop/morfa-farm-shop Morfa Farm Shop · Farm Companion · Farm Companion
 *
 * That second one is 3,504 pages, and they carry 374 of the site's 431
 * clicks, so it is the title Google shows for almost all of our traffic.
 *
 * `openGraph.title` and `twitter.title` are NOT templated, so they are
 * expected to carry the brand and this test deliberately stops reading at the
 * first of those blocks. `src/app/page.tsx` is exempt: it shares the root
 * layout's segment, where `title.default` applies and the template does not.
 */
const APP = resolve(process.cwd(), 'src/app')
const BRAND = 'Farm Companion'
const EXEMPT = new Set(['page.tsx'])

/**
 * Still doubling, fixed in the next slice. Named rather than remembered, and
 * kept failing-if-stale so the list cannot quietly rot.
 */
const KNOWN_DOUBLED_NEXT_SLICE: readonly string[] = [
  'about/page.tsx',
  'admin/documentation/layout.tsx',
  'admin/page.tsx',
  'contact/layout.tsx',
  'privacy/layout.tsx',
  'site-map/page.tsx',
  'terms/page.tsx',
]

/**
 * Every `title:` in the file that is not nested inside an openGraph or
 * twitter block.
 *
 * This walks the source tracking which object key each brace belongs to,
 * rather than reading up to the first openGraph. Taking the first title
 * missed the page that matters most: `shop/[slug]/page.tsx` opens
 * generateMetadata with `if (!shop) return { title: 'Farm shop not found' }`,
 * so the first title in the file is the one that is already correct.
 *
 * Quotes are tracked so a brace inside a string cannot shift the depth. The
 * `${` of a template literal is counted as a brace on both sides, which
 * keeps the depth balanced without interpreting the expression.
 */
function templatedTitles(source: string): string[] {
  const titles: string[] = []
  const keyAtDepth: string[] = []
  let i = 0
  let quote: string | null = null
  while (i < source.length) {
    const c = source[i]
    if (quote) {
      if (c === '\\') { i += 2; continue }
      if (c === quote) quote = null
      i += 1
      continue
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; i += 1; continue }
    if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i) + 1 || source.length; continue }
    if (c === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 2; continue }
    if (c === '{') {
      // The key this object literal is the value of, if any.
      const before = source.slice(Math.max(0, i - 40), i)
      keyAtDepth.push(before.match(/([A-Za-z_$][\w$]*)\s*:\s*$/)?.[1] ?? '')
      i += 1
      continue
    }
    if (c === '}') { keyAtDepth.pop(); i += 1; continue }
    const m = /^\btitle:\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/.exec(source.slice(i))
    if (m) {
      if (!keyAtDepth.includes('openGraph') && !keyAtDepth.includes('twitter')) titles.push(m[2])
      i += m[0].length
      continue
    }
    i += 1
  }
  return titles
}

async function doubledTitles(): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  for await (const file of glob(`${APP}/**/*.tsx`)) {
    const rel = relative(APP, file)
    if (EXEMPT.has(rel)) continue
    const branded = templatedTitles(await readFile(file, 'utf8')).find((t) => t.includes(BRAND))
    if (branded) found.set(rel, branded)
  }
  return found
}

test('no page writes the brand into a title the root template already brands', async () => {
  const doubled = await doubledTitles()
  const offenders = [...doubled]
    .filter(([f]) => !KNOWN_DOUBLED_NEXT_SLICE.includes(f))
    .map(([f, t]) => `${f}  ->  "${t} · ${BRAND}"`)
    .sort()
  assert.deepEqual(offenders, [],
    `These render the brand twice in <title>:\n  ${offenders.join('\n  ')}`)
})

test('the titles named for the next slice are still the ones that double', async () => {
  const doubled = await doubledTitles()
  const alreadyFixed = KNOWN_DOUBLED_NEXT_SLICE.filter((f) => !doubled.has(f))
  assert.deepEqual(alreadyFixed, [],
    `Fixed, so remove from KNOWN_DOUBLED_NEXT_SLICE: ${alreadyFixed.join(', ')}`)
})

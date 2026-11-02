import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * Every internal link we put in front of a reader must lead somewhere.
 *
 * `/claim` never existed as a route. It sat in the footer of every page and in
 * the site map as "Claim or update your details", and it returned 404 for as
 * long as either file has existed. The site map also offered
 * `/submission-success`, which is a post-submission page, not a destination,
 * and which returned 500 because it passes an onClick from a server
 * component. Both are leftovers from c1a6919, which deleted the farm
 * submission flow and the pages but not the links pointing at them.
 *
 * Nothing caught it because nothing checked. A 404 in a footer is on every
 * page of the site at once, so this is cheap insurance against the next
 * deletion leaving the same kind of tail.
 */
const SOURCES = [
  'src/components/Footer.tsx',
  'src/app/site-map/page.tsx',
]

const APP = resolve(process.cwd(), 'src/app')

/** `href: '/foo'` as those two files write it. Skips anchors and externals. */
function hrefsIn(source: string): string[] {
  const found = new Set<string>()
  for (const m of source.matchAll(/href:\s*'(\/[^']*)'/g)) found.add(m[1])
  for (const m of source.matchAll(/href="(\/[^"]*)"/g)) found.add(m[1])
  return [...found]
}

/**
 * A path is routable when App Router can serve it: a page, or a route handler
 * for the file-like paths (/robots.txt). Dynamic segments are out of scope
 * here because neither file links to one.
 */
function isRoutable(href: string): boolean {
  const rel = href.replace(/^\//, '').replace(/[?#].*$/, '')
  const dir = rel === '' ? APP : resolve(APP, rel)
  return ['page.tsx', 'page.ts', 'route.tsx', 'route.ts']
    .some((f) => existsSync(resolve(dir, f)))
}

test('every internal link in the footer and site map resolves to a route', async () => {
  const broken: string[] = []
  for (const file of SOURCES) {
    const source = await readFile(resolve(process.cwd(), file), 'utf8')
    for (const href of hrefsIn(source)) {
      if (!isRoutable(href)) broken.push(`${href}  (${file})`)
    }
  }
  assert.deepEqual(broken, [],
    `These links are rendered to readers and have no route behind them:\n  ${broken.join('\n  ')}`)
})

/**
 * A directory holding only a layout serves nothing: the layout's metadata,
 * including its canonical URL, is dead weight and the path 404s. `src/app/add`
 * was left in exactly that state by the same commit.
 */
test('no route directory contains a layout without a page', async () => {
  const { readdir } = await import('node:fs/promises')
  const orphans: string[] = []
  const walk = async (dir: string, rel = ''): Promise<void> => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith('_') || e.name === 'api') continue
      const here = resolve(dir, e.name)
      const files = await readdir(here)
      const hasLayout = files.some((f) => /^layout\.tsx?$/.test(f))
      const hasPage = files.some((f) => /^(page|route)\.tsx?$/.test(f))
      const hasChildPage = files.some((f) => f.startsWith('['))
      if (hasLayout && !hasPage && !hasChildPage) orphans.push(`${rel}/${e.name}`)
      await walk(here, `${rel}/${e.name}`)
    }
  }
  await walk(APP)
  assert.deepEqual(orphans, [],
    `These route directories have a layout but nothing to render:\n  ${orphans.join('\n  ')}`)
})

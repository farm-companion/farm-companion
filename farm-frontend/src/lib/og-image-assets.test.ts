/**
 * Every local image this site hands to a social crawler must actually be an image.
 *
 * Written because `public/og-farm-shops.jpg` was a saved Next.js HTML page with a
 * `.jpg` extension, declared as the og:image for `/shop`. Crawlers fetched it,
 * failed to decode it, and rendered no card at all. Nothing caught that for nine
 * months, because nothing ever opened the file.
 *
 * Two tiers:
 *   every referenced public image  -> must decode, and must stay under the 5 MB
 *                                     ceiling the major crawlers enforce
 *   those used as a social card    -> must also be close to 1.91:1
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import sharp from 'sharp'

const SRC = join(process.cwd(), 'src')
const PUBLIC = join(process.cwd(), 'public')

const MAX_BYTES = 5 * 1024 * 1024
const CARD_RATIO = 1200 / 630
const RATIO_TOLERANCE = 0.08

// A card reference is one inside an openGraph or twitter metadata block, not
// merely any line with `images:` on it. The first version of this test matched
// the latter and flagged five page hero images, which are not social cards.
const CARD_BLOCK = /openGraph|twitter\s*:|og:image/i
const CARD_BLOCK_WINDOW = 12

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      out.push(...sourceFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      out.push(full)
    }
  }
  return out
}

interface Reference {
  asset: string
  file: string
  isCard: boolean
}

/** Collect `/something.jpg` literals that resolve to a file in public/. */
function collectReferences(): Reference[] {
  const found = new Map<string, Reference>()
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, index) => {
      // Is this line inside an openGraph / twitter metadata block?
      const window = lines.slice(Math.max(0, index - CARD_BLOCK_WINDOW), index + 1).join('\n')
      const isCard = CARD_BLOCK.test(window)
      for (const match of line.matchAll(/['"`/]((?:[\w-]+\/)*[\w-]+\.(?:jpg|jpeg|png|webp|gif|avif))/gi)) {
        const asset = match[1]
        if (!existsSync(join(PUBLIC, asset))) continue
        const prior = found.get(asset)
        found.set(asset, {
          asset,
          file: prior?.file ?? file,
          isCard: (prior?.isCard ?? false) || isCard,
        })
      }
    })
  }
  return [...found.values()]
}

const references = collectReferences()

test('the scan finds referenced public images at all', () => {
  assert.ok(
    references.length > 0,
    'no referenced public images found, so the rest of this file is vacuously passing'
  )
})

test('every referenced public image decodes as a real image', async () => {
  const broken: string[] = []
  for (const ref of references) {
    const path = join(PUBLIC, ref.asset)
    try {
      const meta = await sharp(path).metadata()
      if (!meta.width || !meta.height) broken.push(`${ref.asset}: no dimensions`)
    } catch {
      const head = readFileSync(path).subarray(0, 32).toString('utf8').trim().slice(0, 24)
      broken.push(`${ref.asset}: not decodable (starts "${head}"), referenced from ${ref.file}`)
    }
  }
  assert.deepEqual(broken, [], `undecodable images:\n${broken.join('\n')}`)
})

test('no referenced image exceeds the 5 MB crawler ceiling', () => {
  const heavy = references
    .map((ref) => ({ ref, bytes: statSync(join(PUBLIC, ref.asset)).size }))
    .filter(({ bytes }) => bytes > MAX_BYTES)
    .map(({ ref, bytes }) => `${ref.asset}: ${(bytes / 1024 / 1024).toFixed(1)} MB`)
  assert.deepEqual(heavy, [], `over the ceiling:\n${heavy.join('\n')}`)
})

/**
 * Static cards that are the wrong shape. Empty, and it should stay empty: every
 * page now points at the dynamic `/og` route, which always emits exactly
 * 1200x630. Five entries lived here briefly (about, counties, add, feedback,
 * seasonal-header), each a real defect a crawler letterboxed or centre-cropped.
 *
 * This list may shrink, never grow. A new wrong-shaped card fails immediately,
 * and so does leaving a fixed one in the list.
 */
const KNOWN_WRONG_ASPECT = new Set<string>([])

test('no NEW social card is the wrong shape, and the known list is shrinking', async () => {
  const wrong: string[] = []
  const seen = new Set<string>()
  for (const ref of references.filter((r) => r.isCard)) {
    const meta = await sharp(join(PUBLIC, ref.asset)).metadata()
    if (!meta.width || !meta.height) continue
    const ratio = meta.width / meta.height
    if (Math.abs(ratio - CARD_RATIO) > RATIO_TOLERANCE) {
      seen.add(ref.asset)
      if (!KNOWN_WRONG_ASPECT.has(ref.asset)) {
        wrong.push(`${ref.asset}: ${meta.width}x${meta.height} is ${ratio.toFixed(2)}:1`)
      }
    }
  }
  assert.deepEqual(wrong, [], `new social card with the wrong aspect:\n${wrong.join('\n')}`)

  const fixed = [...KNOWN_WRONG_ASPECT].filter((asset) => !seen.has(asset))
  assert.deepEqual(
    fixed,
    [],
    `these are fixed now, so remove them from KNOWN_WRONG_ASPECT: ${fixed.join(', ')}`
  )
})

test('image extensions match their actual encoded format', async () => {
  const mismatched: string[] = []
  for (const ref of references) {
    const meta = await sharp(join(PUBLIC, ref.asset)).metadata()
    const ext = extname(ref.asset).toLowerCase().replace('.', '')
    const expected = ext === 'jpg' ? 'jpeg' : ext
    if (meta.format && meta.format !== expected) {
      mismatched.push(`${ref.asset}: encoded as ${meta.format}`)
    }
  }
  assert.deepEqual(mismatched, [], `extension lies about the format:\n${mismatched.join('\n')}`)
})

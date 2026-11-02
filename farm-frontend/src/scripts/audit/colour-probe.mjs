// farm-frontend/src/scripts/audit/colour-probe.mjs
// Read-only. Record the computed colour of every element carrying one of the
// semantic colour classes, so a before/after diff shows whether a stylesheet
// change moved a colour that was already working.
//
// This exists because the colour classes were hand-written and unlayered for
// six months. Unlayered CSS beats every cascade layer, so those rules were
// silently masking whatever else wanted the same property. Generating them
// from @theme instead removes the mask, and the only way to know what the
// mask was hiding is to measure both sides.
//
// It caught exactly that: `text-text-heading dark:text-white` on /shop turned
// white-on-cream, which traced to Tailwind v4's `dark:` defaulting to the
// prefers-color-scheme media query while this site sets the theme with a
// class. Hover and focus variants cannot be measured this way; class-rules.ts
// covers whether those generate a rule at all.
//
//   node src/scripts/audit/colour-probe.mjs .audit/colour-before.json
//   node src/scripts/audit/colour-probe.mjs .audit/colour-after.json
//   node -e "..."  # diff the two by (route, cls, i, tag)
//
// CHROME_PATH picks the browser; BASE_URL the origin (default :3001).
import puppeteer from 'puppeteer'
import { writeFileSync } from 'node:fs'

const OUT = process.argv[2]
if (!OUT) {
  console.error('usage: node src/scripts/audit/colour-probe.mjs <out.json>')
  process.exit(1)
}
const BASE = process.env.BASE_URL || 'http://localhost:3001'
const ROUTES = ['/', '/shop', '/shop/morfa-farm-shop', '/counties', '/counties/devon', '/seasonal', '/best']

/** The classes worth watching: every one names a theme token, not a literal. */
const CLASSES = [
  'bg-paper', 'bg-ink', 'bg-brand', 'bg-accent', 'bg-surface', 'bg-surface-2',
  'bg-card', 'bg-background', 'bg-border',
  'text-paper', 'text-ink', 'text-ink-muted', 'text-ink-subtle', 'text-brand',
  'text-accent', 'text-foreground',
  'text-text-heading', 'text-text-body', 'text-text-muted',
  'border-border', 'border-ink', 'border-brand', 'border-accent',
]

// Four elements per class per route is enough to catch a moved colour without
// turning the output into a page dump.
const PER_CLASS = 4

const collect = (classes) => `(() => {
  const out = []
  for (const cls of ${JSON.stringify(classes)}) {
    const els = Array.from(document.querySelectorAll('.' + CSS.escape(cls)))
    for (const [i, el] of els.slice(0, ${PER_CLASS}).entries()) {
      const cs = getComputedStyle(el)
      out.push({
        cls, i, tag: el.tagName.toLowerCase(),
        color: cs.color,
        background: cs.backgroundColor,
        borderTop: cs.borderTopColor,
      })
    }
  }
  return out
})()`

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
})
const rows = []
for (const route of ROUTES) {
  const page = await browser.newPage()
  // Without this the cookie dialog sits over the page and every measurement
  // is taken through it.
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('fc_consent', 'denied') } catch { /* private mode */ }
  })
  await page.setViewport({ width: 1280, height: 800 })
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60_000 })
    for (const f of await page.evaluate(collect(CLASSES))) rows.push({ route, ...f })
  } catch (e) {
    rows.push({ route, error: String(e.message).slice(0, 120) })
  }
  await page.close()
}
await browser.close()

// Sorted so the two files diff cleanly whatever order the routes finished in.
rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
writeFileSync(OUT, JSON.stringify(rows, null, 1))
console.log(`${rows.length} measurements -> ${OUT}`)

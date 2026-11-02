// Computed-style audit and visual baseline.
//
// Written because the 375x812 pass that preceded it measured positions and
// tap-target sizes and never measured a font size, which is how a farm's
// phone number shipped at 10.5px and was reported as meeting the floor.
//
//   node src/scripts/audit/style-audit.mjs --out .audit/before
//   node src/scripts/audit/style-audit.mjs --out .audit/after --compare .audit/before
// Puppeteer rather than Playwright: both are dependencies, but Playwright's
// browser binary is not downloaded and installing one is not this script's
// decision to make. Puppeteer's Chrome is already cached.
import puppeteer from 'puppeteer'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'
const args = process.argv.slice(2)
const argOf = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const OUT = argOf('--out', '.audit/run')
const COMPARE = argOf('--compare', null)

const ROUTES = [
  '/', '/map', '/shop', '/shop/morfa-farm-shop',
  '/counties', '/counties/devon', '/seasonal', '/best',
]
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
]

// PRODUCT.md: "Body text holds at least 4.5:1 contrast, interactive targets at
// least 48px". The type floor is the one nobody was checking.
const MIN_TEXT_PX = 16
const MIN_TARGET_PX = 48

const collect = `() => {
  const vis = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'
  }
  const label = (el) => (el.innerText || el.getAttribute('aria-label') || '')
    .trim().replace(/\\s+/g, ' ').slice(0, 40)

  const text = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!node.nodeValue || !node.nodeValue.trim()) continue
    const el = node.parentElement
    if (!el || seen.has(el) || !vis(el)) continue
    seen.add(el)
    const cs = getComputedStyle(el)
    text.push({
      tag: el.tagName.toLowerCase(),
      px: Math.round(parseFloat(cs.fontSize) * 100) / 100,
      weight: cs.fontWeight,
      sample: node.nodeValue.trim().replace(/\\s+/g, ' ').slice(0, 40),
    })
  }

  const targets = []
  for (const el of document.querySelectorAll('a, button, input, select, textarea, [role="button"]')) {
    if (!vis(el)) continue
    const r = el.getBoundingClientRect()
    targets.push({
      tag: el.tagName.toLowerCase(),
      label: label(el),
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top + window.scrollY),
    })
  }

  return {
    root: getComputedStyle(document.documentElement).fontSize,
    docHeight: document.body.scrollHeight,
    text,
    targets,
  }
}`

// The cached Chrome build and puppeteer's expected version drift apart, and
// re-downloading a browser is not this script's call. CHROME_PATH points at
// whatever is already on the machine; without it, puppeteer's own resolution
// is used and the error tells the operator what to do.
const browser = await puppeteer.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
})
const report = { base: BASE, at: new Date().toISOString(), routes: {} }

for (const vp of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: vp.width, height: vp.height })
  // Without this the consent banner covers every page, and its own text and
  // buttons land in the measurements while the page behind it is inert.
  // 'denied' rather than 'granted': the audit has no business opting a
  // browser into analytics.
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('fc_consent', 'denied') } catch {}
  })
  for (const route of ROUTES) {
    const key = `${route} @${vp.name}`
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 45000 })
    } catch {
      try { await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 }) } catch {}
    }
    await new Promise((r) => setTimeout(r, 1200))
    const data = await page.evaluate(`(${collect})()`)
    const shotDir = join(OUT, 'shots')
    mkdirSync(shotDir, { recursive: true })
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')
    await page.screenshot({ path: join(shotDir, `${slug}.${vp.name}.png`), fullPage: false })

    const small = data.text.filter((t) => t.px < MIN_TEXT_PX)
    const tiny = data.targets.filter((t) => t.h < MIN_TARGET_PX || t.w < MIN_TARGET_PX)
    report.routes[key] = {
      root: data.root,
      docHeight: data.docHeight,
      textNodes: data.text.length,
      belowTextFloor: small.length,
      smallestText: data.text.length ? Math.min(...data.text.map((t) => t.px)) : null,
      targets: data.targets.length,
      belowTargetFloor: tiny.length,
      worstTargets: tiny.sort((a, b) => a.h * a.w - b.h * b.w).slice(0, 5)
        .map((t) => `${t.label || t.tag} ${t.w}x${t.h}`),
    }
    console.log(`${key.padEnd(34)} root=${data.root.padEnd(6)} text<${MIN_TEXT_PX}px: ${String(small.length).padStart(4)}/${String(data.text.length).padStart(4)}  targets<${MIN_TARGET_PX}: ${String(tiny.length).padStart(3)}/${String(data.targets.length).padStart(3)}`)
  }
  await page.close()
}

await browser.close()
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2))
console.log(`\nwritten ${join(OUT, 'report.json')}`)

if (COMPARE && existsSync(join(COMPARE, 'report.json'))) {
  const before = JSON.parse(readFileSync(join(COMPARE, 'report.json'), 'utf8'))
  console.log('\nchange against ' + COMPARE)
  for (const key of Object.keys(report.routes)) {
    const b = before.routes[key], a = report.routes[key]
    if (!b) continue
    const d = (x, y) => (y - x === 0 ? '   =' : (y - x > 0 ? '+' : '') + (y - x))
    console.log(`${key.padEnd(34)} smallText ${b.smallestText}->${a.smallestText}  below16 ${d(b.belowTextFloor, a.belowTextFloor)}  below48 ${d(b.belowTargetFloor, a.belowTargetFloor)}  height ${d(b.docHeight, a.docHeight)}`)
  }
}

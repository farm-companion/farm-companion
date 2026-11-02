// farm-frontend/src/scripts/enrich-verification-signals.ts
// Read fetched website text and fill the evidence columns of a verification
// CSV, so a person reviews findings instead of doing the research.
//
// Fetching is a shell step rather than code here, because the tooling that gets
// past a blocked site is machine-level, not a repo dependency. From the repo
// root, for each row with a website:
//
//   scrapling extract get "<url>" pages/sites/<slug>.md --impersonate chrome --ai-targeted
//   # if that is empty or blocked:
//   scrapling extract fetch "<url>" pages/sites/<slug>.md --ai-targeted
//
// A farm shop's own site states its opening hours and its "come and visit"
// language. That is evidence edge E5, which the spec recorded as needing a
// Google Maps API key and billing. It needs neither.
//
//   pnpm tsx src/scripts/enrich-verification-signals.ts ../docs/verification/cornwall.csv --pages <dir>
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { extractWebsiteSignals } from '@/lib/website-signals'
import { parseCsvRecords, toCsv } from '@/lib/csv'

const EVIDENCE_COLUMNS = ['site_status', 'site_hours', 'site_signals']

/** Every page fetched for one slug: its homepage plus any subpages. */
function pagesFor(dir: string, slug: string): string[] {
  const texts: string[] = []
  for (const sub of ['sites', 'subpages']) {
    const d = join(dir, sub)
    if (!existsSync(d)) continue
    for (const name of readdirSync(d)) {
      if (name === `${slug}.md` || name.startsWith(`${slug}__`)) {
        texts.push(readFileSync(join(d, name), 'utf8'))
      }
    }
  }
  return texts
}

function main(): void {
  const args = process.argv.slice(2)
  const csvPath = args.find((a) => !a.startsWith('--'))
  const pagesIdx = args.indexOf('--pages')
  const pagesDir = pagesIdx >= 0 ? args[pagesIdx + 1] : undefined
  if (!csvPath || !pagesDir) {
    console.error('Usage: tsx src/scripts/enrich-verification-signals.ts <verification.csv> --pages <dir>')
    process.exit(1)
  }

  const file = resolve(csvPath)
  const records = parseCsvRecords(readFileSync(file, 'utf8'))
  if (records.length === 0) {
    console.error('empty CSV')
    process.exit(1)
  }

  // Never overwrite a human's work. Evidence columns are ours; the decision
  // columns are theirs, and once they have started this file is the audit trail.
  const signed = records.filter((r) => r.verified || r.verified_by)
  if (signed.length > 0) {
    console.error(`REFUSING: ${signed.length} row(s) already carry a human decision.`)
    console.error('Enrich before the human pass, not during it.')
    process.exit(1)
  }

  let withPages = 0
  let blocked = 0
  let withHours = 0
  for (const r of records) {
    const texts = pagesFor(resolve(pagesDir), r.slug)
    if (texts.length === 0) {
      r.site_status = r.website ? 'not fetched' : 'no website'
      r.site_hours = ''
      r.site_signals = ''
      continue
    }
    withPages++
    const s = extractWebsiteSignals(texts.join('\n'))
    if (s.blocked) blocked++
    if (s.hours.length > 0 && !s.blocked) withHours++
    r.site_status = s.blocked ? s.negative.find((n) => n.startsWith('BLOCKED:')) ?? 'blocked' : 'fetched'
    r.site_hours = s.blocked ? '' : s.hours.join(' | ')
    r.site_signals = [...s.positive, ...s.negative.filter((n) => !n.startsWith('BLOCKED:'))].join(', ')
  }

  const columns = [...Object.keys(records[0]).filter((c) => !EVIDENCE_COLUMNS.includes(c))]
  // Evidence sits immediately before the human's columns, so the reviewer reads
  // the finding and then signs on the same screen.
  const at = columns.indexOf('venue_type')
  columns.splice(at < 0 ? columns.length : at, 0, ...EVIDENCE_COLUMNS)
  writeFileSync(file, toCsv(columns, records))

  console.log(`${records.length} rows; ${withPages} had fetched pages.`)
  console.log(`  ${withHours} have opening hours quoted from their own site`)
  console.log(`  ${blocked} blocked (login wall, server error or a scraper URL): needs a call`)
  console.log(`  ${records.length - withPages} had no page fetched`)
  console.log(`\n-> ${file}`)
}

if (/enrich-verification-signals\.ts$/.test(process.argv[1] ?? '')) {
  main()
}

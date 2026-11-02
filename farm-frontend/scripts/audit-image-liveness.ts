#!/usr/bin/env tsx
/**
 * Liveness sweep over the image rows: does the URL on each row still serve
 * an image, and is it big enough to be worth showing?
 *
 * This exists because link rot was found by hand rather than reported. 86
 * approved hero rows pointed at a generation CDN that had evicted the files,
 * and they served 404s on production for months with nothing watching. A row
 * is only as good as the bytes at the end of its URL, and nothing in the
 * schema records whether those bytes are still there.
 *
 * Fair use: the pending population is ~11.7k rows hot-linked to
 * geograph.org.uk, a free community service. Sweeping all of it in one run
 * would be abusive, so --status=pending and --status=all require --i-mean-it
 * and are rate limited. Default scope is 'approved', which is our own
 * storage plus whatever third-party hosts have leaked into it, and is the
 * population that actually faces users.
 *
 * Usage:
 *   npx tsx scripts/audit-image-liveness.ts                      # approved rows
 *   npx tsx scripts/audit-image-liveness.ts --dimensions         # also decode
 *   npx tsx scripts/audit-image-liveness.ts --status=pending --sample=40 --i-mean-it
 *   npx tsx scripts/audit-image-liveness.ts --json=/tmp/sweep.json
 *
 * Exit code 1 when any approved row fails, so this can gate a deploy.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFile } from 'fs/promises'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import { isOwnImageHost } from '../src/lib/image-host'

const prisma = new PrismaClient()

/** Below this many bytes a response is a placeholder or an error page, not a photo. */
const MIN_BYTES = 2_000

/**
 * A hero needs to fill a wide banner. Geograph's _120x120 thumbnails sit far
 * under this, which is why the pending queue cannot be approved as it stands.
 */
const MIN_HERO_EDGE = 600

const DEFAULT_CONCURRENCY = 8

type Status = 'approved' | 'pending' | 'all'

interface Row {
  id: string
  url: string
  status: string
  uploadedBy: string
  isHero: boolean
  farmSlug: string
}

interface Probe {
  row: Row
  httpStatus: number | null
  contentType: string | null
  bytes: number | null
  width: number | null
  height: number | null
  error: string | null
}

function flag(name: string, fallback: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`))
  return found ? found.split('=').slice(1).join('=') : fallback
}

function host(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return '(unparseable)'
  }
}

/**
 * A 404 is decisive; a 5xx or a socket error is usually the object store
 * having a moment. Retrying only the latter matters because this sweep is
 * meant to gate a deploy, and a gate that fires on a transient blip gets
 * ignored. Measured: a clean 1018-row run produced 2 spurious 504s, both of
 * which answered 200 on the next request.
 */
const RETRY_ATTEMPTS = 3
const RETRY_PAUSE_MS = 1_500

function isTransient(p: Probe): boolean {
  if (p.error) return true
  return p.httpStatus !== null && p.httpStatus >= 500
}

/**
 * HEAD first because it costs the host almost nothing. Some CDNs answer HEAD
 * with 405 while serving GET fine, so fall back to a ranged GET rather than
 * recording a false failure.
 */
async function probeOnce(row: Row, wantDimensions: boolean): Promise<Probe> {
  const base: Probe = {
    row,
    httpStatus: null,
    contentType: null,
    bytes: null,
    width: null,
    height: null,
    error: null,
  }

  try {
    const head = await fetch(row.url, { method: 'HEAD', redirect: 'follow' })
    base.httpStatus = head.status
    base.contentType = head.headers.get('content-type')
    const len = head.headers.get('content-length')
    if (len) base.bytes = Number(len)

    const headUnsupported = head.status === 405 || head.status === 501
    const needBody = wantDimensions || base.bytes === null || headUnsupported
    if (!head.ok && !headUnsupported) return base
    if (!needBody) return base

    const get = await fetch(row.url, { redirect: 'follow' })
    base.httpStatus = get.status
    base.contentType = get.headers.get('content-type')
    if (!get.ok) return base

    const buffer = Buffer.from(await get.arrayBuffer())
    base.bytes = buffer.byteLength

    if (wantDimensions) {
      const meta = await sharp(buffer).metadata()
      base.width = meta.width ?? null
      base.height = meta.height ?? null
    }
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err)
  }

  return base
}

/** Probe with retries, so only a repeatable failure counts as a failure. */
async function probe(row: Row, wantDimensions: boolean): Promise<Probe> {
  let last = await probeOnce(row, wantDimensions)
  for (let attempt = 2; attempt <= RETRY_ATTEMPTS && isTransient(last); attempt += 1) {
    await new Promise((r) => setTimeout(r, RETRY_PAUSE_MS))
    last = await probeOnce(row, wantDimensions)
  }
  return last
}

/** Bounded worker pool. Keeps a slow host from serialising the whole sweep. */
async function sweep(
  rows: Row[],
  wantDimensions: boolean,
  concurrency: number,
  pauseMs: number
): Promise<Probe[]> {
  const results: Probe[] = []
  let next = 0
  let done = 0

  async function worker(): Promise<void> {
    while (next < rows.length) {
      const index = next++
      results.push(await probe(rows[index], wantDimensions))
      done += 1
      if (done % 50 === 0) console.log(`  ... ${done}/${rows.length}`)
      if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, rows.length) }, () => worker())
  )
  return results
}

function verdict(p: Probe): 'ok' | 'dead' | 'too-small' | 'not-image' | 'error' {
  if (p.error) return 'error'
  if (p.httpStatus === null || p.httpStatus >= 400) return 'dead'
  if (p.contentType && !p.contentType.startsWith('image/')) return 'not-image'
  if (p.bytes !== null && p.bytes < MIN_BYTES) return 'too-small'
  return 'ok'
}

async function main() {
  const status = flag('status', 'approved') as Status
  const sample = Number(flag('sample', '0'))
  const wantDimensions = process.argv.includes('--dimensions')
  const concurrency = Number(flag('concurrency', String(DEFAULT_CONCURRENCY)))
  const jsonPath = flag('json', '')

  if (status !== 'approved' && !process.argv.includes('--i-mean-it')) {
    console.error(
      `Scope '${status}' sweeps third-party hosts (geograph.org.uk) at scale.\n` +
        'Re-run with --i-mean-it, and prefer --sample to keep it polite.'
    )
    process.exit(2)
  }
  // Third-party hosts get one request per worker per 250ms; our own bucket does not need it.
  const pauseMs = status === 'approved' ? 0 : 250

  console.log('Image liveness sweep')
  console.log('='.repeat(60))
  console.log(`Scope: ${status}${sample ? ` (random sample of ${sample})` : ''}`)
  console.log(`Decode dimensions: ${wantDimensions ? 'yes' : 'no'}`)
  console.log('')

  try {
    const where = status === 'all' ? '' : `WHERE i.status = '${status}'`
    const limit = sample > 0 ? `ORDER BY random() LIMIT ${sample}` : 'ORDER BY f.slug'
    const rows = await prisma.$queryRawUnsafe<Row[]>(`
      SELECT i.id, i.url, i.status, i."uploadedBy", i."isHero", f.slug AS "farmSlug"
      FROM images i
      JOIN farms f ON f.id = i."farmId"
      ${where}
      ${limit}
    `)

    console.log(`Probing ${rows.length} row(s) at concurrency ${concurrency}...`)
    const probes = await sweep(rows, wantDimensions, concurrency, pauseMs)
    console.log('')

    const byVerdict = new Map<string, Probe[]>()
    for (const p of probes) {
      const v = verdict(p)
      byVerdict.set(v, [...(byVerdict.get(v) ?? []), p])
    }

    console.log('Verdict:')
    for (const [v, list] of [...byVerdict].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${v.padEnd(12)} ${list.length}`)
    }
    console.log('')

    console.log('By host:')
    const byHost = new Map<string, { total: number; bad: number }>()
    for (const p of probes) {
      const h = host(p.row.url)
      const entry = byHost.get(h) ?? { total: 0, bad: 0 }
      entry.total += 1
      if (verdict(p) !== 'ok') entry.bad += 1
      byHost.set(h, entry)
    }
    for (const [h, e] of [...byHost].sort((a, b) => b[1].total - a[1].total)) {
      const own = isOwnImageHost(`https://${h}/`) ? '' : '  (hot-linked)'
      console.log(`  ${h.padEnd(48)} ${String(e.total).padStart(6)}  bad=${e.bad}${own}`)
    }
    console.log('')

    if (wantDimensions) {
      const sized = probes.filter((p) => p.width && p.height)
      const heroCapable = sized.filter(
        (p) => Math.max(p.width!, p.height!) >= MIN_HERO_EDGE
      ).length
      console.log('Dimensions:')
      console.log(`  decoded:       ${sized.length}`)
      console.log(`  hero-capable:  ${heroCapable} (longest edge >= ${MIN_HERO_EDGE}px)`)
      console.log(`  too small:     ${sized.length - heroCapable}`)
      console.log('')
    }

    const failures = probes.filter((p) => verdict(p) !== 'ok')
    if (failures.length > 0) {
      console.log(`Failures (${failures.length}), first 15:`)
      for (const p of failures.slice(0, 15)) {
        console.log(
          `  ${p.row.farmSlug.padEnd(38)} ${String(p.httpStatus ?? 'ERR').padEnd(5)} ` +
            `${verdict(p).padEnd(10)} ${p.row.url.slice(0, 60)}`
        )
      }
      console.log('')
    }

    const hotlinkedApproved = probes.filter(
      (p) => p.row.status === 'approved' && !isOwnImageHost(p.row.url)
    ).length
    if (hotlinkedApproved > 0) {
      console.log(
        `${hotlinkedApproved} approved row(s) are hot-linked to a host we do not control.`
      )
      console.log('Those are the rows that rot without warning.')
      console.log('')
    }

    if (jsonPath) {
      await writeFile(
        jsonPath,
        JSON.stringify(
          {
            sweptAt: new Date().toISOString(),
            scope: status,
            sample: sample || null,
            probes: probes.map((p) => ({
              id: p.row.id,
              farmSlug: p.row.farmSlug,
              url: p.row.url,
              status: p.row.status,
              uploadedBy: p.row.uploadedBy,
              httpStatus: p.httpStatus,
              contentType: p.contentType,
              bytes: p.bytes,
              width: p.width,
              height: p.height,
              verdict: verdict(p),
              error: p.error,
            })),
          },
          null,
          2
        ),
        'utf8'
      )
      console.log(`Report written to ${jsonPath}`)
    }

    const approvedFailures = probes.filter(
      (p) => p.row.status === 'approved' && verdict(p) !== 'ok'
    )
    if (approvedFailures.length > 0) {
      console.error(`${approvedFailures.length} approved row(s) failed. Exit 1.`)
      process.exitCode = 1
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Sweep failed:', err)
  process.exit(1)
})

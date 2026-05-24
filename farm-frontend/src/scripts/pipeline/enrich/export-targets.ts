// Stage input builder: select farms that need a description and produce the
// target list the Python scrape sidecar (and the enrich stage) consume. Read
// only - no writes to the DB. Farms with a usable website are scrape targets;
// the rest are "thin" and get an honest brief line with no scrape.
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../lib/log'
import type { FactSheet } from './validate'

/** The shape selected from the Farm table (read-only). */
export interface FarmRow {
  id: string
  slug: string
  name: string
  website: string | null
  phone: string | null
  city: string | null
  county: string | null
  postcode: string | null
  description: string | null
  categories: Array<{ category: { slug: string } }>
}

export interface EnrichTarget {
  id: string // Farm primary key; the locator for the enrich update (07-load targetId)
  slug: string
  name: string
  website: string | null
  scrape: boolean // has a usable (non-social) website
  factSheet: FactSheet
}

const SOCIAL = /facebook|instagram|twitter|x\.com|tiktok|linktr|whatsapp/i

function isScrapable(website: string | null): boolean {
  return !!website && /^https?:\/\//i.test(website) && !SOCIAL.test(website)
}

export function buildTargets(rows: FarmRow[]): EnrichTarget[] {
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    website: r.website,
    scrape: isScrapable(r.website),
    factSheet: {
      name: r.name,
      city: r.city,
      county: r.county,
      postcode: r.postcode,
      website: r.website,
      phone: r.phone,
      categories: r.categories.map((c) => c.category.slug),
    },
  }))
}

interface TargetPrisma {
  farm: { findMany: (args: unknown) => Promise<FarmRow[]> }
}

export async function loadTargets(prisma: TargetPrisma, opts: { limit?: number } = {}): Promise<EnrichTarget[]> {
  const rows = await prisma.farm.findMany({
    where: { OR: [{ description: null }, { description: '' }] },
    select: {
      id: true, slug: true, name: true, website: true, phone: true,
      city: true, county: true, postcode: true, description: true,
      categories: { select: { category: { select: { slug: true } } } },
    },
    ...(opts.limit ? { take: opts.limit } : {}),
  })
  return buildTargets(rows)
}

export async function runExportTargets(opts: { limit?: number } = {}): Promise<EnrichTarget[]> {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const targets = await loadTargets(prisma as unknown as TargetPrisma, opts)
    const dir = resolve(process.cwd(), '.enrichment')
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, '_targets.json'), JSON.stringify(targets, null, 2))
    const scrapeable = targets.filter((t) => t.scrape).length
    log('info', 'export-targets complete', { total: targets.length, scrapeable, thin: targets.length - scrapeable })
    return targets
  } finally {
    await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect()
  }
}

// CLI: `tsx src/scripts/pipeline/enrich/export-targets.ts [--limit=N]`
if (import.meta.url === `file://${process.argv[1]}`) {
  void (async () => {
    const { config } = await import('dotenv')
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    config({ path: resolve(process.cwd(), '.env') })
    const limitArg = process.argv.find((a) => a.startsWith('--limit='))
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined
    await runExportTargets({ limit })
  })()
}

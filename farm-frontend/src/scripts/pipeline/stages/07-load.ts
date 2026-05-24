// Stage 07: apply a ChangeSet. Dry-run by default (zero writes). No --force.
// Writes only create/update actions; noop never touches the DB (idempotency).
// Updates are located by primary-key id; created rows persist slug + match ids.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { CURATED_SOURCES } from '../types'
import type { ChangeSet, FarmChange, ImageCandidate, Provenance, RunReport } from '../types'

interface MinimalPrisma {
  farm: {
    create: (args: unknown) => Promise<{ id: string }>
    update: (args: unknown) => Promise<unknown>
    findUnique: (args: unknown) => Promise<{ provenance: unknown; description: string | null } | null>
  }
  category: { findMany: (args: unknown) => Promise<{ id: string; slug: string }[]> }
  farmCategory: { upsert: (args: unknown) => Promise<unknown> }
  image: {
    findMany: (args: unknown) => Promise<{ url: string }[]>
    create: (args: unknown) => Promise<unknown>
  }
}

function emptyReport(): RunReport {
  return {
    created: 0, updated: 0, noop: 0, skipped: 0,
    imagesAttached: 0, categoriesLinked: 0, errors: 0, byField: {},
    startedAt: new Date().toISOString(), finishedAt: '',
  }
}

function buildData(change: FarmChange): Record<string, unknown> {
  const data: Record<string, unknown> = { provenance: change.provenanceNext }
  for (const diff of change.fields) data[diff.field] = diff.to
  if (change.osmId) data.osmId = change.osmId
  if (change.fsaId) data.fsaId = change.fsaId
  const dataSource = change.osmId ? 'osm' : change.fsaId ? 'fsa' : undefined
  if (dataSource) data.dataSource = dataSource
  if (change.enriched) data.lastEnrichedAt = new Date()
  return data
}

async function linkCategories(
  prisma: MinimalPrisma,
  farmId: string | null,
  slugs: string[] | undefined,
  categoryIdBySlug: Map<string, string>,
  apply: boolean,
  report: RunReport,
): Promise<void> {
  for (const slug of slugs ?? []) {
    const categoryId = categoryIdBySlug.get(slug)
    if (!categoryId) continue // unknown slug: skip (do not invent categories)
    report.categoriesLinked++
    if (apply && farmId) {
      await prisma.farmCategory.upsert({
        where: { farmId_categoryId: { farmId, categoryId } },
        create: { farmId, categoryId },
        update: {},
      })
    }
  }
}

async function attachImages(
  prisma: MinimalPrisma,
  farmId: string | null,
  images: ImageCandidate[] | undefined,
  apply: boolean,
  report: RunReport,
): Promise<void> {
  if (!images || images.length === 0) return
  // Existing urls only knowable when we have a real farmId in apply mode.
  const existing = (apply && farmId)
    ? new Set((await prisma.image.findMany({ where: { farmId }, select: { url: true } })).map((r) => r.url))
    : new Set<string>()
  for (const img of images) {
    if (existing.has(img.url)) continue
    report.imagesAttached++
    if (apply && farmId) {
      await prisma.image.create({ data: {
        farmId,
        url: img.url,
        source: img.source,
        license: img.license,
        attribution: img.attribution,
        sourceUrl: img.sourceUrl,
        uploadedBy: 'cc',
        status: 'pending',
        isHero: false,
        displayOrder: 100,
      } })
    }
  }
}

export async function applyChangeSet(
  changeSet: ChangeSet,
  prisma: MinimalPrisma,
  opts: { apply: boolean },
): Promise<RunReport> {
  const report = emptyReport()
  const categoryRows = await prisma.category.findMany({ select: { id: true, slug: true } })
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]))
  for (const change of changeSet) {
    try {
      if (change.action === 'noop') { report.noop++; continue }

      if (change.action === 'create') {
        if (!change.slug) {
          // A candidate with no name (hence no slug) cannot become a farm.
          // This is an expected skip (e.g. an unnamed OSM shop=farm node), not
          // a failure, so it counts as skipped rather than an error.
          report.skipped++
          log('warn', 'create skipped: candidate has no name/slug', { stage: '07' })
          continue
        }
        const hasCoords = change.fields.some((f) => f.field === 'latitude')
          && change.fields.some((f) => f.field === 'longitude')
        if (!hasCoords) {
          // Map-first directory: a farm with no coordinates cannot be a pin and
          // would fail the required lat/lng columns anyway (e.g. an FSA row with
          // only a partial/outward postcode that postcodes.io could not geocode).
          // Expected skip, not an error; revisit when geocoding coverage improves.
          report.skipped++
          log('warn', 'create skipped: candidate has no coordinates', { stage: '07', slug: change.slug })
          continue
        }
        for (const diff of change.fields) report.byField[diff.field] = (report.byField[diff.field] ?? 0) + 1
        report.created++
        const created = opts.apply ? await prisma.farm.create({ data: { ...buildData(change), slug: change.slug } }) : null
        await linkCategories(prisma, created?.id ?? null, change.categories, categoryIdBySlug, opts.apply, report)
        await attachImages(prisma, created?.id ?? null, change.images, opts.apply, report)
        continue
      }

      // update
      if (!change.targetId) {
        report.errors++
        log('error', 'update missing targetId; skipped', { stage: '07', slug: change.slug })
        continue
      }
      // Never-clobber: an enrich (machine) description must not overwrite a real
      // curated one. Enrich changes are description-only, so this is binary -
      // skip the whole change when a non-empty owner/admin/user description
      // already exists. Read at apply time (covers the export->load race window).
      if (change.enriched) {
        const existing = await prisma.farm.findUnique({ where: { id: change.targetId }, select: { provenance: true, description: true } })
        const src = (existing?.provenance as Provenance | null)?.description?.source
        if (existing?.description && src && CURATED_SOURCES.has(src)) {
          report.skipped++
          log('info', 'update skipped: curated description preserved (never-clobber)', { stage: '07', slug: change.slug })
          continue
        }
      }
      for (const diff of change.fields) report.byField[diff.field] = (report.byField[diff.field] ?? 0) + 1
      report.updated++
      if (opts.apply) await prisma.farm.update({ where: { id: change.targetId }, data: buildData(change) })
      await linkCategories(prisma, change.targetId, change.categories, categoryIdBySlug, opts.apply, report)
      await attachImages(prisma, change.targetId, change.images, opts.apply, report)
    } catch (e) {
      report.errors++
      log('error', 'load row failed', { stage: '07', slug: change.slug, error: e instanceof Error ? e.message : String(e) })
    }
  }
  report.finishedAt = new Date().toISOString()
  log('info', opts.apply ? 'load applied' : 'load dry-run', {
    stage: '07', created: report.created, updated: report.updated, noop: report.noop, errors: report.errors,
  })
  return report
}

export async function runLoad(opts: { apply: boolean; changeSetPath?: string }): Promise<RunReport> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  // Default: the main pipeline's merge output. Enrich passes its own changeset
  // (.enrichment/_enrich-changeset.json) via --changeset.
  const csPath = opts.changeSetPath ? resolve(process.cwd(), opts.changeSetPath) : resolve(dir, '06-merge.json')
  const cs = JSON.parse(readFileSync(csPath, 'utf8')) as ChangeSet
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const report = await applyChangeSet(cs, prisma as unknown as MinimalPrisma, opts)
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, `run-report-${Date.now()}.json`), JSON.stringify(report, null, 2))
    return report
  } finally {
    await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect()
  }
}

// CLI: `tsx src/scripts/pipeline/stages/07-load.ts --changeset=<path> [--apply]`
// Used by `pnpm enrich:load` to load the enrich changeset (dry-run by default).
if (import.meta.url === `file://${process.argv[1]}`) {
  void (async () => {
    const { config } = await import('dotenv')
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    config({ path: resolve(process.cwd(), '.env') })
    const csArg = process.argv.find((a) => a.startsWith('--changeset='))
    const changeSetPath = csArg ? csArg.split('=')[1] : undefined
    const apply = process.argv.includes('--apply') && !process.argv.includes('--dry-run')
    const report = await runLoad({ apply, changeSetPath })
    log('info', 'load report', { ...report })
    if (!apply) log('warn', 'DRY RUN - no writes. Re-run with --apply (and without --dry-run) to persist.', {})
  })()
}

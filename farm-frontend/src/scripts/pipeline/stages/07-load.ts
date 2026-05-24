// Stage 07: apply a ChangeSet. Dry-run by default (zero writes). No --force.
// Writes only create/update actions; noop never touches the DB (idempotency).
// Updates are located by primary-key id; created rows persist slug + match ids.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import type { ChangeSet, FarmChange, RunReport } from '../types'

interface MinimalPrisma {
  farm: {
    create: (args: unknown) => Promise<{ id: string }>
    update: (args: unknown) => Promise<unknown>
  }
  category: { findMany: (args: unknown) => Promise<{ id: string; slug: string }[]> }
  farmCategory: { upsert: (args: unknown) => Promise<unknown> }
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
          report.errors++
          log('error', 'create missing slug; skipped', { stage: '07' })
          continue
        }
        for (const diff of change.fields) report.byField[diff.field] = (report.byField[diff.field] ?? 0) + 1
        report.created++
        const created = opts.apply ? await prisma.farm.create({ data: { ...buildData(change), slug: change.slug } }) : null
        await linkCategories(prisma, created?.id ?? null, change.categories, categoryIdBySlug, opts.apply, report)
        continue
      }

      // update
      if (!change.targetId) {
        report.errors++
        log('error', 'update missing targetId; skipped', { stage: '07', slug: change.slug })
        continue
      }
      for (const diff of change.fields) report.byField[diff.field] = (report.byField[diff.field] ?? 0) + 1
      report.updated++
      if (opts.apply) await prisma.farm.update({ where: { id: change.targetId }, data: buildData(change) })
      await linkCategories(prisma, change.targetId, change.categories, categoryIdBySlug, opts.apply, report)
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

export async function runLoad(opts: { apply: boolean }): Promise<RunReport> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const cs = JSON.parse(readFileSync(resolve(dir, '06-merge.json'), 'utf8')) as ChangeSet
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

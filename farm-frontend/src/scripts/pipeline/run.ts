#!/usr/bin/env tsx
// Pipeline orchestrator. Chains stages 01..07 with range + safety flags.
//   pnpm pipeline --from 1 --to 5         # read side only, no DB
//   pnpm pipeline --dry-run               # full chain, load is dry-run (default)
//   pnpm pipeline --apply --limit 50      # apply a small batch
import './env' // MUST be first: loads .env.local/.env before stage modules read process.env
import { discover } from './stages/01-discover'
import { runNormalize } from './stages/02-normalize'
import { runGeocode } from './stages/03-geocode'
import { runEnrich } from './stages/04-enrich'
import { runImages } from './stages/05-images'
import { runMerge } from './stages/06-merge'
import { runLoad } from './stages/07-load'
import { log } from './lib/log'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  if (i < 0) return undefined
  const val = process.argv[i + 1]
  // Guard against swallowing the next flag as this flag's value.
  return val && !val.startsWith('--') ? val : undefined
}
function flag(name: string): boolean { return process.argv.includes(`--${name}`) }

function intArg(name: string): number | undefined {
  const raw = arg(name)
  if (raw === undefined) return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : undefined
}

async function main() {
  const from = intArg('from') ?? 1
  const to = intArg('to') ?? 7
  const limit = intArg('limit')
  // dry-run is the safe default; --dry-run always wins over --apply.
  const apply = flag('apply') && !flag('dry-run')
  const inRange = (n: number) => n >= from && n <= to

  if (inRange(1)) await discover({ limit })
  if (inRange(2)) runNormalize()
  if (inRange(3)) await runGeocode()
  if (inRange(4)) runEnrich()
  if (inRange(5)) await runImages()
  if (inRange(6)) await runMerge()
  if (inRange(7)) {
    const report = await runLoad({ apply })
    log('info', 'run report', { ...report })
    if (!apply) log('warn', 'DRY RUN - no writes. Re-run with --apply (and without --dry-run) to persist.', {})
  }
}

main().catch((e) => {
  log('error', 'pipeline failed', { error: e instanceof Error ? e.message : String(e) })
  process.exitCode = 1
})

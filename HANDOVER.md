# Handover — 2026-05-17 00:52

> Branch: `claude/add-sitemap-page-wHEV4` · 3 commits this session + 1 parallel session commit (`af5cd23` EV-1 spec) + 1 close-out commit pending push · ECC `post:ecc-context-monitor` cost-warning hook DISABLED for this project (env var, takes effect next session)

## Mission
Resume Stage 0 infrastructure migration: rebase + push prior session's Stage 0 housekeeping (Slices 1-5), then strip Vercel runtime deps before the Coolify/Hetzner deployment.

## Session close-out
- `.claude/settings.local.json` got `"env": { "ECC_DISABLED_HOOKS": "post:ecc-context-monitor" }` — silences the dollar-cost warnings starting next session. **Not committed** (file contains a `PGPASSWORD` literal in the bash allowlist; added to `.gitignore` instead).
- `.gitignore` got a `.claude/settings.local.json` entry under the MCP block to prevent future accidental commit.
- Parallel session committed `af5cd23 docs: queue Slice EV-1 (mailboxlayer email verification spec)` adding `docs/assistant/email-verification-plan.md` + ledger entry. Not from this session — independent work stream lands ahead of Slice 6c.
- Remaining untracked at /clear: `docs/PRODUCTION_READINESS_REPORT.md` (pre-existing, ownership unclear).

## What landed
- ✅ Rebase: local `6d943a9` replayed onto remote `325101d`; resolved `farm-frontend/package-lock.json` modify/delete by accepting the deletion; `next.config.ts` auto-merged with `output: 'standalone'` preserved (line 31). Pushed as `1346d88`.
- ✅ Slice 6a — remove `@vercel/analytics`: dead `// import` + dead `{/* <Analytics /> */}` JSX block deleted from `src/app/layout.tsx`; dep dropped from `package.json`; `pnpm-lock.yaml` regenerated. Commit `b7d9988`.
- ✅ Slice 6b — `@vercel/kv` shim: new `farm-frontend/src/lib/kv.ts` (26 LOC, `Redis` from `@upstash/redis`, reads `KV_REST_API_*` then falls back to `UPSTASH_REDIS_REST_*`). Migrated 5 lib callers: `rate-limit`, `logging`, `error-handler`, `performance-monitor`, `cache-manager`. Commit `38a4f48`.

## Verified
- Rebase shrank `local ahead` from 30 → 1 commit, as predicted in the prior handover.
- Slice 6a: `pnpm exec tsc --noEmit --skipLibCheck` exits 0; `grep '@vercel/analytics'` returns zero in `src/` and `pnpm-lock.yaml`.
- Slice 6b: `pnpm exec tsc --noEmit --skipLibCheck` exits 0; `grep '@vercel/kv' farm-frontend/src/lib/` only matches comments inside `kv.ts`.
- All three commits visible on `origin/claude/add-sitemap-page-wHEV4` (push outputs `b7d9988..38a4f48` etc.).

## NOT verified — user must do this
- ⏳ Dockerfile actually builds — `cd farm-frontend && docker build -t farm-frontend:dev .`
- ⏳ Dev infra healthy — `docker compose -f docker-compose.dev.yml up -d && docker compose -f docker-compose.dev.yml ps`
- ⏳ Standalone Next build — `cd farm-frontend && pnpm run build`; expect `.next/standalone/server.js`.
- ⏳ KV shim actually talks to Upstash — runtime check; requires `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`) in env. Container will start either way; misconfigured envs throw on first `kv.*` call, where existing try/catch fallbacks (e.g. `rate-limit.ts:26-30`) absorb the error.

## Open threads
- ⚠️ 5 API routes still import `@vercel/kv` — Slice 6c targets: `api/contact/submit`, `api/farms/submit`, `api/log-error`, `api/log-http-error`, `api/add/selftest`. `@vercel/kv` cannot leave `package.json` until 6c lands.
- ⚠️ `@vercel/blob` not touched — `lib/blob.ts`, `lib/county-blob.ts`, `lib/farm-blob.ts`, county/farm image generators, plus routes. Multi-slice (6d+); needs a real storage destination decision (R2 vs Supabase Storage vs MinIO on the droplet).
- ⚠️ 39 Dependabot vulns on default branch (2 critical, 23 high, 14 moderate) flagged on every push. Queue 1 in `CLAUDE.md`; not started.
- ⚠️ ECC `cost-tracking` PostToolUse hook fires "$X WARNING/CRITICAL" reminders, but user is on a **Max plan** — dollar figures are irrelevant; actual constraint is monthly quota. Hook should be disabled or reconfigured for quota-relative reporting.

## Decisions
- **Thin re-export shim over adapter interface** for KV: Vercel KV is literally Upstash Redis under the hood; method names are 1:1. Rejected interface+impl pattern as pure ceremony.
- **Split @vercel/kv migration into 6b (libs) + 6c (api routes)** to respect CLAUDE.md's 8-file/slice cap. Rejected one big 13-file slice.
- **Accept package-lock.json deletion in rebase**: pnpm is canonical per `package.json` `pnpm.overrides` and the Dockerfile. Rejected keeping both lockfiles.

## You are here → next step
Run Slice 6c: in each of the 5 API routes, swap `from '@vercel/kv'` to `from '@/lib/kv'` (including the dynamic `await import('@vercel/kv')` in `api/add/selftest/route.ts:24`), remove `"@vercel/kv"` from `farm-frontend/package.json`, run `pnpm install`, then `pnpm exec tsc --noEmit --skipLibCheck`, commit, push.

## Previous handover

### Handover — 2026-05-17 00:16

> Branch: `claude/add-sitemap-page-wHEV4` · 1 commit this session (local only) · ⚠️ not pushed — rebase pending

**Mission:** Begin Stage 0 batch conductor work per prior session's HANDOVER: declutter docs root, scaffold Docker deployment for Coolify (Dockerfile, .dockerignore, docker-compose.dev.yml, Next.js standalone output), kill lockfile drift. Mid-session pivot: forensic audit of installed Claude Code skills/plugins for malware.

**What landed:** Stage 0 housekeeping committed locally as `6d943a9` (NOT YET PUSHED at the time). 14 stale root markdowns → `docs/archive/`. `farm-frontend/Dockerfile` (Node 22 bookworm-slim, pnpm via corepack, standalone runtime, non-root user, HEALTHCHECK). `farm-frontend/.dockerignore`. `docker-compose.dev.yml` (postgres+postgis 16-3.4, redis 7, meilisearch v1.10). `farm-frontend/next.config.ts` got `output: 'standalone'`. `.gitignore` deduplicated. `farm-frontend/package-lock.json` deleted (drift fix; pnpm canonical). Ledger appended.

**Verified:** File-level git status. Skill/plugin malware audit clean (0 bidi, 0 homoglyph, 1 benign ZWJ).

**NOT verified:** Push + rebase, Dockerfile build, dev infra health, standalone Next build.

**Decisions:** Bookworm-slim base over alpine (sharp/prisma pain). Infra-only compose (host pnpm dev is faster). pnpm canonical (no dual lockfiles). Vercel strip is multi-slice, deferred.

### Handover — 2026-05-16 23:47

> Branch: `claude/add-sitemap-page-wHEV4` · 0 commits this session · 1 file modified (CLAUDE.md, pre-existing) · ⚠️ uncommitted changes

**Mission:** Begin Coolify+Hetzner infrastructure rebuild of farm-companion (UK farm directory) into a "premium" stack. Architecture locked as **Shape A** (single Hetzner droplet, all services on it, R2 for images later, Storage Box for backups). Operator-driven baby-step provisioning; no app code touched.

**What landed (in operator's infrastructure, NOT in repo):** Hetzner CPX42 droplet `37.27.194.158` (Helsinki, Ubuntu 24.04, 16 GB RAM, 8 vCPU, 320 GB SSD, €25.49/mo). OS hardened. SSH key `~/.ssh/farm_companion_prod`. Droplet registered with **existing** Coolify at `coolify.flintmere.com` as server `farm-companion-prod`. Project `farm-companion` in Coolify with internal-only resources: Postgres (`postgis/postgis:16-3.4-alpine` + `postgis` + `pg_trgm`), Redis 7, Meilisearch v1.10. Coolify GitHub App scoped to repo only.

**Verified:** SSH login, Coolify server UI green, `SELECT postgis_version()` returned 3.4.

**NOT verified:** Redis/Meilisearch actually accept connections; standalone Coolify orphans on droplet.

**Open threads:** Domain registrar unknown (`farmcompanion.co.uk` on Microsoft 365 nameservers); live site on Vercel; DNS migration deferred until app deployable on sslip.io.

**Decisions:** Shape A locked (rejected Neon-managed). Single Coolify (rejected standalone install). CPX42 (rejected CCX23 unavailable). DNS deferred. Better Auth chosen for Stage 6 (rejected Supabase Auth).

# Farm Companion — Reset Design (2026-05-18)

**Status:** Approved by operator 2026-05-18 (sections 1, 2, 3). Supersedes `docs/assistant/migration-plan-2026-05-18.md` (kept in history for context but no longer authoritative).

**Why this exists:** the prior audit + migration plan over-scoped (14 slices to preserve every existing feature) and was built on a wrong infrastructure premise (treated Vercel KV and a Coolify Redis container as separate stores; they are the same store accessed through two clients). After resetting to first principles, the right product is much smaller: a premium UK farm directory whose user-write features (submissions, photo uploads, moderation queues, newsletter, claims) are deleted, not migrated. With the site pre-launch and no real users, the strip is risk-free.

---

## 1. Product scope

### Premium lens (operator decision)

**Hybrid spine: Tool first, Editorial second.**
- **Tool spine (Citymapper-style):** map-first, location-aware, "OPEN NOW" prominent, one-tap directions/call/save, filter-rich, mobile-first. This is the dominant lens — the index, search, map, and individual farm pages are utilitarian-premium.
- **Editorial garnish:** "What's in season this week" hero on homepage; "Farm of the month" feature; seasonal long-form pieces. Phase 4 work, after the spine is rock-solid.
- **Trip Planner:** deferred to post-launch Phase 2 feature.

### MVP — the Spine (must be premium-grade)

1. Public farm directory: browse, filter, search.
2. Map-first homepage with clustering, smooth zoom, "near me" detection.
3. Individual farm pages: photos, opening hours, what they sell, directions, call, share.
4. **"Open now" status** — prominent, accurate, always live.
5. Filter chips: open now / pick-your-own / cafe / dog-friendly / wheelchair / pay-by-card.
6. Categories: dairy / meat / veg / eggs / honey / orchard / mixed.
7. Mobile-first; PWA-installable; offline-friendly for last-viewed farms.
8. SEO-perfect listing pages (ISR, OG tags, structured data, sitemap).
9. Accessibility AA — keyboard, screen reader, color contrast, focus states.

### Garnish (Phase 4)

10. "What's in season this week" hero on homepage.
11. "Farm of the month" feature.
12. Seasonal long-form pieces (asparagus, lambing, harvest).
13. Curated trail / region pieces ("Cotswolds farm Sunday").

### Deferred (build later, after launch)

- Trip Planner (route + open-hours scheduling).
- Farm-owner claim flow.
- User reviews.
- Events calendar.
- User accounts; favourites synced across devices (start with localStorage only).

### KILLED (deleted now, not deferred)

- User-submission form (`POST /api/farms/submit`, `src/app/add/page.tsx` and related forms).
- User-photo upload (`POST /api/photos/upload-url`, `finalize`, `[id]`, `upload-blob`, `deletion-requests`, related components).
- Admin moderation queue (`/api/admin/farms` GET, `[id]/review`, `approve-to-live`, `photo-stats`, `photos/approve`, `reject`, `remove`, `cleanup-broken`, `cleanup-deleted`).
- Newsletter signup (`POST /api/newsletter/subscribe`, `unsubscribe`, `NewsletterSignup` component).
- Claim flow (`POST /api/claims`, `ClaimForm` component, `src/app/claim/[slug]/page.tsx`).
- `/api/admin/migrate-farms`, `POST` handler in `/api/farms/route.ts`, `/api/farms/data`, `/api/farms-cached`, `/api/farms/status/[id]`, `/api/photos/upload-blob`, `/api/upload`, `/api/consent`, `/api/feedback`, `/api/indexnow`, `/api/performance/dashboard`.
- All `/api/admin/generate-*`, `/api/admin/audit/sitemap-reconciliation`, `/api/admin/database-integrity` ops tools.
- `farm-frontend/src/lib/redis.ts` + `farm-frontend/src/lib/database-constraints.ts` (the node-redis pseudo-DB layer).
- Filesystem path consumers reading `data/farms/`, `data/live-farms/`, `data/claims/` (the directories themselves can be deleted in a later cleanup if no other tool reads them; confirm before).

**Operator (you) maintains farm data** through a tiny admin CRUD on `Farm` + `Image`, built fresh in Phase 3. No queues, no review flows.

---

## 2. Clean infrastructure target

After Phase 0, the codebase has exactly three storage primitives, each with one job:

| Primitive | Job | Lib file | Env vars |
|---|---|---|---|
| **Postgres** (Prisma) | Canonical store for `Farm`, `Category`, `Image` (+ future: `Review`, `Event`) | `prisma/client` | `DATABASE_URL` |
| **Vercel KV** (Upstash REST) | Ephemeral only: rate-limit counters, cache, error breadcrumbs | `src/lib/kv.ts` | `KV_REST_API_URL` + `KV_REST_API_TOKEN` |
| **Vercel Blob** | Photo binaries (admin-uploaded only, post-Phase-3) | `src/lib/blob.ts` | `BLOB_*` |

**Deleted:** `lib/redis.ts`, `lib/database-constraints.ts`, the filesystem `data/farms/` reads. The `REDIS_URL` env var no longer has a consumer in `farm-frontend` after Phase 0 Slice 0.1 lands; `farm-produce-images` (sibling app) still uses it independently — out of scope.

### Why this shape works

- **One source of truth per domain object.** Farms are in Postgres. Photos (binaries) are in Blob; photo metadata is in Postgres `Image`. Rate-limits and ephemeral caches are in Vercel KV. No store overlap, no key-mismatch ambiguity.
- **No client-library duplication.** Only `@upstash/redis` (via `lib/kv.ts`) for KV access; node-redis is gone.
- **Apple-tier latency.** Postgres reads with proper indexes + ISR + Vercel edge cache → sub-100 ms TTFB on listing pages.
- **Cheap to operate.** Vercel KV free tier covers expected ephemeral volume; Postgres + Blob already provisioned.

---

## 3. Build sequence

Eight phases. ~22-30 slices total. Each slice respects CLAUDE.md's 8-file / 300-LOC budget (deletions exempt from LOC; file count still capped).

| Phase | Goal | Slice count | Operator gate |
|---|---|---|---|
| **0 — STRIP** | Delete ~38 files / ~4,390 LOC of dead code in 5 verified batches | 5 | Review each PR before merge (auto-merge on green if pre-authorised) |
| **1 — STABILIZE Tool spine** | Verify + tighten public read path (farms GET, map, search, individual pages, "open now" accuracy), N+1 fixes, index audit | 4-6 | Walk live site after each slice |
| **2 — DESIGN SYSTEM** | Tokens audit (color, spacing, type, motion); component fills; accessibility AA pass; micro-interactions | 3-4 | Eyeball the design pass |
| **3 — OPERATOR ADMIN CRUD** | Postgres-backed admin for `Farm` + `Image` — one clean form, validates, saves. Replaces deleted moderation flow. | 3-4 | Operator starts maintaining farm data |
| **4 — SEASONALITY + EDITORIAL HERO** | "What's in season" component + first long-form editorial piece | 2-3 | Approve editorial copy |
| **5 — PWA + OFFLINE + PERF** | Service worker, offline last-viewed, Lighthouse all-green, bundle budget | 2-3 | Lighthouse run |
| **6 — PRE-LAUNCH HARDENING** | SEO checklist, security review, prod health checks | 1-2 | Final review |
| **7 — LAUNCH** | Domain, DNS, analytics on, announce | — | Operator |

### Phase 0 slice breakdown (verified 2026-05-18 by Explore agent)

| Slice | Files | LOC deleted | What | Order |
|---|---|---|---|---|
| **0.1 Pseudo-DB foundation** | 5 | ~852 | `lib/redis.ts` + `lib/database-constraints.ts` + admin/farms GET + admin/farms/[id]/review + admin/farms/approve-to-live | First |
| **0.2 User submission + migrate** | 3 files (+ companion page `src/app/add/page.tsx` ~877 LOC) | ~1,020 | api/farms/submit + admin/migrate-farms + POST handler in api/farms/route.ts (keep GET) + delete entire `add` page | After 0.1 |
| **0.3 User photo upload + admin photo review** | 7 (+ 3 components) | ~768 | api/photos/upload-url, finalize, [id], upload-blob, deletion-requests + admin/photos/cleanup-broken, cleanup-deleted + PhotoSubmissionForm, FarmImageUpload, PhotoDeletionRequest components | After 0.2 |
| **0.4 Dead public endpoints + UI cleanup** | 6 routes + 2 page deletions (NewsletterSignup + ClaimForm + claim/[slug] page + relevant landing-page sections) | ~600 | newsletter/subscribe + unsubscribe, claims, consent, feedback, indexnow + components/pages that link them | Independent |
| **0.5 Admin ops tools + dead upload** | 6 | ~1,491 | admin/database-integrity, admin/audit/sitemap-reconciliation, admin/generate-images, generate-produce-images, generate-batch + api/upload | After 0.1 |

**Total Phase 0:** ~38 files deleted, ~4,390 LOC removed.

**Verification per slice:** explicit `grep` patterns prove zero remaining references after deletion. Each slice's PR description includes the before/after counts.

### Phase 1 sketch (locked at Phase 0 exit)

Not detailed here; will be elaborated by `superpowers:writing-plans` after Phase 0 lands. Expected scope:
- 1.1 Audit `api/farms/route.ts` GET for N+1 and add indexes.
- 1.2 Map render tested end-to-end with realistic dataset; clustering thresholds tuned.
- 1.3 "Open now" badge accuracy: handle DST, multi-day-per-week schedules, holidays.
- 1.4 Individual farm page polish (typography, photo grid, directions/call CTAs).
- 1.5 Search relevance + filter chip behavior.
- 1.6 Public read-path E2E test (Playwright) covering top-5 farm journeys.

---

## 4. Error handling & testing posture

### Errors
- Public read path: never crash, never blank-page. ISR + skeletons + friendly empty states.
- Operator admin (Phase 3): inline validation, optimistic UI where appropriate, surfaced API errors.
- KV unavailability: rate-limit fails closed (already shipped in PR #147); cache misses are non-fatal.
- Postgres unavailability: ISR pages serve stale content; admin gets a 503 page with retry guidance.

### Testing
- Unit tests for `lib/` modules (already have 47+).
- Component tests for the design system (Phase 2).
- E2E (Playwright) for the 5 public read journeys + the 3 admin CRUD flows (Phase 3).
- Lighthouse + a11y CI gate before launch (Phase 5).

---

## 5. What stays the same

- Next.js 16 App Router.
- Prisma + Postgres (Hetzner).
- Vercel KV (Upstash) + Vercel Blob.
- Tailwind + design tokens already in place.
- Maplibre-gl for map rendering.
- Admin login (cookie-based) at `/api/admin/login` + `/api/admin/logout` and `lib/auth.ts`.
- Cron job for Bing sitemap ping.
- Rate-limit fail-closed work (PR #147).
- KV_KEY_PREFIX multi-tenant safety (PR #146).

---

## 6. Out of scope

- `farm-produce-images` sibling app (uses `REDIS_URL` independently; deferred).
- `farm-pipeline` Python enrichment work (lives on `backup/local-enrichment-pre-reset` branch; will be evaluated separately after Phase 0 lands).
- `FC1/` archive directory (legacy backup; can be deleted in a later cleanup).
- Vercel "Coolify Redis" decommission — there is no separate Coolify Redis; the audit was wrong about this.

---

## 7. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| A "DEAD" route I delete turns out to have a live consumer | Low | Explore agent verified each target's incoming references; per-slice `grep` verification gates the PR |
| Postgres schema change needed during Phase 3 admin CRUD | Medium | Use Prisma migrations; staging-first apply (baby step in Phase 3 plan) |
| Editorial content quality lags (Phase 4) | Medium | Phase 4 doesn't gate launch; ships after spine is solid |
| Backup branch (`backup/local-enrichment-pre-reset`) work conflicts with Phase 0 deletions | Low-medium | The enrichment commits touched `lib/farm-images.ts`, `lib/google-photos.ts`, `prisma/schema.prisma`, `scripts/import-farms.ts`, `scripts/run-enrichment.sh`, `scripts/check-image-status.ts` — none of which are in the Phase 0 KILL list. Will rebase or cherry-pick those into Phase 1/3 work later. |
| Operator burnout from accumulated context | Medium-high | Baby steps for every operator action; status reports at each PR; freedom to pause |

---

## 8. Definition of "done" for this design

This spec is done when:
- ✅ Operator approved Section 1 (scope) — 2026-05-18.
- ✅ Operator approved Sections 2 + 3 (infra + sequence) — 2026-05-18 by "lets do it approach A".
- ✅ Spec doc committed and merged to master.
- ⏳ `superpowers:writing-plans` invoked to produce the Phase 0 implementation plan.
- ⏳ Phase 0 Slice 0.1 PR opened.

Once Slice 0.1 ships, this spec stops being the active reference and the implementation plan + per-slice PRs become authoritative.

---

*Spec authored 2026-05-18. Source: `superpowers:brainstorming` session with operator. Inputs: prior audit (`docs/assistant/audit-2026-05-18.md`), council-approved (now superseded) migration plan (`docs/assistant/migration-plan-2026-05-18.md`), CLAUDE.md product directive, Explore agent dead-code inventory.*

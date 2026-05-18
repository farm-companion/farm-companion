# Phase 0 — Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete ~38 files / ~4,390 LOC of dead and broken code so the codebase shrinks to just the Tool-spine MVP defined in `docs/superpowers/specs/2026-05-18-farm-companion-reset-design.md`.

**Architecture:** Each task is one slice = one branch = one PR = one merge to master. Each respects CLAUDE.md's 8-file ceiling (deletions exempt from LOC ceiling). Slices are ordered by dependency: leaf consumers first, shared library files last (so `tsc` always passes after each merge).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma + Postgres, Vercel KV (Upstash REST) via `@upstash/redis`, Vercel Blob, MapLibre. Tests: built-in `tsx --test` runner.

---

## File Structure (all paths relative to `/Users/abuaa/Projects/farm-companion/`)

### Files to delete entirely

```
farm-frontend/src/app/admin/farms/page.tsx                       (slice 0.1)
farm-frontend/src/app/admin/photos/page.tsx                      (slice 0.5)
farm-frontend/src/app/admin/photos/approved/page.tsx             (slice 0.5)
farm-frontend/src/app/admin/claims/page.tsx                      (slice 0.7)
farm-frontend/src/app/add/page.tsx                               (slice 0.2)
farm-frontend/src/app/claim/page.tsx                             (slice 0.7)
farm-frontend/src/app/claim/[slug]/page.tsx                      (slice 0.7)
farm-frontend/src/app/api/admin/farms/route.ts                   (slice 0.1)
farm-frontend/src/app/api/admin/farms/[id]/route.ts              (slice 0.1)
farm-frontend/src/app/api/admin/farms/[id]/review/route.ts       (slice 0.1)
farm-frontend/src/app/api/admin/farms/approve-to-live/route.ts   (slice 0.1)
farm-frontend/src/app/api/admin/farms/photo-stats/route.ts       (slice 0.1)
farm-frontend/src/app/api/admin/migrate-farms/route.ts           (slice 0.2)
farm-frontend/src/app/api/admin/photos/approve/route.ts          (slice 0.4)
farm-frontend/src/app/api/admin/photos/reject/route.ts           (slice 0.4)
farm-frontend/src/app/api/admin/photos/remove/route.ts           (slice 0.4)
farm-frontend/src/app/api/admin/photos/cleanup-broken/route.ts   (slice 0.4)
farm-frontend/src/app/api/admin/photos/cleanup-deleted/route.ts  (slice 0.4)
farm-frontend/src/app/api/admin/database-integrity/route.ts      (slice 0.9)
farm-frontend/src/app/api/admin/audit/sitemap-reconciliation/route.ts (slice 0.9)
farm-frontend/src/app/api/admin/generate-images/route.ts         (slice 0.9)
farm-frontend/src/app/api/admin/generate-produce-images/route.ts (slice 0.9)
farm-frontend/src/app/api/admin/generate-batch/route.ts          (slice 0.9)
farm-frontend/src/app/api/farms/submit/route.ts                  (slice 0.2)
farm-frontend/src/app/api/farms/data/route.ts                    (slice 0.8)
farm-frontend/src/app/api/farms/status/[id]/route.ts             (slice 0.8)
farm-frontend/src/app/api/farms-cached/route.ts                  (slice 0.8)
farm-frontend/src/app/api/photos/upload-url/route.ts             (slice 0.3)
farm-frontend/src/app/api/photos/finalize/route.ts               (slice 0.3)
farm-frontend/src/app/api/photos/[id]/route.ts                   (slice 0.3)
farm-frontend/src/app/api/photos/upload-blob/route.ts            (slice 0.3)
farm-frontend/src/app/api/photos/deletion-requests/route.ts      (slice 0.3)
farm-frontend/src/app/api/upload/route.ts                        (slice 0.9)
farm-frontend/src/app/api/newsletter/subscribe/route.ts          (slice 0.6)
farm-frontend/src/app/api/newsletter/unsubscribe/route.ts        (slice 0.6)
farm-frontend/src/app/api/claims/route.ts                        (slice 0.7)
farm-frontend/src/app/api/consent/route.ts                       (slice 0.8)
farm-frontend/src/app/api/feedback/route.ts                      (slice 0.8)
farm-frontend/src/app/api/indexnow/route.ts                      (slice 0.8)
farm-frontend/src/app/api/performance/dashboard/route.ts         (slice 0.8)
farm-frontend/src/components/NewsletterSignup.tsx                (slice 0.6)
farm-frontend/src/components/ClaimForm.tsx                       (slice 0.7)
farm-frontend/src/components/PhotoSubmissionForm.tsx             (slice 0.5)
farm-frontend/src/components/FarmImageUpload.tsx                 (slice 0.5)
farm-frontend/src/components/PhotoDeletionRequest.tsx            (slice 0.5)
farm-frontend/src/lib/redis.ts                                   (slice 0.10)
farm-frontend/src/lib/database-constraints.ts                    (slice 0.10)
```

### Files to edit (partial deletion / cleanup)

```
farm-frontend/src/app/api/farms/route.ts     (slice 0.2: delete POST handler lines 248-413 + interface FarmShopData lines 10-46; keep GET)
farm-frontend/src/components/FarmPageClient.tsx  (slice 0.5: delete PhotoSubmissionForm import line 23 + usage at line 262)
farm-frontend/src/app/page.tsx               (slice 0.6: delete NewsletterSignup dynamic-import lines 36-37 + render at line 171)
```

### Files to keep (do NOT touch in Phase 0)

```
farm-frontend/src/lib/kv.ts                  (Upstash shim — used by rate-limit, cache)
farm-frontend/src/lib/rate-limit.ts          (just hardened in PR #147)
farm-frontend/src/lib/blob.ts                (photo binaries; used by Phase 3 admin)
farm-frontend/src/lib/auth.ts                (admin login)
farm-frontend/src/lib/prisma.ts              (canonical DB client)
farm-frontend/src/app/api/farms/route.ts     GET handler only
farm-frontend/src/app/api/farms/weekend/route.ts
farm-frontend/src/app/api/farms/open-now-count/route.ts
farm-frontend/src/app/api/contact/submit/route.ts
farm-frontend/src/app/api/search/route.ts
farm-frontend/src/app/api/w3w/convert/route.ts
farm-frontend/src/app/api/cron/bing-sitemap-ping/route.ts
farm-frontend/src/app/api/admin/login/route.ts + logout/route.ts
farm-frontend/src/app/admin/page.tsx (shell)
farm-frontend/src/app/admin/login/page.tsx
farm-frontend/src/app/admin/documentation/page.tsx
farm-frontend/src/app/admin/produce/* (produce admin — keep until verified dead in Phase 3)
All public routes/pages/components/hooks/design tokens
```

---

## The Deletion Recipe (reused by every slice)

Every Phase 0 slice follows the same pattern. Steps below are written out IN FULL for Slice 0.1; subsequent slices reference "Deletion Recipe step N" to avoid duplication while keeping each step concrete and complete.

```
1. PREFLIGHT GREP        — prove zero non-self consumers of each target
2. CREATE BRANCH         — feature branch from origin/master
3. DELETE FILES          — git rm each target
4. EDIT (if any)         — surgical edits with exact line ranges
5. RUN TYPECHECK         — pnpm exec tsc --noEmit; must exit 0
6. RUN UNIT TESTS        — pnpm test:unit; must pass (no new failures)
7. RUN BUILD             — pnpm build; must exit 0
8. POSTFLIGHT GREP       — prove zero remaining references
9. COMMIT                — conventional commit, references this plan
10. PUSH + PR            — auto-generated body with before/after stats
11. AUTO-MERGE on green CI
12. RESET LOCAL MASTER   — git checkout master; git pull --ff-only
```

If any step fails, STOP and report — do not bypass with `--no-verify` or skip steps.

---

## Task 1 (Slice 0.1) — Admin farm-moderation routes & UI (6 files)

**Files:**
- Delete: `farm-frontend/src/app/api/admin/farms/route.ts`
- Delete: `farm-frontend/src/app/api/admin/farms/[id]/route.ts`
- Delete: `farm-frontend/src/app/api/admin/farms/[id]/review/route.ts`
- Delete: `farm-frontend/src/app/api/admin/farms/approve-to-live/route.ts`
- Delete: `farm-frontend/src/app/api/admin/farms/photo-stats/route.ts`
- Delete: `farm-frontend/src/app/admin/farms/page.tsx`

**Why this slice first:** all five routes are confirmed broken (audit P0); the admin page is their only UI consumer; deleting them does not yet remove `lib/redis.ts` (other consumers exist in later slices), so the project still typechecks after this slice.

- [ ] **Step 1 — Preflight grep: prove zero non-self consumers**

```bash
cd /Users/abuaa/Projects/farm-companion/farm-frontend
echo "=== consumers of admin/farms routes (should be admin page + tests only) ==="
grep -rln '/api/admin/farms' src --include='*.ts' --include='*.tsx' | grep -v 'src/app/api/admin/farms/'
echo "=== consumers of admin/farms page ==="
grep -rln "from '@/app/admin/farms\|href.*admin/farms[^/]" src --include='*.ts' --include='*.tsx'
```

Expected: the only hits are inside `src/app/admin/page.tsx` (admin dashboard linking to `/admin/farms`) — that's OK; we'll let the link 404 until Phase 3 ships an admin CRUD that owns that path. Anything else: investigate before continuing.

- [ ] **Step 2 — Create branch from origin/master**

```bash
git fetch origin master
git checkout -b strip/0.1-admin-farm-moderation origin/master
```

- [ ] **Step 3 — Delete the six files**

```bash
git rm farm-frontend/src/app/api/admin/farms/route.ts
git rm farm-frontend/src/app/api/admin/farms/[id]/route.ts
git rm farm-frontend/src/app/api/admin/farms/[id]/review/route.ts
git rm farm-frontend/src/app/api/admin/farms/approve-to-live/route.ts
git rm farm-frontend/src/app/api/admin/farms/photo-stats/route.ts
git rm farm-frontend/src/app/admin/farms/page.tsx
git status --short
```

Expected: six `D` (deleted) entries; nothing else.

- [ ] **Step 4 — No edits required (this slice is pure deletion)**

Skip.

- [ ] **Step 5 — Run typecheck**

```bash
cd farm-frontend && pnpm exec tsc --noEmit
```

Expected: exit code 0. The admin dashboard's link to `/admin/farms` is a client-side string, not a TypeScript import, so it does not cause a typecheck failure.

- [ ] **Step 6 — Run unit tests**

```bash
cd farm-frontend && pnpm test:unit
```

Expected: all 47+ existing tests pass; zero new failures.

- [ ] **Step 7 — Run build**

```bash
cd farm-frontend && pnpm build
```

Expected: exit code 0; build output shows fewer route handlers than before.

- [ ] **Step 8 — Postflight grep: prove zero remaining references**

```bash
echo "=== should all return zero hits ==="
grep -rln 'admin/farms/route\.ts\|admin/farms/\[id\]/route\|farms/\[id\]/review\|approve-to-live\|admin/farms/photo-stats' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: zero hits.

- [ ] **Step 9 — Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
strip(phase-0): delete admin farm-moderation routes and UI (Slice 0.1)

Removes the broken admin farm-moderation pipeline per the reset spec
(docs/superpowers/specs/2026-05-18-farm-companion-reset-design.md):

- api/admin/farms (GET) — reads dead Redis key, always returns {}
- api/admin/farms/[id] — orphan
- api/admin/farms/[id]/review — reads/writes the same dead Redis key
- api/admin/farms/approve-to-live — reads from a filesystem path
  nothing writes to (data/farms/<id>.json) and never updates Prisma
- api/admin/farms/photo-stats — depends on lib/redis (to be removed)
- src/app/admin/farms/page.tsx — the UI consumer of the above

6 files removed (~835 LOC). lib/redis.ts stays for now (other consumers
in slices 0.2-0.9 still import it); final removal is in Slice 0.10.

Verification:
- pnpm exec tsc --noEmit: PASS
- pnpm test:unit: PASS (47+ tests)
- pnpm build: PASS
- grep for any of the removed routes/page: zero hits

Phase 0 strip: 1/10 slices complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 10 — Push and open PR**

```bash
git push -u origin strip/0.1-admin-farm-moderation
gh pr create --base master --head strip/0.1-admin-farm-moderation \
  --title "strip(phase-0): delete admin farm-moderation routes and UI (Slice 0.1)" \
  --body "Implements Slice 0.1 of \`docs/superpowers/plans/2026-05-18-phase-0-strip.md\`. Deletes the admin farm-moderation pipeline (5 broken API routes + 1 UI page, ~835 LOC). Verification: typecheck, unit tests, build all green. No new dependencies added.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 11 — Wait for CI green, then auto-merge**

```bash
PR=$(gh pr list --head strip/0.1-admin-farm-moderation --json number --jq '.[0].number')
gh pr checks "$PR" --watch
gh pr merge "$PR" --squash --delete-branch
```

- [ ] **Step 12 — Reset local master**

```bash
git checkout master && git pull --ff-only origin master
```

---

## Task 2 (Slice 0.2) — User farm-submission flow (4 files)

**Files:**
- Delete: `farm-frontend/src/app/api/farms/submit/route.ts`
- Delete: `farm-frontend/src/app/api/admin/migrate-farms/route.ts`
- Delete: `farm-frontend/src/app/add/page.tsx`
- Modify: `farm-frontend/src/app/api/farms/route.ts` (remove POST handler at lines 248-413, remove `interface FarmShopData` at lines 10-46, remove now-unused imports — keep GET handler intact)

- [ ] **Step 1 — Preflight grep**

```bash
cd /Users/abuaa/Projects/farm-companion/farm-frontend
echo "=== consumers of /api/farms/submit ==="
grep -rln "'/api/farms/submit'\|\"/api/farms/submit\"\|/api/farms/submit" src --include='*.ts' --include='*.tsx' | grep -v 'src/app/api/farms/submit/'
echo "=== consumers of /api/admin/migrate-farms ==="
grep -rln 'migrate-farms' src --include='*.ts' --include='*.tsx'
echo "=== consumers of /add page or POST /api/farms ==="
grep -rln "href.*'/add'\|href=\"/add\"\|router.push.*'/add'" src --include='*.ts' --include='*.tsx'
```

Expected: `/api/farms/submit` consumed only by `src/app/add/page.tsx` (about to delete); `migrate-farms` has zero hits; `/add` link may exist in nav components — flag any such usage to be removed in this slice (add to the file list).

- [ ] **Step 2 — Create branch**

```bash
git fetch origin master
git checkout -b strip/0.2-user-submission origin/master
```

- [ ] **Step 3 — Delete the three full-file targets**

```bash
git rm farm-frontend/src/app/api/farms/submit/route.ts
git rm farm-frontend/src/app/api/admin/migrate-farms/route.ts
git rm farm-frontend/src/app/add/page.tsx
```

- [ ] **Step 4 — Surgical edit of `api/farms/route.ts`**

Read the file once to confirm line numbers (file shifts may occur if anything has been touched since this plan was written). Then:

```bash
grep -n 'interface FarmShopData\|^async function farmsHandler\|^export async function POST\|^// Export with performance' farm-frontend/src/app/api/farms/route.ts
```

Expected anchors (at plan-time):
```
10:interface FarmShopData {
46:}
66:async function farmsHandler(request: NextRequest) {
246:}
248:export async function POST(request: NextRequest) {
413:}
415:// Export with performance middleware
```

Edits (use the Edit tool):
1. Delete lines 248-413 (the entire `export async function POST(...) { ... }` block).
2. Delete lines 10-46 (the `interface FarmShopData {...}` block — used only by POST).
3. Remove now-unused imports:
   - `import { errors, handleApiError } from '@/lib/errors'` — keep `handleApiError` (used by `farmsHandler`); remove `errors`.
   - Inspect for any other now-unused symbols by running `pnpm exec tsc --noEmit` and addressing each `'X' is declared but its value is never read` warning.

- [ ] **Step 5 — Run typecheck**

```bash
cd farm-frontend && pnpm exec tsc --noEmit
```

Expected: exit 0. If errors mention removed `FarmShopData` or unused imports, fix the imports per Step 4 sub-bullet 3.

- [ ] **Step 6 — Run unit tests**

```bash
cd farm-frontend && pnpm test:unit
```

Expected: all green. If `api/farms/submit` has a companion test file (`*.test.ts`), delete that too and re-run.

- [ ] **Step 7 — Run build**

```bash
cd farm-frontend && pnpm build
```

Expected: exit 0. Build output no longer lists `/api/farms/submit`, `/add`, or `/api/admin/migrate-farms` routes.

- [ ] **Step 8 — Postflight grep**

```bash
grep -rln '/api/farms/submit\|/api/admin/migrate-farms\|src/app/add\|interface FarmShopData' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
grep -n 'export async function POST\|export async function GET' farm-frontend/src/app/api/farms/route.ts
```

Expected: zero hits on first grep. Second grep shows ONLY the GET-wrapped export at the bottom of the file (no POST).

- [ ] **Step 9 — Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
strip(phase-0): delete user farm-submission flow (Slice 0.2)

Removes the user-submission write path per the reset spec. Pre-launch
state = no users to break. Future "submit a farm" UX will be a mailto
link or, post-Phase-3, a clean operator-managed admin form.

Files removed:
- api/farms/submit/route.ts — broken (writes to dead Redis key, then
  swallows exceptions; admin queue never sees the data)
- api/admin/migrate-farms/route.ts — zero callers (no cron, no UI, no
  script)
- src/app/add/page.tsx — the submission form UI (877 LOC), depends on
  PhotoSubmissionForm + FarmImageUpload (removed in Slice 0.5)
- POST handler from api/farms/route.ts (~165 LOC) and the orphan
  FarmShopData interface

GET handler at api/farms preserved (it's the public read path).

Verification:
- pnpm exec tsc --noEmit: PASS
- pnpm test:unit: PASS
- pnpm build: PASS, no /api/farms/submit or /add route in output

Phase 0 strip: 2/10 slices complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 10-12 — Push, PR, merge, reset (per Deletion Recipe)**

Same shape as Task 1 steps 10-12; substitute the branch name `strip/0.2-user-submission` and PR title `strip(phase-0): delete user farm-submission flow (Slice 0.2)`.

---

## Task 3 (Slice 0.3) — User photo upload API (5 files)

**Files:**
- Delete: `farm-frontend/src/app/api/photos/upload-url/route.ts`
- Delete: `farm-frontend/src/app/api/photos/finalize/route.ts`
- Delete: `farm-frontend/src/app/api/photos/[id]/route.ts`
- Delete: `farm-frontend/src/app/api/photos/upload-blob/route.ts`
- Delete: `farm-frontend/src/app/api/photos/deletion-requests/route.ts`

- [ ] **Step 1 — Preflight grep**

```bash
grep -rln '/api/photos/upload-url\|/api/photos/finalize\|/api/photos/upload-blob\|/api/photos/deletion-requests' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v 'src/app/api/photos/'
grep -rln 'fetch.*photos/\[id\]' farm-frontend/src --include='*.ts' --include='*.tsx'
```

Expected: consumers are `PhotoSubmissionForm`, `FarmImageUpload`, `PhotoDeletionRequest` components — they will be deleted in Slice 0.5, so the orphan API routes can go now without breaking anything except those component runtimes. The components themselves still compile because they reference URLs as strings, not as TypeScript imports.

- [ ] **Step 2 — Create branch**

```bash
git fetch origin master
git checkout -b strip/0.3-user-photo-api origin/master
```

- [ ] **Step 3 — Delete the five route files**

```bash
git rm farm-frontend/src/app/api/photos/upload-url/route.ts
git rm farm-frontend/src/app/api/photos/finalize/route.ts
git rm farm-frontend/src/app/api/photos/[id]/route.ts
git rm farm-frontend/src/app/api/photos/upload-blob/route.ts
git rm farm-frontend/src/app/api/photos/deletion-requests/route.ts
```

- [ ] **Steps 5-7 — Typecheck, tests, build** (per Deletion Recipe)

```bash
cd farm-frontend && pnpm exec tsc --noEmit && pnpm test:unit && pnpm build
```

Expected: all PASS. The photo components still typecheck (they fetch URLs as strings).

- [ ] **Step 8 — Postflight grep**

```bash
grep -rln 'app/api/photos/upload-url\|app/api/photos/finalize\|app/api/photos/upload-blob\|app/api/photos/deletion-requests\|app/api/photos/\[id\]' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: zero hits.

- [ ] **Steps 9-12 — Commit, push, PR, merge, reset**

Commit message body:

```
strip(phase-0): delete user photo upload API routes (Slice 0.3)

Five routes that comprise the user-photo upload pipeline are removed.
Pre-launch state + KILLED-list scope per reset spec.

- api/photos/upload-url
- api/photos/finalize
- api/photos/[id] (GET/PATCH/DELETE)
- api/photos/upload-blob
- api/photos/deletion-requests

Photo-related UI components (PhotoSubmissionForm, FarmImageUpload,
PhotoDeletionRequest) remain in-tree but with dead API targets. They
are deleted in Slice 0.5.

Verification: tsc PASS, tests PASS, build PASS, postflight grep clean.

Phase 0 strip: 3/10 slices complete.
```

Branch: `strip/0.3-user-photo-api`.

---

## Task 4 (Slice 0.4) — Admin photo-moderation routes (5 files)

**Files:**
- Delete: `farm-frontend/src/app/api/admin/photos/approve/route.ts`
- Delete: `farm-frontend/src/app/api/admin/photos/reject/route.ts`
- Delete: `farm-frontend/src/app/api/admin/photos/remove/route.ts`
- Delete: `farm-frontend/src/app/api/admin/photos/cleanup-broken/route.ts`
- Delete: `farm-frontend/src/app/api/admin/photos/cleanup-deleted/route.ts`

- [ ] **Step 1 — Preflight grep**

```bash
grep -rln '/api/admin/photos/approve\|/api/admin/photos/reject\|/api/admin/photos/remove\|/api/admin/photos/cleanup' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v 'src/app/api/admin/photos/'
```

Expected: consumers are the admin photo UI pages (`src/app/admin/photos/page.tsx` + `approved/page.tsx`); they are deleted in Slice 0.5.

- [ ] **Step 2 — Branch**

```bash
git fetch origin master && git checkout -b strip/0.4-admin-photo-api origin/master
```

- [ ] **Step 3 — Delete the five files**

```bash
git rm farm-frontend/src/app/api/admin/photos/approve/route.ts
git rm farm-frontend/src/app/api/admin/photos/reject/route.ts
git rm farm-frontend/src/app/api/admin/photos/remove/route.ts
git rm farm-frontend/src/app/api/admin/photos/cleanup-broken/route.ts
git rm farm-frontend/src/app/api/admin/photos/cleanup-deleted/route.ts
```

- [ ] **Steps 5-12 — Recipe**

Typecheck, tests, build, postflight grep, commit, push, PR (branch `strip/0.4-admin-photo-api`), merge, reset.

Commit body:

```
strip(phase-0): delete admin photo-moderation API routes (Slice 0.4)

Five routes that comprise the admin photo moderation pipeline. All
depend on lib/redis (deleted in Slice 0.10) and are unused after the
photo-write pipeline goes away (Slice 0.3).

Verification: tsc PASS, tests PASS, build PASS, postflight grep clean.

Phase 0 strip: 4/10 slices complete.
```

---

## Task 5 (Slice 0.5) — Admin photo UI + user photo components (6 files)

**Files:**
- Delete: `farm-frontend/src/app/admin/photos/page.tsx`
- Delete: `farm-frontend/src/app/admin/photos/approved/page.tsx`
- Delete: `farm-frontend/src/components/PhotoSubmissionForm.tsx`
- Delete: `farm-frontend/src/components/FarmImageUpload.tsx`
- Delete: `farm-frontend/src/components/PhotoDeletionRequest.tsx`
- Modify: `farm-frontend/src/components/FarmPageClient.tsx` (remove `import PhotoSubmissionForm from './PhotoSubmissionForm'` at line 23 + the `<PhotoSubmissionForm ... />` block at line 262 + any surrounding now-empty container)

- [ ] **Step 1 — Preflight grep**

```bash
grep -rln 'PhotoSubmissionForm\|FarmImageUpload\|PhotoDeletionRequest' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
grep -rln "href=\"/admin/photos\|href='/admin/photos\|href={`?/admin/photos" farm-frontend/src --include='*.ts' --include='*.tsx'
```

Expected: PhotoSubmissionForm has the one usage in `FarmPageClient.tsx` (about to be edited); the other two components are only referenced by themselves and `src/app/add/page.tsx` (deleted in Slice 0.2). Any `/admin/photos` link from the admin dashboard is OK to leave broken until Phase 3 (same disposition as Slice 0.1).

- [ ] **Step 2 — Branch**

```bash
git fetch origin master && git checkout -b strip/0.5-photo-ui origin/master
```

- [ ] **Step 3 — Delete the five full-file targets**

```bash
git rm farm-frontend/src/app/admin/photos/page.tsx
git rm farm-frontend/src/app/admin/photos/approved/page.tsx
git rm farm-frontend/src/components/PhotoSubmissionForm.tsx
git rm farm-frontend/src/components/FarmImageUpload.tsx
git rm farm-frontend/src/components/PhotoDeletionRequest.tsx
```

- [ ] **Step 4 — Surgical edit of `FarmPageClient.tsx`**

Read the file. Find:
1. Line 23: `import PhotoSubmissionForm from './PhotoSubmissionForm'` — delete this import line.
2. Line 262 (anchor `<PhotoSubmissionForm`) — delete the entire `<PhotoSubmissionForm ... />` JSX block. Inspect the surrounding ~10 lines: if there is a wrapping `<section>`, `<div>`, or conditional that becomes empty after removal, delete that too. If it shares a wrapper with another sibling that stays, just delete the `<PhotoSubmissionForm>` block.

Use the Edit tool with `old_string` = the literal import line, and a second Edit for the JSX block.

- [ ] **Steps 5-7 — Typecheck, tests, build**

```bash
cd farm-frontend && pnpm exec tsc --noEmit && pnpm test:unit && pnpm build
```

If tsc reports any now-unused imports in `FarmPageClient.tsx` (e.g. types that were only used by the removed JSX), remove them too.

- [ ] **Step 8 — Postflight grep**

```bash
grep -rln 'PhotoSubmissionForm\|FarmImageUpload\|PhotoDeletionRequest' farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: zero hits.

- [ ] **Steps 9-12 — Recipe**

Branch `strip/0.5-photo-ui`. Commit body:

```
strip(phase-0): delete photo UI components and admin photo pages (Slice 0.5)

Removes the user-facing photo upload UI from public farm pages (the
PhotoSubmissionForm block in FarmPageClient.tsx) and the admin photo
moderation pages. Pre-launch + KILLED scope.

Files removed:
- src/app/admin/photos/page.tsx
- src/app/admin/photos/approved/page.tsx
- src/components/PhotoSubmissionForm.tsx
- src/components/FarmImageUpload.tsx
- src/components/PhotoDeletionRequest.tsx

Edited:
- src/components/FarmPageClient.tsx — removed PhotoSubmissionForm
  import + the JSX block on the farm detail page

Phase 0 strip: 5/10 slices complete.
```

---

## Task 6 (Slice 0.6) — Newsletter feature (4 files)

**Files:**
- Delete: `farm-frontend/src/app/api/newsletter/subscribe/route.ts`
- Delete: `farm-frontend/src/app/api/newsletter/unsubscribe/route.ts`
- Delete: `farm-frontend/src/components/NewsletterSignup.tsx`
- Modify: `farm-frontend/src/app/page.tsx` (remove `const NewsletterSignup = dynamic(...)` block at lines 36-37 + the `<NewsletterSignup />` render at line 171)

- [ ] **Step 1 — Preflight grep**

```bash
grep -rln 'NewsletterSignup\|/api/newsletter/' farm-frontend/src --include='*.ts' --include='*.tsx'
```

Expected: only the listed files + `src/app/page.tsx`. Any other hit means there's a `/unsubscribe` page or footer link to flag.

- [ ] **Step 2 — Branch**

```bash
git fetch origin master && git checkout -b strip/0.6-newsletter origin/master
```

- [ ] **Step 3 — Delete the three full-file targets**

```bash
git rm farm-frontend/src/app/api/newsletter/subscribe/route.ts
git rm farm-frontend/src/app/api/newsletter/unsubscribe/route.ts
git rm farm-frontend/src/components/NewsletterSignup.tsx
```

- [ ] **Step 4 — Surgical edit of `src/app/page.tsx`**

Anchors (from plan-time inspection):
```
36:const NewsletterSignup = dynamic(
37:  () => import('@/components/NewsletterSignup')
...
171:          <NewsletterSignup />
```

1. Delete the multi-line `const NewsletterSignup = dynamic(...)` block starting at line 36. This block typically spans 3-5 lines ending with `)`.
2. Delete the `<NewsletterSignup />` JSX render at line 171 + any wrapping `<section>` or container that only existed to hold the signup.

Run `pnpm exec tsc --noEmit` after the edit; if `dynamic` becomes unused (no other dynamic imports in the file), remove its import too.

- [ ] **Steps 5-8 — Recipe**

Typecheck PASS; tests PASS; build PASS; postflight grep for `NewsletterSignup\|/api/newsletter/` returns zero hits in `src/`.

- [ ] **Steps 9-12 — Commit, PR, merge, reset**

Branch `strip/0.6-newsletter`. Commit body:

```
strip(phase-0): delete newsletter feature (Slice 0.6)

Newsletter signup was a dead-letter office: the route received POSTs,
sent a welcome email, then discarded the subscriber. TODO comment in
newsletter.service.ts (line 58) confirmed it was never wired to a
subscriber store.

Files removed:
- api/newsletter/subscribe/route.ts
- api/newsletter/unsubscribe/route.ts
- src/components/NewsletterSignup.tsx

Edited:
- src/app/page.tsx — removed NewsletterSignup dynamic import and
  render block

Phase 0 strip: 6/10 slices complete.
```

---

## Task 7 (Slice 0.7) — Claims feature (5 files)

**Files:**
- Delete: `farm-frontend/src/app/api/claims/route.ts`
- Delete: `farm-frontend/src/components/ClaimForm.tsx`
- Delete: `farm-frontend/src/app/claim/page.tsx`
- Delete: `farm-frontend/src/app/claim/[slug]/page.tsx`
- Delete: `farm-frontend/src/app/admin/claims/page.tsx`

- [ ] **Step 1 — Preflight grep**

```bash
grep -rln 'ClaimForm\|/api/claims\|src/app/claim\|/admin/claims' farm-frontend/src --include='*.ts' --include='*.tsx'
```

Expected: only the listed files. Any nav link to `/claim` should be removed in this slice too — add to file list and commit message.

- [ ] **Step 2 — Branch**

```bash
git fetch origin master && git checkout -b strip/0.7-claims origin/master
```

- [ ] **Step 3 — Delete the five files**

```bash
git rm farm-frontend/src/app/api/claims/route.ts
git rm farm-frontend/src/components/ClaimForm.tsx
git rm farm-frontend/src/app/claim/page.tsx
git rm 'farm-frontend/src/app/claim/[slug]/page.tsx'
git rm farm-frontend/src/app/admin/claims/page.tsx
# Clean up the now-empty claim/ and admin/claims/ directories if needed
rmdir farm-frontend/src/app/claim/[slug] farm-frontend/src/app/claim farm-frontend/src/app/admin/claims 2>/dev/null || true
```

- [ ] **Steps 5-12 — Recipe**

Branch `strip/0.7-claims`. Commit body:

```
strip(phase-0): delete claim flow (Slice 0.7)

Farm-owner claim feature is deferred to post-launch per reset spec.
Pre-launch state means zero pending claims to preserve.

Files removed:
- api/claims/route.ts
- src/components/ClaimForm.tsx
- src/app/claim/page.tsx
- src/app/claim/[slug]/page.tsx
- src/app/admin/claims/page.tsx

Phase 0 strip: 7/10 slices complete.
```

---

## Task 8 (Slice 0.8) — Misc dead public endpoints (7 files)

**Files:**
- Delete: `farm-frontend/src/app/api/consent/route.ts`
- Delete: `farm-frontend/src/app/api/feedback/route.ts`
- Delete: `farm-frontend/src/app/api/indexnow/route.ts`
- Delete: `farm-frontend/src/app/api/performance/dashboard/route.ts`
- Delete: `farm-frontend/src/app/api/farms/data/route.ts`
- Delete: `farm-frontend/src/app/api/farms-cached/route.ts`
- Delete: `farm-frontend/src/app/api/farms/status/[id]/route.ts`

- [ ] **Step 1 — Preflight grep**

```bash
for path in '/api/consent' '/api/feedback' '/api/indexnow' '/api/performance/dashboard' '/api/farms/data' '/api/farms-cached' '/api/farms/status'; do
  hits=$(grep -rln "$path" farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v "src/app$path" | wc -l)
  echo "$path: $hits external consumers"
done
```

Expected: every line reports `0 external consumers`. If any is non-zero, investigate before deleting.

- [ ] **Step 2 — Branch + Step 3 delete**

```bash
git fetch origin master && git checkout -b strip/0.8-dead-public-endpoints origin/master
git rm farm-frontend/src/app/api/consent/route.ts
git rm farm-frontend/src/app/api/feedback/route.ts
git rm farm-frontend/src/app/api/indexnow/route.ts
git rm farm-frontend/src/app/api/performance/dashboard/route.ts
git rm farm-frontend/src/app/api/farms/data/route.ts
git rm farm-frontend/src/app/api/farms-cached/route.ts
git rm 'farm-frontend/src/app/api/farms/status/[id]/route.ts'
```

- [ ] **Steps 5-12 — Recipe**

Commit body:

```
strip(phase-0): delete misc dead public API endpoints (Slice 0.8)

Seven API routes with zero live consumers per audit §3.

- api/consent — never imported
- api/feedback — never imported
- api/indexnow — superseded by Bing sitemap ping cron
- api/performance/dashboard — orphaned ops tool
- api/farms/data — orphan (canonical is /api/farms GET)
- api/farms-cached — orphan (canonical is /api/farms GET)
- api/farms/status/[id] — orphan

Phase 0 strip: 8/10 slices complete.
```

Branch: `strip/0.8-dead-public-endpoints`.

---

## Task 9 (Slice 0.9) — Admin ops tools & dead upload (6 files)

**Files:**
- Delete: `farm-frontend/src/app/api/admin/database-integrity/route.ts`
- Delete: `farm-frontend/src/app/api/admin/audit/sitemap-reconciliation/route.ts`
- Delete: `farm-frontend/src/app/api/admin/generate-images/route.ts`
- Delete: `farm-frontend/src/app/api/admin/generate-produce-images/route.ts`
- Delete: `farm-frontend/src/app/api/admin/generate-batch/route.ts`
- Delete: `farm-frontend/src/app/api/upload/route.ts`

- [ ] **Step 1 — Preflight grep**

```bash
for path in 'database-integrity' 'sitemap-reconciliation' 'generate-images' 'generate-produce-images' 'generate-batch' 'api/upload'; do
  hits=$(grep -rln "$path" farm-frontend/src --include='*.ts' --include='*.tsx' | grep -v "src/app/api/admin/$path\|src/app/api/$path" | wc -l)
  echo "$path: $hits external consumers"
done
```

Expected: every line reports 0 external consumers. The produce-image generators might be called by `src/app/admin/produce/upload/page.tsx` — if so, surface the dependency (do not delete in this slice; either include produce admin pages in this slice or defer to a Phase 3 cleanup).

- [ ] **Step 2 — Branch + Step 3 delete** (per recipe)

Branch `strip/0.9-admin-ops-tools`.

```bash
git rm farm-frontend/src/app/api/admin/database-integrity/route.ts
git rm farm-frontend/src/app/api/admin/audit/sitemap-reconciliation/route.ts
git rm farm-frontend/src/app/api/admin/generate-images/route.ts
git rm farm-frontend/src/app/api/admin/generate-produce-images/route.ts
git rm farm-frontend/src/app/api/admin/generate-batch/route.ts
git rm farm-frontend/src/app/api/upload/route.ts
```

- [ ] **Steps 5-12 — Recipe**

Commit body:

```
strip(phase-0): delete admin ops tools and dead upload route (Slice 0.9)

Six routes that were one-shot ops tools or orphans:

- api/admin/database-integrity — depended on database-constraints
- api/admin/audit/sitemap-reconciliation — never scheduled
- api/admin/generate-{images,produce-images,batch} — manual batch jobs
- api/upload — orphan generic upload

This slice leaves only lib/redis.ts and lib/database-constraints.ts as
the remaining pseudo-DB surface; both go in Slice 0.10.

Phase 0 strip: 9/10 slices complete.
```

---

## Task 10 (Slice 0.10) — Final pseudo-DB cleanup (2 files + verify)

**Files:**
- Delete: `farm-frontend/src/lib/redis.ts`
- Delete: `farm-frontend/src/lib/database-constraints.ts`
- Modify: `farm-frontend/package.json` (remove `"redis": "^X.Y.Z"` from `dependencies` since the lib is no longer imported)

- [ ] **Step 1 — Final preflight: every old consumer must be gone**

```bash
echo "=== lib/redis.ts importers (must be zero before we delete it) ==="
grep -rln "from '@/lib/redis'\|from '../../../lib/redis'\|from '../../lib/redis'\|from '../lib/redis'" farm-frontend/src --include='*.ts' --include='*.tsx'
echo "=== lib/database-constraints.ts importers (must be zero) ==="
grep -rln "from '@/lib/database-constraints'\|from '../../../lib/database-constraints'\|database-constraints" farm-frontend/src --include='*.ts' --include='*.tsx'
```

Expected: both return zero hits. If anything is non-zero, identify the consumer and either delete it (if it's also in the KILL list — likely an admin produce page if produce was deferred) or pause Slice 0.10 to fix.

- [ ] **Step 2 — Branch**

```bash
git fetch origin master && git checkout -b strip/0.10-pseudo-db-cleanup origin/master
```

- [ ] **Step 3 — Delete the two lib files**

```bash
git rm farm-frontend/src/lib/redis.ts
git rm farm-frontend/src/lib/database-constraints.ts
```

- [ ] **Step 4 — Remove the `redis` npm dependency**

```bash
cd farm-frontend
# Verify nothing else imports `redis` (the npm package, not our lib path)
grep -rln "from 'redis'\|require('redis')" src --include='*.ts' --include='*.tsx' --include='*.js'
# Expected: zero hits. If anything is non-zero, STOP.

pnpm remove redis
git diff farm-frontend/package.json farm-frontend/pnpm-lock.yaml | head -30
```

- [ ] **Step 5 — Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: exit 0. Any error here means there's still an importer — STOP and investigate.

- [ ] **Step 6 — Unit tests**

```bash
pnpm test:unit
```

Expected: all green.

- [ ] **Step 7 — Build**

```bash
pnpm build
```

Expected: exit 0. Build output is meaningfully smaller (no redis client bundling).

- [ ] **Step 8 — Postflight grep**

```bash
grep -rln 'lib/redis\|database-constraints' farm-frontend/src --include='*.ts' --include='*.tsx'
# Expected: zero hits.

grep -rln "from 'redis'\|require('redis')" farm-frontend --include='*.ts' --include='*.tsx' --include='*.js' | grep -v node_modules
# Expected: zero hits in src/; one-shot ops scripts in farm-frontend/scripts/ may remain; flag them
# for a separate cleanup PR if found.
```

- [ ] **Steps 9-12 — Commit, push, PR, merge, reset**

Branch `strip/0.10-pseudo-db-cleanup`. Commit body:

```
strip(phase-0): delete pseudo-DB layer (Slice 0.10 — Phase 0 complete)

Removes the final two pseudo-DB files plus the `redis` npm dependency.
At this point the codebase has exactly three storage primitives:
- Postgres (Prisma) — canonical store
- Vercel KV (Upstash REST via lib/kv.ts) — ephemeral only
- Vercel Blob — photo binaries (admin-uploaded, post-Phase-3)

Files removed:
- src/lib/redis.ts
- src/lib/database-constraints.ts
- `redis` npm dependency from package.json

Verification:
- pnpm exec tsc --noEmit: PASS
- pnpm test:unit: PASS
- pnpm build: PASS, bundle size reduced
- postflight grep for lib/redis or database-constraints: 0 hits

Phase 0 strip COMPLETE: 10/10 slices, ~38 files removed, ~4,390 LOC
deleted, codebase shrunk to the Tool-spine MVP.

Next phase: Phase 1 — STABILIZE the public read path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## Phase 0 exit gate

Phase 0 is complete when all 10 slices are merged to master AND:
- `grep -r 'lib/redis\|database-constraints\|/api/admin/farms\|/api/admin/migrate-farms\|/api/photos/upload\|/api/photos/finalize\|/api/newsletter\|/api/claims\|/api/upload' farm-frontend/src` returns zero hits.
- `pnpm exec tsc --noEmit` on the merged master is green.
- `pnpm build` on the merged master is green.
- A manual smoke test of the public site (`/`, `/shop`, `/shop/<a-known-slug>`, `/search?q=test`) loads without errors.
- The execution ledger and the reset spec's "Definition of done" section are updated to mark Phase 0 complete.

After exit, invoke `superpowers:writing-plans` (or `superpowers:brainstorming` first if scope shifts) to produce the Phase 1 implementation plan.

---

*Plan compiled 2026-05-18 from `docs/superpowers/specs/2026-05-18-farm-companion-reset-design.md` and Explore-agent dead-code inventory. Verified file paths and line anchors at plan-time; an executor SHOULD re-verify anchors before edits since the tree may shift between slices.*

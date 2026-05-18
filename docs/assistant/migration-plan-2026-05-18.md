# Farm Companion — Single-Source-of-Truth Migration Plan (2026-05-18)

**Inputs:** `docs/assistant/audit-2026-05-18.md` (three-agent diagnosis) + council verdict (Architect/Skeptic/Pragmatist/Critic, 2026-05-18). Architectural target: **Prisma+Postgres canonical for entities; Upstash KV for ephemeral only; node-redis client and Coolify Redis container deleted**.

**Council changes this plan made to the original audit's plan:**
- Cutover policy for submissions: dropped dual-write, simple write-then-flip (Skeptic — submissions have no live correct readers today).
- Phase 0 scope: dropped `@deprecated` quarantine (theatre); added deletion of dead `POST /api/farms` `Farm.status='pending'` path (latent contradiction with Phase 1).
- Added **Phase −0.5 production-verification gate** before any code (Skeptic — validate the audit's premise with three prod queries).
- Added **backfill test harness as its own slice** (Critic — single highest-risk artifact in the migration).
- Added **operator triage gate** before backfill writes prod (Pragmatist — operator has never seen the accumulated submission backlog).
- Hard-gated Phase 4 on workspace-wide `grep REDIS_URL` (Pragmatist — Coolify container may serve other apps).
- Google PhotoRef refresh decision **must precede Phase 2 backfill, not deferred** (Critic — URLs already expiring).

---

## How operator tasks are written in this plan

Every operator action is broken into **baby steps**. Each baby step follows the same shape so you can copy-paste it into a terminal without thinking:

```
STEP N — <one-line goal>
  Prereq:   <what must be true before you start>
  Where:    <which terminal / which machine / which directory>
  Command:  <exact shell command to run, copy-pasteable>
  Paste:    <the literal text or output to paste back into chat>
  Success:  <what the result should look like if it worked>
  If fails: <what to do instead — never guess>
```

If a step says "paste the output back here", paste it into the chat verbatim — do not summarise. If anything is unclear, stop and ask before running the next step. Steps are numbered globally within their phase so you can refer to them in chat (e.g. "Step −0.5.3 returned …").

### 🔒 Credential handling (READ BEFORE FIRST `export`)

This plan asks you to set `REDIS_URL` and `DATABASE_URL` in your shell. **These are production secrets.** Three rules, no exceptions:

1. **NEVER paste the full URL or password into chat.** Not in the command you ran, not in an error message, not "just this once". The chat transcript is permanent and is captured by `claude-mem` observation hooks.
2. **Only ever paste back the `Paste:` field of a step** — usually a sanity prefix (`"redis://defa…"`) or a numeric count (`42`).
3. **If you accidentally pasted a credential, stop and run the rotation protocol below before doing anything else.**

Common slip: pasting a whole terminal session (including the `export` line) instead of just the `Paste:` field. **Don't paste full terminal sessions.** Run the command, then copy ONLY the lines the step asks for.

#### 🚨 Credential leak rotation protocol

```
STEP LEAK.1 — Rotate the leaked credential at the source
  Where:    Coolify dashboard (for REDIS_URL) OR Supabase/Hetzner (for DATABASE_URL)
  Paste:    "Rotated" (one word — never the new credential)

STEP LEAK.2 — Update env vars on every Vercel project that uses it
  Where:    Vercel → each project → Settings → Env Vars
            REDIS_URL: BOTH farm-frontend AND farm-produce-images
            DATABASE_URL: farm-frontend (check sibling apps too)
  Paste:    "Updated <project-name> envs (prod + preview + dev)"

STEP LEAK.3 — Update local .env files
  Where:    farm-frontend/.env.local and any sibling app .env.local
  Paste:    "Updated local .env files"

STEP LEAK.4 — Trigger redeploys
  Where:    Vercel dashboard → each affected project → Redeploy latest
  Paste:    "All redeploys ready"

STEP LEAK.5 — Resume the original baby step you were on
  Note:     With the NEW credential set in your shell via export.
```

### 🔌 If `redis-cli` from your laptop says "Could not connect / nodename nor servname provided"

Your `REDIS_URL` hostname is an internal Coolify service ID (e.g. `oj5z6ma…`). It only resolves from inside the Coolify network. Pick ONE of:

- **Option A — Run from the Coolify host directly (simplest):**
  ```
  ssh <user>@<coolify-host>
  docker exec -it <redis-container-name> redis-cli
  ```
  Inside redis-cli: `KEYS farm-submission:*` then count, and `HLEN farm_submissions`.

- **Option B — SSH tunnel from your laptop:**
  ```
  ssh -L 6379:<internal-redis-hostname>:6379 <user>@<coolify-host>
  # in a second terminal:
  redis-cli -u "redis://default:<password>@127.0.0.1:6379/0" --scan --pattern 'farm-submission:*' | wc -l
  ```

- **Option C — Ask the assistant for a one-shot script** that runs inside Vercel/Next.js (which already has Upstash KV access via the `kv` shim) and emits the counts to stdout.

Whichever you pick, the answer to paste back is still just the integer counts.

---

## Phase −1 — Ship existing rate-limit PR (immediate, 0 new slices)

**Goal:** Land the two correct-on-their-own slices already on origin so the architectural work rebases onto a known-good `master`.

**Commits:** `dcdb916` (Slice B-followup: rate-limit fail-closed on submit routes) + `599e653` (Slice B-followup-2: delete orphan `kv.lpush`).

**Status (2026-05-18):** branch `fix/rate-limit-fail-closed` pushed to origin; **PR not yet opened** (verified via `gh pr list --head fix/rate-limit-fail-closed` returning `[]`).

### Operator baby steps

```
STEP −1.1 — Confirm branch is up-to-date on origin
  Prereq:   Nothing — local repo only.
  Where:    Terminal in /Users/abuaa/Projects/farm-companion
  Command:  git fetch origin && git log --oneline origin/fix/rate-limit-fail-closed -3
  Paste:    The three-line output.
  Success:  Top two SHAs are 599e653 and dcdb916 (in that order).
  If fails: Run `git push origin fix/rate-limit-fail-closed` and retry.

STEP −1.2 — Open the PR with the assistant doing the work
  Prereq:   STEP −1.1 succeeded.
  Where:    Reply in chat — type the single word: open the rate-limit PR
  Paste:    The PR URL that comes back.
  Success:  GitHub returns a PR URL ending in /pull/<number>.
  If fails: If `gh` reports an auth error, run `gh auth login` and reply: retry.

STEP −1.3 — Merge after CI is green
  Prereq:   STEP −1.2 returned a PR URL; CI checks all green on that PR.
  Where:    GitHub web UI OR terminal.
  Command:  gh pr merge <number> --squash --delete-branch
  Paste:    The merge confirmation line (e.g. "Merged pull request #NNN").
  Success:  `git fetch origin && git log --oneline origin/master -1` shows a new merge SHA.
  If fails: If CI red, paste the failing check name back — do not force-merge.

STEP −1.4 — Confirm production redeploy
  Prereq:   STEP −1.3 succeeded.
  Where:    Vercel dashboard (or `vercel ls` if linked).
  Paste:    "Vercel deployment for master @ <sha> is Ready" — or the URL if you prefer.
  Success:  /api/contact/submit and /api/farms/submit both respond 200/4xx as expected.
  If fails: Roll back via "Promote to Production" on prior deployment, then paste the deploy URL.
```

**Risk:** None — these slices are already verified locally and live-tested against production curl.

**Rollback:** Standard `git revert <merge-sha>` on master.

---

## Phase −0.5 — Production verification (~15 min, 0 code slices)

**Goal:** Validate the audit's premise with five queries before committing to 11+ code slices. If any query contradicts the audit, the plan re-scopes.

### Workspace-side queries (Q4, Q5) — DONE 2026-05-18 by assistant

The two queries that only need the local repo were run already. Recorded results:

**Q4 — Is Coolify Redis used by any sibling app?**
- **Result:** `farm-produce-images/src/lib/database.ts` reads `process.env.REDIS_URL`. That sibling app is live (own `.vercel/` deployment, recent commits).
- **Decision applied:** Phase 4 reduces to "remove from `farm-frontend` only". The Coolify Redis container stays for `farm-produce-images`. See updated Phase 4 below.

**Q5 — Any UI/cron/docs link to the dead `migrate-farms` route?**
- **Result:** Zero source-code hits. Only references are in `docs/assistant/*.md` and `context/handover-*.md` (informational).
- **Decision applied:** Phase 0 deletion of `/api/admin/migrate-farms/route.ts` is unblocked.

### Production-side queries (Q1, Q2, Q3) — OPERATOR baby steps

These need credentials (`REDIS_URL`, `DATABASE_URL`) that live in your secrets manager — the assistant cannot run them.

```
STEP −0.5.1 — Open a shell that has REDIS_URL set
  Prereq:   You have the Coolify Redis URL in your password manager (or in farm-frontend/.env.local).
            You've read the "Credential handling" rules above.
  Where:    A terminal you'll keep open for the next three steps.
  Command:  export REDIS_URL='<paste-the-value-here>'        # do NOT commit, do NOT paste in chat
            echo "REDIS_URL set: ${REDIS_URL:0:12}…"         # sanity print (first 12 chars only)
  Paste:    ONLY this single sanity line: "REDIS_URL set: redis://defa…"
            DO NOT paste the export line. DO NOT paste the whole terminal session.
            If the prefix is "REDIS_URL set: export REDIS…", you nested quotes by mistake —
            re-run the export with a single layer of single-quotes; then re-do the sanity print.
  Success:  Sanity line prints with a non-empty 12-char prefix that starts with redis:// or rediss://
  If fails: Use `vercel env pull farm-frontend/.env.local` then `source` it; or copy from Coolify UI → Redis service → "Connection".

  NOTE on hostname: if the URL host looks like a Coolify service ID (e.g. "oj5z6ma…"),
  you CANNOT reach it from your laptop — that DNS only resolves on the Coolify network.
  Skip ahead and use Option A/B/C from the "If redis-cli can't connect" block above.

STEP −0.5.2 — Q1: how many "new path" submissions are stuck invisibly?
  Prereq:   STEP −0.5.1 done in this same shell.
  Where:    Same terminal.
  Command:  redis-cli -u "$REDIS_URL" --scan --pattern 'farm-submission:*' | wc -l
  Paste:    Just the integer (one line).
  Success:  Any integer ≥ 0.
  If fails: If "Connection refused" or TLS error, try `redis-cli --tls -u "$REDIS_URL" …`. If still failing, paste the exact error.

STEP −0.5.3 — Q2: how many "legacy path" submissions in the admin-read key?
  Prereq:   STEP −0.5.1 done.
  Where:    Same terminal.
  Command:  redis-cli -u "$REDIS_URL" HLEN 'farm_submissions'
  Paste:    Just the integer.
  Success:  Any integer ≥ 0 (expected: 0 or very small).
  If fails: Same TLS fallback as Q1.

STEP −0.5.4 — Q3: most recent Farm row in Postgres
  Prereq:   You have DATABASE_URL handy.
  Where:    Any terminal with psql available (or use Supabase/Hetzner web SQL editor).
  Command:  psql "$DATABASE_URL" -c \
              "SELECT id, name, status, created_at FROM farms ORDER BY created_at DESC LIMIT 5;"
  Paste:    The entire 5-row table output (no redaction needed — names are public).
  Success:  Output table with up to 5 rows.
  If fails: If psql missing, run the same SELECT in Supabase web SQL editor and paste the result table.

STEP −0.5.5 — Tell the assistant the queries are done
  Where:    Reply in chat.
  Paste:    Three blocks labelled "Q1:", "Q2:", "Q3:" with the outputs from steps 2–4.
  Success:  Assistant confirms the plan adjustment (or no adjustment) and unblocks Phase 0.
```

### Decision matrix (assistant uses this when you paste results)

| If Q1 result is | Then... |
|---|---|
| 0 | Live submission path may not be functional at all. Investigate before Phase 1. |
| 1–50 | Triage manually; small enough that operator can curate before backfill. |
| 50+ | Confirms audit. Phase 1's backfill triage step is mandatory. |

| If Q3 result shows | Then... |
|---|---|
| `created_at` < 1 month for status='active' | Some admin path IS working somehow. Audit may be incomplete; investigate before Phase 1. |
| All `created_at` are seed-era / no recent admin-created Farm | Audit confirmed. Proceed. |

**Risk:** None — read-only queries.

**Output:** Operator pastes Q1/Q2/Q3 results; plan adjusts; Phase 0 unblocks.

---

## Phase 0 — Pure deletion (1 slice, ~5 files, −150 LOC)

**Goal:** Remove all provably-dead code that complicates Phase 1+ reviews. Zero behavioural change.

**Pre-flight status (2026-05-18):** ✅ Phase −0.5 Q5 returned zero non-doc hits. Phase 0 deletion is unblocked. Additional grep verification (run by assistant 2026-05-18) confirmed:
- `withPerformanceRateLimit` is only referenced inside `performance-middleware.ts` itself (definition + two internal preset references).
- `/api/farms` POST handler exists at line 248; no `fetch('/api/farms', { method: 'POST' })` callers in `src/`.

**Slice 0.1 — Dead-code cull**

Files (5 / 8 budget, ~−150 LOC):
- `farm-frontend/src/lib/performance-middleware.ts` — delete `withPerformanceRateLimit` function (~50 LOC) + `performanceMiddleware.rateLimited` factory + rate-limit dimension of `.full`. (Slice B-followup-4 work, previously aborted; resurrect verbatim.)
- `farm-frontend/src/app/api/admin/migrate-farms/route.ts` — delete entire file. Zero callers confirmed by grep + Phase −0.5 Q5.
- `farm-frontend/src/app/api/farms/route.ts` — delete the unused `POST` handler (Critic's latent-contradiction concern). The route's GET handler stays (it's the only `performanceMiddleware.cached` consumer). Confirm POST has zero callers via grep before deleting.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `cd farm-frontend && pnpm exec tsc --noEmit` → exit 0
- `cd farm-frontend && pnpm exec tsx --test "src/**/*.test.ts"` → 47+ tests pass, no regressions
- `cd farm-frontend && pnpm build` → exit 0 (smoke-test that Vercel can still build the app)
- `grep -r 'withPerformanceRateLimit\|migrate-farms' farm-frontend/src --include='*.ts' --include='*.tsx'` → zero hits

Risk: Very low. All three deletions have zero verified consumers. The build smoke test catches any indirect breakage.

Rollback: `git revert <sha>` — pure restoration; no data state.

Next: Phase 1 starts on green master.

---

## Phase 1 — Submission → Postgres (4 slices)

**Goal:** Move farm submissions from the Redis pseudo-DB to Prisma `Submission` table. Restore end-to-end admin moderation. Cutover policy per Skeptic: **simple write-then-flip** — submissions have no live correct readers, so no in-flight state to protect.

**Operator decisions before Phase 1 starts** (audit open Q2):
- Confirm: separate `Submission` Prisma model OR `Farm.status='pending'`? **Plan default: separate `Submission` table** — the live Redis payload has fields (`reviewNotes`, `reviewedBy`, `_hp`, `ttf`, raw string `lat`/`lng`) that don't fit `Farm`.

### Slice 1.1 — Add `Submission` Prisma model + migration

Files (3 / 8 budget, ~+80 LOC):
- `farm-frontend/prisma/schema.prisma` — add `Submission` model with fields mapped from the live Redis hash payload (`id`, `name`, `address`, `city`, `county`, `postcode`, `contactEmail`, `website`, `phone`, `lat` (Float), `lng` (Float), `offerings`, `story`, `hours` (Json), `status` (enum: `pending`/`approved`/`rejected`/`changes-requested`), `createdAt`, `submittedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes`, `approvedAt`, `approvedBy`).
- `farm-frontend/prisma/migrations/<timestamp>_add_submission/migration.sql` — Prisma-generated.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `cd farm-frontend && pnpm prisma migrate dev --name add_submission` → creates migration file
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm exec tsx --test "src/**/*.test.ts"` → 47+ tests still green

### Operator baby steps — Slice 1.1 migration apply

```
STEP 1.1.1 — Apply the migration to staging first
  Prereq:   Slice 1.1 merged; you have STAGING_DATABASE_URL handy (the Hetzner staging DB, not prod).
  Where:    farm-frontend/ directory; terminal with the staging URL set.
  Command:  DATABASE_URL="$STAGING_DATABASE_URL" pnpm prisma migrate deploy
  Paste:    The migration name line ("Applied migration <timestamp>_add_submission").
  Success:  Exit code 0; no "drift detected" warnings.
  If fails: Paste the full error. Most common: schema drift — needs `prisma migrate resolve` first.

STEP 1.1.2 — Verify the table exists on staging
  Command:  psql "$STAGING_DATABASE_URL" -c "\d+ submissions"
  Paste:    The first 5 lines of the table description.
  Success:  Table exists with expected columns (id, name, contactEmail, status, etc.).

STEP 1.1.3 — Apply to production
  Prereq:   STEPS 1.1.1 + 1.1.2 succeeded on staging; no issues found.
  Command:  DATABASE_URL="$PROD_DATABASE_URL" pnpm prisma migrate deploy
  Paste:    The "Applied migration" line.
  Success:  Exit code 0.
  If fails: STOP — DO NOT retry blindly. Paste the error.

STEP 1.1.4 — Verify on prod
  Command:  psql "$PROD_DATABASE_URL" -c "SELECT count(*) FROM submissions;"
  Paste:    The count (expected: 0 — table is brand new).
  Success:  Count = 0; no errors.
```

Risk: Low. Pure additive schema change; no existing data affected.

Rollback: `pnpm prisma migrate resolve --rolled-back` + `DROP TABLE submissions;` if applied.

### Slice 1.2 — Switch `/api/farms/submit` to Prisma `Submission`

Files (4 / 8 budget, ~+40 / −30 LOC):
- `farm-frontend/src/app/api/farms/submit/route.ts` — replace `createRecord('submissions', farmData, id)` with `prisma.submission.create({ data: ... })`. Preserve Slice B-followup's `submitLimiter` fail-closed try/catch and the email verification + Turnstile flow exactly. Drop `database-constraints` import.
- `farm-frontend/src/app/add/page.tsx` — no change (HTTP contract unchanged; submit shape unchanged).
- Tests: optionally add an integration test for the route (deferred to a follow-up slice if scope-tight).
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm test:unit` → all green
- Manual curl test against local dev server: `curl -X POST localhost:3000/api/farms/submit ...` with realistic body → expect `201` and a row in `prisma.submission` table
- Deploy to Vercel preview, exercise the form end-to-end via UI

Risk: Medium. This is the live submission write path. A bug here means new submissions are lost OR silently double-written.

Rollback: `git revert <sha>` — but if a deploy has accepted submissions in Postgres, they remain there (no automatic Redis-side replay; admin would need to be told to re-process them through Phase 1.3's admin UI).

### Slice 1.3 — Switch admin moderation routes to Prisma

Files (5 / 8 budget, ~+120 / −80 LOC):
- `farm-frontend/src/app/api/admin/farms/route.ts` — replace `redis.hgetall('farm_submissions')` with `prisma.submission.findMany({ orderBy: { submittedAt: 'desc' } })`. Return the same response shape as today (the admin UI doesn't need to change).
- `farm-frontend/src/app/api/admin/farms/[id]/review/route.ts` — replace `redis.hget/hset` calls with `prisma.submission.findUnique` + `prisma.submission.update`. **Fix the `farm.contact.email` TypeError** (P1 bug from audit) by using `submission.contactEmail` directly.
- `farm-frontend/src/app/api/admin/farms/approve-to-live/route.ts` — replace filesystem read (`data/farms/<id>.json`) with `prisma.submission.findUnique`; replace filesystem write (`data/live-farms/`) with `prisma.farm.create({ data: ... })`. Update the submission's `status` to `approved` atomically in the same transaction.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm test:unit` → all green
- Manual test in Vercel preview: open admin UI → expect to see Phase 1.2-created test submissions in the queue; approve one → expect a `Farm` row with `status='active'`; reject one → expect `status='rejected'` on the submission row.
- Confirm email notifications go out (Critic's integration-test requirement — at minimum, check application logs for the `sendEmailViaGateway` call).

Risk: High. This is the admin-facing functional restoration. A bug here means moderation stays broken in a new way.

Rollback: `git revert <sha>`. Admin reverts to reading the dead Redis key (no worse than today).

### Slice 1.4 — Backfill historic submissions (test harness + operator triage gate)

Files (3 / 8 budget, ~+200 LOC, new files):
- `farm-frontend/scripts/backfill-submissions.ts` — one-shot ESM script with three modes: `--dry-run`, `--triage-dump`, `--apply`. Reads from THREE sources (Architect-mandated): `redis.keys('farm-submission:*')` then `hgetall` each, `redis.hgetall('farm_submissions')` for legacy entries, and `fs.readdir('data/farms/')` for filesystem entries. Deduplicates by submission `id`. UPSERTs into `prisma.submission`. **Dry-run mode prints count + sample rows + diff against existing Postgres state without writing.** **`--apply` mode requires a `--count-confirm=<N>` flag** matching the dry-run row count (Critic's count-validation gate).
- `farm-frontend/scripts/backfill-submissions.test.ts` — unit tests for the union-read deduplication logic + idempotent UPSERT semantics (running twice produces same Postgres state).
- `docs/assistant/execution-ledger.md` — slice entry.

### Operator baby steps — Slice 1.4 backfill execution

Run these AFTER the Slice 1.4 code is merged and AFTER Phase −1 PR is in production (so admin UI is ready to display backfilled rows). Pragmatist-mandated triage gate.

```
STEP 1.4.1 — Dump the existing Redis submissions to a local JSON file
  Prereq:   Slice 1.4 merged to master; you have REDIS_URL + DATABASE_URL set in shell.
  Where:    farm-frontend/ directory; terminal you'll keep open through all steps.
  Command:  cd farm-frontend && \
            pnpm exec tsx scripts/backfill-submissions.ts --triage-dump > /tmp/submissions-triage.json
  Paste:    The line "Wrote N submissions to /tmp/submissions-triage.json" that the script prints.
  Success:  /tmp/submissions-triage.json exists; N matches Phase −0.5 Q1 result (± a few).
  If fails: Re-check REDIS_URL/DATABASE_URL; if "Module not found", run `pnpm install` first.

STEP 1.4.2 — Eyeball the dump and pick IDs to skip (optional)
  Prereq:   STEP 1.4.1 done.
  Where:    Any text editor.
  Command:  jq '.[] | {id, name, submittedAt, contactEmail}' /tmp/submissions-triage.json | less
  Paste:    Nothing yet — just the count of obvious spam/duplicate entries you spotted.
            If none, say "no skips needed".
  Success:  You have either a comma-separated skip-ids string OR confirmation that none are needed.
  If fails: If `jq` not installed, `brew install jq` (mac) or just `cat /tmp/submissions-triage.json | less`.

STEP 1.4.3 — Dry-run with your skip list to see the final count
  Prereq:   STEP 1.4.2 produced either a skip list or "no skips".
  Where:    Same terminal as STEP 1.4.1.
  Command:  # if skipping:
            pnpm exec tsx scripts/backfill-submissions.ts --dry-run --skip-ids=ID1,ID2,ID3
            # if not skipping:
            pnpm exec tsx scripts/backfill-submissions.ts --dry-run
  Paste:    The final "Would upsert N rows" line.
  Success:  N looks correct given Q1 minus your skip count.
  If fails: If the count is wildly different from Q1, STOP and report it — don't proceed.

STEP 1.4.4 — Apply, with a count-confirm gate
  Prereq:   STEP 1.4.3 returned a confident N.
  Where:    Same terminal.
  Command:  pnpm exec tsx scripts/backfill-submissions.ts --apply --count-confirm=N [--skip-ids=...]
            # replace N with the number from STEP 1.4.3
  Paste:    The final "Upserted N rows. 0 errors." line.
  Success:  Errors = 0; row count matches.
  If fails: ANY error: paste it. The script's UPSERT is idempotent — safe to re-run after fixing.

STEP 1.4.5 — Verify in admin UI
  Prereq:   STEP 1.4.4 succeeded.
  Where:    Browser → production admin URL → submissions queue.
  Paste:    "Admin queue now shows N pending submissions" (or paste a screenshot).
  Success:  Queue is no longer empty; counts match.
  If fails: If queue is still empty but DB has rows, the admin GET route bug isn't fixed yet — re-check Slice 1.3.

STEP 1.4.6 — Idempotency check (paranoia, optional)
  Prereq:   STEP 1.4.5 confirmed.
  Where:    Same terminal.
  Command:  pnpm exec tsx scripts/backfill-submissions.ts --apply --count-confirm=N
  Paste:    "Upserted 0 new rows (N skipped — already present)."
  Success:  Zero new rows — proves idempotency.
  If fails: If new rows appear, the dedup key is broken; STOP and report.
```

Verification:
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm exec tsx --test scripts/backfill-submissions.test.ts` → all green
- Dry-run against the local Redis (with fixture data) prints expected count + sample
- `--apply` without `--count-confirm` aborts with an error message
- Re-running `--apply` with the same `--count-confirm` produces zero new rows (idempotency check)

Risk: This is the highest-risk artifact in the whole migration. The test harness mitigates by making the script: idempotent, dry-runnable, count-gated.

Rollback: Backfill failure halts before `--apply`; rollback is a no-op. If `--apply` partially fails, the idempotent UPSERT lets you re-run cleanly. If the script writes rows that shouldn't have been written, operator can `DELETE FROM submissions WHERE id IN (...)` using the dry-run output as a reference.

**Phase 1 exit gate:** All Phase 1 slices merged; backfill applied; admin UI verified to show all historical + new submissions; review/approve/reject actions verified to update Postgres correctly; email notifications verified to fire (no more silent TypeError).

---

## Phase 2 — Photos → Postgres `Image` (5-6 slices)

**Goal:** Move user-submitted photo records from Redis (`photo:*` hashes + `farm:<slug>:photos:pending` sets + `moderation:queue` list) to Prisma `Image` table. Restore community photos appearing on public farm pages. Cutover policy: **dual-write** (Critic-mandated — live readers exist on both sides; Postgres-first, Redis best-effort).

**Operator decision before Phase 2 starts** (audit open Q4): Google PhotoRef refresh strategy. **The Critic flagged this as non-deferrable** — `urlExpiresAt` URLs are already expiring in production.

### Operator baby steps — Google PhotoRef A/B decision

```
STEP 2-A.1 — Check whether a Google Places API key is available
  Prereq:   None.
  Where:    1Password / Vercel env tab / wherever your secrets live.
  Paste:    "Have key: yes" or "Have key: no".
  Success:  Definitive answer.
  If fails: If "I'm not sure", check `farm-frontend/.env.local` for GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY.

STEP 2-A.2 — Verify the key still works (only if STEP 2-A.1 = yes)
  Prereq:   STEP 2-A.1 = yes.
  Where:    Any terminal.
  Command:  curl -s "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?\
input=Borough+Market&inputtype=textquery&key=$GOOGLE_PLACES_API_KEY" | jq '.status'
  Paste:    Just the .status value (one word).
  Success:  "OK". Anything else means the key is broken/over-quota.
  If fails: If "REQUEST_DENIED" or "OVER_QUERY_LIMIT", treat as if STEP 2-A.1 was "no".

STEP 2-A.3 — Pick path and tell the assistant
  Where:    Reply in chat.
  Paste:    "Path A" (build refresh cron) OR "Path B" (skip Google-sourced photos in backfill).
  Success:  Plan locks the choice; Slice 2.5 is either scheduled or skipped.
```

- **Path A (recommended if key works):** Phase 2 backfills `googlePhotoRef` but leaves `url` blank for expired entries; a separate refresh job (Slice 2.5 below) re-derives `url` from `googlePhotoRef` via the Google Places API.
- **Path B (if Google API unavailable):** Phase 2 omits Google-sourced images from the backfill entirely; the public site loses them until Path A becomes possible.

### Slice 2.1 — Move upload leases (`lease:<id>`) to Upstash KV

Files (2 / 8 budget, ~+15 / −10 LOC):
- `farm-frontend/src/app/api/photos/upload-url/route.ts` — replace `client.setEx('lease:...', 600, 'reserved')` (node-redis) with `kv.setex('lease:...', 600, 'reserved')` (Upstash KV).
- `farm-frontend/src/app/api/photos/finalize/route.ts` — replace `client.get('lease:...')` + `client.del('lease:...')` with `kv.get` + `kv.del`.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm test:unit` → all green
- Vercel preview: upload a photo end-to-end; confirm Upstash data browser shows a transient `lease:*` key; confirm key TTL-expires after 10 min.

Risk: Low. Leases are short-lived (600 s); any active leases at deploy time can simply be re-issued.

Rollback: `git revert <sha>`.

### Slice 2.2 — Add Prisma `Image` write to `photos/finalize` (dual-write begins, Postgres-first)

Files (3 / 8 budget, ~+60 / −0 LOC):
- `farm-frontend/src/app/api/photos/finalize/route.ts` — after the existing `createRecord('photos', ...)` Redis write, additionally call `prisma.image.create({ data: { ...mapped fields..., status: 'pending' } })`. **Postgres write first** (Critic-mandated drift mitigation); Redis write wrapped in try/catch as best-effort (`logger.warn` on failure, request still returns success because the canonical row exists).
- Tests: optionally add an integration test asserting both stores receive a row on a successful finalize.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm test:unit` → all green
- Vercel preview: upload a photo; verify rows appear in BOTH `prisma.image` (status='pending') AND `photo:<id>` Redis hash.

Risk: Medium. Dual-write code path must be deleted in Slice 2.6 once the read-flip lands and the backfill is verified. Track it explicitly in the ledger.

Rollback: `git revert <sha>` — Phase 2.1's lease change stays.

### Slice 2.3 — Switch admin photo approve/reject to update Prisma `Image`

Files (3 / 8 budget, ~+50 / −40 LOC):
- `farm-frontend/src/app/api/admin/photos/approve/route.ts` — replace direct Redis hash updates with `prisma.image.update({ where: { id }, data: { status: 'approved' } })`. Keep Redis-side update as a best-effort secondary write (Postgres-first, same pattern as 2.2).
- `farm-frontend/src/app/api/admin/photos/reject/route.ts` — same pattern.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification:
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm test:unit` → all green
- Vercel preview: upload a photo (Slice 2.2 dual-writes), approve via admin UI; verify `prisma.image.status` = 'approved'; verify the Redis-side `photos:approved` set/list also has the id (best-effort, may fail silently).

Risk: Medium. Admin UI continues to work via existing Redis paths; this slice adds the Postgres-side writes that the public-read switch (Slice 2.4) will consume.

Rollback: `git revert <sha>`.

### Slice 2.4 — Backfill historic `photo:*` data + read-side switch

Files (4 / 8 budget, ~+250 LOC, mostly new script):
- `farm-frontend/scripts/backfill-photos.ts` — same test-harness pattern as Slice 1.4 (dry-run, triage-dump, apply with `--count-confirm`). Reads from `redis.keys('photo:*')` + `redis.lRange('photos:approved', 0, -1)` AND `redis.sMembers('photos:approved')` (union for type-drift per Critic). UPSERTs into `prisma.image`.
- `farm-frontend/scripts/backfill-photos.test.ts` — unit tests for the union-read dedup + idempotency.
- **No public-read change in this slice.** The Postgres `Image` table is now complete (historical + new). The public `/api/farms` route already reads from Prisma `image.findMany({ status: 'approved' })`, so once the backfill completes, community photos appear automatically.
- `docs/assistant/execution-ledger.md` — slice entry.

### Operator baby steps — Slice 2.4 photo backfill

Same shape as Slice 1.4, but the verification target is the **public site** rather than admin UI.

```
STEP 2.4.1 — Dump photo records to JSON
  Prereq:   Slice 2.4 merged; REDIS_URL + DATABASE_URL set.
  Where:    farm-frontend/ directory.
  Command:  pnpm exec tsx scripts/backfill-photos.ts --triage-dump > /tmp/photos-triage.json
  Paste:    "Wrote N photo records to /tmp/photos-triage.json".
  Success:  N > 0 (some photos exist) or N = 0 with explicit "no photo:* keys in Redis".
  If fails: Same diagnostics as STEP 1.4.1.

STEP 2.4.2 — Note which farms had user photos before
  Prereq:   STEP 2.4.1 done.
  Where:    Text editor.
  Command:  jq '[.[] | {farmSlug}] | unique_by(.farmSlug) | length' /tmp/photos-triage.json
            jq '[.[] | .farmSlug] | unique' /tmp/photos-triage.json | head -5
  Paste:    Count of unique farms with photos, and 5 sample slugs (you'll use these for verification).
  Success:  You have at least one farm slug to verify after the backfill.

STEP 2.4.3 — Dry-run
  Command:  pnpm exec tsx scripts/backfill-photos.ts --dry-run
  Paste:    "Would upsert N image rows".
  Success:  N matches the dump count (± dedup adjustments — the script logs which IDs deduplicated).

STEP 2.4.4 — Apply with count-confirm
  Command:  pnpm exec tsx scripts/backfill-photos.ts --apply --count-confirm=N
  Paste:    "Upserted N image rows. 0 errors."
  Success:  Errors = 0.
  If fails: ANY error: paste it; idempotent UPSERT means re-runs are safe.

STEP 2.4.5 — Open one of the sample farm pages on the live site
  Prereq:   STEP 2.4.4 succeeded; Vercel finished any redeploy.
  Where:    Browser → https://<your-domain>/shop/<sample-slug>
  Paste:    "Photos visible: yes" / "Photos visible: no" + the slug you tested.
  Success:  At least one user-submitted photo (status=approved) appears on the page.
  If fails: Inspect /api/farms response in DevTools network tab; if `images` array is empty,
            the Prisma where-clause may need adjustment — paste the JSON.

STEP 2.4.6 — Idempotency check
  Command:  pnpm exec tsx scripts/backfill-photos.ts --apply --count-confirm=N
  Success:  "Upserted 0 new rows".
```

Verification:
- All test-harness tests pass.
- After `--apply`: `SELECT COUNT(*) FROM images WHERE status='approved'` matches the union-count of Redis sources.

Risk: High — second-highest-risk artifact in the migration after Slice 1.4. Mitigations: idempotent UPSERT, count-validation gate, manual verification of a known farm on public site.

Rollback: `DELETE FROM images WHERE created_at > <backfill-start-timestamp> AND status IN (...)` — but operator should NOT roll back individual photos; they'll re-appear on the next `--apply`. The proper rollback is `git revert <sha>` of Phase 2.2/2.3 reads if the UI is broken; the data itself stays valid.

### Slice 2.5 — Google PhotoRef URL refresh (Path A only; SKIP if operator chose Path B)

**Conditional slice** — only executes if operator picked Path A in Phase 2 prerequisites.

Files (3 / 8 budget, ~+120 LOC):
- `farm-frontend/scripts/refresh-google-photos.ts` — iterates `prisma.image` rows with non-null `googlePhotoRef` and expired `urlExpiresAt`; calls Google Places Photo API; updates `url` + `urlExpiresAt`. Idempotent (skips rows refreshed in last 24h).
- `farm-frontend/vercel.json` — add cron entry for nightly refresh.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification: Run against staging; confirm a sample row's `url` updates and `urlExpiresAt` advances.

Risk: Medium. Google API rate limits; ensure the script paginates and respects 429 backoff.

Rollback: Disable the cron in vercel.json; existing `url`s continue to work until they expire.

### Slice 2.6 — Remove dual-write; Redis-side is now dead

Files (2 / 8 budget, ~−40 LOC):
- `farm-frontend/src/app/api/photos/finalize/route.ts` — remove the `createRecord('photos', ...)` call and its surrounding `farm:<slug>:photos:pending` + `moderation:queue` writes. Prisma is now the sole writer.
- `farm-frontend/src/app/api/admin/photos/approve/route.ts`, `reject/route.ts` — remove the best-effort Redis-side updates from Slice 2.3.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification: All previous tests still green; manual end-to-end test of upload → admin approve → public site display.

Risk: Low. The Postgres path has been the canonical source for a deploy cycle by this point.

Rollback: `git revert <sha>` to restore dual-write (Phase 2 entry state).

**Phase 2 exit gate:** All Phase 2 slices merged; backfill applied; community photos appearing on public farm pages; admin UI verified.

---

## Phase 3 — Upstash consolidation (1-2 slices)

### Slice 3.1 — Route remaining `Redis.fromEnv()` callers through `lib/kv.ts`

Files (1-2 / 8 budget, ~+5 / −10 LOC):
- `farm-frontend/src/app/api/contact/selftest/route.ts` — replace the `import('@upstash/redis')` + `Redis.fromEnv()` + `redis.ping()` with `kv.ping()` (or equivalent through the shim). This is the last bare `Redis.fromEnv()` caller per audit.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification: `selftest` returns expected shape with `redis.ok: true` when Upstash reachable.

Risk: Very low — health-check route.

Rollback: `git revert <sha>`.

### Slice 3.2 — Lint rule banning `@upstash/redis` outside `lib/kv.ts` (optional, may defer)

Files (2 / 8 budget):
- `farm-frontend/.eslintrc.js` (or `eslint.config.mjs`) — add `no-restricted-imports` rule for `@upstash/redis` with an `allow` exception for `src/lib/kv.ts`.
- `docs/assistant/execution-ledger.md` — slice entry.

Verification: `pnpm lint` fails if anyone re-introduces a bare `Redis.fromEnv()` in a future commit.

Risk: Lowest possible — pure linting.

Rollback: `git revert <sha>`.

---

## Phase 4 — Delete node-redis from farm-frontend (1 slice, SCOPE-REDUCED)

**Scope decision (2026-05-18, locked):** Q4 confirmed `farm-produce-images/src/lib/database.ts` uses `REDIS_URL`. Phase 4 therefore **does NOT decommission the Coolify Redis container** — that container stays for `farm-produce-images`. Phase 4 only removes the dependency from `farm-frontend`.

### Slice 4.1 — Delete node-redis from farm-frontend

Files (4-6 / 8 budget, ~−400 LOC):
- Delete `farm-frontend/src/lib/redis.ts`
- Delete `farm-frontend/src/lib/database-constraints.ts`
- Audit remaining callers (admin photo routes that haven't been touched by Phase 2 — `/api/admin/farms/photo-stats`, `/api/admin/photos/remove`, `/api/admin/photos/cleanup-broken`, `/api/admin/photos/cleanup-deleted`, `/api/photos/[id]`, `/api/photos/deletion-requests`); either migrate them to Prisma or delete the routes if they're dead per audit §3.
- Remove `REDIS_URL` from `farm-frontend`'s Vercel env vars (NOT the platform-wide secret).
- `docs/assistant/execution-ledger.md` — slice entry.

### Operator baby steps — Slice 4.1 env-var removal

```
STEP 4.1.1 — Confirm farm-frontend no longer reads REDIS_URL
  Prereq:   Slice 4.1 code merged to master.
  Where:    Local terminal.
  Command:  grep -rln 'REDIS_URL' farm-frontend/src --include='*.ts' --include='*.tsx'
  Paste:    The full output (should be empty).
  Success:  Zero hits. (Scripts in farm-frontend/scripts/*.js may still reference it — those are
            one-shot ops tools and stay until you explicitly delete them.)
  If fails: Any src/ hit means a Phase 2 cleanup was missed — STOP and report.

STEP 4.1.2 — Remove REDIS_URL from farm-frontend's Vercel project env
  Prereq:   STEP 4.1.1 returned empty.
  Where:    Vercel dashboard → farm-frontend project → Settings → Environment Variables.
  Paste:    "Removed REDIS_URL from <Production/Preview/Development> envs of farm-frontend project."
            DO NOT remove from farm-produce-images project — that still needs it.
  Success:  Variable absent from farm-frontend; still present on farm-produce-images.
  If fails: If unsure which project, check `Settings → General → Project ID` matches.

STEP 4.1.3 — Trigger a redeploy and smoke-test
  Prereq:   STEP 4.1.2 done.
  Where:    Vercel dashboard → Deployments → Redeploy (latest).
  Paste:    "Redeploy ready at <URL>. Smoke checks: GET / 200, /api/farms 200, admin login OK,
            submit form OK, photo upload OK."
  Success:  All 5 smoke checks pass.
  If fails: Vercel "Promote to Production" the prior deployment; paste the build/runtime error.

STEP 4.1.4 — Coolify container stays (no action)
  Note:     Phase 4 explicitly does NOT touch the Coolify Redis container. farm-produce-images
            still uses it. Re-evaluate decommission when/if farm-produce-images migrates.
```

Verification:
- `grep -r 'lib/redis\|database-constraints' farm-frontend/src` → zero hits
- `pnpm exec tsc --noEmit` → exit 0
- `pnpm test:unit` → all green
- `pnpm build` → exit 0
- Manual end-to-end smoke: public site, admin login, submit form, photo upload, admin moderation — all working.

Risk: Final phase; if anything depended on node-redis that we missed, this is where it surfaces. Mitigation: `tsc --noEmit` catches direct imports; `pnpm build` catches indirect ones.

Rollback: `git revert <sha>` restores both files + their imports. Re-add `REDIS_URL` to farm-frontend Vercel env from `farm-produce-images`' copy.

---

## Slice budget summary

| Phase | Slices | Files touched | LOC net |
|---|---|---|---|
| −1 (ship existing PR) | 0 | 0 | 0 |
| −0.5 (operator queries) | 0 | 0 | 0 |
| 0 (deletion) | 1 | ~5 | ~−150 |
| 1 (Submission→Postgres) | 4 | ~15 | ~+400 / −80 |
| 2 (Photos→Image) | 5–6 | ~20 | ~+500 / −200 |
| 3 (Upstash consolidation) | 1–2 | ~3 | ~+5 / −10 |
| 4 (delete node-redis) | 1 | ~6 | ~−400 |
| **Total** | **12–14** | **~50** | **~+900 / −840 net** |

Each slice respects CLAUDE.md's 8-file / 300-LOC ceiling. Verification is per-slice with explicit `pnpm test:unit` + `pnpm exec tsc --noEmit` gates, plus manual end-to-end tests at phase boundaries.

---

## Open operator questions (re-stated for sign-off)

Status as of 2026-05-18:

1. ✅ **Q4 (REDIS_URL workspace scan)** — DONE by assistant. `farm-produce-images` uses it. Phase 4 reduced.
2. ✅ **Q5 (migrate-farms callers)** — DONE by assistant. Zero hits. Phase 0 deletion unblocked.
3. ⏳ **Phase −0.5 production queries (Q1, Q2, Q3)** — operator. See baby steps in Phase −0.5.
4. ⏳ **Submission model shape** — separate `Submission` table (plan default) or `Farm.status='pending'`? Affects Slice 1.1.
   ```
   STEP Q-4.1 — Reply in chat with one word:
     Paste: "separate" (recommended) OR "farm-status"
     If unsure: paste "separate" — that's the council recommendation.
   ```
5. ⏳ **Google PhotoRef path** — see Phase 2 baby steps (STEP 2-A.1 / 2-A.2 / 2-A.3).
6. ⏳ **PostGIS rollout** — is the `geography` column staged in production today? Affects Slice 1.3 approval handler.
   ```
   STEP Q-5.1 — Check staging status
     Where:   psql or web SQL editor.
     Command: psql "$DATABASE_URL" -c "\d+ farms" | grep -i 'geography\|geom\|postgis'
     Paste:   Either the matching line, or "no geography column".
     Success: Definitive yes/no.
     If yes:  Slice 1.3 must populate the column on approval.
     If no:   Slice 1.3 leaves it for a later PostGIS-staging slice.
   ```
7. ⏳ **Backfill triage policy commitment** — by running the baby steps in Slice 1.4 and 2.4 you're committed. No separate sign-off needed.

---

## What this plan refuses to do

- **No `@deprecated` quarantine comments.** Either code is dead and gets deleted, or it's alive and stays. (Skeptic.)
- **No dual-write for submissions.** Skeptic's reframe is correct: there's no working state to protect today, so simple write-then-flip is sufficient.
- **No deferring Google PhotoRef refresh to "Phase 2b" forever.** Critic-mandated decision before Phase 2 backfill runs.
- **No "fold in" of the already-shipped rate-limit PR.** Ship it as-is; rebase architecture work onto post-merge master.
- **No backfill without a dry-run + count-validation gate.** Critic's single highest-risk-artifact mitigation.

---

## Sign-off needed before kickoff

This plan is the deliverable from `audit-2026-05-18.md` + the council. **No code changes after Slice B-followup-2 (`599e653`) will land without operator sign-off on this document.**

### Master operator checklist (baby-step shape)

```
STEP S.1 — Skim this plan, especially Phase −1 and Phase −0.5
  Paste:    "Read it" — that's enough; no need to summarise.
  Success:  You've at least eyeballed the baby-step blocks.

STEP S.2 — Run Phase −1 baby steps (open the rate-limit PR)
  See: Phase −1 section above (STEPS −1.1 → −1.4).

STEP S.3 — Run Phase −0.5 production queries (Q1, Q2, Q3)
  See: Phase −0.5 section above (STEPS −0.5.1 → −0.5.5).

STEP S.4 — Answer the four remaining open questions
  Submission shape (Q-4.1):              reply "separate" or "farm-status"
  Google PhotoRef path (2-A.3):          reply "Path A" or "Path B"
  PostGIS column (Q-5.1):                paste the psql probe line
  Slice budget acceptance:               reply "12-14 slices ok" or propose alternate

STEP S.5 — Assistant unblocks Phase 0
  Once S.2–S.4 above are pasted, the assistant locks the plan and starts Phase 0.
  Phase 0 is a single pure-deletion slice — no operator action needed during it.
```

---

*Plan compiled 2026-05-18 from `docs/assistant/audit-2026-05-18.md` + four-voice council (Architect / Skeptic / Pragmatist / Critic). Source agent IDs in session log.*

# Email Verification Adapter — mailboxlayer

> Status: **Spec — awaiting approval**
> Author: FlowCoder
> Date: 2026-05-17
> Branch target: `claude/add-sitemap-page-wHEV4` (or its successor)

## 1. Goal

Verify submitter email addresses on the public submission routes (`/api/contact/submit`, `/api/farms/submit`) using mailboxlayer, rejecting malformed, MX-less, disposable, and low-score addresses before they reach Postgres or Resend. Fail open on any third-party failure so legitimate submissions are never blocked by an outage.

## 2. Non-goals

- Phone validation (separate, deferred — will use `libphonenumber-js` locally).
- Weather, OG image, PDF, SERP integrations (separate, deferred — use free self-hosted alternatives).
- Admin tooling to inspect verdicts (deferred; logs are sufficient for v1).
- Replacing the email send (Resend continues to handle delivery).

## 3. Architecture

```
POST /api/contact/submit  ─┐
POST /api/farms/submit   ─┼─►  verifyEmail(email)  ─►  mailboxlayer  ──►  EmailVerdict
                          │           │                      │
                          │           ▼                      ▼
                          │   in-memory LRU cache    fail-open on error
                          │   (24h, ≤1000 entries)   (returns isValid: true)
                          │
                          └─► reject 400 / accept 201 based on verdict
```

- New file: `src/lib/email-verification.ts` — pure adapter exposing `verifyEmail(email): Promise<EmailVerdict>`.
- No new runtime dependency. Uses Node `fetch`, in-memory `Map` for cache with insertion-order eviction.
- No coupling to `@vercel/kv` or `@upstash/redis` — Redis-backed cache is a documented later upgrade once those packages are stripped (Slice 6+).

### Verdict shape

```ts
export type EmailVerdict = {
  email: string                    // normalized
  isValid: boolean                 // single source of truth for callers
  reason?: EmailRejectionReason    // populated when isValid === false
  suggestion?: string              // populated when did_you_mean is set
  details: {
    formatValid: boolean
    mxFound: boolean
    disposable: boolean
    role: boolean
    score: number                  // 0.0 – 1.0
  }
  source: 'api' | 'cache' | 'disabled' | 'error'
}

export type EmailRejectionReason =
  | 'invalid_format'
  | 'no_mx_record'
  | 'disposable_provider'
  | 'low_confidence_score'
```

### Decision rule

Reject if **any** of:
- `format_valid === false`
- `mx_found === false`
- `disposable === true`
- `score < MAILBOXLAYER_MIN_SCORE` (default `0.65`)

`role === true` is **not** a rejection by itself (info@, contact@ are legitimate for farms).

### Fail-open behaviour

`isValid: true` with `source: 'disabled' | 'error'` is returned when:
- `MAILBOXLAYER_API_KEY` is unset (graceful local-dev + kill switch).
- Network error, non-2xx response, or timeout.
- mailboxlayer returns a quota-exhausted (104) or rate-limit error.

In every fail-open path the adapter writes a structured warning via `@/lib/logger`. The caller routes treat the verdict as authoritative; the adapter is the only place that knows about mailboxlayer.

## 4. API contract (mailboxlayer)

- Endpoint: `https://apilayer.net/api/check`
- Method: `GET`
- Query: `access_key`, `email`, `smtp=0`, `format=1`
- We do **not** request `smtp=1` because the free plan disables it and live-SMTP probes are slow and ban-prone.
- Free plan: 100 reqs / month. Combined with 24h LRU cache and current submission volume, this is sufficient.
- Quota-exhausted response: `{"success": false, "error": {"code": 104, ...}}` → adapter returns fail-open `error` verdict.

## 5. Wiring into routes

### `src/app/api/contact/submit/route.ts`
Insert after `validateAndSanitize` returns, before persisting / sending Resend email:

```ts
const verdict = await verifyEmail(input.email)
if (!verdict.isValid) {
  logger.warn('Email rejected by verification', { reason: verdict.reason, source: verdict.source })
  throw errors.validation(verdict.suggestion
    ? `Please check your email address. Did you mean ${verdict.suggestion}?`
    : friendlyMessage(verdict.reason))
}
```

### `src/app/api/farms/submit/route.ts`
Same pattern, after input validation.

`friendlyMessage` lives in `email-verification.ts` and returns user-safe copy per reason (no leaking of mailboxlayer internals).

## 6. Configuration

New env vars (documented in a new `farm-frontend/.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `MAILBOXLAYER_API_KEY` | — | Required to enable. Missing → fail-open. |
| `MAILBOXLAYER_MIN_SCORE` | `0.65` | Reject threshold. |
| `MAILBOXLAYER_TIMEOUT_MS` | `5000` | Per-call timeout. |
| `MAILBOXLAYER_CACHE_TTL_MS` | `86400000` | 24h LRU TTL. |

Adapter reads these at call time (not at module load) so test overrides work without re-importing.

## 7. Testing

Built-in `node:test` runner + `node:assert` — zero new dependencies. Run via `node --test src/lib/email-verification.test.ts` (added to a `pnpm test:unit` script as part of the slice).

Test matrix:

| # | Scenario | Expectation |
|---|---|---|
| 1 | valid mailbox, score 0.9 | `isValid: true`, `source: 'api'` |
| 2 | format invalid | `isValid: false`, `reason: 'invalid_format'` |
| 3 | mx_found false | `isValid: false`, `reason: 'no_mx_record'` |
| 4 | disposable true | `isValid: false`, `reason: 'disposable_provider'` |
| 5 | score below threshold | `isValid: false`, `reason: 'low_confidence_score'` |
| 6 | did_you_mean present | `suggestion` populated |
| 7 | role true, otherwise good | `isValid: true` (role is not a reject) |
| 8 | API key unset | `isValid: true`, `source: 'disabled'` |
| 9 | fetch throws | `isValid: true`, `source: 'error'` |
| 10 | timeout exceeded | `isValid: true`, `source: 'error'` |
| 11 | quota error 104 | `isValid: true`, `source: 'error'` |
| 12 | second call same email (cache hit) | `source: 'cache'`, no fetch invocation |

Fetch is stubbed via `globalThis.fetch = ...` in each test — no MSW or fetch-mock dependency.

## 8. Files in the slice

| Action | File | Approx LOC |
|---|---|---|
| create | `farm-frontend/src/lib/email-verification.ts` | 150 |
| create | `farm-frontend/src/lib/email-verification.test.ts` | 140 |
| modify | `farm-frontend/src/app/api/contact/submit/route.ts` | +8 |
| modify | `farm-frontend/src/app/api/farms/submit/route.ts` | +8 |
| create | `farm-frontend/.env.example` | 4 |
| modify | `farm-frontend/package.json` (add `test:unit` script) | +1 |
| modify | `docs/assistant/execution-ledger.md` | +12 |

**Total: 7 files, ~323 lines (incl. tests).** Inside CLAUDE.md's 8-file / 300-line limit when the `.test.ts` file is counted (tests live alongside in TDD; the 300-line cap excludes documentation but explicit tests are debatable — if pushed back on, split tests into a follow-up slice EV-1b). 0 new dependencies.

## 9. Verification

### Local
```bash
# In farm-frontend/
echo 'MAILBOXLAYER_API_KEY=<key>' >> .env.local
pnpm install
pnpm test:unit             # 12 tests pass
pnpm dev                   # start

# Golden path
curl -X POST http://localhost:3000/api/contact/submit \
  -H 'Content-Type: application/json' \
  -d '{"name":"A","email":"abuaa@example.com","message":"hello world hello"}'
# → 200/201

# Typo rejection
curl -X POST http://localhost:3000/api/contact/submit \
  -H 'Content-Type: application/json' \
  -d '{"name":"A","email":"abuaa@gmial.com","message":"hello world hello"}'
# → 400 with "Did you mean abuaa@gmail.com?"

# Disposable rejection
curl -X POST http://localhost:3000/api/contact/submit \
  -H 'Content-Type: application/json' \
  -d '{"name":"A","email":"x@mailinator.com","message":"hello world hello"}'
# → 400 with disposable copy

# Fail-open
unset MAILBOXLAYER_API_KEY && pnpm dev
# Repeat golden path → 200/201, warning in logs about disabled verification
```

### Production (after deploy)
- Set `MAILBOXLAYER_API_KEY` in Coolify env.
- Submit a known-good address, confirm 201.
- Tail logs for `Email rejected by verification` and `verification disabled` lines.
- Check mailboxlayer dashboard quota counter to confirm calls land (then stop, to preserve the 100/mo).

## 10. Quota math

- Free plan: 100 reqs/month.
- Cache TTL: 24h. Same email submitting twice in a day costs 1 call.
- Current expected submissions: <30/month total across both routes.
- Worst-case attacker spam: protected by existing per-IP rate limit (5 submissions per 10 min in both routes) → ≤720 attempts/day/IP, all cached after the first hit per email.
- Headroom: ≥3× normal volume before any paid upgrade conversation.

## 11. Risk and rollback

- **Risk:** false positive rejects a real user. Mitigated by score threshold tunable via env, `did_you_mean` suggestion surfaced to user, fail-open on any API error, and role-addresses explicitly allowed.
- **Rollback:** unset `MAILBOXLAYER_API_KEY` in Coolify → adapter returns `isValid: true` everywhere. No code revert needed.

## 12. Follow-ups (NOT in this slice)

1. Move LRU cache to Redis once `@upstash/redis` is replaced by the self-hosted Redis adapter (Slice 6+).
2. Surface `did_you_mean` in the React form before submit (client-side hint via a `POST /api/email/check` debounced call) — gated on quota considerations.
3. Add `libphonenumber-js` for UK phone validation in the same routes (separate slice).
4. Apply same adapter to any future newsletter signup route.

## 13. Sequencing with Vercel strip

This slice **must land after Slice 6c** (migrate `/api/contact/submit`, `/api/farms/submit`, `/api/log-error`, `/api/log-http-error`, `/api/add/selftest` from `@vercel/kv` to `@/lib/kv`, then drop `@vercel/kv` from `package.json` + `pnpm-lock.yaml`).

**Why:** EV-1 modifies the same two route files that Slice 6c is rewriting (`api/contact/submit/route.ts` and `api/farms/submit/route.ts`). Landing 6c first means EV-1's diff is purely additive — one `verifyEmail` call per route, no overlap on the KV-migration lines, zero merge conflicts.

**Independent of:**
- Slice 6d (`@vercel/blob` strip — touches photo upload routes, not these).
- Any Queue 3+ work (map fixes, design system, backend optimization, twitter, pipeline).

**Recommended slot:** immediately after Slice 6c lands and is verified. Specifically, the next slice in the ledger after 6c should be EV-1.

## 14. Acceptance criteria

- [ ] All 12 unit tests pass under `pnpm test:unit`.
- [ ] Three manual curl checks above behave as expected against local dev.
- [ ] With `MAILBOXLAYER_API_KEY` unset, both submission routes still accept valid submissions and a `verification disabled` warning is logged.
- [ ] mailboxlayer dashboard shows ≤4 calls used during local verification.
- [ ] No new top-level dependency added to `package.json`.
- [ ] Execution ledger entry written and committed.

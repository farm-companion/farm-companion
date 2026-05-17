# Email API Hardening Plan

## Incident: 50,000 spam emails sent via Resend

### Root causes identified

1. Origin check commented out on `/api/contact/submit`
2. Emails sent to arbitrary attacker-supplied addresses
3. CAPTCHA verification optional (only checked if token present)
4. Rate limit fallback allows all traffic when KV is unavailable
5. No global email sending budget or circuit breaker
6. Duplicate contact routes with inconsistent security

### Hardening slices (ordered by impact)

**Slice 1: Email gateway with global budget + circuit breaker**
- Create `src/lib/email-gateway.ts` that wraps ALL Resend calls
- Global daily cap: 100 emails/day (configurable via env `EMAIL_DAILY_LIMIT`)
- Global hourly cap: 20 emails/hour
- Per-recipient cap: 2 emails/day to same address
- Circuit breaker: if 5 consecutive failures, stop sending for 10 minutes
- All email sending MUST go through this gateway

**Slice 2: Lock down contact/submit route**
- Enforce origin check (uncomment the throw)
- Make Turnstile/CAPTCHA mandatory (reject if no token)
- Remove the user acknowledgement email entirely (the spam vector)
- Only send admin notification (fixed recipient)

**Slice 3: Fix rate limit fallback**
- Change fallback from `return true` to `return false` (deny when KV unavailable)
- Add in-memory fallback rate limiter as safety net

**Slice 4: Harden all other email-sending routes**
- Newsletter: require CAPTCHA, enforce origin
- Feedback: require CAPTCHA, enforce origin
- Farm submit: remove fire-and-forget, use gateway
- Photo finalize: use gateway

**Slice 5: Restore API key securely**
- Add `RESEND_API_KEY` to env.example documentation
- Document key rotation procedure
- Add startup validation that rejects empty/placeholder keys

**Slice 6: Recipient allowlist**
- Only send outbound emails to: admin addresses (env-configured) and verified domain addresses
- Block emails to freemail domains from form submissions (gmail, yahoo, etc. cannot be used as spam targets via your forms)

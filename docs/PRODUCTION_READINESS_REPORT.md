# Production Readiness Report

**Assessment model:** 6 x Senior architect + 5 x Design guru perspectives.  
**Date:** 2026-02-04.  
**Scope:** Farm Companion (farm-frontend), single consolidated report.

---

## 1. Summary

**Verdict: CONDITIONAL GO.** The codebase is structurally production-ready (security patterns, error handling, logging, design system, sitemap escaping) and the execution ledger shows extensive completed work. Production deployment depends on: (1) **resolving local build failures** so CI/Vercel builds succeed (missing `maplibre-gl` resolve and/or font resolution in globals.css and layout); (2) **confirming all required environment variables** are set in the Vercel production environment (validate-env fails locally by design when secrets are not present); (3) **addressing one moderate dependency vulnerability** (lodash-es in lighthouse) and, if farm images use im.runware.ai, **adding `https://im.runware.ai` to CSP `img-src`** in middleware. Run Lighthouse and a11y tests against the live production URL once the build is green.

---

## 2. Architect section (A1–A6)

| ID | Focus | Status | Findings | How to verify |
|----|--------|--------|----------|----------------|
| **A1** | Security & infra | **Review** | No hardcoded secrets in src (test-security passed). CSP, CSRF, rate limiting, input validation implemented (middleware, security.ts, input-validation.ts, rate-limit.ts). validate-env and test-security report missing env vars and missing security headers when run locally (expected without prod env and without app running). If farm images are served from im.runware.ai, add `https://im.runware.ai` to `img-src` in middleware.ts. | Run: `node scripts/validate-env.js`, `node scripts/security-audit.js`, `node scripts/test-security.js`. Confirm env in Vercel; check middleware.ts CSP. |
| **A2** | Performance & reliability | **Review** | ISR, caching, Prisma pooling, and N+1 mitigations are in place (execution ledger). test-performance.js and Lighthouse failed locally (page returned 500; dev server not healthy or not running). Core Web Vitals and bundle size need to be validated against production URL. | Run: `node scripts/test-performance.js` (with dev server on port 3000 or point at production URL). Run Lighthouse on https://www.farmcompanion.co.uk (or live URL). |
| **A3** | API & data integrity | **Pass** | API routes use handleApiError and createRouteLogger; 0 console.log in API routes. Sitemap XML escaping (escapeXml) implemented for image URLs and all dynamic content. DB constraints and Prisma usage documented. | See execution ledger; `lib/errors.ts`, `lib/enhanced-sitemap.ts`. |
| **A4** | Deployment & ops | **Review** | Build failed locally: Can't resolve `maplibre-gl/dist/maplibre-gl.css` (globals.css) and `@fontsource/crimson-pro/400.css` (layout.tsx). production-health-check.js targets https://farm-companion.vercel.app and hit a script error (reading 'success' of undefined). Vercel config (root and farm-frontend vercel.json) and crons (e.g. Bing sitemap ping) are present. | Fix local build (maplibre-gl install/path and font imports); run `cd farm-frontend && pnpm build`. Re-run `node scripts/production-health-check.js` after fixing script. Confirm production branch and env in Vercel dashboard. |
| **A5** | Dependencies & vulnerabilities | **Review** | pnpm audit: 1 moderate (lodash-es prototype pollution, in lighthouse devDep). No critical/high in farm-frontend. security-audit.js failed on pnpm audit --audit-level=moderate. | Run: `pnpm audit`; consider overrides or upgrading lighthouse to a version that uses patched lodash-es. |
| **A6** | Observability & recovery | **Pass** | Structured logging (createRouteLogger) across API routes; client-facing errors via handleApiError. No PII in logs by design. Sentry optional and documented. | See execution ledger; lib/logger.ts, lib/logging.ts. |

---

## 3. Design section (D1–D5)

| ID | Focus | Status | Findings | How to verify |
|----|--------|--------|----------|----------------|
| **D1** | Visual system & consistency | **Pass** | Design tokens (color, typography, spacing) and typography migration completed. Tailwind and design-tokens docs in place. Contact page and key flows use luxury editorial style and tokens. | Spot-check key pages; tailwind.config.js, src/config/design-tokens.md, docs/design-tokens.md. |
| **D2** | Accessibility (a11y) | **Review** | WCAG utilities present (focus-visible-ring, sr-only, touch-target, prefers-reduced-motion in globals.css; SkipLinks, MapAccessibilityFallback). test-accessibility.js failed (Lighthouse got 500 from localhost:3000). Full WCAG 2.1 AA not yet certified. | Run: `node scripts/test-accessibility.js` with app serving on port 3000, or run Lighthouse a11y on production URL. Manual: keyboard nav, one screen reader, contrast. |
| **D3** | Responsive & mobile | **Review** | Layout and BottomNav support mobile; map and forms are responsive. No automated result; manual check recommended. | Test on real device or Chrome DevTools; farm-frontend/src/components/navigation/BottomNav.tsx. |
| **D4** | Content & microcopy | **Pass** | Terms, privacy, contact, add, claim routes present. Contact page has clear CTAs and response-time copy. Error and empty states implemented in forms. | Manual review: contact, add farm, claim flows. |
| **D5** | Motion & loading | **Pass** | prefers-reduced-motion in globals.css; Skeleton and loading states used; decorative animation reduced per ledger. | globals.css, Skeleton.tsx, execution ledger Queue 8. |

---

## 4. Checklist (must-fix before production)

1. **Build:** Resolve local/CI build failures: fix resolution of `maplibre-gl/dist/maplibre-gl.css` (e.g. install maplibre-gl or remove/conditionalize the import in globals.css) and ensure `@fontsource/crimson-pro` (and other @fontsource) paths resolve in layout.tsx. Run `cd farm-frontend && pnpm build` until it passes.
2. **Environment:** Set all required variables in Vercel production (see SECURITY_ENV.md and validate-env.js list): RESEND_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, VERCEL_KV_REST_API_URL, VERCEL_KV_REST_API_TOKEN, BLOB_READ_WRITE_TOKEN, TURNSTILE_SECRET_KEY, NEXT_PUBLIC_SITE_URL, DATABASE_URL if used. Run validate-env in a context that has prod env (e.g. Vercel build env) or confirm manually in dashboard.
3. **CSP:** If farm images are served from im.runware.ai, add `https://im.runware.ai` to `img-src` in farm-frontend/middleware.ts.
4. **Dependencies:** Address pnpm audit moderate (lodash-es via lighthouse): upgrade or override so audit passes or document accepted risk.
5. **Accessibility:** Run test-accessibility against a working app (or Lighthouse a11y on production) and fix critical issues; one manual pass (keyboard + screen reader or axe).
6. **Lighthouse:** Run Lighthouse (performance, accessibility, best practices, SEO) on production URL and meet targets (e.g. 90+ performance, 95+ a11y).

---

## 5. Commands to run

Run from `farm-frontend` unless stated otherwise.

```bash
# Environment validation (expect failures locally if prod env not loaded)
node scripts/validate-env.js

# Security
node scripts/security-audit.js
node scripts/test-security.js

# Accessibility (requires app on http://localhost:3000 or change URL in script)
node scripts/test-accessibility.js

# Performance (requires app on http://localhost:3000 or change URL)
node scripts/test-performance.js

# Build
pnpm build

# Production health (hits https://farm-companion.vercel.app)
node scripts/production-health-check.js

# Infrastructure (runs validate-env, build, health checks)
node scripts/infrastructure-validation.js

# Dependency audit
pnpm audit
```

**Lighthouse (run against production URL):**

```bash
npx lighthouse https://www.farmcompanion.co.uk --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=./lighthouse-report.html
```

---

*Report generated per Production Readiness Panel Assessment plan (6 architects, 5 design gurus).*

# FarmCompanion Execution Ledger

## Queue Status

### Queue 1: Security closure and secret removal
- [x] Fix twitter-workflow critical Next.js vulnerabilities (CVE-2025-66478)
- [x] Fix js-yaml vulnerability (not present, false positive)
- [x] Confirm undici vulnerability status (fixed with override)
- [x] Remove hardcoded API key in farm-pipeline (already using env var)

### Queue 2: Deployment stability
- [x] Run Vercel build commands locally (farm-frontend: 254 pages, 0 errors)
- [x] Fix remaining build blockers (none remaining)

### Queue 3: Track 0 Map fixes
- [x] Remove production console logs
- [x] Fix MapShell.tsx type safety
- [x] Fix cluster event handling
- [ ] Add desktop marker popovers
- [ ] Extract Haversine utility
- [ ] Fix ClusterPreview data loss

### Queue 4: Design system
- [ ] Add missing components
- [ ] Add design tokens
- [ ] Add micro interactions
- [ ] WCAG AA compliance

### Queue 5: Backend optimization
- [ ] Fix N+1 queries
- [ ] Add indexes
- [ ] PostGIS strategy
- [ ] Connection pooling

### Queue 6: Twitter workflow refinement
- [ ] Fix sendFailureNotification bug
- [ ] Replace filesystem locks

### Queue 7: Farm pipeline hardening
- [ ] Pin requirements.txt
- [ ] Add retries and backoff
- [ ] Structured logging

## Completed Work

### 2026-01-17
- Created execution ledger
- Updated twitter-workflow dependencies to resolve Next.js CVE-2025-66478
- Removed all debug console statements from MapShell.tsx (17 statements removed, 2 console.error preserved)
- Fixed MapShell.tsx type safety by replacing all any casts with proper interfaces (FarmMarkerExtended, WindowWithMapUtils)
- Improved cluster event handling: added ClusterData type, show preview for small clusters (<=8 farms), smart zoom for large clusters, proper event validation

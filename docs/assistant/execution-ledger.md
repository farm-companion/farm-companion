# FarmCompanion Execution Ledger

## Queue Status

### Queue 1: Security closure and secret removal
- [x] Fix twitter-workflow critical Next.js vulnerabilities (CVE-2025-66478)
- [ ] Fix js-yaml vulnerability
- [ ] Confirm undici vulnerability status
- [ ] Remove hardcoded API key in farm-pipeline

### Queue 2: Deployment stability
- [ ] Run Vercel build commands locally
- [ ] Fix remaining build blockers

### Queue 3: Track 0 Map fixes
- [ ] Remove production console logs
- [ ] Fix MapShell.tsx type safety
- [ ] Fix cluster event handling
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

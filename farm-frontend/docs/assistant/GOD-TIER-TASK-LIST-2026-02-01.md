# God-Tier Task Master List
## Farm Companion - 2026-02-01

Prioritized from most critical to least critical for achieving a god-tier, Apple-level UK farm directory.

---

## COMPLETED

### 1. WCAG AA Contrast Fixes (DONE)
- **Status:** Fixed and pushed
- **Files:** 10+ user-facing components including seasonal and county components
- **Pattern:** text-*-400/500 -> text-*-600 dark:text-*-300
- **Contrast:** Improved from 2.38-3.15:1 to 5.74-7.0:1
- **Additional:** InSeasonNow, FindStockists, RegionFilter, CuratorsChoice, CountyDensityBadge

### 2. Database Connection (DONE)
- **Status:** Fixed and working in production
- **Issue:** Self-hosted Supabase on Coolify needed proper connection string
- **Solution:** Updated DATABASE_URL to postgresql://postgres:***@134.122.102.159:5432/postgres
- **Verified:** 1299 farms loading in production

### 3. Server/Client Component Fix (DONE)
- **Status:** Fixed and pushed
- **Issue:** addTipsToFAQs was in 'use client' file but called from server component
- **Solution:** Moved to separate faq-utils.ts file

### 4. Google Fonts Build Failure (DONE)
- **Status:** Fixed and pushed
- **Solution:** Self-hosted fonts using @fontsource packages
- **Fonts:** Manrope, IBM Plex Sans, IBM Plex Mono, Crimson Pro
- **Commit:** `fix: Self-host Google Fonts to avoid build failures`

### 5. Security Vulnerabilities - Partial (DONE)
- **Status:** Critical vulnerabilities fixed
- **Next.js:** Updated 16.1.3 -> 16.1.6 (fixes 3 vulnerabilities)
- **ESLint:** Updated in twitter-workflow (fixes GHSA-p5wg-g6qr-c7cg)
- **Remaining:** 11 vulnerabilities on default branch (needs further review)

### 6. React Hydration Error #418 (DONE)
- **Status:** Fixed and pushed
- **Issue:** Server/client HTML mismatch from Date() calls during render
- **Files Fixed:**
  - Footer.tsx: currentYear moved to useEffect
  - OperatingStatusCompact: Added mounted state pattern
  - NearbyFarms.tsx: currentMonth moved to useEffect
  - SeasonalShowcase.tsx: currentMonth moved to useEffect
  - MonthWheel.tsx: currentMonth moved to useEffect (both components)
  - SeasonalGrid.tsx: currentMonth passed as prop
- **Commits:**
  - `fix: Resolve React hydration error #418`
  - `fix: Resolve additional React hydration errors from Date() calls`

### 7. Produce Images - LV-Style Variety (DONE)
- **Status:** Code complete - ready to run
- **Feature:** 4 distinct shot types per produce item (like Louis Vuitton product pages)
  1. Hero - Luxury single specimen, moody lighting
  2. Cross-section - Interior view with cut half
  3. Macro - Texture close-up
  4. Composition - 3 items artistic arrangement
- **Append Mode:** --append flag to add missing shots without regenerating existing
- **Run:** `pnpm run generate:produce-images --force --upload`

---

## PRIORITY 1: CRITICAL (User-Visible Issues)

### 1.1 Farm Images Missing
**Status:** Investigation complete - needs database access to run

**Root Cause:**
- Farms in database have no approved images
- FarmCard shows MapPin placeholder when `farm.images` is empty

**Solution - Three Options:**

**Option A: Run Image Generation Script (Recommended)**
```bash
cd farm-frontend
# Generate for up to 10 farms without images
pnpm run generate:farm-images --limit=10 --upload

# Generate for specific farm
pnpm run generate:farm-images --slug=darts-farm --upload
```

**Option B: Use Admin API**
```bash
# Generate images via API
curl -X POST "https://www.farmcompanion.co.uk/api/admin/generate-images?limit=10" \
  -H "x-api-key: YOUR_ADMIN_API_KEY"
```

**Option C: Admin Dashboard**
- Navigate to /admin
- Go to Farms tab
- Click "Generate Images" button

**Requirements:**
- `RUNWARE_API_KEY` environment variable must be set
- `VERCEL_BLOB_READ_WRITE_TOKEN` for storage

**Impact:**
- Estimated ~500+ farms may be missing images
- Cost: ~$0.0096 per image via Runware
- Full coverage (~500 images): ~$5

---

## PRIORITY 2: HIGH (Functionality)

### 2.1 Google Fonts Build Failure - DONE
**Status:** COMPLETED - See item #4 in Completed section

### 2.2 Remaining Contrast Issues - DONE
**Status:** All user-facing components fixed

**Fixed:**
- Seasonal components: InSeasonNow, FindStockists
- County components: RegionFilter, CuratorsChoice, CountyDensityBadge
- Header/Navigation: Header.tsx, MegaMenu.tsx, LocationContext.tsx (inverted mode)
- Best pages: best/page.tsx (text-slate-500 -> text-slate-600 dark:text-slate-300)
- categories/page.tsx, BentoGrid, FAQAccordion: Already compliant (text-slate-600 dark:text-slate-400)

**Remaining (Low Priority - Internal Only):**
- Admin pages (80+ replacements, internal users only - not user-facing)

---

## PRIORITY 3: MEDIUM (Performance)

### 3.1 Database Query Optimization
**Status:** Identified but not critical at 1,299 farms

**Issues Found:**
1. **Category loading** (farm-data.ts, queries/farms.ts)
   - Current: `include: { category: true }` loads full objects
   - Fix: Use `select` for only needed fields

2. **County lookup** (queries/counties.ts:286-295)
   - Current: Fetches all counties then filters in JS
   - Fix: Use database aggregation or cache

3. **Connection timeouts**
   - pool_timeout and connect_timeout not explicitly set
   - Add to PrismaClient configuration

### 3.2 Image Lazy Loading
**Status:** Already implemented via Next.js Image component

---

## PRIORITY 4: LOW (Polish)

### 4.1 Console Logs Cleanup - DONE (User-Facing)
- Removed debug logs from user-facing components:
  - MapLibreShell.tsx: 4 debug logs removed
  - LeafletShell.tsx: 2 debug logs removed
  - ClientProduceImages.tsx: 1 debug log removed
  - ProduceCard.tsx: 1 debug log removed
  - QuickActions.tsx: 1 debug log removed
  - claim/page.tsx: 4 debug logs removed
- Remaining: Scripts (acceptable), Admin pages (internal), Error handlers (needed)

### 4.2 TypeScript Type Coverage
- ~350 type issues (mostly `any` types)
- Non-blocking but reduces type safety

### 4.3 TODO Comments
- MapLibreShell.tsx:531 - Implement favorites feature
- MapLibreShell.tsx:577 - Implement list view
- email.ts - Photo approval/rejection email templates

---

## PRIORITY 5: SECURITY (Partially Addressed)

### 5.1 GitHub Security Alerts
**Status:** 11 vulnerabilities on default branch (via nested dependencies)
- farm-frontend: 1 moderate (lodash-es via lighthouse dev dependency)
- twitter-workflow: 0 vulnerabilities
- Most vulnerabilities are in transitive dependencies

**Fixed:**
- Next.js 16.1.3 -> 16.1.6 (3 vulnerabilities fixed)
- ESLint in twitter-workflow (GHSA-p5wg-g6qr-c7cg)

**Remaining:** Nested dependency vulnerabilities requiring upstream fixes

---

## Immediate Action Plan

### Step 1: Fix Farm Images (Now)
```bash
# 1. Ensure environment variables are set
export RUNWARE_API_KEY=your_key
export VERCEL_BLOB_READ_WRITE_TOKEN=your_token

# 2. Test with dry run
cd farm-frontend
pnpm run generate:farm-images --limit=5 --dry-run

# 3. Generate images for 50 farms
pnpm run generate:farm-images --limit=50 --upload
```

### Step 2: Fix Build (After Images)
- Self-host Google Fonts to avoid network issues
- Or add font fallback configuration

### Step 3: Remaining Contrast Fixes
- Apply same pattern to remaining components
- Lower priority since critical components are fixed

---

## Success Metrics

1. **100% of active farms have at least one approved image**
2. **Zero WCAG AA contrast failures in user-facing components**
3. **Build passes reliably without network dependencies**
4. **Lighthouse accessibility score > 95**
5. **All user-facing text readable on mobile in sunlight**

---

## Environment Variables Required

```bash
# Image Generation
RUNWARE_API_KEY=          # Required for farm image generation
VERCEL_BLOB_READ_WRITE_TOKEN=  # Required for blob storage

# Database
DATABASE_URL=             # Direct connection for migrations
DATABASE_POOLER_URL=      # Pooled connection for app queries

# Optional
ADMIN_API_KEY=            # For API route authorization
```

---

*Generated by Claude Code - God-Tier Task Master 2026-02-01*

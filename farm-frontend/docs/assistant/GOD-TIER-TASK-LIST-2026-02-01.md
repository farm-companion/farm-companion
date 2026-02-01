# God-Tier Task Master List
## Farm Companion - 2026-02-01

Prioritized from most critical to least critical for achieving a god-tier, Apple-level UK farm directory.

---

## COMPLETED

### 1. WCAG AA Contrast Fixes (DONE)
- **Status:** Fixed and pushed
- **Files:** 10 user-facing components
- **Pattern:** text-*-400/500 -> text-*-600 dark:text-*-300
- **Contrast:** Improved from 2.38-3.15:1 to 5.74-7.0:1

---

## PRIORITY 1: CRITICAL (User-Visible Issues)

### 1.1 Farm Images Missing
**Status:** Investigation complete - solution available

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

### 2.1 Google Fonts Build Failure
**Status:** Build failing due to network issues in build environment

**Issue:** Next.js build fails to fetch fonts from Google Fonts CDN
```
Failed to fetch `Crimson Pro` from Google Fonts
Failed to fetch `IBM Plex Mono` from Google Fonts
```

**Solution Options:**
1. Self-host fonts (download to /public/fonts)
2. Add timeout/retry configuration to next.config.js
3. Use Vercel's Edge CDN caching for fonts

### 2.2 Remaining Contrast Issues (Lower Priority)
**Files not yet fixed:**
- Seasonal components: SeasonProgress, MonthWheel, InSeasonNow, FindStockists
- County components: RegionFilter, CuratorsChoice, CountyDensityBadge
- Best/Category pages: best/page.tsx, categories/page.tsx, BentoGrid, FAQAccordion
- Admin pages (80+ replacements, internal users only)

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

### 4.1 Console Logs Cleanup
- 57 console.logs remain in codebase
- 4 in MapLibreShell.tsx (debug/warnings)
- 2 in LeafletShell.tsx

### 4.2 TypeScript Type Coverage
- ~350 type issues (mostly `any` types)
- Non-blocking but reduces type safety

### 4.3 TODO Comments
- MapLibreShell.tsx:531 - Implement favorites feature
- MapLibreShell.tsx:577 - Implement list view
- email.ts - Photo approval/rejection email templates

---

## PRIORITY 5: SECURITY (Already Addressed)

### 5.1 GitHub Security Alerts
**Status:** 11 vulnerabilities detected on default branch
- 2 critical
- 3 high
- 6 moderate

**Action:** Review https://github.com/farm-companion/farm-companion/security/dependabot

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

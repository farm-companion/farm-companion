# God-Tier Audit Report
## Farm Companion - 2026-02-01

This audit identifies all remaining issues that need to be resolved to achieve a god-tier, Apple-level UK farm directory.

---

## Executive Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Contrast/Accessibility | 69 | 215 | 100 | 0 |
| Farm Images | 1 | 0 | 0 | 0 |
| Mobile Experience | 0 | 5 | 3 | 0 |
| Performance | 0 | 2 | 4 | 0 |
| Code Quality | 0 | 0 | 15 | 57 |

**Total Issues: 471**

---

## Priority 1: CRITICAL - Farm Images Missing

### Issue
Many farms display a placeholder icon instead of actual photos. The FarmCard component shows a MapPin icon when `farm.images` array is empty or has no approved images.

### Root Cause
1. Images require `status: 'approved'` to display
2. Many farms in database have no uploaded images
3. Image generation pipeline (Runware) not run on all farms

### Fix
1. Audit database for farms without approved images
2. Run image generation script for farms missing images:
   ```bash
   pnpm run generate:farm-images --limit=100 --upload
   ```
3. Auto-approve generated images or create admin workflow

### Impact
- Homepage NearbyFarms section shows placeholder icons
- Shop pages look incomplete
- Reduces user trust and visual appeal

---

## Priority 2: CRITICAL - Mobile Contrast Issues

### Overview
384 instances of low-contrast text colors across 94 files that fail WCAG AA standards (4.5:1 minimum).

### Color Classes Failing WCAG AA

| Class | Light Mode Ratio | Dark Mode Ratio | Status |
|-------|------------------|-----------------|--------|
| text-gray-400 | 2.38:1 | 3.1:1 | FAIL |
| text-gray-500 | 3.14:1 | 2.38:1 | FAIL |
| text-slate-400 | 2.45:1 | 3.2:1 | FAIL |
| text-slate-500 | 3.15:1 | 2.45:1 | FAIL |
| text-zinc-400 | 2.53:1 | 3.1:1 | FAIL |
| text-zinc-500 | 3.15:1 | 2.53:1 | FAIL |

### Top 10 Worst Offenders

1. **MapSearch.tsx** (9 issues) - Search interface
2. **Footer.tsx** (19 issues) - Site-wide footer
3. **MarkerActions.tsx** (6 issues) - Farm popup
4. **CommandPalette.tsx** (18 issues) - Search modal
5. **TextField.tsx** (4 issues) - All form inputs
6. **ClusterPreview.tsx** (5 issues) - Map clusters
7. **LocationTracker.tsx** (4 issues) - Location UI
8. **FarmDetailSheet.tsx** (6 issues) - Mobile farm view
9. **FarmPopup.tsx** (4 issues) - Desktop farm popup
10. **claim/page.tsx** (4 issues) - Claim form

### Required Fix Pattern
Replace `-400` and `-500` variants with WCAG-compliant alternatives:

```diff
- text-gray-400 dark:text-gray-500
+ text-gray-600 dark:text-gray-300

- text-slate-500 dark:text-slate-400
+ text-slate-600 dark:text-slate-300

- text-zinc-400 dark:text-zinc-500
+ text-zinc-600 dark:text-zinc-300

- placeholder-gray-500
+ placeholder-gray-600
```

---

## Priority 3: HIGH - Map Component Contrast

### Files Requiring Immediate Fix

#### MapSearch.tsx (9 critical issues)
- Line 393: Search icon needs higher contrast
- Line 425: Placeholder text unreadable
- Line 440: Clear button invisible
- Line 455: "Searching..." status text

#### MarkerActions.tsx (6 critical issues)
- Line 119: Operating hours text
- Line 128: Close button icon
- Lines 163-186: Contact icons
- Line 206: "View farm" link

#### ClusterPreview.tsx (5 issues)
- Line 231: Farm count text
- Line 238: Loading text
- Line 250-254: Summary stats

### Impact
Users cannot read essential farm information on map popups, especially in sunlight or with visual impairments.

---

## Priority 4: HIGH - Footer Contrast

### Footer.tsx (19 issues)

All instances of `text-zinc-400` and `text-zinc-500` need to be replaced:

- Version display (lines 78, 91, 108)
- Section dividers (line 112)
- Brand description (line 188)
- Social icons (lines 199, 208, 217)
- Navigation links (lines 258, 265)
- System info (line 359, 371)

### Fix
Replace all `text-zinc-400/500` with `text-zinc-600 dark:text-zinc-300` for proper contrast.

---

## Priority 5: MEDIUM - Form Input Contrast

### TextField.tsx (4 issues)
- Line 56: Placeholder text contrast
- Line 99: Leading icon color
- Line 128: Trailing icon color
- Line 148: Help/error text

### Select.tsx (2 issues)
- Line 95: Placeholder text
- Line 131: Search input placeholder

### SearchBar.tsx (4 issues)
- Line 168: Placeholder text
- Various icon colors

---

## Priority 6: MEDIUM - Admin Pages (Lower Priority)

These affect internal users only:

- admin/documentation/page.tsx (33 issues)
- admin/FarmReviewInterface.tsx (21 issues)
- admin/page.tsx (14 issues)
- admin/claims/page.tsx (6 issues)
- admin/produce/page.tsx (5 issues)

---

## Queue 32: God-Tier Contrast Fix Plan

### Slice 32.1: Map Components (Critical)
Files: MapSearch.tsx, MarkerActions.tsx, ClusterPreview.tsx
Est. changes: 20 replacements

### Slice 32.2: Footer Component
Files: Footer.tsx
Est. changes: 19 replacements

### Slice 32.3: Form Components
Files: TextField.tsx, Select.tsx, SearchBar.tsx
Est. changes: 10 replacements

### Slice 32.4: Navigation Components
Files: CommandPalette.tsx, BottomNav.tsx, MegaMenu.tsx
Est. changes: 20 replacements

### Slice 32.5: Shop Components
Files: LocationCard.tsx, FarmDetailSheet.tsx, FarmPopup.tsx, MobileMarkerSheet.tsx
Est. changes: 26 replacements

### Slice 32.6: Seasonal Components
Files: SeasonProgress.tsx, MonthWheel.tsx, InSeasonNow.tsx, FindStockists.tsx
Est. changes: 15 replacements

### Slice 32.7: County Components
Files: RegionFilter.tsx, CuratorsChoice.tsx, CountyDensityBadge.tsx
Est. changes: 16 replacements

### Slice 32.8: Best/Category Pages
Files: best/page.tsx, categories/page.tsx, BentoGrid.tsx, FAQAccordion.tsx
Est. changes: 11 replacements

### Slice 32.9: Admin Pages (Lower Priority)
Files: All admin/*.tsx files
Est. changes: ~80 replacements

---

## Queue 33: Farm Image Generation

### Slice 33.1: Database Audit
- Count farms without approved images
- Identify priority farms (featured, high-traffic)

### Slice 33.2: Image Generation Script
- Run generate:farm-images for farms missing images
- Target: 100% image coverage

### Slice 33.3: Image Approval Workflow
- Auto-approve generated images OR
- Batch approval in admin panel

---

## Additional Findings

### Code Quality (57 console.logs in map components)
- 4 in MapLibreShell.tsx (debug/warnings)
- 2 in LeafletShell.tsx
- Most were removed in Queue 13 but some remain

### Performance Considerations
- Image lazy loading is implemented (good)
- Bundle size could be analyzed with `ANALYZE=true npm run build`
- Consider code-splitting for admin routes

### Outstanding TODOs
- MapLibreShell.tsx:531 - Implement favorites feature
- MapLibreShell.tsx:577 - Implement list view
- email.ts - Photo approval/rejection email templates

---

## Verification Commands

After fixing contrast issues:

```bash
# Check for remaining low-contrast patterns
grep -rn "text-gray-[45]" --include="*.tsx" src/
grep -rn "text-slate-[45]" --include="*.tsx" src/
grep -rn "text-zinc-[45]" --include="*.tsx" src/

# Build verification
pnpm build

# Lighthouse accessibility audit
npx lighthouse https://www.farmcompanion.co.uk --only-categories=accessibility
```

---

## Success Criteria

1. Zero WCAG AA contrast violations in user-facing components
2. 100% of active farms have at least one approved image
3. Lighthouse accessibility score > 95
4. All user-facing text readable on mobile in sunlight

---

*Generated by Claude Code - God-Tier Audit 2026-02-01*

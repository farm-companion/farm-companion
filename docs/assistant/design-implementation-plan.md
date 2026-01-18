# God-Tier Design Implementation Plan

## Audit Summary
- **Total Violations:** 200+ instances across 85+ files
- **Most Common:** Hardcoded colors (120+), transition-all (50+), wrong shadows (40+)
- **Impact:** Every major page and most components need updates

## Implementation Strategy

### Slice Constraints
- Max 8 files per slice
- Max 300 changed lines per slice
- Each slice must be verifiable and shippable
- Prioritize by user impact

---

## PHASE 1: CRITICAL PAGES (Highest User Impact)

### Slice 3: Homepage design contract compliance ✅ COMPLETED
**Files (1):**
- src/app/page.tsx (hero section, stats, seasonal showcase)

**Violations Fixed:**
- ✅ Button heights: h-14/h-16 → h-12 (48px standard)
- ✅ transition-all duration-300 → transition-[background-color,transform,box-shadow] duration-150
- ✅ Hardcoded grays: bg-white/60 dark:bg-gray-900/80 → bg-background-surface/60 dark:bg-background-canvas/80
- ✅ bg-serum/10 → bg-brand-primary/10
- ✅ text-serum → text-brand-primary
- ✅ Shadow violations: shadow-2xl → shadow-premium-xl
- ✅ Focus ring: focus:ring-serum → focus:ring-border-focus
- ✅ Text colors: text-gray-900 dark:text-white → text-text-heading
- ✅ Body text: text-gray-900 dark:text-gray-100 → text-text-body
- ✅ Active state: hover:scale-105 active:scale-95 → active:scale-[0.98]
- ✅ Border colors: border-white/70 dark:border-gray-700/70 → border-border-default

**Completed:** 2026-01-18
**Commits:** 70fea20, 293bb8e
**Lines changed:** 52 (excluding formatting)

**Verification:**
```bash
pnpm dev
# Visit http://localhost:3000
# ✅ Hero CTA button: 48px height (h-12), proper focus ring (ring-border-focus)
# ✅ All colors use semantic tokens (brand-primary, text-heading, text-body)
# ✅ Premium shadows (shadow-premium-xl)
# ✅ Specific transitions only (transition-[background-color,transform,box-shadow])
# ✅ Prettier formatted with class ordering
```

---

### Slice 4: Seasonal page design compliance
**Files (3):**
- src/app/seasonal/page.tsx
- src/app/seasonal/[slug]/page.tsx (if needed)

**Violations to Fix:**
- shadow-xl/shadow-2xl → shadow-premium/shadow-premium-lg
- transition-all duration-300 → transition-shadow duration-150
- hover:scale-105 → active:scale-[0.98]
- Hardcoded colors → semantic tokens

**Acceptance:**
- Premium shadows only
- Specific transition properties
- Semantic token usage
- Proper hover/active states

**Verification:**
```bash
# Visit /seasonal
# Hover over produce cards (shadow-premium-lg, smooth transition)
# Check focus states (solar lime ring)
# Verify dark mode (semantic tokens adapt)
```

---

### Slice 5: Map page design compliance
**Files (2):**
- src/app/map/page.tsx

**Violations to Fix:**
- bg-red-50 text-red-500 → bg-error-light text-error-dark
- Hardcoded grays in error states → semantic tokens
- Input focus rings → border-focus with proper ring

**Acceptance:**
- Error states use semantic error tokens
- All inputs have proper focus rings
- No hardcoded colors

**Verification:**
```bash
# Visit /map
# Trigger error state (semantic error colors)
# Focus on search input (solar lime ring)
# Check empty state styling
```

---

### Slice 6: Farm profile page design compliance
**Files (3):**
- src/app/shop/[slug]/page.tsx
- src/components/FarmPageClient.tsx (if separate)

**Violations to Fix:**
- Hardcoded status colors → semantic tokens
- Wrong shadows → premium variants
- Missing focus states → add focus rings

**Acceptance:**
- All status indicators use semantic tokens
- Premium shadows
- Focus rings on all interactive elements

**Verification:**
```bash
# Visit /shop/[slug]
# Check "Open Now" badge (semantic success)
# Check image gallery (premium shadows)
# Tab through interactive elements (focus rings)
```

---

## PHASE 2: SHARED COMPONENTS (Widest Reuse)

### Slice 7: FarmList component compliance
**Files (1):**
- src/components/FarmList.tsx

**Violations to Fix (120+ line changes):**
- border-gray-100 → border-border-default
- bg-gray-50 → bg-background-surface
- text-gray-900 dark:text-white → text-text-heading
- bg-green-50 text-green-600 → bg-success-light text-success-dark
- transition-all → transition-colors

**Acceptance:**
- All hardcoded grays → semantic tokens
- Status badges use semantic colors
- Specific transitions only
- No visual regressions

**Verification:**
```bash
# Check any page with farm list
# Verify card backgrounds (semantic surface)
# Check badge colors (semantic success/info)
# Test hover states (smooth transitions)
```

---

### Slice 8: ConsentBanner component compliance
**Files (1):**
- src/components/ConsentBanner.tsx

**Violations to Fix:**
- shadow-2xl → shadow-premium-xl
- dark:border-gray-700/50 → border-border-default
- dark:bg-obsidian/90 → bg-background-canvas/90
- text-gray-600/700 → text-text-body/text-text-heading
- bg-gray-300 → bg-background-surface
- transition-all → transition-colors

**Acceptance:**
- Premium shadow variant
- All semantic tokens
- Specific transitions
- Dark mode works correctly

**Verification:**
```bash
# Clear cookies, reload site
# Check consent banner appearance (premium shadow)
# Test button hover states (semantic colors)
# Toggle dark mode (tokens adapt)
```

---

### Slice 9: GracefulFallbacks component compliance
**Files (1):**
- src/components/GracefulFallbacks.tsx

**Violations to Fix:**
- bg-red-100 text-red-600 → bg-error-light text-error-dark
- bg-amber-100 text-amber-600 → bg-warning-light text-warning-dark
- All status indicators → semantic tokens

**Acceptance:**
- Error states use error tokens
- Warning states use warning tokens
- Consistent with design system

**Verification:**
```bash
# Trigger error state (network offline)
# Check error message styling (semantic error)
# Test warning state if applicable
```

---

### Slice 10: PhotoViewer component compliance
**Files (1):**
- src/components/PhotoViewer.tsx

**Violations to Fix:**
- Status badge colors → semantic tokens
- shadow-md/shadow-2xl → shadow-premium variants
- transition-all duration-200 → transition-shadow duration-150

**Acceptance:**
- Status badges semantic
- Premium shadows
- Specific transitions

**Verification:**
```bash
# Open photo viewer/gallery
# Check status badges (semantic colors)
# Test modal shadow (premium-xl)
# Verify animations (smooth, no jank)
```

---

## PHASE 3: FEATURE COMPONENTS

### Slice 11: Map feature components (Part 1)
**Files (2):**
- src/features/map/ui/MarkerActions.tsx
- src/features/map/ui/MapMarkerPopover.tsx (if needed)

**Violations to Fix:**
- shadow-2xl → shadow-premium-xl
- transition-all → transition-shadow
- bg-gray-300/gray-100 → semantic tokens
- text-gray-400 → text-text-muted

**Acceptance:**
- Premium shadows
- Semantic tokens
- Specific transitions

**Verification:**
```bash
# Visit /map
# Click farm marker
# Check marker actions popup (premium shadow)
# Verify button colors (semantic)
```

---

### Slice 12: Map feature components (Part 2)
**Files (2):**
- src/features/map/ui/LocationTracker.tsx
- src/features/map/ui/LiveLocationTracker.tsx (if separate)

**Violations to Fix:**
- bg-blue-100 text-blue-700 → bg-info-light text-info-dark
- bg-green-100 text-green-700 → bg-success-light text-success-dark
- bg-red-100 text-red-700 → bg-error-light text-error-dark

**Acceptance:**
- Status indicators semantic
- Location states clear
- Proper color contrast

**Verification:**
```bash
# Visit /map
# Enable location tracking
# Check "Getting location" state (info)
# Check "Location found" state (success)
# Check "Location denied" state (error)
```

---

### Slice 13: Remaining map components
**Files (3-5):**
- src/features/map/ui/ClusterPreview.tsx
- Any other map UI components with violations

**Violations to Fix:**
- Hardcoded colors → semantic tokens
- Wrong shadows → premium variants
- transition-all → specific properties

**Acceptance:**
- All map components follow design system
- Consistent with main components

**Verification:**
```bash
# Visit /map
# Click cluster marker
# Check cluster preview (semantic colors, premium shadow)
# Test all map interactions
```

---

## PHASE 4: UTILITIES & POLISH

### Slice 14: Create utility functions for common fixes
**Files (2):**
- src/lib/design-tokens.ts (new)
- Update components to use utilities

**Create:**
```typescript
// Status badge helper
export const getStatusBadgeClasses = (status: 'success' | 'error' | 'warning' | 'info') => {
  // Returns semantic token classes
}

// Shadow helper
export const getShadowClasses = (variant: 'premium' | 'premium-lg' | 'premium-xl') => {
  // Returns correct shadow classes
}
```

**Acceptance:**
- Utilities reduce duplication
- Type-safe design token usage

---

### Slice 15: Button component touch target fix
**Files (1):**
- src/components/ui/Button.tsx

**Fix:**
- Remove sm variant (h-10) OR increase to h-12 minimum
- Update all usages to use md (h-12) as default

**Acceptance:**
- All buttons meet 48px minimum
- No breaking changes in layouts

**Verification:**
```bash
# Search codebase for Button usage
# Verify all instances work with h-12 minimum
# Check dense UIs (admin panels) for layout issues
```

---

### Slice 16: Final audit and verification
**Files (Multiple - verification only):**

**Tasks:**
- Run ESLint with Tailwind rules
- Run Prettier to order classes
- Visual regression testing
- Accessibility audit with axe DevTools
- Dark mode verification

**Acceptance:**
- 0 ESLint violations
- All classes ordered
- No visual regressions
- WCAG AA compliance
- Dark mode works

**Verification:**
```bash
cd farm-frontend
pnpm lint
pnpm prettier --check src/
# Manual testing checklist
```

---

## RISK MITIGATION

### Breaking Changes to Watch
1. **Button size change:** Small buttons h-10 → h-12 may affect dense layouts
2. **Shadow changes:** May look different initially (intentional upgrade)
3. **Color changes:** Semantic tokens may shift hues slightly

### Rollback Strategy
Each slice is independently committable. If issues arise:
```bash
git revert <commit-hash>
```

---

## SUCCESS METRICS

After all slices complete:
- [ ] 0 hardcoded color violations
- [ ] 0 transition-all usages
- [ ] All shadows use premium variants
- [ ] All buttons ≥48px touch target
- [ ] All focus rings visible
- [ ] Dark mode works perfectly
- [ ] Lighthouse score ≥95
- [ ] 0 axe DevTools violations

---

## ESTIMATED TIMELINE

- Phase 1 (Pages): 4 slices × ~20 min = 80 min
- Phase 2 (Shared): 4 slices × ~15 min = 60 min
- Phase 3 (Features): 3 slices × ~15 min = 45 min
- Phase 4 (Polish): 3 slices × ~10 min = 30 min

**Total:** ~3.5 hours of focused implementation

---

## NEXT STEPS

1. Update godtier-ledger.md with this plan
2. Execute Slice 3 (Homepage compliance)
3. Verify and commit
4. Repeat for all slices

**Current Status:** Ready to begin Phase 1, Slice 3

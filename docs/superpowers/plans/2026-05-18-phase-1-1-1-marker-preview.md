# Phase 1.1.1 — Marker Preview Polish + Unify (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-component, mobile-vs-desktop split marker-tap experience (`MarkerActions` sheet + `FarmPreviewCard` floater) with a single design-token-driven `FarmPreviewCard` wrapped by `MarkerPreview` that renders the right layout on each viewport. Drop dead code, fix Emil-style polish violations, add tactile feedback.

**Architecture:**
- One **presentation component** (`FarmPreviewCard`) — owns all visual decisions, gets data via props, uses design tokens.
- One **layout wrapper** (`MarkerPreview`) — chooses mobile bottom-anchored vs desktop floating-card positioning.
- Map page renders `MarkerPreview` once for both platforms; `MapLibreShell` stops bothering with `MarkerActions` and `handleFavorite`.

**Tech stack:** React 19 (Next.js 16 App Router), Tailwind 3, MapLibre GL, `lucide-react` icons. Tests: `node:test` (existing harness; no React Testing Library — pure-helper tests only per reset spec §4 deferring component tests to Phase 2).

**Spec:** `docs/superpowers/specs/2026-05-18-phase-1-map-polish-design.md` §4 Slice 1.1.1 + §4.5 (locked Option C).

---

## File Structure

**Create:**
- `farm-frontend/src/features/map/ui/MarkerPreview.tsx` — layout wrapper (mobile bottom-anchored / desktop floating-card)
- `farm-frontend/src/features/map/lib/preview-helpers.ts` — pure helpers (`truncateHook`, `getOpeningTone`, `buildDirectionsUrl`, `buildShopUrl`) extracted for TDD
- `farm-frontend/src/features/map/lib/preview-helpers.test.ts` — `node:test` cases for the above

**Modify:**
- `farm-frontend/src/app/globals.css` — add `--brand-action`, `--brand-action-hover`, `--brand-action-text` to the light block (after line 215, near other brand vars) and dark block (after line 558)
- `farm-frontend/tailwind.config.js` — expose those three as Tailwind colour utilities (after line 241, near `brand-primary`)
- `farm-frontend/src/features/map/ui/FarmPreviewCard.tsx` — migrate hex codes to tokens; `<img>` → `<Image>`; fix entry animation; tactile `:active`; tabular-nums; use the new helpers
- `farm-frontend/src/features/map/ui/MapLibreShell.tsx` — remove `MarkerActions` import + usage (lines 13, 651-665); remove `handleFavorite` (lines 516-519)
- `farm-frontend/src/app/map/page.tsx` — replace the desktop-only `FarmPreviewCard` block (~lines 532-546) with `MarkerPreview` that works on both platforms; wire `onViewDetails` to `router.push('/shop/<slug>')`

**Delete:**
- `farm-frontend/src/features/map/ui/MapMarkerPopover.tsx` (145 LOC, zero callers, pre-confirmed)
- `farm-frontend/src/features/map/ui/MarkerActions.tsx` (215 LOC, becomes unreferenced after this slice)

**Append:**
- `farm-companion/docs/assistant/execution-ledger.md` — one slice entry (carve-out doc).

**Budget check:** 8 user-facing files modified or created (`globals.css`, `tailwind.config.js`, `FarmPreviewCard.tsx`, `MapLibreShell.tsx`, `map/page.tsx`, `MarkerPreview.tsx`, `preview-helpers.ts`, `preview-helpers.test.ts`). At budget. Ledger doc + the two deletions don't count.

---

## Tasks

### Task 0: Branch + sync

**Files:** none (git only)

- [ ] **Step 0.1: Branch from current master**

```bash
cd /Users/abuaa/Projects/farm-companion
git checkout master
git pull --ff-only
cd farm-frontend
git checkout -b polish/phase-1-1-1-marker-preview
```

Expected: "Switched to a new branch 'polish/phase-1-1-1-marker-preview'".

- [ ] **Step 0.2: Confirm previous PRs landed cleanly**

```bash
git log --oneline -6
```

Expected: top commits include `#162` (blob.ts), `#163` (photos.ts), `#164` + `#165` (redis cleanup), and the docs spec PR `#166` either merged or still open.

---

### Task 1: Add `--brand-action` design tokens

**Files:**
- Modify: `farm-frontend/src/app/globals.css` (light block ~line 215, dark block ~line 558)
- Modify: `farm-frontend/tailwind.config.js` (extend.colors block, after line 241)

- [ ] **Step 1.1: Light-block token addition**

In `src/app/globals.css`, find the line `--brand-accent-dark: #65a30d;` (around line 217). Immediately after it, add:

```css
  /* Map-surface CTAs and clusters (Phase 1.1 — earthy primary).
     Resolves via --harvest-leaf-* palette imported from harvest-theme.css. */
  --brand-action: var(--harvest-leaf-900);        /* #14532D */
  --brand-action-hover: var(--harvest-leaf-800);  /* #166534 */
  --brand-action-text: #FFFFFF;
```

- [ ] **Step 1.2: Dark-block token addition**

In `src/app/globals.css`, find the dark-block line `--brand-accent-dark: #84cc16;` (around line 558). Immediately after it, add:

```css
  --brand-action: var(--harvest-leaf-500);        /* #22C55E — brighter on dark per WCAG */
  --brand-action-hover: var(--harvest-leaf-400);  /* #4ADE80 */
  --brand-action-text: #052e16;                   /* harvest-leaf-950 equivalent for contrast */
```

- [ ] **Step 1.3: Tailwind exposure**

In `tailwind.config.js`, find `'brand-danger': '#F43F5E',` (around line 241). Immediately after it, add:

```js
        // Map-surface CTAs (Phase 1.1 spec §4.5 — locked Option C)
        'brand-action': 'var(--brand-action)',
        'brand-action-hover': 'var(--brand-action-hover)',
        'brand-action-text': 'var(--brand-action-text)',
```

- [ ] **Step 1.4: Smoke check that nothing breaks**

```bash
cd farm-frontend
pnpm exec tsc --noEmit
```

Expected: EXIT=0. Tokens are string `var(...)` references, so tsc has nothing to check; this is the "did we break anything else" canary.

- [ ] **Step 1.5: Commit checkpoint**

```bash
git add src/app/globals.css tailwind.config.js
git commit -m "feat(tokens): add --brand-action token for map-surface CTAs (Phase 1.1.1)

Per docs/superpowers/specs/2026-05-18-phase-1-map-polish-design.md §4.5
(operator selected Option C). Provides one swap-point for the green
primary-action colour used by map cluster fills and the marker preview's
'View Full Details' CTA.

Light: harvest-leaf-900 (#14532D) / hover harvest-leaf-800.
Dark:  harvest-leaf-500 (#22C55E) / hover harvest-leaf-400.
Text:  white on light, #052e16 on dark (WCAG-safe contrast)."
```

---

### Task 2: TDD pure helpers (`preview-helpers.ts`)

**Files:**
- Create: `farm-frontend/src/features/map/lib/preview-helpers.ts`
- Create: `farm-frontend/src/features/map/lib/preview-helpers.test.ts`

**Why:** Extract pure logic from `FarmPreviewCard` so it's covered by `node:test` (existing harness). The card itself stays presentational; helpers carry the rules.

- [ ] **Step 2.1: Write the failing test file**

Create `src/features/map/lib/preview-helpers.test.ts`:

```ts
// Pure helpers for FarmPreviewCard. Run via: pnpm test:unit

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  truncateHook,
  getOpeningTone,
  buildDirectionsUrl,
  buildShopUrl,
} from './preview-helpers'

test('truncateHook returns undefined for empty/whitespace input', () => {
  assert.equal(truncateHook(undefined), undefined)
  assert.equal(truncateHook(''), undefined)
  assert.equal(truncateHook('   '), undefined)
})

test('truncateHook returns short descriptions unchanged', () => {
  const short = 'Family farm shop in the Cotswolds.'
  assert.equal(truncateHook(short), short)
})

test('truncateHook caps at 120 chars by default', () => {
  const long = 'a'.repeat(200)
  const out = truncateHook(long)
  assert.equal(out?.length, 120)
})

test('truncateHook respects custom max', () => {
  const long = 'a'.repeat(80)
  assert.equal(truncateHook(long, 50)?.length, 50)
})

test('getOpeningTone returns "open" for isOpen=true', () => {
  assert.equal(getOpeningTone(true), 'open')
})

test('getOpeningTone returns "closed" for isOpen=false', () => {
  assert.equal(getOpeningTone(false), 'closed')
})

test('getOpeningTone returns "unknown" for null/undefined', () => {
  assert.equal(getOpeningTone(null), 'unknown')
  assert.equal(getOpeningTone(undefined), 'unknown')
})

test('buildDirectionsUrl produces a google maps dir URL', () => {
  const url = buildDirectionsUrl(51.5074, -0.1278)
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1/)
  assert.match(url, /destination=51\.5074,-0\.1278/)
})

test('buildShopUrl uses origin + slug', () => {
  assert.equal(
    buildShopUrl('https://example.com', 'priory-farm'),
    'https://example.com/shop/priory-farm',
  )
})

test('buildShopUrl strips trailing slash from origin', () => {
  assert.equal(
    buildShopUrl('https://example.com/', 'priory-farm'),
    'https://example.com/shop/priory-farm',
  )
})
```

- [ ] **Step 2.2: Run tests, confirm they fail**

```bash
pnpm exec tsx --test src/features/map/lib/preview-helpers.test.ts 2>&1 | head -20
```

Expected: failures on `Cannot find module './preview-helpers'` or similar — file doesn't exist yet.

- [ ] **Step 2.3: Implement the helpers**

Create `src/features/map/lib/preview-helpers.ts`:

```ts
/**
 * Pure helpers for FarmPreviewCard.
 * Extracted so the card itself can stay presentational and these
 * rules are testable under node:test (no React Testing Library needed).
 */

/**
 * Truncate a farm's description to a hook-length string suitable for the
 * preview card. Returns undefined for empty/whitespace input so callers
 * can branch with `{hook && ...}`.
 */
export function truncateHook(description: string | undefined, max = 120): string | undefined {
  if (!description) return undefined
  const trimmed = description.trim()
  if (!trimmed) return undefined
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max)
}

/**
 * Tri-state open/closed/unknown tone for the status badge.
 * Drives token selection in FarmPreviewCard.
 */
export type OpeningTone = 'open' | 'closed' | 'unknown'

export function getOpeningTone(isOpen: boolean | null | undefined): OpeningTone {
  if (isOpen === true) return 'open'
  if (isOpen === false) return 'closed'
  return 'unknown'
}

/**
 * Build a Google Maps directions URL for a lat/lng pair.
 * Used by both the desktop and mobile preview layouts.
 */
export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/**
 * Build the canonical in-app /shop/<slug> URL from an origin.
 * Strips a trailing slash from origin so we never produce double-slashes.
 */
export function buildShopUrl(origin: string, slug: string): string {
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin
  return `${cleanOrigin}/shop/${slug}`
}
```

- [ ] **Step 2.4: Run tests, confirm pass**

```bash
pnpm exec tsx --test src/features/map/lib/preview-helpers.test.ts 2>&1 | grep -E "^(ok|not ok|# tests|# pass|# fail)" | head -20
```

Expected: 10 `ok` lines, zero `not ok`.

- [ ] **Step 2.5: Commit checkpoint**

```bash
git add src/features/map/lib/preview-helpers.ts src/features/map/lib/preview-helpers.test.ts
git commit -m "test(map): add preview-helpers with TDD coverage (Phase 1.1.1)

Pure helpers extracted from FarmPreviewCard so its visual logic can be
verified under the existing node:test harness without requiring React
Testing Library. Reset spec §4 defers component tests to Phase 2.

Covered: truncateHook, getOpeningTone, buildDirectionsUrl, buildShopUrl
(10 cases, all green)."
```

---

### Task 3: Migrate `FarmPreviewCard` to tokens + polish

**Files:**
- Modify: `farm-frontend/src/features/map/ui/FarmPreviewCard.tsx` (full rewrite — same external API)

- [ ] **Step 3.1: Replace the file**

Overwrite `src/features/map/ui/FarmPreviewCard.tsx` with:

```tsx
'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { X, Phone, Navigation, Share2, Circle, ChevronRight, Leaf } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'
import {
  truncateHook,
  getOpeningTone,
  buildDirectionsUrl,
  buildShopUrl,
} from '../lib/preview-helpers'

interface FarmPreviewCardProps {
  farm: FarmShop
  onClose: () => void
  onViewDetails: (farmId: string) => void
  formatDistance?: (distance: number) => string
  className?: string
}

/**
 * FarmPreviewCard — shown when a map marker is tapped.
 * Presentational only; layout (positioning) is owned by MarkerPreview.
 * Polish per Emil's framework (custom easing, scale-from-0.97 entry,
 * tactile :active, tabular-nums on changing digits).
 */
export default function FarmPreviewCard({
  farm,
  onClose,
  onViewDetails,
  formatDistance,
  className = '',
}: FarmPreviewCardProps) {
  const heroImage = farm.images?.[0] ? getImageUrl(farm.images[0]) : undefined
  const hasHours = farm.hours && farm.hours.length > 0
  const openingStatus = hasHours ? formatOpeningStatus(farm.hours!) : null
  const tone = getOpeningTone(openingStatus?.isOpen)
  const hasDistance = farm.distance !== undefined && formatDistance
  const hook = truncateHook(farm.description)

  const directionsUrl = buildDirectionsUrl(farm.location.lat, farm.location.lng)
  const phoneUrl = farm.contact?.phone ? `tel:${farm.contact.phone}` : null

  const handleShare = useCallback(async () => {
    const shareData = {
      title: farm.name,
      text: `Check out ${farm.name} — a local farm shop in ${farm.location.county}`,
      url: buildShopUrl(window.location.origin, farm.slug),
    }
    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareData.url)
    }
  }, [farm])

  return (
    <div
      data-mounted
      className={[
        'group relative bg-background-elevated text-text-body rounded-2xl overflow-hidden',
        'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.10)]',
        'transition-[transform,opacity] duration-200',
        '[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
        'data-[mounted]:opacity-100 data-[mounted]:translate-y-0 data-[mounted]:scale-100',
        'opacity-0 translate-y-2 scale-[0.97]',
        className,
      ].join(' ')}
      style={{ width: 320 }}
      role="dialog"
      aria-label={`Preview of ${farm.name}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 active:scale-[0.97] transition-[background-color,transform] duration-150"
        aria-label="Close preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Hero image */}
      <div className="relative w-full h-[180px] bg-background-surface">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={farm.name}
            fill
            className="object-cover [outline:1px_solid_rgba(0,0,0,0.08)] [outline-offset:-1px] dark:[outline-color:rgba(255,255,255,0.10)]"
            sizes="320px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-12 h-12 text-text-subtle" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-medium text-text-heading [text-wrap:balance]">
          {farm.name}
        </h3>
        <p className="text-sm text-text-muted mt-0.5 [font-variant-numeric:tabular-nums]">
          {farm.location.county}
          {hasDistance && ` · ${formatDistance!(farm.distance!)}`}
        </p>

        {/* Hook */}
        {hook && (
          <p className="text-sm italic text-text-body mt-2 line-clamp-2 [text-wrap:pretty]">
            &ldquo;{hook}&rdquo;
          </p>
        )}

        {/* Status */}
        {openingStatus && tone !== 'unknown' && (
          <div className="flex items-center gap-1.5 mt-3 [font-variant-numeric:tabular-nums]">
            <Circle
              className={[
                'w-2.5 h-2.5',
                tone === 'open' ? 'fill-brand-action text-brand-action' : 'fill-brand-danger text-brand-danger',
              ].join(' ')}
              aria-hidden
            />
            <span
              className={[
                'text-sm font-medium',
                tone === 'open' ? 'text-brand-action' : 'text-brand-danger',
              ].join(' ')}
            >
              {openingStatus.status}
            </span>
            {openingStatus.nextOpening && (
              <span className="text-sm text-text-muted">{openingStatus.nextOpening}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {farm.offerings && farm.offerings.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {farm.offerings.slice(0, 3).map((offering) => (
              <span
                key={offering}
                className="inline-block px-2 py-0.5 bg-brand-action/10 text-brand-action text-[11px] font-semibold rounded-full uppercase tracking-wide"
              >
                {offering}
              </span>
            ))}
          </div>
        )}

        {/* View details CTA — Emil: tactile :active, custom easing, durations ≤200ms */}
        <button
          onClick={() => onViewDetails(farm.id)}
          className="w-full mt-4 py-2.5 bg-brand-action hover:bg-brand-action-hover active:scale-[0.98] text-brand-action-text text-[15px] font-medium rounded-lg transition-[transform,background-color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-1"
        >
          View Full Details
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Action buttons row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {phoneUrl ? (
            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-1 py-2.5 bg-background-surface text-text-body text-[13px] font-medium rounded-lg hover:bg-background-hover active:scale-[0.98] transition-[transform,background-color] duration-150"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          ) : (
            <div aria-hidden />
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 py-2.5 bg-background-surface text-text-body text-[13px] font-medium rounded-lg hover:bg-background-hover active:scale-[0.98] transition-[transform,background-color] duration-150"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1 py-2.5 bg-background-surface text-text-body text-[13px] font-medium rounded-lg hover:bg-background-hover active:scale-[0.98] transition-[transform,background-color] duration-150"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Notes on the changes (spec §3.3 + §4.5):**
- Zero hex literals. All colour comes from `text-text-*`, `bg-background-*`, `bg-brand-action*`, `text-brand-danger`.
- `<img>` → `next/image` with `fill`, `sizes="320px"`, `loading="lazy"`, neutral inset outline (light + dark variants).
- Entry animation: `data-mounted` attribute + `data-[mounted]:` Tailwind variant selectors. Element renders with `opacity-0 translate-y-2 scale-[0.97]` and immediately transitions to `opacity-100 translate-y-0 scale-100` because `data-mounted` is present on first paint. Custom cubic-bezier per Emil. (Avoids `@starting-style` for browser-support resilience.)
- `:active scale(0.97-0.98)` on every button per Emil's tactile rule.
- `[font-variant-numeric:tabular-nums]` on distance + opening-status text.
- `[text-wrap:balance]` on the heading, `[text-wrap:pretty]` on the hook quote.
- Uses helpers from Task 2.

- [ ] **Step 3.2: Run typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: EXIT=0.

- [ ] **Step 3.3: Confirm helper tests still pass**

```bash
pnpm exec tsx --test src/features/map/lib/preview-helpers.test.ts 2>&1 | grep -cE "^ok "
```

Expected: `10`.

- [ ] **Step 3.4: Commit checkpoint**

```bash
git add src/features/map/ui/FarmPreviewCard.tsx
git commit -m "refactor(map): FarmPreviewCard uses tokens, next/image, polished motion (Phase 1.1.1)

- Zero hex literals: all colour via design tokens (bg-brand-action, etc).
- <img> → next/image with fill, sizes, loading=lazy, neutral inset outline.
- Entry: data-mounted attribute pattern, opacity+translateY+scale(0.97)→0,
  cubic-bezier(0.23,1,0.32,1), 200ms (Emil's framework).
- Tactile :active scale(0.98) on every button.
- Tabular-nums on distance + opening-status text.
- text-wrap:balance on heading, text-wrap:pretty on hook quote.
- Logic extracted to preview-helpers.ts (TDD-covered)."
```

---

### Task 4: Create `MarkerPreview` layout wrapper

**Files:**
- Create: `farm-frontend/src/features/map/ui/MarkerPreview.tsx`

- [ ] **Step 4.1: Implement the wrapper**

Create `src/features/map/ui/MarkerPreview.tsx`:

```tsx
'use client'

import type { FarmShop } from '@/types/farm'
import FarmPreviewCard from './FarmPreviewCard'

interface MarkerPreviewProps {
  farm: FarmShop | null
  isDesktop: boolean
  panelWidth?: number               // desktop only: width of the side panel to avoid overlap
  onClose: () => void
  onViewDetails: (farmId: string) => void
  formatDistance?: (distance: number) => string
}

/**
 * MarkerPreview — positioning wrapper around FarmPreviewCard.
 * One component, two layouts:
 *   - Desktop: floating card pinned bottom-left of the map viewport
 *   - Mobile:  bottom-anchored full-width(-with-padding) sheet-style card,
 *              sitting above the collapsed bottom-sheet handle.
 *
 * Renders nothing when farm is null.
 */
export default function MarkerPreview({
  farm,
  isDesktop,
  panelWidth = 0,
  onClose,
  onViewDetails,
  formatDistance,
}: MarkerPreviewProps) {
  if (!farm) return null

  if (isDesktop) {
    return (
      <div
        className="absolute z-30 bottom-6 pointer-events-none flex justify-center"
        style={{ left: '24px', right: `${panelWidth + 24}px` }}
      >
        <div className="pointer-events-auto">
          <FarmPreviewCard
            farm={farm}
            onClose={onClose}
            onViewDetails={onViewDetails}
            formatDistance={formatDistance}
          />
        </div>
      </div>
    )
  }

  // Mobile: bottom-anchored, full width minus 16px gutters, above the bottom-sheet's collapsed handle (~64px)
  return (
    <div
      className="md:hidden fixed left-2 right-2 z-40 pointer-events-none"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto mx-auto" style={{ maxWidth: 360 }}>
        <FarmPreviewCard
          farm={farm}
          onClose={onClose}
          onViewDetails={onViewDetails}
          formatDistance={formatDistance}
          className="w-full"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4.2: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: EXIT=0.

- [ ] **Step 4.3: Commit checkpoint**

```bash
git add src/features/map/ui/MarkerPreview.tsx
git commit -m "feat(map): add MarkerPreview layout wrapper (Phase 1.1.1)

One component, two layouts. Desktop renders the FarmPreviewCard as a
floating card pinned to the bottom-left of the map viewport, avoiding
the side-panel via panelWidth. Mobile renders it bottom-anchored,
above the collapsed bottom-sheet handle, full-width with 8px gutters
and a 360px cap. Renders nothing when farm is null.

Replaces the historical mobile MarkerActions sheet (deleted later in
this slice)."
```

---

### Task 5: Wire `MarkerPreview` into the map page

**Files:**
- Modify: `farm-frontend/src/app/map/page.tsx`

- [ ] **Step 5.1: Swap the import**

In `src/app/map/page.tsx`, locate (around line 17):

```tsx
import FarmPreviewCard from '@/features/map/ui/FarmPreviewCard'
```

Replace that single line with:

```tsx
import MarkerPreview from '@/features/map/ui/MarkerPreview'
```

(`FarmPreviewCard` is now consumed exclusively by `MarkerPreview`; the page no longer imports it directly.)

- [ ] **Step 5.2: Add the router for in-app navigation**

In `src/app/map/page.tsx`, locate the existing import line (around line 4):

```tsx
import { useSearchParams } from 'next/navigation'
```

Replace with:

```tsx
import { useSearchParams, useRouter } from 'next/navigation'
```

Inside `MapPageContent`, right after the existing `const searchParams = useSearchParams()` (around line 67), add:

```tsx
  const router = useRouter()
```

- [ ] **Step 5.3: Define the unified view-details handler**

In `src/app/map/page.tsx`, grep for `handleViewFarmDetails`:

```bash
grep -n "handleViewFarmDetails" src/app/map/page.tsx
```

Locate the existing definition (likely a `useCallback` somewhere in the body). Replace its body with:

```tsx
  const handleViewFarmDetails = useCallback((farmId: string) => {
    const target = farms.find(f => f.id === farmId)
    if (target) {
      router.push(`/shop/${target.slug}`)
    }
  }, [farms, router])
```

If it does not exist yet, add it just below the other handlers (search `setPreviewFarm` for nearby context).

- [ ] **Step 5.4: Replace the desktop-only FarmPreviewCard block**

In `src/app/map/page.tsx`, locate (around lines 532-546):

```tsx
      {/* ========== FARM PREVIEW CARD (desktop marker click) ========== */}
      {previewFarm && isDesktop && (
        <div className="absolute z-30 bottom-6 pointer-events-none flex justify-center"
          style={{ left: '24px', right: `${panelWidth + 24}px` }}
        >
          <div className="pointer-events-auto relative">
            <FarmPreviewCard
              farm={previewFarm}
              onClose={() => setPreviewFarm(null)}
              onViewDetails={handleViewFarmDetails}
              formatDistance={formatDistance}
            />
          </div>
        </div>
      )}
```

Replace the entire block with:

```tsx
      {/* ========== MARKER PREVIEW (mobile + desktop) ========== */}
      <MarkerPreview
        farm={previewFarm}
        isDesktop={isDesktop}
        panelWidth={panelWidth}
        onClose={() => setPreviewFarm(null)}
        onViewDetails={handleViewFarmDetails}
        formatDistance={formatDistance}
      />
```

- [ ] **Step 5.5: Ensure `previewFarm` is set on mobile too**

Grep for where `setPreviewFarm` is called:

```bash
grep -n "setPreviewFarm" src/app/map/page.tsx
```

If any call-site is gated by `isDesktop` (e.g. `if (isDesktop) setPreviewFarm(farm)`), remove that gate so mobile taps also populate it. Typical shape after the fix:

```tsx
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarmId(farmId)
    const farm = filteredFarms.find(f => f.id === farmId)
    if (farm) setPreviewFarm(farm)
  }, [filteredFarms])
```

- [ ] **Step 5.6: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: EXIT=0.

- [ ] **Step 5.7: Commit checkpoint**

```bash
git add src/app/map/page.tsx
git commit -m "feat(map): use MarkerPreview for both mobile and desktop (Phase 1.1.1)

Replaces the desktop-only FarmPreviewCard block. Both viewports now
render the same component with appropriate positioning. Adds router-
based 'View Full Details' navigation to /shop/<slug>.

Mobile no longer relies on MarkerActions (removed in the next task)."
```

---

### Task 6: Strip `MarkerActions` and `handleFavorite` from `MapLibreShell`

**Files:**
- Modify: `farm-frontend/src/features/map/ui/MapLibreShell.tsx`

- [ ] **Step 6.1: Remove the import**

In `src/features/map/ui/MapLibreShell.tsx` line 13:

```tsx
import MarkerActions from './MarkerActions'
```

Delete the entire line.

- [ ] **Step 6.2: Remove the `handleFavorite` TODO stub**

Locate (around lines 516-519):

```tsx
  const handleFavorite = useCallback((farmId: string) => {
    triggerHaptic('medium')
    // TODO: Implement favorites
  }, [triggerHaptic])
```

Delete the entire `useCallback`.

- [ ] **Step 6.3: Remove the mobile `MarkerActions` render block**

Locate (around lines 650-665):

```tsx
      {/* Marker Actions - Mobile Only */}
      {!isDesktop && (
        <MarkerActions
          farm={markerState.selected}
          isVisible={markerState.showActions}
          onClose={handleCloseMarkerActions}
          onNavigate={handleNavigate}
          onFavorite={handleFavorite}
          onShare={handleShare}
          userLocation={effectiveUserLocation ? {
            latitude: effectiveUserLocation.latitude,
            longitude: effectiveUserLocation.longitude
          } : null}
          isDesktop={isDesktop}
        />
      )}

      {/* Desktop marker interaction handled by FarmPreviewCard in page.tsx */}
```

Replace the entire block (both the conditional render and the desktop comment that follows it) with:

```tsx
      {/* Marker preview handled by MarkerPreview in map/page.tsx (mobile + desktop). */}
```

- [ ] **Step 6.4: Remove now-orphaned handlers**

After the deletions, check whether `handleShare`, `handleNavigate`, and `handleCloseMarkerActions` are still referenced:

```bash
grep -nE "handleShare|handleNavigate|handleCloseMarkerActions" src/features/map/ui/MapLibreShell.tsx
```

If grep returns ONLY their `useCallback` definitions (not call sites), delete those `useCallback` blocks. Otherwise, leave them — something else still uses them.

- [ ] **Step 6.5: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: EXIT=0. If there are unused-import errors for `useCallback` (because no callbacks remain), remove the unused part of the import.

- [ ] **Step 6.6: Commit checkpoint**

```bash
git add src/features/map/ui/MapLibreShell.tsx
git commit -m "refactor(map): drop MarkerActions and handleFavorite TODO from shell (Phase 1.1.1)

MarkerActions was mobile-only; MarkerPreview now handles both platforms
from map/page.tsx. The handleFavorite stub had only ever been a TODO;
favorites is deferred to a Phase 2+ proper feature with persistence
(spec §5)."
```

---

### Task 7: Delete the dead files

**Files:**
- Delete: `farm-frontend/src/features/map/ui/MapMarkerPopover.tsx`
- Delete: `farm-frontend/src/features/map/ui/MarkerActions.tsx`

- [ ] **Step 7.1: Confirm zero callers**

```bash
grep -rEn "MapMarkerPopover|MarkerActions" src/ 2>/dev/null | grep -v node_modules | grep -v "\.next"
```

Expected: empty output. If anything matches, fix that before deleting.

- [ ] **Step 7.2: Delete**

```bash
git rm src/features/map/ui/MapMarkerPopover.tsx src/features/map/ui/MarkerActions.tsx
```

- [ ] **Step 7.3: Re-run typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: EXIT=0.

- [ ] **Step 7.4: Commit checkpoint**

```bash
git commit -m "strip(map): delete dead MapMarkerPopover and MarkerActions (Phase 1.1.1)

MapMarkerPopover was already orphaned before this slice; MarkerActions
became orphaned in Task 6 when the mobile path moved to MarkerPreview.

Both deletions are pure (no other behaviour). 360 LOC removed."
```

---

### Task 8: Full verification gauntlet

**Files:** none (verification only)

- [ ] **Step 8.1: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: EXIT=0.

- [ ] **Step 8.2: Unit tests**

```bash
pnpm exec tsx --test "src/**/*.test.ts" > /tmp/farm-test-1.1.1.log 2>&1 & TPID=$!
sleep 25
if kill -0 $TPID 2>/dev/null; then
  echo "STILL_RUNNING after 25s; killing (known hang per observation 1323)"
  kill $TPID 2>/dev/null
  sleep 1
  kill -9 $TPID 2>/dev/null
fi
grep -cE "^ok " /tmp/farm-test-1.1.1.log
```

Expected: `21` (11 pre-existing + 10 from `preview-helpers`). If lower, inspect `/tmp/farm-test-1.1.1.log`.

- [ ] **Step 8.3: Production build**

```bash
pnpm build > /tmp/farm-build-1.1.1.log 2>&1
echo "BUILD_EXIT=$?"
grep -E "✓ Generating|Compiled successfully|error" /tmp/farm-build-1.1.1.log | grep -v "expected during build" | tail -8
```

Expected: `BUILD_EXIT=0`, a "✓ Generating static pages" line, no `error` lines except the known Prisma-without-DB warning.

- [ ] **Step 8.4: Postflight grep — no stray dead-code refs**

```bash
grep -rEn "MapMarkerPopover|MarkerActions|handleFavorite" src/ 2>/dev/null | grep -v "\.next" | grep -v node_modules
```

Expected: empty.

- [ ] **Step 8.5: Postflight grep — no map hex leakage**

```bash
grep -nE "#1A1A1A|#8C8C8C|#2D5016|#234012|#F5F5F5|#5C5C5C|#CC0000|#CCCCCC" src/features/map/ui/FarmPreviewCard.tsx
```

Expected: empty.

- [ ] **Step 8.6: Manual smoke (dev server)**

```bash
pnpm dev
```

Open `http://localhost:3001/map`. With browser devtools open:

- Resize to **375 × 812** (iPhone 13 mini). Tap a pin. Confirm: the preview card appears bottom-anchored above the bottom-sheet, with hero image, name, county, hook, status, tags, "View Full Details", and the Call / Directions / Share row. Tap "View Full Details" — navigates to `/shop/<slug>`. Tap a different pin without closing — card content updates.
- Resize to **1280 × 800**. Tap a pin. Confirm: the same card appears floating bottom-left of the map, respecting the side panel. Same content, same CTAs.
- Toggle dark mode. Confirm: card background, text, brand-action button, status badges all re-tone correctly. No raw white-on-white or hex-coloured surfaces.
- Tap a pin, then quickly tap another — entry animation should retarget smoothly (no jarring restart).
- Press "View Full Details" — should briefly scale to 0.98 on press (`:active`).

If any of these fail, stop and diagnose. Capture screenshots into `/tmp/` for the PR.

- [ ] **Step 8.7: Stop dev server**

`Ctrl+C` in the dev terminal.

---

### Task 9: Ledger + PR

**Files:**
- Modify: `farm-companion/docs/assistant/execution-ledger.md` (append)

- [ ] **Step 9.1: Append ledger entry**

In `/Users/abuaa/Projects/farm-companion/docs/assistant/execution-ledger.md`, append at the very end:

```markdown

### 2026-05-18 — Phase 1.1.1: Marker preview polish + unify

**Goal:** First Phase-1.1 polish slice. Replace the two-component, mobile-vs-desktop split marker-tap experience with a single design-token-driven FarmPreviewCard wrapped by MarkerPreview. Apply Emil Kowalski's polish framework end-to-end.

**Files changed:**
- CREATE `farm-frontend/src/features/map/ui/MarkerPreview.tsx` (mobile/desktop layout wrapper).
- CREATE `farm-frontend/src/features/map/lib/preview-helpers.ts` + `.test.ts` (10 TDD cases).
- MODIFY `farm-frontend/src/app/globals.css` (light + dark blocks: --brand-action token trio).
- MODIFY `farm-frontend/tailwind.config.js` (expose brand-action utilities).
- MODIFY `farm-frontend/src/features/map/ui/FarmPreviewCard.tsx` (tokens, next/image, polish, helpers).
- MODIFY `farm-frontend/src/features/map/ui/MapLibreShell.tsx` (drop MarkerActions, handleFavorite TODO).
- MODIFY `farm-frontend/src/app/map/page.tsx` (use MarkerPreview for both platforms; in-app navigation).
- DELETE `farm-frontend/src/features/map/ui/MapMarkerPopover.tsx` (145 LOC, pre-orphaned).
- DELETE `farm-frontend/src/features/map/ui/MarkerActions.tsx` (215 LOC, orphaned by this slice).

**Design decisions applied:**
- Primary-action colour: `--brand-action` token (Harvest Leaf 800/900 light, 400/500 dark) per locked Option C of the spec.
- Entry animation: `data-mounted` attribute + `opacity-0 translate-y-2 scale-[0.97]` → neutral, cubic-bezier(0.23,1,0.32,1), 200ms (Emil).
- `:active scale(0.98)` on every button.
- `[font-variant-numeric:tabular-nums]` on distance + opening status.
- `next/image` for hero with neutral inset outline.
- Cross-platform unification: same preview content on mobile and desktop, layout-only divergence.

**Verification:**
- `pnpm exec tsc --noEmit` → PASS (EXIT=0).
- `pnpm exec tsx --test "src/**/*.test.ts"` → 21 `ok` (11 pre-existing + 10 new preview-helpers).
- `pnpm build` → PASS (EXIT=0).
- Manual smoke at 375 px and 1280 px, light + dark → both layouts render with the same content; CTAs work; entry animation retargets cleanly; dark mode tokens resolve correctly.
- Postflight greps for `MapMarkerPopover`, `MarkerActions`, `handleFavorite`, and the migrated hex codes → all zero in `src/`.

**Risk and rollback:** Low. Mobile sheet content upgraded (gained hero image, hook, status, tags, in-app "View Details" CTA — superset of the old Navigate/Favorite/Share). Favorites was a TODO stub; deferred to Phase 2+ per spec §5. Rollback: `git revert <sha>`.

**PR:** (filled in after PR creation).

**Next:** Slice 1.1.2 (cluster polish — reconcile two styling systems, fix scale(0) entry, lighter shadows, kill the small-cluster preview sheet). Cluster palette adopts the same --brand-action token introduced here.
```

- [ ] **Step 9.2: Stage + commit ledger**

```bash
git add ../docs/assistant/execution-ledger.md
git commit -m "docs(ledger): log Phase 1.1.1 — marker preview polish + unify"
```

- [ ] **Step 9.3: Push the branch**

```bash
git push -u origin polish/phase-1-1-1-marker-preview
```

- [ ] **Step 9.4: Open the PR**

```bash
gh pr create --title "polish(map): unify marker preview + design tokens (Phase 1.1.1)" --body "$(cat <<'EOF'
## Phase 1.1.1 — Marker preview polish + unify

First slice of Phase 1.1 per the [map polish spec](../blob/master/docs/superpowers/specs/2026-05-18-phase-1-map-polish-design.md). Replaces the two-component, mobile-vs-desktop split marker-tap experience with one design-token-driven preview.

### Changes
- **New** `MarkerPreview` layout wrapper (mobile bottom-anchored / desktop floating).
- **New** `preview-helpers.ts` (pure functions, TDD-covered — 10 cases via `node:test`).
- **New** `--brand-action` design token trio in `globals.css` (light + dark), exposed via Tailwind (per spec §4.5 locked Option C).
- **Refactor** `FarmPreviewCard`: zero hex literals, `next/image` hero with neutral outline, custom-easing entry animation with `data-mounted` pattern, tactile `:active` scale, tabular-nums on changing digits.
- **Strip** `MarkerActions` (215 LOC) and `MapMarkerPopover` (145 LOC) from the codebase.
- **Strip** `handleFavorite` TODO from `MapLibreShell` (favorites deferred to Phase 2+ per spec §5).

### Design philosophy applied
- **Emil Kowalski**: scale-from-0.97 not 0 on entry, custom `cubic-bezier(0.23,1,0.32,1)`, durations ≤200ms, tactile `:active` press feedback, transform-origin awareness.
- **ecc:make-interfaces-feel-better**: image inset outlines, tabular-nums on counters, text-wrap balance/pretty, hit-area sizes.
- **Apple/Citymapper**: layered subtle shadows, consistent cross-platform interaction model.

### Verification
- `pnpm exec tsc --noEmit` — PASS (EXIT=0)
- `pnpm exec tsx --test "src/**/*.test.ts"` — 21 `ok` (11 pre-existing + 10 new)
- `pnpm build` — PASS (EXIT=0)
- Manual smoke at 375 + 1280 px, light + dark — pin-tap shows same preview content, layout adapts, CTAs work, entry animation retargets cleanly, all tokens resolve

### Risk and rollback
Low. Mobile sheet content was upgraded — gained hero image, hook quote, status badge, tags, in-app "View Details" CTA (superset of old Navigate/Favorite/Share). No URL changes. Rollback: `git revert <sha>`.

### Next slice
Slice 1.1.2 — cluster polish (reconcile two styling systems, fix `scale(0)` entry, lighter shadows, eliminate the small-cluster preview sheet). The `--brand-action` token introduced here propagates into cluster colours.
EOF
)"
```

- [ ] **Step 9.5: Capture the PR URL and update the ledger**

```bash
gh pr view --json url -q .url
```

Copy the URL, edit the ledger's `**PR:**` line to include it, then:

```bash
git add ../docs/assistant/execution-ledger.md
git commit -m "docs(ledger): record Phase 1.1.1 PR URL"
git push
```

---

## Self-Review

### Spec coverage check

Spec sections vs tasks:
- §3.1 (dead code) → Tasks 6.1, 6.2, 7 cover all four items (`MapMarkerPopover` deletion, `MarkerActions` deletion, `handleFavorite` removal). `generateClusterSVG` and `handleShowAllFarms` are explicitly deferred to Slice 1.1.2 per spec §4 — not gaps.
- §3.2 (hex codes) → Task 1 + Task 3 cover all 7 colour values.
- §3.3 (Emil polish violations) → Task 3 step 3.1 addresses: scale-from-0 (avoided), heavy shadow (replaced with layered), no press feedback (added `:active` scale to every button), arbitrary `animate-[…]` (replaced with `data-mounted` + transition), `<img>` (→ `next/image` with outline), no tabular-nums (added).
- §3.4 (cross-platform divergence) → Tasks 4 + 5 unify the model.
- §4 Slice 1.1.1 scope → all 7 numbered items covered. Item 7 (token audit) is implicit in Task 1 (we verified tokens before writing).
- §4.5 (locked Option C) → Task 1 implements the exact token spec.

No gaps detected.

### Placeholder scan

- "TBD" — zero
- "TODO" — present in step 6.2 where we DELETE the TODO; not a placeholder
- "implement later", "fill in" — zero
- "appropriate error handling" — zero
- "Add validation" — zero
- "Similar to Task N" — zero
- "Write tests for the above" without code — zero (Task 2 has 10 explicit assertions)

Clean.

### Type consistency

- `truncateHook(description: string | undefined, max = 120)` — used in Step 3.1 as `truncateHook(farm.description)`. Match.
- `getOpeningTone(isOpen: boolean | null | undefined)` — used as `getOpeningTone(openingStatus?.isOpen)`. `openingStatus?.isOpen` is `boolean | undefined`. Match.
- `buildDirectionsUrl(lat: number, lng: number)` — used as `buildDirectionsUrl(farm.location.lat, farm.location.lng)`. Match.
- `buildShopUrl(origin: string, slug: string)` — used in `handleShare` as `buildShopUrl(window.location.origin, farm.slug)`. Match.
- `MarkerPreview` props (Task 4): `farm, isDesktop, panelWidth, onClose, onViewDetails, formatDistance`. Matches consumer call in Task 5 Step 5.4.

Consistent.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-phase-1-1-1-marker-preview.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best when the plan has clean task boundaries (this one does — 9 independent tasks).

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints. Best when the work needs continuous human-in-the-loop pacing.

**Which approach?**

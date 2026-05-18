# Phase 1.1 — Map UX polish (design spec)

**Date:** 2026-05-18
**Status:** Spec
**Predecessors:** `2026-05-18-farm-companion-reset-design.md` (Phase 0 strip-then-build)
**Anchor:** Slice 1.1.1 — Marker tap: polish + unify

---

## 1. Goal

Phase 0 stripped the codebase to a clean spine. Phase 1.1 is the **first public-facing polish pass** on that spine, focused on the single most-touched interactive surface: the map's marker-tap experience.

After Phase 1.1 lands, the marker-tap → preview flow should feel like a deliberate product decision (one component, one set of tokens, one entry animation, one mental model across mobile and desktop) rather than the union of two parallel implementations.

This spec covers a **4-slice arc**. Slice 1.1.1 (the anchor) is detailed here. Slices 1.1.2 – 1.1.4 are sketched with enough rigor to lock ordering; each will be elaborated by `superpowers:writing-plans` when its turn comes.

---

## 2. Why this anchor

Three reasons map polish wins over the other Phase 1 candidates (perf, "open now" accuracy, search, individual farm page polish):

1. **The map is the spine.** Per the reset design spec, the product positioning is "map-first Citymapper-style". Polish here compounds; polish elsewhere is downstream.
2. **High user-visible payoff per LOC.** Every visitor who taps a pin sees the preview. Hex-code-vs-token improvements ship immediately as felt quality.
3. **Forces system audit.** Migrating one preview card to the design tokens surfaces whether the rest of the app is using tokens correctly. Cheap canary for the design system.

Three reasons "marker tap" wins over "cluster polish" as the *first* slice within the map arc:

1. **Markers are the unit; clusters aggregate them.** Polishing the unit informs the aggregation's right answer.
2. **Cross-platform divergence lives in the marker-tap flow.** Mobile shows `MarkerActions` (sheet), desktop shows `FarmPreviewCard` (card). Same tap, different products. Fixing this is a one-time forcing function.
3. **Cluster polish (Slice 1.1.2) needs a reference for what "good" looks like.** Marker preview ships that reference.

---

## 3. Current state (concrete findings)

Read of `src/features/map/` (6,099 LOC) and `src/app/map/page.tsx` (701 LOC) on 2026-05-18.

### 3.1 Dead code

- `src/features/map/ui/MapMarkerPopover.tsx` (145 LOC) — referenced by zero callers. `FarmPreviewCard` superseded it.
- `src/features/map/lib/cluster-config.ts:generateClusterSVG()` (~70 LOC inside a 266-LOC file) — branded pill design defined but unused; `MapLibreShell.tsx:getClusterStyle()` ships inline circles instead.
- `MapLibreShell.tsx:516-519` `handleFavorite` — body is `// TODO: Implement favorites`.
- `MapLibreShell.tsx:563-567` `handleShowAllFarms` — body is `// TODO: Implement list view`.

### 3.2 Hardcoded values bypassing the design system

`src/features/map/ui/FarmPreviewCard.tsx` hardcodes:
- `#1A1A1A` (title color)
- `#8C8C8C` (subtitle/muted)
- `#2D5016` / `#234012` (brand green + hover)
- `#F5F5F5` / `#E8E8E8` (surface + hover)
- `#5C5C5C` (body text)
- `#CC0000` (closed-status red)
- `#CCCCCC` (placeholder icon)

Should resolve through `tailwind.config.js` token names or the CSS-variable layer in `globals.css`.

### 3.3 Polish violations (Emil Kowalski's framework)

- **Entry from `scale(0)`** — `cluster-config.ts:102-105` keyframe; should start at `scale(0.95)` with `opacity: 0`.
- **Single heavy shadow** — `MapLibreShell.tsx:380` `box-shadow: 0 2px 8px rgba(0,0,0,0.3)`; should be layered Apple-style depth (`0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.12)`).
- **No press feedback on markers** — only `mouseenter` brightness filter; missing `:active` scale-down for tactile response.
- **Arbitrary Tailwind animation** — `FarmPreviewCard.tsx:53` uses `animate-[slideUp_200ms_ease-out]`; the `slideUp` keyframe is implicit/missing, animation is not interruptible, easing curve is weak.
- **`<img>` instead of `next/image`** — `FarmPreviewCard.tsx:69-74`; no perf optimisation, no error fallback, no neutral inset outline.
- **No `tabular-nums`** on distance / hours digits — counters can jiggle.

### 3.4 Cross-platform divergence

| Surface | Mobile (`MarkerActions`) | Desktop (`FarmPreviewCard`) |
| --- | --- | --- |
| Layout | Half-sheet at bottom | Floating card, bottom of map |
| Image | None | Hero image, 180px tall |
| Hook quote | No | Yes (first 120 chars of description) |
| Status | No | Open-now badge with circle dot |
| Tags | No | Top 3 offerings as chips |
| Primary CTA | "Navigate" (opens Google Maps) | "View Full Details" (in-app `/shop/<slug>`) |
| Secondary | Favorite, Share | Call, Directions, Share |

Same tap, two products. This is the highest-impact UX bug.

### 3.5 Architecture smells (downstream slices)

- `src/app/map/page.tsx` — **701 LOC**, over CLAUDE.md's 500-line hard limit. Justification or split required.
- `src/features/map/ui/MapLibreShell.tsx` — **712 LOC**, same issue.
- No URL state for `selectedFarmId` or viewport. `/map?farm=<slug>&z=12&c=51.5,-0.1` should round-trip.

---

## 4. The 4-slice arc

### Slice 1.1.1 — Marker tap: polish + unify (THE ANCHOR)

**Scope (≤8 files, in budget):**

1. **DELETE** `src/features/map/ui/MapMarkerPopover.tsx` (dead).
2. **MODIFY** `src/features/map/ui/FarmPreviewCard.tsx`:
   - Replace every hardcoded hex with a design token (Tailwind class or CSS variable).
   - Replace `<img>` with `next/image` (`fill` + `sizes` + neutral inset outline).
   - Replace `animate-[slideUp_…]` with a proper CSS transition + `@starting-style` (or `data-mounted` fallback); custom easing `cubic-bezier(0.23, 1, 0.32, 1)`; start at `transform: translateY(8px) scale(0.97)` + `opacity: 0`, end at neutral.
   - Add `:active { transform: scale(0.98) }` on the primary CTA.
   - Add `font-variant-numeric: tabular-nums` to distance + opening-status text.
   - Add `loading="lazy"` semantics and an error fallback (Leaf placeholder already present, reuse).
3. **CREATE** a thin wrapper `src/features/map/ui/MarkerPreview.tsx` — chooses layout based on `useMediaQuery('(min-width: 768px)')` or a passed `isDesktop` prop; renders `FarmPreviewCard` for both, with mobile getting a bottom-anchored full-width variant and desktop getting the floating card.
4. **MODIFY** `src/features/map/ui/MapLibreShell.tsx`:
   - Stop rendering `MarkerActions` on mobile (it becomes dead after 1.1.1 lands; flag for deletion in 1.1.2).
   - Delete the `handleFavorite` TODO stub and the favorite button wire-up; remove its `onClick` from the new preview.
   - Surface `markerState.selected` to the parent (already does via `onFarmSelect`); parent renders `MarkerPreview` once for both platforms.
5. **MODIFY** `src/app/map/page.tsx`:
   - Replace the existing desktop-only `FarmPreviewCard` block (lines ~532-546) with a `MarkerPreview` that works on both platforms.
   - Wire `onViewDetails` to `router.push('/shop/<slug>')` instead of just closing.
6. (Optional, if budget allows) **MODIFY** `src/features/map/ui/MarkerActions.tsx` — mark as `@deprecated` with a one-line note, OR delete if no other consumer. Delete preferred.
7. **MODIFY** `tailwind.config.js` or `src/app/globals.css` if any required token is missing (audit first; most should exist).

**Tests (TDD):**
- Component tests for `FarmPreviewCard`:
  - Renders farm name, county, status badge, tags.
  - Calls `onViewDetails(farm.id)` when CTA clicked.
  - Hides hook when `description` is empty.
  - Shows phone CTA only when `contact.phone` present.
  - Distance text uses tabular-nums (computed style check).
- Snapshot or visual test for the mobile vs desktop layouts of `MarkerPreview`.
- Smoke test that `MapLibreShell` no longer imports `MarkerActions`.

**Verification gate:**
- `pnpm exec tsc --noEmit` PASS
- `pnpm test:unit` PASS (existing 11 + new tests)
- `pnpm build` PASS, 95 static pages
- Manual: tap a pin on `/map` in dev, both at 375px and 1280px viewports — same content, layout differs.

**Risk:** Low-medium. The component swap is bounded; the only behavioural change visible to users is that the mobile sheet's content changes from "Navigate / Favorite / Share" to "View Details / Call / Directions / Share" — strictly an upgrade in information density. Rollback: `git revert`.

**Estimated:** 5–7 files, ~250–350 LOC net (mostly replace + small additions; deletes balance new code).

### Slice 1.1.2 — Cluster polish (next)

**Scope sketch:**
- Reconcile cluster styling. Adopt `generateClusterSVG()` (branded pill, design-token aware) as the single source; delete `getClusterStyle()` from `MapLibreShell`.
- Fix `scale(0)` → `scale(0.95)` entry per Emil; replace keyframe with transition where possible (for interruptibility).
- Lighter, layered shadow on cluster markers and the marker preview.
- Add `:active` tactile feedback on cluster markers.
- Eliminate the "small-cluster preview sheet" (lines 669-709 in `MapLibreShell`) — clicking a small cluster should `fitBounds` to its leaves and let the user pick from the visible markers; no intermediate sheet.

**Files (est. 4-6):** `MapLibreShell.tsx`, `cluster-config.ts`, `tailwind.config.js` (motion tokens), possibly `globals.css`.

### Slice 1.1.3 — URL state

**Scope sketch:**
- New hook `useMapURLState({ farm?, z?, c? })` that reads from `useSearchParams` and writes via `router.replace` with `scroll: false`.
- Hydrate selected farm + viewport on first paint.
- Browser back/forward navigates between farm selections.
- Update the share button in `FarmPreviewCard` to use the canonical map URL with `?farm=<slug>` rather than the page URL.

**Files (est. 4-5):** new `useMapURLState.ts`, `map/page.tsx`, `FarmPreviewCard.tsx`, possibly `MapLibreShell.tsx` (initial viewport hydration).

### Slice 1.1.4 — Carve up the 700-LOC files

**Scope sketch:**
- Extract `useFarmData()` (fetch + filter), `useFilteredFarms()`, `useViewportFiltering()` from `map/page.tsx`.
- Extract `MapDesktopLayout` + `MapMobileLayout` components.
- Slim `MapLibreShell.tsx` by extracting cluster-marker rendering and farm-marker rendering into hooks (`useClusterMarkers`, `useFarmMarkers`) that manage the imperative MapLibre marker lifecycle.
- Target: both files under 500 LOC.

**Files (est. 6-8):** multiple new hook/component files + the two big files trimmed.

---

## 4.5 Open decision blocking Slice 1.1.1 — primary-action colour

Token audit (2026-05-18) revealed the design system is layered:

- `--brand-primary` resolves to `--harvest-kinetic-500` = **`#06B6D4` Kinetic Cyan** (documented as "primary action"). Listed as the brand primary in `globals.css:213` and `harvest-theme.css:48`.
- A parallel **Harvest Leaf** palette (`--harvest-leaf-50` … `--harvest-leaf-900`) exists for agricultural/secondary surfaces. The deepest shade `--harvest-leaf-900` = `#14532D`.
- `FarmPreviewCard.tsx` currently hardcodes `#2D5016` — close to but not an exact token. `cluster-config.ts` hardcodes `#1A3A0A`, `#234012`, `#2D5016`, `#3A6420`, `#4A7A2E` (a separate green palette baked into clusters).

Slice 1.1.1 must pick one of:

| Option | Primary-action button (e.g. "View Full Details") | Implication |
| --- | --- | --- |
| **A — Cyan (system default)** | `bg-brand-primary` (resolves to `#06B6D4`) | Aligns with the documented brand primary; matches focus rings and CTAs elsewhere in the app. Visually distinct from agricultural greens used on map clusters. |
| **B — Harvest Leaf 900** | `bg-[var(--harvest-leaf-900)]` (or a new `--brand-action` alias to the same) | Keeps the "earthy" feel of the current hardcoded green; closer to `cluster-config.ts`'s palette so map elements feel one family. |
| **C — Add a `--brand-action` token** | New CSS variable mapped to a chosen shade (probably Harvest Leaf 800/900) | Most flexible. One token to change later. Adds one variable to `globals.css` light + dark blocks. |

**Recommendation: B or C.** The current page is using green and changing it to cyan introduces a visual regression that should be a deliberate brand decision, not a side-effect of a polish slice. Option C is best long-term (one token, one swap point) but adds two lines to `globals.css`. Option B is the smallest diff that respects existing design intent.

This decision affects ~6 lines in `FarmPreviewCard.tsx` and propagates into Slice 1.1.2 (cluster colour reconciliation). **Operator picks before Slice 1.1.1 code work begins.**

---

## 5. Out of scope

The following are explicitly **deferred** to keep this phase shippable:

- Cluster behaviour at the data layer (server-side clustering, vector tiles). Phase 5+ if ever.
- Search relevance tuning (Phase 1.2 candidate).
- "Open now" badge accuracy fixes (Phase 1.3 candidate).
- Individual farm page polish (Phase 1.4 candidate).
- Map style/theme switching.
- Favorites feature — `handleFavorite` is being deleted, not implemented. Decision: ship a Phase 2+ proper favorites system with persistence, not a per-marker stub.
- Offline support / service-worker map tile caching.

---

## 6. Risks & mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Tailwind tokens turn out to be incomplete | Medium | Audit `tailwind.config.js` + `globals.css` before Slice 1.1.1 work begins; add any missing token in the same slice (still in budget). |
| Removing mobile `MarkerActions` regresses an unmeasured UX path | Low | The new mobile preview is a superset: same Directions + Share, plus Call, hero image, status, hook. Favorites was a TODO stub anyway. |
| `next/image` for hero requires `next.config.js` remote domain allowlist update | Low-medium | Check before commit; most farm images go through `getImageUrl()` which already normalises domains. |
| Slice 1.1.4 (file split) creates merge pain with parallel work | Low | No parallel work expected; map module is uncontested. |
| Design tokens differ between Slice 1.1.1 (preview) and Slice 1.1.2 (clusters) | Low | Both slices land within Phase 1.1; tokens chosen in 1.1.1 are reused in 1.1.2 by design. |

---

## 7. Definition of "done" for Phase 1.1

All four slices merged. The map page:
- Has one preview component (no dead duplicates).
- Renders the same preview content on mobile and desktop, with appropriate layout.
- Uses design tokens, not hex codes.
- Passes Emil's polish checklist for entry animation, press feedback, image outlines, tabular numerics.
- Has shareable URLs with farm + viewport state.
- `map/page.tsx` + `MapLibreShell.tsx` are both under 500 LOC.

Phase 1.1 ends. Phase 1.2 brainstorm follows (perf / "open now" accuracy / search / individual page polish / E2E tests).

---

## 8. Source-of-truth references applied to this design

- **Emil Kowalski (UI polish)** — animation framework (scale not from 0, custom easing, durations 150-250ms, `:active` press feedback), `transform-origin: trigger` for popovers, blur to mask crossfades, asymmetric enter/exit timing.
- **`ecc:make-interfaces-feel-better`** — concentric radius, optical alignment, `text-wrap: balance` on headings, `tabular-nums` on changing digits, image inset outlines.
- **Apple Design Resources** — layered shadows for depth, accessibility-first colour contrast.
- **Citymapper interaction model** — map dominant; sheet/card secondary; consistent across breakpoints.
- **CLAUDE.md file-size rules** — flagged 701/712 LOC files for Slice 1.1.4.

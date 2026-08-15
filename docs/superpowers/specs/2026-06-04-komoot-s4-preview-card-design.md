# Komoot S4: preview card polish + one-popover invariant

Parent: `2026-05-31-komoot-class-map-design.md`, slice 4 ("Detail and badges").

## Problem

1. The FarmPreviewCard carries four competing actions: a brand "View Full
   Details" button plus a Call/Directions/Share row. The spec calls for one
   clear primary CTA.
2. Clicking a marker while a ClusterPreview is open leaves both popovers up
   (carried over from S3). The reverse also holds: opening a cluster preview
   does not dismiss an open farm preview, because farm selection lives in
   `map/page.tsx` while cluster-preview state lives in `MapLibreShell.tsx`.
3. Pre-existing eslint error `react-hooks/set-state-in-effect` at
   `FarmPreviewCard.tsx:57` (the `setMounted` entry-animation effect).
4. Dead code: `markerState`/`popoverPosition` in MapLibreShell are write-only;
   `FarmPopup.tsx`, `FarmDetailSheet.tsx`, `MobileMarkerSheet.tsx` in
   `components/map/` are referenced only by their barrel (M4 consolidation
   leftovers).

## Decisions (user-approved)

- **Directions is the single primary CTA** (Komoot pattern: the map surface's
  job is getting you there). Brand-colored, full-width, Navigation icon.
  Below it one quiet row: "View full details" text link (left, keeps the
  `/shop` SEO path one tap away), Call and Share as compact icon buttons
  (right, 44px targets). Phone-less farms omit Call.
- **Open Now moves onto the hero**: status pill overlays the photo bottom-left
  (Rapeseed accent when open, neutral when closed). `nextOpening` stays in the
  body next to county/distance. When a CC-attribution strip is present
  (bottom full-width), the pill lifts above it. Offerings badges unchanged.
- **One popover at a time, approach A** (bidirectional callbacks, state stays
  with its owner): `handleMarkerClick` in the shell also calls
  `handleCloseClusterPreview()`; the shell gains an optional
  `onClusterPreviewOpen` prop that `page.tsx` wires to
  `setSelectedFarmId(null)`.
- **Entry animation goes CSS-only**: replace the `setMounted` state + effect
  with a CSS keyframe entry animation (same 200ms cubic-bezier(0.23,1,0.32,1)
  feel, `motion-reduce:animate-none`). Deletes the lint error at the root.
- **Delete the dead code** listed above (grep-proven before deletion).

## Files (8, at slice budget)

- `features/map/ui/FarmPreviewCard.tsx` — CTA hierarchy, hero pill, CSS entry
- `features/map/ui/MapLibreShell.tsx` — close-cluster-on-marker-click,
  `onClusterPreviewOpen` prop, drop `markerState`/`popoverPosition`
- `features/map/ui/MapShellAuto.tsx` — prop pass-through
- `app/map/page.tsx` — wire `onClusterPreviewOpen`
- DELETE `components/map/FarmPopup.tsx`, `FarmDetailSheet.tsx`,
  `MobileMarkerSheet.tsx` + their exports in `components/map/index.ts`

## Verification

- Unit: existing suite stays green; new tests only if a pure helper is
  extracted.
- `tsc --noEmit` clean; eslint error count drops by one (the
  set-state-in-effect at FarmPreviewCard:57); `npx impeccable detect` exit 0
  on touched files; `next build` exit 0.
- Live Playwright on :3001, desktop 1440 + mobile 390:
  - marker click while cluster preview open -> cluster preview closes
  - cluster click while farm preview open -> farm preview closes
  - card shows hero pill, one brand Directions CTA, quiet secondary row
  - entry animation still plays; focus contract (close-button focus on open,
    return-focus to marker on close) intact.

## Risk / rollback

Presentation plus a small state-coordination change; no route/data/SEO
change. Rollback = revert the commit (restores the three deleted components).

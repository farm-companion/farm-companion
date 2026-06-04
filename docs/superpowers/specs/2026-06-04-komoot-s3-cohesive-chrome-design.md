# Komoot Slice 3: Cohesive Chrome

Date: 2026-06-04
Status: Approved
Owner: FlowCoder
Parent: 2026-05-31-komoot-class-map-design.md (Slice 3 of 5)

## Problem

Map chrome is scattered and off-brand. Three separate control components
(MapControls top-right in zinc/blue, LocationControl bottom-right as a four-pill
stack in blue/amber, ScaleBar bottom-left in zinc) each carry their own styling
system. SearchAreaControl duplicates the search-as-I-move toggle that already
exists as "Update as I move" checkboxes in both the desktop panel header and the
mobile sheet header, floats an off-palette cyan button, and shows a farm count
that the headers also show. Two positioning bugs: the mobile compass overlaps
the bottom sheet, and on desktop the bottom-right controls sit underneath the
380px list panel (panel is z-20, controls z-10 at right-4).

## Decision

One control system, brand-styled, correctly offset on both form factors.

### MapControlCluster (new: src/features/map/ui/MapControlCluster.tsx)

Single vertical stack, bottom-right inside MapLibreShell. Pitti tokens
(bg-surface, border-border, text-ink, brand focus ring), 44px touch targets.
Top to bottom:

- Compass: rendered only when bearing is nonzero; icon rotates with the map;
  click eases bearing back to north.
- Locate: one round button reusing useMapLocation (keeps the permission state
  machine and IP fallback). Spinner while locating, brand tint when located,
  alert tint when denied. Feedback via aria-label and the existing SR live
  region. No tracking toggle, no accuracy pill, no source pill.
- Zoom: one bordered segment, + above -.
- Scale bar: right-aligned beneath the stack, ink-muted hairline style.

Positioning: bottom offset = bottomSheetHeight + 16 on mobile (fixes the
compass/sheet overlap); right offset = new rightOffset prop threaded
page -> MapShellAuto -> MapLibreShell carrying the live desktop panel width
(380 open, 0 collapsed), fixing the panel occlusion.

Cut entirely (approved): fullscreen toggle, tracking toggle, accuracy pill,
approximate-location pill. The map is already full-viewport; Komoot ships none
of these.

### Scale math extraction (new: src/features/map/lib/scale.ts + test)

The meters-per-pixel to clean-step computation moves out of ScaleBar into a
pure unit-tested function (same pattern as classifyDeclutter). Metric only,
matching current usage. The cluster renders its output.

### Search this area system (rework: SearchAreaControl.tsx + page.tsx)

SearchAreaControl collapses to one brand-styled pill, top-center below the
search bar, visible only when search-as-I-move is off and the map has moved
(hasPendingSearch). The toggle pill and floating count pill are deleted; the
"Update as I move" checkboxes in the two list headers become the single toggle
location, and the count already lives in those headers.

### Deletions

MapControls.tsx, LocationControl.tsx, ScaleBar.tsx become dead once the cluster
lands (grep-verified: only MapLibreShell consumed them; LeafletShell does not).
Removed in S3b together with their barrel exports.

## Slicing (8-file budget per slice)

- S3a map chrome (6 files): MapControlCluster.tsx (new), lib/scale.ts (new),
  lib/scale.test.ts (new), MapLibreShell.tsx (render cluster, drop 3 control
  renders, add rightOffset), MapShellAuto.tsx (prop pass-through), page.tsx
  (pass rightOffset = panelWidth).
- S3b search system (6 files): SearchAreaControl.tsx (single pill), page.tsx
  (reposition top-center, drop toggle/count props), index.ts (drop dead
  exports), delete MapControls.tsx, LocationControl.tsx, ScaleBar.tsx.

## Error handling

Cluster renders nothing useful without a map: every handler guards on the map
instance (same pattern as today). Locate keeps the existing denied/error/idle
states from useMapLocation. Scale function is pure; invalid zoom or latitude
inputs return null and the bar hides.

## Testing

- TDD on lib/scale.ts (step selection, label formatting, width math at known
  zoom/latitude fixtures).
- Existing unit suite stays green; tsc --noEmit clean; next build exit 0.
- npx impeccable detect src/ exits 0.
- Live Playwright desktop + 390px mobile: cluster clears the bottom sheet at
  every snap point, cluster visible left of the open desktop panel and slides
  right when the panel collapses, search pill appears top-center after panning
  with auto-search off and disappears after click.

## Success criteria

- One control surface bottom-right; zero zinc/blue/cyan chrome remains on /map.
- Compass never overlaps the mobile sheet; no control hides under the desktop
  panel.
- Exactly one search-as-I-move toggle location (list headers).
- Three dead components removed.

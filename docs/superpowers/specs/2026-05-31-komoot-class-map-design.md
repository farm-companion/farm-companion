# Komoot-class Map Redesign

Date: 2026-05-31
Status: Approved direction, implementation in progress
Owner: FlowCoder

## Problem

The `/map` page reads as the default OpenFreeMap basemap with a beige tint. It is
not Komoot-class. The cause is structural: `src/lib/map-theme.ts` only recolors
the loaded vector style layer by layer. It never reduces label density, never
thins roads, and adds no relief. So by construction the map looks like a busy
reference map that has been repainted, and the surrounding panels (initials-only
list rows, scattered floating controls) do not match Komoot's photo-led cards.

## North star

The map is a calm canvas. Everything that is not a farm recedes. Farms and their
photos earn attention. This is the single principle behind every Komoot view.

## Decisions

- Cartography ambition: calm cartography, no terrain. Authored declutter on top
  of the existing recolor. Label suppression and hairline roads. No hillshade and
  no new tile dependency, so we keep the no-API-key, no-tile-cap setup.
- Focus: both surfaces, sliced together. Each slice improves one map thing and
  one UI thing so progress is visible on both at once.

## Core technical move

Do not rewrite to a self-hosted style JSON. Extend the theme engine. The same
`map.on('load')` pass that calls `recolorMap` also calls a new `declutterMap`.
A schema-based classifier (`classifyDeclutter`, mirroring `classifyLayer`) maps
each OpenMapTiles layer to an action:

- hide: POI and house-number symbols (Komoot shows almost none).
- demote: small place labels (village, hamlet, suburb, place_other) and road
  name labels get a raised min zoom, so the UK overview is quiet but detail
  returns when you zoom in. Towns, cities, regions, countries, water stay.
- thin: minor and secondary or tertiary road lines get a hairline width and
  reduced opacity. Motorway, trunk, primary, and rail are left intact.

The classifier is pure and unit-tested without a GL context, exactly like the
existing `classifyLayer`.

## Slice sequence (interleaved map + UI)

1. Calm canvas + readable list. Map: declutter pass. UI: `FarmListRow` gains a
   photo thumbnail, branded fallback, tighter hierarchy, status badges.
2. Imagery and marker craft. Map: marker selected and hover states on the M3
   two-tier pins. UI: photo carry-through to preview and cluster cards.
3. Cohesive chrome. Map: one bottom-right control cluster (zoom, locate,
   compass, scale) plus a consistent Search this area pill. UI: collapse the
   scattered farms-in-view, manual-search, and nearby cards into one system.
4. Detail and badges. Map: preview card polish. UI: farm preview card with
   photo, Open Now and category badges, one clear primary CTA.
5. Motion and states. Map: fly-to easing and hover-to-list sync. UI: skeleton,
   empty, and loading states. WCAG AA.

## Success criteria

- At UK zoom the visible label count drops to roughly Komoot's level (regions,
  cities, water only).
- Roads read as hairlines and land is one quiet tone.
- Every list row carries a photo or a branded fallback plus status badges.
- One control system and one panel language.
- `npx impeccable detect src/` exits 0.

## Files (Slice 1)

- `src/lib/map-declutter.ts` (new): `classifyDeclutter`, `declutterMap`.
- `src/lib/map-declutter.test.ts` (new): classifier fixtures.
- `src/features/map/ui/MapLibreShell.tsx` (edit): call `declutterMap` after
  `recolorMap` in the load handler.
- `src/components/FarmListRow.tsx` (edit): photo thumbnail, fallback, badges.

## Risk and rollback

Declutter only changes layout and paint of basemap layers and swallows per-layer
errors, so an unmatched style cannot break the map. Rollback is removing the one
`declutterMap` call and reverting `FarmListRow`.

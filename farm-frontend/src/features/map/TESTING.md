# MapLibre GL Migration Testing Checklist

## Overview

This document provides a comprehensive testing checklist for the MapLibre GL migration.
Run through these tests before switching `NEXT_PUBLIC_MAP_PROVIDER` to `maplibre` in production.

## Environment Setup

```bash
# Test with MapLibre
NEXT_PUBLIC_MAP_PROVIDER=maplibre

# Test with Google Maps (fallback)
NEXT_PUBLIC_MAP_PROVIDER=google

# Test auto-detection
NEXT_PUBLIC_MAP_PROVIDER=auto
```

## Browser Compatibility

### Desktop Browsers

| Browser | Version | WebGL | Status |
|---------|---------|-------|--------|
| Chrome | 90+ | Required | [ ] Pass |
| Firefox | 85+ | Required | [ ] Pass |
| Safari | 14+ | Required | [ ] Pass |
| Edge | 90+ | Required | [ ] Pass |

### Mobile Browsers

| Browser | Version | WebGL | Status |
|---------|---------|-------|--------|
| iOS Safari | 14+ | Required | [ ] Pass |
| Chrome Android | 90+ | Required | [ ] Pass |
| Samsung Internet | 14+ | Required | [ ] Pass |

## Functional Tests

### Map Initialization

- [ ] Map loads within 3 seconds on fast connection
- [ ] Map shows UK bounds on initial load
- [ ] Loading spinner displays during initialization
- [ ] Error state shows if map fails to load
- [ ] Attribution displays correctly (Stadia Maps, OpenMapTiles, OSM)

### Marker Display

- [ ] Farm markers display at correct locations
- [ ] Category-based pin colors are correct
- [ ] Markers cluster at appropriate zoom levels
- [ ] Cluster counts are accurate
- [ ] Cluster colors match tier (mega=red, large=orange, etc.)

### Interactions

- [ ] Click on farm marker shows details (mobile: bottom sheet, desktop: popover)
- [ ] Click on cluster zooms in or shows preview (count <= 8)
- [ ] Hover on marker shows scale animation
- [ ] Hover on cluster shows scale animation
- [ ] Double-click zooms in
- [ ] Two-finger pinch zooms (mobile)

### Navigation

- [ ] Pan by dragging works smoothly
- [ ] Zoom controls (+/-) work correctly
- [ ] Fullscreen toggle works
- [ ] Compass appears when rotated, resets to north on click
- [ ] Scale bar updates on zoom/pan
- [ ] "Center on me" button works with location permission

### Location Features

- [ ] Location permission prompt appears
- [ ] User location marker displays (blue dot with pulse)
- [ ] Accuracy circle displays
- [ ] "Approximate location" badge shows for IP-based location
- [ ] Permission denied message displays appropriately

### Search Integration

- [ ] Search suggestions appear while typing
- [ ] Postcode autocomplete works (UK postcodes)
- [ ] Place search works (Nominatim)
- [ ] Farm name matching works (local)
- [ ] Selecting suggestion flies to location
- [ ] Clear button resets search

### Cluster Preview

- [ ] Preview shows for small clusters (count <= 8)
- [ ] Farm list displays correctly
- [ ] Clicking farm in list selects it
- [ ] "View all" zooms to cluster bounds
- [ ] Close button works

## Performance Tests

### Target: 60fps pan/zoom

- [ ] Smooth panning with 100 farms
- [ ] Smooth panning with 500 farms
- [ ] Smooth panning with 1000+ farms
- [ ] Smooth zoom transitions
- [ ] No jank during cluster recalculation

### Memory

- [ ] No memory leaks on repeated zoom in/out
- [ ] Markers properly cleaned up on unmount
- [ ] No memory growth over 5 minutes of use

### Network

- [ ] Tiles load progressively
- [ ] Cached tiles reused on pan back
- [ ] Graceful degradation on slow connection

## Accessibility Tests

### Keyboard Navigation

- [ ] Tab navigates between markers
- [ ] Enter/Space selects focused marker
- [ ] Escape closes popups/sheets
- [ ] Arrow keys pan map
- [ ] +/- keys zoom
- [ ] Skip link bypasses map

### Screen Readers

- [ ] Map announces when loaded
- [ ] Markers have accessible labels
- [ ] Clusters announce count
- [ ] Actions announce results
- [ ] Live regions update appropriately

### Visual

- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Reduced motion respected
- [ ] Dark mode works correctly

## Mobile-Specific Tests

### Touch Gestures

- [ ] Single tap selects marker
- [ ] Double tap zooms in
- [ ] Two-finger pinch zooms
- [ ] Two-finger rotate (if enabled)
- [ ] Swipe pans smoothly
- [ ] Long press (if applicable)

### Responsiveness

- [ ] Map fills container correctly
- [ ] Controls don't overlap on small screens
- [ ] Bottom sheet doesn't obscure important content
- [ ] Landscape orientation works
- [ ] Portrait orientation works

### iOS Specific

- [ ] Safari scroll behavior correct
- [ ] Safe area insets respected
- [ ] Touch events don't conflict with browser gestures

### Android Specific

- [ ] Back button behavior correct
- [ ] Keyboard doesn't obscure search
- [ ] Chrome custom tabs work for directions

## Integration Tests

### With Farm Data

- [ ] Farms load from API correctly
- [ ] Selected farm highlights on map
- [ ] Farm details sync with map selection
- [ ] Filtering updates markers

### With URL State

- [ ] Deep links to coordinates work
- [ ] Selected farm ID in URL works
- [ ] Back/forward navigation works

## Regression Tests

### Features from Google Maps

- [ ] All markers display (none missing)
- [ ] Cluster behavior matches
- [ ] Zoom levels feel similar
- [ ] Pan behavior feels similar
- [ ] Mobile experience equivalent

## Sign-off

| Tester | Date | Environment | Result |
|--------|------|-------------|--------|
| | | Chrome/Mac | |
| | | Safari/iOS | |
| | | Chrome/Android | |
| | | Firefox/Windows | |

## Notes

Add any issues or observations here:

```
-
-
-
```

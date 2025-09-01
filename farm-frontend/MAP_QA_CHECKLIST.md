# Map Page QA Checklist

## Test Environment Setup
- **Device**: iPhone (Safari)
- **Browser**: Safari (latest)
- **URL**: `/map`
- **Test Data**: Ensure farms are loaded with location data

## 1. iPhone Safari Touch Gestures

### ✅ One-Finger Pan
- [ ] **Test**: Drag one finger across the map
- **Expected**: Map pans smoothly in the direction of finger movement
- **Acceptance**: No stuttering, responsive to touch, maintains momentum

### ✅ Two-Finger Pan  
- [ ] **Test**: Use two fingers to drag the map
- **Expected**: Map pans smoothly with two-finger gesture
- **Acceptance**: Works consistently, no conflicts with other gestures

### ✅ Double-Tap Zoom
- [ ] **Test**: Double-tap on map surface
- **Expected**: Map zooms in by one level at tap location
- **Acceptance**: Zoom centers on tap point, smooth animation

### ✅ Pinch Zoom
- [ ] **Test**: Pinch in/out with two fingers
- **Expected**: Map zooms in/out smoothly
- **Acceptance**: Zoom level changes appropriately, maintains center point

## 2. Cluster Interaction

### ✅ Cluster Tap Zoom
- [ ] **Test**: Tap on a cluster (grouped markers)
- **Expected**: Map zooms in to show individual markers in that area
- **Acceptance**: Smooth zoom animation, clusters expand to show farms

## 3. Zoom Controls

### ✅ Zoom Controls Not Overlapped
- [ ] **Test**: Check zoom +/- buttons position
- **Expected**: Zoom controls visible and accessible on right side
- **Acceptance**: Not covered by bottom sheet or other UI elements

## 4. "Farms in View" Counter

### ✅ Counter Updates After Pan/Zoom
- [ ] **Test**: Pan or zoom the map
- **Expected**: Farm count in bottom sheet header updates
- **Acceptance**: Shows accurate count of farms currently in viewport

## 5. Locate FAB (Floating Action Button)

### ✅ Recenters Map
- [ ] **Test**: Tap locate button
- **Expected**: Map centers on user's current location
- **Acceptance**: Smooth pan animation to location

### ✅ Haptics Fire
- [ ] **Test**: Tap locate button
- **Expected**: Light haptic feedback triggers
- **Acceptance**: Vibration feedback on button press

## 6. Bottom Sheet Behavior

### ✅ Sheet Snaps Cleanly
- [ ] **Test**: Drag sheet up/down
- **Expected**: Sheet snaps to defined positions (40px, 200px, 400px)
- **Acceptance**: Smooth snap animation, no jitter

### ✅ Never Blocks Map Gestures
- [ ] **Test**: Interact with map above sheet's top edge
- **Expected**: Map gestures work normally above sheet
- **Acceptance**: Pan, zoom, and tap gestures work above sheet boundary

## 7. Additional Mobile UX Tests

### ✅ Orientation Change
- [ ] **Test**: Rotate device from portrait to landscape
- **Expected**: Map resizes appropriately, maintains state
- **Acceptance**: No layout breaks, smooth transition

### ✅ Safe Area Handling
- [ ] **Test**: Check map on devices with notches/Dynamic Island
- **Expected**: Map respects safe areas
- **Acceptance**: Content not hidden behind system UI

### ✅ Performance
- [ ] **Test**: Pan/zoom rapidly
- **Expected**: Smooth 60fps performance
- **Acceptance**: No frame drops, responsive touch

## 8. Accessibility Tests

### ✅ Screen Reader Support
- [ ] **Test**: Use VoiceOver to navigate map
- **Expected**: Map elements are properly labeled
- **Acceptance**: Screen reader can identify and interact with map features

### ✅ Keyboard Navigation
- [ ] **Test**: Use keyboard to navigate
- **Expected**: Map can be controlled via keyboard
- **Acceptance**: Tab navigation works, keyboard shortcuts function

## 9. Error Handling

### ✅ Location Permission Denied
- [ ] **Test**: Deny location permission
- **Expected**: Graceful fallback, user informed
- **Acceptance**: App continues to function without location

### ✅ Network Issues
- [ ] **Test**: Disconnect network during map load
- **Expected**: Error message shown, retry option available
- **Acceptance**: User can retry loading map

## 10. Cross-Browser Compatibility

### ✅ Safari Mobile
- [ ] **Test**: All functionality on Safari iOS
- **Expected**: All features work as expected
- **Acceptance**: No Safari-specific issues

### ✅ Chrome Mobile
- [ ] **Test**: All functionality on Chrome iOS
- **Expected**: All features work as expected
- **Acceptance**: Consistent behavior across browsers

## Test Results Summary

| Test Category | Status | Notes |
|---------------|--------|-------|
| Touch Gestures | ⏳ | |
| Cluster Interaction | ⏳ | |
| Zoom Controls | ⏳ | |
| Farms Counter | ⏳ | |
| Locate FAB | ⏳ | |
| Bottom Sheet | ⏳ | |
| Mobile UX | ⏳ | |
| Accessibility | ⏳ | |
| Error Handling | ⏳ | |
| Cross-Browser | ⏳ | |

## Issues Found

### Critical Issues
- [ ] List any critical issues that prevent core functionality

### Minor Issues  
- [ ] List any minor UX issues or inconsistencies

### Performance Issues
- [ ] List any performance problems or optimization opportunities

## Recommendations

### Immediate Fixes
- [ ] List any issues that need immediate attention

### Future Improvements
- [ ] List any enhancements for future iterations

---

**Tested By**: [Name]  
**Date**: [Date]  
**Version**: [App Version]  
**Device**: iPhone [Model]  
**iOS Version**: [Version]  
**Safari Version**: [Version]

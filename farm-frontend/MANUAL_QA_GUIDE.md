# Manual QA Testing Guide for Map Page

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the map page:**
   - Navigate to `http://localhost:3000/map`
   - Ensure you're on an iPhone or using Safari mobile simulation

3. **Follow the checklist:**
   - Use the `MAP_QA_CHECKLIST.md` file to track your progress
   - Test each item systematically

## Testing Setup

### Device Requirements
- **Primary**: iPhone with Safari
- **Secondary**: iPad with Safari
- **Fallback**: Chrome DevTools with mobile simulation

### Browser Developer Tools
1. Open Safari on iPhone
2. Or use Chrome DevTools:
   - Press F12
   - Click device toggle (📱)
   - Select iPhone 12/13/14/15
   - Set user agent to Safari iOS

## Step-by-Step Manual Tests

### 1. Touch Gestures Test

#### One-Finger Pan
1. **Action**: Place one finger on the map and drag
2. **Expected**: Map moves smoothly in the direction of your finger
3. **Check**: No stuttering, maintains momentum after release

#### Two-Finger Pan
1. **Action**: Place two fingers on the map and drag
2. **Expected**: Map pans smoothly with two-finger gesture
3. **Check**: No conflicts with other gestures

#### Double-Tap Zoom
1. **Action**: Double-tap anywhere on the map
2. **Expected**: Map zooms in by one level at tap location
3. **Check**: Zoom centers on tap point, smooth animation

#### Pinch Zoom
1. **Action**: Pinch in/out with two fingers
2. **Expected**: Map zooms in/out smoothly
3. **Check**: Zoom level changes appropriately, maintains center point

### 2. Cluster Interaction Test

#### Cluster Tap Zoom
1. **Action**: Look for grouped markers (clusters) and tap one
2. **Expected**: Map zooms in to show individual markers
3. **Check**: Smooth zoom animation, clusters expand to show farms

### 3. Zoom Controls Test

#### Zoom Controls Visibility
1. **Action**: Look for zoom +/- buttons on the right side
2. **Expected**: Zoom controls are visible and accessible
3. **Check**: Not covered by bottom sheet or other UI elements

### 4. Farms Counter Test

#### Counter Updates
1. **Action**: Pan or zoom the map
2. **Expected**: Farm count in bottom sheet header updates
3. **Check**: Shows accurate count of farms currently in viewport

### 5. Locate Button Test

#### Recenter Functionality
1. **Action**: Tap the locate button (usually in bottom sheet)
2. **Expected**: Map centers on your current location
3. **Check**: Smooth pan animation to location

#### Haptic Feedback
1. **Action**: Tap the locate button
2. **Expected**: Light haptic feedback triggers
3. **Check**: Vibration feedback on button press

### 6. Bottom Sheet Test

#### Sheet Snapping
1. **Action**: Drag the bottom sheet up/down
2. **Expected**: Sheet snaps to defined positions (40px, 200px, 400px)
3. **Check**: Smooth snap animation, no jitter

#### Map Gesture Blocking
1. **Action**: Try to interact with map above sheet's top edge
2. **Expected**: Map gestures work normally above sheet
3. **Check**: Pan, zoom, and tap gestures work above sheet boundary

## Common Issues to Watch For

### Performance Issues
- [ ] Frame drops during pan/zoom
- [ ] Slow response to touch gestures
- [ ] Delayed cluster expansion
- [ ] Laggy bottom sheet dragging

### Visual Issues
- [ ] Zoom controls overlapping with UI
- [ ] Bottom sheet not respecting safe areas
- [ ] Map not filling available space
- [ ] Clusters not rendering properly

### Functional Issues
- [ ] Location button not working
- [ ] Farms counter not updating
- [ ] Bottom sheet not snapping correctly
- [ ] Map gestures blocked by UI elements

### Accessibility Issues
- [ ] Screen reader not announcing map elements
- [ ] Keyboard navigation not working
- [ ] Missing ARIA labels
- [ ] Poor color contrast

## Testing on Different Devices

### iPhone Models to Test
- iPhone 12/13/14/15 (various screen sizes)
- iPhone SE (smaller screen)
- iPhone Pro Max (larger screen)

### iOS Versions to Test
- iOS 16.x
- iOS 17.x
- iOS 18.x (if available)

### Safari Versions
- Latest Safari on each iOS version
- Check for Safari-specific issues

## Reporting Issues

When you find an issue, document:

1. **Device**: iPhone model and iOS version
2. **Browser**: Safari version
3. **Steps to Reproduce**: Exact steps to trigger the issue
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots/Videos**: Visual evidence if helpful
7. **Severity**: Critical, High, Medium, Low

## Quick Commands

```bash
# Start development server
npm run dev

# Run automated QA tests
npm run test:map-qa

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:performance

# Run lighthouse audit
npm run lighthouse
```

## Tips for Effective Testing

1. **Test systematically**: Go through the checklist in order
2. **Test edge cases**: Try unusual gestures or rapid interactions
3. **Test with different data**: Try with many farms, few farms, no farms
4. **Test network conditions**: Try with slow network or offline
5. **Test accessibility**: Use VoiceOver and keyboard navigation
6. **Document everything**: Take notes and screenshots
7. **Test repeatedly**: Some issues only appear after multiple interactions

## Success Criteria

The map page is ready for production when:

- [ ] All touch gestures work smoothly
- [ ] Clusters expand properly on tap
- [ ] Zoom controls are accessible
- [ ] Farms counter updates correctly
- [ ] Locate button works with haptics
- [ ] Bottom sheet snaps cleanly
- [ ] Map gestures work above sheet
- [ ] No critical accessibility issues
- [ ] Performance is smooth (60fps)
- [ ] Works on all target devices

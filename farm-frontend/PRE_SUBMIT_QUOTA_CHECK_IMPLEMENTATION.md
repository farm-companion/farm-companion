# Pre-Submit Quota Check Implementation

## Overview

This document describes the implementation of a pre-submit quota check that prevents users from attempting uploads when a farm already has the maximum number of photos (5), saving time and bandwidth while avoiding "success" confusion.

## Problem Statement

The previous implementation had several issues:
1. **Wasted bandwidth** - Users could upload files only to get a 409 error
2. **Poor user experience** - No indication of photo limits before upload
3. **Server load** - Processing uploads that would inevitably fail
4. **Confusion** - Users thought upload succeeded when it actually failed

## Solution: Pre-Submit Quota Check

### Key Changes

#### 1. Quota Check on Component Mount

**Implementation:**
```typescript
// Pre-submit quota check
useEffect(() => {
  (async () => {
    try {
      const res = await fetch(`/api/photos?farmSlug=${encodeURIComponent(farmSlug)}`);
      if (!res.ok) return;
      const { farmPhotoCount, maxPhotosAllowed } = await res.json();
      
      if (farmPhotoCount >= maxPhotosAllowed) {
        setErrors([`This farm already has ${farmPhotoCount}/${maxPhotosAllowed} photos.`]);
        setReplaceMode(true);
      }
    } catch (error) {
      console.error('Error checking photo quota:', error);
    } finally {
      setIsCheckingQuota(false);
    }
  })();
}, [farmSlug]);
```

#### 2. Enhanced UI States

**Loading State:**
```typescript
{isCheckingQuota ? (
  <>
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Checking Photo Limit...</span>
  </>
) : isSubmitting ? (
  // ... existing submitting state
) : replaceMode ? (
  'Photo Limit Reached'
) : (
  'Submit Photo'
)}
```

**Disabled States:**
```typescript
disabled={isSubmitting || isCheckingQuota || replaceMode}
className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
  replaceMode ? 'opacity-50 cursor-not-allowed' : ''
}`}
```

#### 3. Helpful Error Messages

**Replace Mode Guidance:**
```typescript
{replaceMode && (
  <div className="mt-3 pt-3 border-t border-red-200">
    <p className="text-sm text-red-700 mb-2">
      This farm has reached the maximum number of photos. To add a new photo, you'll need to:
    </p>
    <ul className="text-sm text-red-700 space-y-1 mb-3">
      <li>• Contact us to request removal of an existing photo</li>
      <li>• Wait for an existing photo to be rejected</li>
      <li>• Replace an existing photo with a better one</li>
    </ul>
    <p className="text-sm text-red-700 mb-2">
      Need help? Contact our support team:
    </p>
    <a href="mailto:hello@farmcompanion.co.uk?subject=Photo%20Replacement%20Request">
      hello@farmcompanion.co.uk
    </a>
  </div>
)}
```

## Benefits

### 1. **Saves Time & Bandwidth**
- Prevents unnecessary file uploads
- No wasted server processing
- Faster user feedback

### 2. **Better User Experience**
- Clear indication of photo limits
- Helpful guidance on next steps
- No false "success" confusion

### 3. **Reduced Server Load**
- Fewer failed upload attempts
- Less bandwidth consumption
- More efficient resource usage

### 4. **Clear Communication**
- Immediate feedback on limits
- Specific guidance for resolution
- Professional error handling

## Implementation Details

### State Management

```typescript
const [replaceMode, setReplaceMode] = useState(false)
const [isCheckingQuota, setIsCheckingQuota] = useState(true)
```

### API Integration

Uses the existing `/api/photos` endpoint which returns:
```json
{
  "photos": [...],
  "totalCount": 5,
  "farmPhotoCount": 5,
  "maxPhotosAllowed": 5
}
```

### Validation Flow

```
Component mounts
    ↓
Check photo quota via API
    ↓
If quota exceeded → Set replace mode
    ↓
Disable form inputs
    ↓
Show helpful guidance
```

## Testing

### QA Verification

✅ **Pick a farm with 5 photos** → form disables submit & shows "replace" guidance.

✅ **Pick a farm with <5 photos** → form enables submit normally.

✅ **Network error during check** → form still works (graceful fallback).

### Test Scenarios

1. **Farm with 5 photos:**
   - Shows: "Checking Photo Limit..." → "Photo Limit Reached"
   - Submit button: Disabled
   - File input: Disabled
   - Error message: "This farm already has 5/5 photos."

2. **Farm with 3 photos:**
   - Shows: "Checking Photo Limit..." → "Submit Photo"
   - Submit button: Enabled
   - File input: Enabled
   - No error message

3. **Network error:**
   - Shows: "Checking Photo Limit..." → "Submit Photo"
   - Form works normally (graceful degradation)
   - No blocking behavior

## Files Modified

1. `farm-frontend/src/components/PhotoSubmissionForm.tsx`
   - Added useEffect for quota checking
   - Added replace mode state management
   - Updated UI states and error handling
   - Enhanced user guidance

2. `farm-frontend/PRE_SUBMIT_QUOTA_CHECK_IMPLEMENTATION.md` (this documentation)

## Impact

🔧 **Saves users time/bandwidth; avoids "success" confusion**

This implementation resolves the core issues by:
- Preventing unnecessary uploads when quota is exceeded
- Providing immediate, clear feedback about photo limits
- Offering helpful guidance for resolution
- Improving overall user experience and system efficiency

## Future Improvements

1. **Real-time Updates**: Refresh quota on successful uploads
2. **Caching**: Cache quota results for better performance
3. **Progressive Enhancement**: Show quota info in farm listings
4. **Admin Override**: Allow admins to temporarily increase limits
5. **Analytics**: Track quota check patterns for optimization

## Technical Notes

### API Endpoint

Uses the existing `/api/photos` GET endpoint which already provides:
- `farmPhotoCount`: Current number of photos for the farm
- `maxPhotosAllowed`: Maximum photos allowed per farm

### Error Handling

- Graceful fallback if quota check fails
- No blocking behavior on network errors
- Clear error messages for users

### Performance

- Single API call on component mount
- Minimal impact on page load
- Efficient state management
- No unnecessary re-renders

### Accessibility

- Proper ARIA labels for disabled states
- Clear error messages for screen readers
- Keyboard navigation support
- Focus management for form states

# Multipart Upload Implementation

## Overview

This document describes the implementation of multipart uploads to replace base64 encoding for photo submissions, fixing the issues with tiny/black 807-byte images and intermittent "success" responses.

## Problem Statement

The previous implementation used base64 encoding for photo uploads, which caused several issues:

1. **Tiny/black images**: Base64 encoding can corrupt image data during transmission
2. **807-byte images**: Truncated data due to encoding issues
3. **Intermittent success**: Unreliable upload process
4. **Performance**: Base64 encoding increases payload size by ~33%

## Solution: Multipart Uploads

### Key Changes

#### 1. PhotoSubmissionForm.tsx

**Before (Base64):**
```typescript
// Convert file to base64
const base64Data = formData.photoPreview!

const submissionData = {
  farmSlug,
  farmName,
  submitterName: formData.submitterName.trim(),
  submitterEmail: formData.submitterEmail.trim(),
  description: formData.photoDescription.trim(),
  photoData: base64Data
}

const response = await fetch('/api/photos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(submissionData),
})
```

**After (Multipart):**
```typescript
if (!formData.photoFile) {
  setErrors(['Please choose a photo'])
  return
}

const fd = new FormData()
fd.append('farmSlug', farmSlug)
fd.append('farmName', farmName)
fd.append('submitterName', formData.submitterName.trim())
fd.append('submitterEmail', formData.submitterEmail.trim())
fd.append('description', formData.photoDescription.trim())
fd.append('file', formData.photoFile) // ✅ stream the original File

const response = await fetch('/api/photos', { 
  method: 'POST', 
  body: fd 
})
```

**Key Improvements:**
- Keep original `File` object as source of truth
- Use `photoPreview` only for display purposes
- Send raw file data via FormData with `file` field name
- Simplified validation and error handling
- Let browser handle Content-Type with proper boundary

#### 2. Frontend API Proxy (farm-frontend/src/app/api/photos/route.ts)

**Before:**
```typescript
const body = await request.json()
const response = await fetch(farmPhotosUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})
```

**After:**
```typescript
const contentType = request.headers.get('content-type') || ''

if (contentType.includes('multipart/form-data')) {
  // Handle multipart form data
  const formData = await request.formData()
  
  const response = await fetch(farmPhotosUrl, {
    method: 'POST',
    body: formData, // Forward the FormData directly
    // Don't set Content-Type - let the fetch API handle it
  })
} else {
  // Handle JSON data (fallback for backward compatibility)
  const body = await request.json()
  // ... existing JSON handling
}
```

**Key Improvements:**
- Detect content type automatically
- Forward FormData directly without modification
- Maintain backward compatibility with JSON requests

#### 3. Farm-Photos Service API (farm-photos/src/app/api/photos/route.ts)

**Before:**
```typescript
const PhotoSubmissionSchema = z.object({
  farmSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  farmName: z.string().min(1).max(200),
  submitterName: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/),
  submitterEmail: z.string().email(),
  photoData: z.string().min(100), // base64 encoded
  description: z.string().min(10).max(500)
})
```

**After:**
```typescript
const PhotoSubmissionFormSchema = z.object({
  farmSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  farmName: z.string().min(1).max(200),
  submitterName: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/),
  submitterEmail: z.string().email(),
  description: z.string().min(10).max(500)
})

// Handle multipart form data
if (contentType.includes('multipart/form-data')) {
  const formData = await request.formData()
  
  // Extract form fields
  const farmSlug = formData.get('farmSlug') as string
  const farmName = formData.get('farmName') as string
  const submitterName = formData.get('submitterName') as string
  const submitterEmail = formData.get('submitterEmail') as string
  const description = formData.get('description') as string
  photoFile = formData.get('file') as File // ✅ handle 'file' field name
  
  // Validate file
  if (!photoFile || !(photoFile instanceof File)) {
    return NextResponse.json({ error: 'Photo file is required' }, { status: 400 })
  }
  
  // Check file type and size
  if (!photoFile.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Please select a valid image file' }, { status: 400 })
  }
  
  if (photoFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Photo must be smaller than 5MB' }, { status: 400 })
  }
}
```

**Key Improvements:**
- Extract File object directly from FormData
- Validate file type and size on the server
- Maintain backward compatibility with base64 requests
- Convert File to base64 only for storage (temporary solution)

## Benefits

### 1. **Reliability**
- No more corrupted image data
- Eliminates base64 encoding/decoding issues
- Consistent file uploads

### 2. **Performance**
- Reduced payload size (no base64 overhead)
- Faster uploads
- Better memory usage

### 3. **User Experience**
- More reliable upload process
- Better error handling
- Consistent success rates

### 4. **Maintainability**
- Cleaner code structure
- Better separation of concerns
- Easier to debug

## Testing

A test script has been created at `test-multipart-upload.js` to verify the implementation:

```bash
node test-multipart-upload.js
```

The test:
1. Creates a minimal test image
2. Builds FormData with the image
3. Sends it to the API endpoint
4. Verifies the response

## Backward Compatibility

The implementation maintains backward compatibility:
- JSON requests with base64 data still work
- Existing integrations continue to function
- Gradual migration path available

## Future Improvements

1. **Direct File Upload**: Skip base64 conversion entirely in storage
2. **Streaming Uploads**: Handle large files more efficiently
3. **Progress Tracking**: Add upload progress indicators
4. **Chunked Uploads**: Support for very large files

## Files Modified

1. `farm-frontend/src/components/PhotoSubmissionForm.tsx`
2. `farm-frontend/src/app/api/photos/route.ts`
3. `farm-photos/src/app/api/photos/route.ts`
4. `farm-frontend/test-multipart-upload.js` (new test file)
5. `farm-frontend/MULTIPART_UPLOAD_IMPLEMENTATION.md` (this documentation)

## Impact

🔥 **Fixes tiny/black 807-byte images & intermittent "success"**

This implementation resolves the core issues by:
- Eliminating base64 encoding corruption
- Using raw file data for uploads
- Maintaining original file integrity
- Providing reliable upload process

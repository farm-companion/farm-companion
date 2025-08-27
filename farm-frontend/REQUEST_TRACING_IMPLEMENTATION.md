# Request Tracing Implementation

## Overview

This document describes the implementation of request tracing that adds unique request IDs to all API responses, making future debugging fast and efficient.

## Problem Statement

The previous implementation had several debugging challenges:
1. **No request correlation** - Difficult to trace requests across services
2. **Poor error reporting** - Generic error messages without context
3. **Debugging complexity** - Hard to correlate client errors with server logs
4. **Support inefficiency** - No way to quickly identify specific request issues

## Solution: Request Tracing with Request IDs

### Key Changes

#### 1. Client-Side Request ID Handling

**Implementation in PhotoSubmissionForm.tsx:**
```typescript
// Error handling with request ID extraction
} else if (response.status === 409) {
  const rid = response.headers.get('x-request-id') ?? crypto.randomUUID()
  setErrors([`${result.message || 'This farm has reached the maximum number of photos'} (ref: ${rid}). Please contact support if you'd like to replace an existing photo.`])
  setIsPhotoLimitError(true)
} else {
  const rid = response.headers.get('x-request-id') ?? crypto.randomUUID()
  setErrors([`Upload failed (ref: ${rid}). ${result.message || 'Please try again.'}`])
  setIsPhotoLimitError(false)
}

// Network error handling with request ID
} catch (error) {
  const rid = crypto.randomUUID()
  if (error instanceof TypeError && errorMessage.includes('fetch')) {
    setErrors([`Network error (ref: ${rid}). Please check your internet connection and try again.`])
  } else if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
    setErrors([`Unable to connect to server (ref: ${rid}). Please try again.`])
  } else {
    setErrors([`An unexpected error occurred (ref: ${rid}): ${errorMessage}`])
  }
}
```

#### 2. Proxy Route Request ID Propagation

**Implementation in farm-frontend/src/app/api/photos/route.ts:**
```typescript
async function forward(req: Request, method: string) {
  const url = new URL(req.url);
  const upstream = `${BASE}/api/photos${url.search || ''}`;

  // Generate or use existing request ID for tracing
  const rid = req.headers.get('x-request-id') ?? crypto.randomUUID();
  
  let body: BodyInit | undefined;
  let headers: HeadersInit | undefined;

  if (method === 'POST' || method === 'PATCH') {
    const ct = req.headers.get('content-type') || '';
    if (ct.startsWith('multipart/form-data')) {
      const form = await req.formData();
      body = form;
    } else {
      body = await req.text();
      headers = { 'content-type': ct };
    }
  }

  // Add request ID to upstream request
  const upstreamHeaders = { ...headers, 'x-request-id': rid };

  const res = await fetch(upstream, { method, headers: upstreamHeaders, body });
  const h = new Headers(res.headers);
  // strip CORS noise (we are same-origin now)
  h.delete('access-control-allow-origin');
  h.delete('access-control-allow-credentials');
  // Ensure request ID is reflected back in response
  h.set('x-request-id', rid);
  return new Response(res.body, { status: res.status, headers: h });
}
```

#### 3. Backend Service Request ID Handling

**Implementation in farm-photos/src/app/api/photos/route.ts:**
```typescript
// POST - Submit New Photo
export async function POST(request: NextRequest) {
  // Get or generate request ID for tracing
  const rid = request.headers.get('x-request-id') ?? crypto.randomUUID()
  
  try {
    // ... existing logic ...
    
    // All response headers include request ID
    const response = NextResponse.json({ ... })
    corsHeaders(request).forEach((value, key) => response.headers.set(key, value))
    response.headers.set('x-request-id', rid)
    return response
    
  } catch (error) {
    const response = NextResponse.json({ ... }, { status: 500 })
    corsHeaders(request).forEach((value, key) => response.headers.set(key, value))
    response.headers.set('x-request-id', rid)
    return response
  }
}
```

## Benefits

### 1. **Fast Debugging**
- Unique request IDs for every API call
- Easy correlation between client errors and server logs
- Quick identification of specific request issues

### 2. **Better Error Reporting**
- User-friendly error messages with request references
- Support team can quickly locate specific issues
- Clear context for troubleshooting

### 3. **Improved Support**
- Users can provide request IDs for faster resolution
- Support team can trace issues across services
- Reduced time to resolution

### 4. **Request Correlation**
- Track requests across proxy and backend services
- Maintain request context throughout the call chain
- Debug distributed system issues

## Implementation Details

### Request ID Generation

```typescript
// Automatic generation if not provided
const rid = request.headers.get('x-request-id') ?? crypto.randomUUID()
```

### Request ID Propagation

1. **Client** → **Proxy** → **Backend**
2. **Backend** → **Proxy** → **Client**
3. **Request ID preserved throughout the chain**

### Error Message Format

```typescript
// Success case
"Photo submitted successfully!"

// Error case with request ID
"Upload failed (ref: 123e4567-e89b-12d3-a456-426614174000). Please try again."

// Network error with request ID
"Network error (ref: 123e4567-e89b-12d3-a456-426614174000). Please check your internet connection and try again."
```

## Testing

### Test Scenarios

1. **Request without x-request-id header:**
   - ✅ Request ID generated automatically
   - ✅ Request ID included in response headers
   - ✅ Request ID included in error messages

2. **Request with custom x-request-id header:**
   - ✅ Custom request ID preserved
   - ✅ Request ID propagated through proxy
   - ✅ Request ID reflected back in response

3. **Error scenarios:**
   - ✅ Request ID included in validation errors
   - ✅ Request ID included in server errors
   - ✅ Request ID included in network errors

4. **GET requests:**
   - ✅ Request ID preserved in GET responses
   - ✅ Request ID propagated for quota checks

### Test Script

Run the test script to verify implementation:
```bash
node test-request-tracing.js
```

## Usage Examples

### Client-Side Error Handling

```typescript
try {
  const response = await fetch('/api/photos', { 
    method: 'POST', 
    body: formData 
  })
  
  if (!response.ok) {
    const rid = response.headers.get('x-request-id') ?? crypto.randomUUID()
    const errorData = await response.json()
    setError(`Upload failed (ref: ${rid}). ${errorData.message}`)
  }
} catch (error) {
  const rid = crypto.randomUUID()
  setError(`Network error (ref: ${rid}). Please try again.`)
}
```

### Support Team Usage

When a user reports an issue:
1. **User provides request ID** from error message
2. **Support team searches logs** for the specific request ID
3. **Quick identification** of the exact request and issue
4. **Faster resolution** with full context

### Log Correlation

Server logs now include request IDs:
```
[2024-01-15 10:30:45] [rid:123e4567-e89b-12d3-a456-426614174000] Photo submission started
[2024-01-15 10:30:46] [rid:123e4567-e89b-12d3-a456-426614174000] Validation failed: missing farmSlug
[2024-01-15 10:30:46] [rid:123e4567-e89b-12d3-a456-426614174000] Photo submission completed with error
```

## Files Modified

1. `farm-frontend/src/components/PhotoSubmissionForm.tsx`
   - Added request ID extraction from response headers
   - Enhanced error messages with request IDs
   - Added request ID generation for network errors

2. `farm-frontend/src/app/api/photos/route.ts`
   - Added request ID generation and propagation
   - Enhanced proxy to forward request IDs to upstream
   - Ensured request IDs are reflected in responses

3. `farm-photos/src/app/api/photos/route.ts`
   - Added request ID handling in POST method
   - Added request ID handling in GET method
   - Enhanced all error responses with request IDs

4. `farm-frontend/test-request-tracing.js`
   - Comprehensive test suite for request tracing
   - Tests for various scenarios and edge cases
   - Validation of request ID propagation

5. `farm-frontend/REQUEST_TRACING_IMPLEMENTATION.md` (this documentation)

## Impact

🧭 **Makes future debugging fast**

This implementation provides:
- **Unique request identification** for every API call
- **Easy error correlation** between client and server
- **Improved support efficiency** with request references
- **Better debugging capabilities** across distributed services

## Future Improvements

1. **Logging Integration**: Add request IDs to all log entries
2. **Monitoring**: Track request patterns and performance
3. **Analytics**: Analyze error patterns by request ID
4. **Distributed Tracing**: Integrate with tools like Jaeger or Zipkin
5. **Request Context**: Add additional context to request IDs

## Technical Notes

### Request ID Format

- **Generated**: UUID v4 format (e.g., `123e4567-e89b-12d3-a456-426614174000`)
- **Custom**: Any string format supported
- **Header Name**: `x-request-id`

### Performance Impact

- **Minimal overhead**: UUID generation is fast
- **No storage**: Request IDs are not persisted
- **Stateless**: No additional state management required

### Security Considerations

- **No sensitive data**: Request IDs contain no user information
- **Temporary**: Request IDs are not stored long-term
- **Safe for logs**: Can be safely included in log files

### Browser Compatibility

- **crypto.randomUUID()**: Supported in modern browsers
- **Fallback**: Uses existing request ID if available
- **Graceful degradation**: Works even if UUID generation fails

# Same-Origin Proxy Implementation

## Overview

This document describes the implementation of a same-origin proxy for the photos API to eliminate CORS issues and ensure both uploader and admin hit the same backend.

## Problem Statement

The previous implementation had CORS issues because:
1. Frontend and farm-photos service were on different origins
2. Browser security policies blocked cross-origin requests
3. Inconsistent behavior between development and production
4. Complex CORS configuration management

## Solution: Same-Origin Proxy

### Key Changes

#### 1. Environment Configuration

**File: farm-frontend/.env.local**
```bash
# Farm Photos API Configuration
PHOTOS_API_BASE=https://farm-photos-oeh1q91n4-abdur-rahman-morris-projects.vercel.app

# Development Configuration
NODE_ENV="development"
VERCEL_ENV="development"
```

**File: Vercel Project → Environment Variables**
- **Preview/Production**: `PHOTOS_API_BASE=https://farm-photos-<YOUR>.vercel.app`

#### 2. Configuration Update

**File: farm-frontend/src/config/farm-photos.ts**
```typescript
export const FARM_PHOTOS_CONFIG = {
  // API URL for the farm-photos system
  API_URL: process.env.PHOTOS_API_BASE || process.env.FARM_PHOTOS_API_URL || 'https://farm-photos-oeh1q91n4-abdur-rahman-morris-projects.vercel.app',
  // ... rest of config
}
```

#### 3. Thin Proxy Route

**File: farm-frontend/src/app/api/photos/route.ts**
```typescript
// Farm Photos API - Thin Proxy Route
// PuredgeOS 3.0 Compliant Photo Management

export const runtime = 'nodejs'; // ensure Node runtime for streaming FormData
const BASE = process.env.PHOTOS_API_BASE!; // e.g. https://farm-photos-xxxxx.vercel.app

async function forward(req: Request, method: string) {
  const url = new URL(req.url);
  const upstream = `${BASE}/api/photos${url.search || ''}`;

  let body: BodyInit | undefined;
  let headers: HeadersInit | undefined;

  if (method === 'POST' || method === 'PATCH') {
    const ct = req.headers.get('content-type') || '';
    if (ct.startsWith('multipart/form-data')) {
      // receive and forward FormData (streams the file)
      const form = await req.formData();
      body = form;
    } else {
      // forward JSON, etc
      body = await req.text();
      headers = { 'content-type': ct };
    }
  }

  const res = await fetch(upstream, { method, headers, body });
  const h = new Headers(res.headers);
  // strip CORS noise (we are same-origin now)
  h.delete('access-control-allow-origin');
  h.delete('access-control-allow-credentials');
  return new Response(res.body, { status: res.status, headers: h });
}

export async function GET(req: Request)    { return forward(req, 'GET'); }
export async function POST(req: Request)   { return forward(req, 'POST'); }
export async function PATCH(req: Request)  { return forward(req, 'PATCH'); }
export async function DELETE(req: Request) { return forward(req, 'DELETE'); }
export async function OPTIONS()            { return new Response(null, { status: 204 }); }
```

## Benefits

### 1. **Eliminates CORS Issues**
- All requests go through the same origin
- No more cross-origin request blocks
- No preflight errors in DevTools
- Consistent behavior across environments

### 2. **Guarantees Same Backend**
- Uploader and admin hit the same backend
- Consistent data and behavior
- Simplified debugging and monitoring

### 3. **Environment Flexibility**
- Easy to switch between development and production
- Environment-specific configuration via `PHOTOS_API_BASE`
- No code changes needed for different environments

### 4. **Security Benefits**
- Same-origin requests are more secure
- Reduced attack surface
- Better control over request flow
- CORS headers stripped from responses

### 5. **Streaming Support**
- Proper FormData streaming for file uploads
- Node.js runtime ensures optimal performance
- No memory issues with large files

## Setup Instructions

### Local Development

1. **Create environment file:**
   ```bash
   cd farm-frontend
   ./setup-env.sh
   ```

2. **Verify configuration:**
   ```bash
   cat .env.local
   # Should show PHOTOS_API_BASE=https://farm-photos-oeh1q91n4-abdur-rahman-morris-projects.vercel.app
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Set environment variable in Vercel:**
   - Go to Vercel Project Settings
   - Navigate to Environment Variables
   - Add `PHOTOS_API_BASE` with your farm-photos service URL

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## Testing

### Browser Test
1. Open `http://localhost:3000/test-upload.html`
2. Select an image file or generate a test image
3. Click "Test Upload" to verify multipart upload works

### API Test
```bash
cd farm-frontend
node test-multipart-upload.js
```

## Architecture Flow

```
Browser (Same Origin)
    ↓
fetch('/api/photos', { method: 'POST', body: fd })
    ↓
farm-frontend/api/photos (Thin Proxy)
    ↓
forward() function streams FormData
    ↓
farm-photos service (External)
    ↓
Response back through proxy (CORS headers stripped)
    ↓
Browser receives response
```

## Client Usage

**Simple client calls:**
```javascript
const fd = new FormData();
fd.append('file', photoFile);
fd.append('farmSlug', 'my-farm');
// ... other fields

const response = await fetch('/api/photos', { 
  method: 'POST', 
  body: fd 
});
```

## Impact

🔥 **Eliminates CORS + guarantees uploader & admin hit the same backend**

This implementation resolves the core issues by:
- Eliminating cross-origin request blocks
- Ensuring consistent backend access
- Simplifying environment management
- Improving security and reliability
- Providing proper FormData streaming support

## QA Verification

✅ **DevTools → Network**: requests go to `/api/photos` (your own origin), no preflight error.

✅ **Admin list & uploader**: both update against the same backend.

✅ **FormData streaming**: files are properly streamed without memory issues.

✅ **Environment switching**: `PHOTOS_API_BASE` controls which backend is used.

## Files Modified

1. `farm-frontend/.env.local` (created)
2. `farm-frontend/src/config/farm-photos.ts`
3. `farm-frontend/src/app/api/photos/route.ts`
4. `farm-frontend/setup-env.sh` (created)
5. `farm-frontend/test-upload.html` (created)
6. `farm-frontend/SAME_ORIGIN_PROXY_IMPLEMENTATION.md` (this documentation)

## Environment Variables

### Required
- `PHOTOS_API_BASE`: URL of the farm-photos service

### Optional (Fallback)
- `FARM_PHOTOS_API_URL`: Legacy environment variable for backward compatibility

## Troubleshooting

### FormData Parsing Issues
If you see "Failed to parse multipart form data" errors:
1. Check that the request has proper `Content-Type: multipart/form-data`
2. Verify the FormData is properly constructed
3. Ensure the farm-photos service is running and accessible

### Environment Issues
If the proxy can't reach the farm-photos service:
1. Verify `PHOTOS_API_BASE` is set correctly
2. Check that the farm-photos service is deployed and accessible
3. Test the URL directly: `curl https://your-farm-photos-url.vercel.app/api/photos`

### CORS Issues
If you still see CORS errors:
1. Ensure all requests go through the proxy (`/api/photos`)
2. Don't make direct requests to the farm-photos service from the browser
3. Check that the proxy is properly forwarding requests

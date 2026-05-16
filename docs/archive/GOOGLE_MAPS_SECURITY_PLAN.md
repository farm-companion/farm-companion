# 🔒 Google Maps API Security Implementation Plan

## 🚨 Current Issue
Your Google Maps API key `821ed4c7-9648-4524-9287-85fbe8a3e645` is unrestricted and vulnerable to abuse. Google has detected incompatible usage patterns requiring different restriction types.

## 📊 Usage Analysis

### Frontend Web Application (Browser-based)
- **Files**: `farm-frontend/src/lib/googleMaps.ts`, `farm-frontend/src/components/Map.tsx`
- **Environment**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **APIs**: Maps JavaScript API, Places API, Geocoding API
- **Required Restriction**: HTTP referrers (websites) - **This is the correct approach**

### Backend Server-Side (Server-based)
- **Files**: `farm-pipeline/src/shops_pipeline.py`, `farm-pipeline/src/google_places_fetch.py`
- **Environment**: `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACES_API_KEY`
- **APIs**: Geocoding API, Places API
- **Required Restriction**: IP address restrictions (for server-to-server calls)

### API Testing Endpoint (Server-based)
- **Files**: `farm-frontend/src/app/api/test-maps/route.ts`
- **Environment**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (server-side usage)
- **APIs**: Geocoding API, Maps JavaScript API
- **Required Restriction**: IP address restrictions (for server-to-server calls)

## 🛠️ Implementation Steps

### Step 1: Create Two HTTP Referrer-Restricted Keys (Recommended Approach)

#### 1.1 Production Browser Key
- **Name**: `Farm-companion-production`
- **Application Restrictions**: HTTP referrers (web sites)
- **Referrers**:
  - `https://farmcompanion.co.uk/*`
  - `https://www.farmcompanion.co.uk/*`
- **API Restrictions**: Maps JavaScript API, Places API, Geocoding API

#### 1.2 Development/Preview Browser Key
- **Name**: `Farm-companion-preview-dev`
- **Application Restrictions**: HTTP referrers (web sites)
- **Referrers**:
  - `http://localhost:3000/*`
  - `http://127.0.0.1:3000/*`
  - `https://farm-frontend-abdur-rahman-morris-projects.vercel.app/*`
- **API Restrictions**: Maps JavaScript API, Places API, Geocoding API

### Alternative: Server-Side Keys (Only if needed for backend processing)
If you have server-side Google Maps API usage that requires IP restrictions:
- **Backend Server Key**: IP address restricted for server-to-server calls
- **API Testing Key**: IP address restricted for server-side testing

### Step 2: Update Environment Variables

#### 2.1 Frontend Environment (.env.local)
```bash
# Frontend Web Key (HTTP referrer restricted)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_frontend_key_here
```

#### 2.2 Backend Environment
```bash
# Backend Server Key (IP restricted)
GOOGLE_MAPS_API_KEY=your_backend_key_here
GOOGLE_PLACES_API_KEY=your_backend_key_here

# API Testing Key (IP restricted)
GOOGLE_MAPS_API_KEY_TESTING=your_testing_key_here
```

### Step 3: Update Code to Use Appropriate Keys

#### 3.1 Frontend Components (No changes needed)
- `farm-frontend/src/lib/googleMaps.ts` ✅ Already uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `farm-frontend/src/components/Map.tsx` ✅ Already uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### 3.2 Backend Pipeline (Update environment variables)
- `farm-pipeline/src/shops_pipeline.py` ✅ Already uses `GOOGLE_MAPS_API_KEY`
- `farm-pipeline/src/google_places_fetch.py` ✅ Already uses `GOOGLE_PLACES_API_KEY`

#### 3.3 API Testing Endpoint (Update to use testing key)
- `farm-frontend/src/app/api/test-maps/route.ts` - Update to use `GOOGLE_MAPS_API_KEY_TESTING`

### Step 4: Vercel Environment Variables

Update your Vercel project with the new environment variables:

1. **Frontend Variables**:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = Frontend Web Key

2. **Backend Variables**:
   - `GOOGLE_MAPS_API_KEY` = Backend Server Key
   - `GOOGLE_PLACES_API_KEY` = Backend Server Key
   - `GOOGLE_MAPS_API_KEY_TESTING` = API Testing Key

## 🔍 Testing Plan

### 1. Test Frontend Key
- Visit your website and check that maps load correctly
- Test on localhost:3000
- Test on production domain

### 2. Test Backend Key
- Run the farm pipeline scripts
- Check that geocoding works
- Verify Places API calls work

### 3. Test API Testing Key
- Call `/api/test-maps` endpoint
- Verify both geocoding and Maps JavaScript API work

## 🚨 Security Benefits

1. **Frontend Key**: Only works from your domains, prevents unauthorized usage
2. **Backend Key**: Only works from your server IPs, prevents abuse
3. **Testing Key**: Isolated for testing, doesn't affect production

## 📝 Next Steps

1. Create the three API keys in Google Cloud Console
2. Set up appropriate restrictions for each key
3. Update environment variables
4. Test each key in its intended context
5. Remove the old unrestricted key

## ⚠️ Important Notes

- **Never use the same key for different restriction types**
- **Test thoroughly before removing the old key**
- **Keep the old key as backup until everything is working**
- **Monitor usage in Google Cloud Console**

## 🔗 Google Cloud Console Links

- [API Keys & Credentials](https://console.cloud.google.com/apis/credentials)
- [API Restrictions Guide](https://cloud.google.com/docs/authentication/api-keys#restricting_keys)
- [Usage Monitoring](https://console.cloud.google.com/apis/dashboard)

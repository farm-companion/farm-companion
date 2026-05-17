# 🚀 Simple Google Maps Security Setup

## 🎯 Goal
Secure your Google Maps API key using HTTP referrer restrictions (the correct approach for browser-based usage).

## 📋 What You Need
- Access to Google Cloud Console
- Your current API key: `821ed4c7-9648-4524-9287-85fbe8a3e645`
- Access to your Vercel dashboard

## 🔧 Simple 2-Key Approach

### Step 1: Create Production Browser Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. **Name**: `Farm-companion-production`
4. Click "Restrict Key"
5. **Application Restrictions**: HTTP referrers (web sites)
6. **Referrers** (add these):
   - `https://farmcompanion.co.uk/*`
   - `https://www.farmcompanion.co.uk/*`
7. **API Restrictions**: Restrict key → Select APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
8. Click "Save"
9. **Copy this key** - this will be your production key

### Step 2: Create Development Browser Key
1. Click "Create Credentials" → "API Key"
2. **Name**: `Farm-companion-preview-dev`
3. Click "Restrict Key"
4. **Application Restrictions**: HTTP referrers (web sites)
5. **Referrers** (add these):
   - `http://localhost:3000/*`
   - `http://127.0.0.1:3000/*`
   - `https://farm-frontend-abdur-rahman-morris-projects.vercel.app/*`
6. **API Restrictions**: Restrict key → Select APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
7. Click "Save"
8. **Copy this key** - this will be your development key

### Step 3: Update Environment Variables

#### Local Development (.env.local)
Add to your `farm-frontend/.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_development_key_here
```

#### Vercel Production
1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add/Update:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your production key
   - **Environment**: Production only
5. Click "Save"

### Step 4: Test Your Setup

#### Test Local Development
1. Start your dev server: `npm run dev`
2. Visit `http://localhost:3000/map`
3. Check that the map loads without errors

#### Test Production
1. Deploy to Vercel
2. Visit your production site
3. Check that the map loads correctly

### Step 5: Remove Old Key
⚠️ **Only after testing everything works:**
1. Go to Google Cloud Console
2. Find your old key: `821ed4c7-9648-4524-9287-85fbe8a3e645`
3. Delete or disable it

## ✅ Success Criteria
- [ ] Two new restricted keys created
- [ ] Environment variables updated
- [ ] Local development works
- [ ] Production deployment works
- [ ] Old unrestricted key removed
- [ ] No Google security warnings

## 🔒 Security Benefits
- **HTTP referrer restrictions** prevent unauthorized usage
- **Cost control** - no unexpected charges
- **Compliance** - meets Google's requirements
- **Simple setup** - no need to chase server IPs

## 🚨 Important Notes
- **Don't use IP restrictions for browser-based Maps** - use HTTP referrers
- **Vercel serverless uses dynamic egress** - IP restrictions won't work reliably
- **HTTP referrers are the correct approach** for browser-based Google Maps usage

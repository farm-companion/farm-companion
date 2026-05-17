# 🚀 Step-by-Step Google Maps Security Implementation

## 🎯 Goal
Secure your Google Maps API key by creating three separate restricted keys for different usage contexts.

## 📋 Prerequisites
- Access to Google Cloud Console
- Your current API key: `821ed4c7-9648-4524-9287-85fbe8a3e645`
- Access to your Vercel dashboard

## 🔧 Implementation Steps

### Step 1: Create Three New API Keys in Google Cloud Console

#### 1.1 Frontend Web Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Name: `Farm-companion-frontend`
4. Click "Restrict Key"
5. **Application Restrictions**: HTTP referrers (web sites)
6. **Referrers** (add these one by one):
   - `*.farmcompanion.co.uk/*`
   - `localhost:3000/*`
   - `127.0.0.1:3000/*`
   - `*.vercel.app/*`
7. **API Restrictions**: Restrict key → Select APIs:
   - Maps JavaScript API
   - Places API
8. Click "Save"
9. **Copy the key** - this will be your `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### 1.2 Backend Server Key
1. Click "Create Credentials" → "API Key"
2. Name: `Farm-companion-backend`
3. Click "Restrict Key"
4. **Application Restrictions**: IP addresses (web servers, cron jobs, etc.)
5. **IP Addresses** (add your server IPs):
   - Your Vercel server IPs (check Vercel dashboard)
   - Your development machine IP
   - Any other server IPs you use
6. **API Restrictions**: Restrict key → Select APIs:
   - Geocoding API
   - Places API
7. Click "Save"
8. **Copy the key** - this will be your `GOOGLE_MAPS_API_KEY` and `GOOGLE_PLACES_API_KEY`

#### 1.3 API Testing Key
1. Click "Create Credentials" → "API Key"
2. Name: `Farm-companion-api-testing`
3. Click "Restrict Key"
4. **Application Restrictions**: IP addresses
5. **IP Addresses**: Same as backend server
6. **API Restrictions**: Restrict key → Select APIs:
   - Geocoding API
   - Maps JavaScript API
7. Click "Save"
8. **Copy the key** - this will be your `GOOGLE_MAPS_API_KEY_TESTING`

### Step 2: Update Environment Variables

#### 2.1 Local Development (.env.local)
Create/update `.env.local` in your `farm-frontend` directory:
```bash
# Frontend Web Key (HTTP referrer restricted)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_frontend_web_key_here

# Backend Server Keys (IP address restricted)
GOOGLE_MAPS_API_KEY=your_backend_server_key_here
GOOGLE_PLACES_API_KEY=your_backend_server_key_here

# API Testing Key (IP address restricted for server-side testing)
GOOGLE_MAPS_API_KEY_TESTING=your_api_testing_key_here
```

#### 2.2 Vercel Production Environment
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add/update these variables:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = Frontend Web Key
   - `GOOGLE_MAPS_API_KEY` = Backend Server Key
   - `GOOGLE_PLACES_API_KEY` = Backend Server Key
   - `GOOGLE_MAPS_API_KEY_TESTING` = API Testing Key

### Step 3: Test Each Key

#### 3.1 Test Frontend Key
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/map`
3. Check browser console for any errors
4. Verify map loads correctly

#### 3.2 Test Backend Key
1. Run your farm pipeline: `cd farm-pipeline && python src/shops_pipeline.py`
2. Check that geocoding works
3. Verify Places API calls work

#### 3.3 Test API Testing Key
1. Visit `http://localhost:3000/api/test-maps`
2. Check the response for success indicators
3. Verify both geocoding and Maps JavaScript API work

### Step 4: Deploy and Test Production

#### 4.1 Deploy to Vercel
1. Push your changes to GitHub
2. Vercel will automatically deploy
3. Check your production site: `https://www.farmcompanion.co.uk/map`

#### 4.2 Test Production
1. Visit your production site
2. Check that maps load correctly
3. Test the `/api/test-maps` endpoint
4. Monitor Google Cloud Console for usage

### Step 5: Remove Old Key (After Testing)

⚠️ **Only do this after confirming everything works with the new keys**

1. Go to Google Cloud Console → API Keys
2. Find your old key: `821ed4c7-9648-4524-9287-85fbe8a3e645`
3. Click "Delete" or "Disable"
4. Confirm deletion

## 🔍 Troubleshooting

### Common Issues

#### "API key not valid" Error
- Check that the key is correct
- Verify API restrictions are set correctly
- Ensure the right APIs are enabled

#### "Referer not allowed" Error
- Check HTTP referrer restrictions
- Ensure your domain is in the allowed list
- Test with localhost for development

#### "IP not allowed" Error
- Check IP address restrictions
- Verify your server IP is in the allowed list
- Check Vercel server IPs in your dashboard

### Getting Your Server IPs

#### Vercel Server IPs
1. Go to Vercel dashboard
2. Check your deployment logs
3. Look for "Server IP" in the logs
4. Or contact Vercel support for your server IPs

#### Your Development Machine IP
1. Visit `https://whatismyipaddress.com/`
2. Copy your public IP address
3. Add it to the IP restrictions

## 📊 Monitoring

### Google Cloud Console
1. Go to "APIs & Services" → "Dashboard"
2. Monitor usage for each key
3. Check for any unusual activity
4. Set up billing alerts

### Vercel Dashboard
1. Monitor your deployments
2. Check for any errors in logs
3. Verify environment variables are set correctly

## ✅ Success Criteria

- [ ] All three API keys created with proper restrictions
- [ ] Environment variables updated in all environments
- [ ] Frontend maps load correctly
- [ ] Backend geocoding works
- [ ] API testing endpoint works
- [ ] Production deployment successful
- [ ] Old unrestricted key removed
- [ ] No security warnings in Google Cloud Console

## 🚨 Security Benefits

1. **Frontend Key**: Only works from your domains, prevents unauthorized usage
2. **Backend Key**: Only works from your server IPs, prevents abuse
3. **Testing Key**: Isolated for testing, doesn't affect production
4. **Cost Control**: Prevents unauthorized usage that could result in unexpected charges
5. **Compliance**: Meets Google's security requirements

## 📞 Support

If you encounter issues:
1. Check Google Cloud Console for error messages
2. Review Vercel deployment logs
3. Test each key individually
4. Contact Google Cloud support if needed

---

**Remember**: Test thoroughly before removing the old key. Keep it as backup until everything is working perfectly!

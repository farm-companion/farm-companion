# 🗺️ Google Maps Setup Guide

## 🚨 **URGENT: Map Not Loading Issue**

The map is not loading because the Google Maps API key is missing. Here's how to fix it:

## 🔑 **Step 1: Get Google Maps API Key**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable these APIs**:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional, for future features)

4. **Create API Key**:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the generated key

## 🔧 **Step 2: Add API Key to Environment**

### **For Local Development:**
Create `.env.local` file in the `farm-frontend` directory:

```bash
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-FQ0B9L8MFE

# Site URL (for production)
NEXT_PUBLIC_SITE_URL=https://www.farmcompanion.co.uk
```

### **For Production (Vercel):**
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your API key

## 🔒 **Step 3: Secure Your API Key**

### **Restrict API Key (IMPORTANT):**
1. Go back to Google Cloud Console
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `*.farmcompanion.co.uk/*`
   - Add: `localhost:3000/*` (for development)

4. Under "API restrictions":
   - Select "Restrict key"
   - Select only: Maps JavaScript API, Geocoding API

## 🧪 **Step 4: Test**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Check the map page**: http://localhost:3000/map

3. **Look for errors in browser console** (F12)

## 🐛 **Common Issues & Solutions**

### **"API key not valid"**
- Check if API key is correct
- Ensure APIs are enabled in Google Cloud Console
- Check API key restrictions

### **"Quota exceeded"**
- Google Maps has free tier limits
- Check usage in Google Cloud Console
- Consider upgrading if needed

### **"Referrer not allowed"**
- Check HTTP referrer restrictions
- Add your domain to allowed referrers

### **Safari-specific issues**
- Safari has stricter security policies
- Check Safari's privacy settings
- Enable location services if needed

## 📊 **Monitoring**

### **Check API Usage:**
1. Google Cloud Console → APIs & Services → Dashboard
2. Monitor "Maps JavaScript API" usage
3. Set up billing alerts

### **Costs:**
- **Free tier**: $200/month credit
- **Maps JavaScript API**: $7 per 1000 loads
- **Geocoding API**: $5 per 1000 requests

## 🚀 **Deployment**

After adding the environment variable to Vercel:

1. **Redeploy**:
   ```bash
   vercel --prod
   ```

2. **Test production**: https://www.farmcompanion.co.uk/map

## 📞 **Support**

If you're still having issues:

1. Check browser console for specific error messages
2. Verify API key is correctly set in environment
3. Test with a simple HTML page first
4. Contact Google Cloud support if needed

---

**Note**: Never commit your actual API key to git. Always use environment variables!

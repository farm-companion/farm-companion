# Google Maps Setup Guide

## 🗺️ Getting Your Google Maps API Key

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing (required for Maps API)

### 2. Enable Required APIs
Enable these APIs in your Google Cloud Console:
- **Maps JavaScript API** (required for the map)
- **Places API** (optional, for enhanced features)

### 3. Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy your API key

### 4. Set Up Environment Variable
Create a `.env.local` file in the `farm-frontend` directory:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 5. Secure Your API Key (Recommended)
1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**, select **HTTP referrers**
4. Add your domain(s):
   - `http://localhost:3001/*` (for development)
   - `https://yourdomain.com/*` (for production)

### 6. Cost Information
- **Maps JavaScript API**: $7 per 1,000 map loads
- **Places API**: $17 per 1,000 requests
- **Free tier**: $200 credit per month

For a farm directory site, this typically costs **$5-20/month** depending on usage.

## 🚀 Quick Start

1. Get your API key from Google Cloud Console
2. Create `.env.local` with your API key
3. Restart your development server
4. The map should work immediately!

## 🔧 Troubleshooting

### "Google Maps API error: RefererNotAllowedMapError"
- Check your API key restrictions
- Make sure your domain is in the allowed referrers

### "Google Maps API error: ApiNotActivatedMapError"
- Enable the Maps JavaScript API in Google Cloud Console

### Map not loading
- Verify your API key is correct
- Check browser console for errors
- Ensure billing is enabled on your Google Cloud project

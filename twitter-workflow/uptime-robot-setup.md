# Uptime Robot Setup for Dual Posting

## Setup Instructions

1. **Create Account**: Go to [uptimerobot.com](https://uptimerobot.com) and create a free account

2. **Add HTTP Monitor**:
   - Click "Add New Monitor"
   - Select "HTTP(s)" type
   - URL: `https://your-vercel-app.vercel.app/api/cron/dual-farm-spotlight`
   - Monitoring Interval: 60 minutes
   - Add custom headers: `x-vercel-cron: 1`

3. **Create Two Monitors**:
   - **Morning Monitor**: Set to check at 10:00 AM UTC
   - **Evening Monitor**: Set to check at 7:00 PM UTC

## Benefits
- ✅ **Free tier available**
- ✅ **Reliable service**
- ✅ **No Vercel cron limits**
- ✅ **Easy to manage**

## Limitations
- ⚠️ **Free tier**: Limited to 50 monitors
- ⚠️ **Interval**: Minimum 5-minute intervals

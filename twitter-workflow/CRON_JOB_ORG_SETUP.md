# 🔧 Cron-job.org Setup Guide

## Code Changes Made

The endpoint has been updated to work with external cron services like cron-job.org:

### ✅ **What Changed:**
1. **Removed Vercel-only validation** - Now accepts external HTTP requests
2. **Added token-based security** - Uses query parameter for authorization
3. **Maintained backward compatibility** - Still works with Vercel cron if needed

### 🔐 **Security:**
- **Token Required**: Add `?token=YOUR_CRON_SECRET` to the URL
- **Environment Variable**: Set `CRON_SECRET` in your Vercel environment variables

## 🚀 **Cron-job.org Setup**

### **Step 1: Get Your CRON_SECRET**
1. Go to your Vercel dashboard
2. Go to your `twitter-workflow` project
3. Go to Settings → Environment Variables
4. Add: `CRON_SECRET` = `your-secure-random-string-here`
5. Redeploy your project

### **Step 2: Create Cron Jobs on cron-job.org**

**Morning Job:**
- **URL**: `https://twitter-workflow-347ctvaay-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=YOUR_CRON_SECRET`
- **Schedule**: `0 10 * * *` (10:00 AM UTC daily)
- **Method**: `GET`

**Evening Job:**
- **URL**: `https://twitter-workflow-347ctvaay-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=YOUR_CRON_SECRET`
- **Schedule**: `0 19 * * *` (7:00 PM UTC daily)
- **Method**: `GET`

### **Step 3: Test Your Setup**
1. Visit the URL in your browser with the token
2. You should see a JSON response
3. Check the cron-job.org logs for execution status

## 📋 **Example URLs**

Replace `YOUR_CRON_SECRET` with your actual secret:

```
https://twitter-workflow-347ctvaay-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=abc123def456
```

## 🧪 **Testing**

**Test the endpoint:**
```bash
# Test with curl
curl "https://twitter-workflow-347ctvaay-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=YOUR_CRON_SECRET"

# Expected response when not posting time:
# {"success":true,"message":"Not posting time",...}
```

## 🔍 **Troubleshooting**

**If you get "Unauthorized":**
- Check that `CRON_SECRET` is set in Vercel environment variables
- Verify the token in the URL matches your secret
- Redeploy after adding environment variables

**If posts don't appear:**
- Check cron-job.org logs
- Verify the schedule times (10:00 AM and 7:00 PM UTC)
- Check Vercel function logs for errors

---

**🎉 Your dual posting system is now ready for cron-job.org!**

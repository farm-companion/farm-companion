# 🔧 Manual Cron-job.org Setup

## Your API Key
```
/KG+kIyq34axG3s8WNZdR5gmybvGhhkqhV5t84axrLg=
```

## Step 1: Set CRON_SECRET in Vercel

1. Go to your Vercel dashboard
2. Go to `twitter-workflow` project → Settings → Environment Variables
3. Add: `CRON_SECRET` = `farm-companion-secure-2024`
4. Redeploy your project

## Step 2: Create Cron Jobs

### Morning Job (10:00 AM UTC)
**URL**: `https://twitter-workflow-g1mxjvgoo-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=farm-companion-secure-2024`

**Settings**:
- **Name**: `Farm Companion - Morning Post`
- **Schedule**: `0 10 * * *`
- **Method**: `GET`
- **Timeout**: `300` seconds
- **Save Responses**: `Yes`

### Evening Job (7:00 PM UTC)
**URL**: `https://twitter-workflow-g1mxjvgoo-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=farm-companion-secure-2024`

**Settings**:
- **Name**: `Farm Companion - Evening Post`
- **Schedule**: `0 19 * * *`
- **Method**: `GET`
- **Timeout**: `300` seconds
- **Save Responses**: `Yes`

## Step 3: Test Your Setup

Visit this URL in your browser to test:
```
https://twitter-workflow-g1mxjvgoo-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=farm-companion-secure-2024
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Not posting time",
  "workflowId": "dual-cron-2025-09-10",
  "currentTime": "19:30 UTC",
  "nextPostingTimes": {
    "morning": "10:00 UTC",
    "evening": "19:00 UTC"
  }
}
```

## Step 4: Monitor Your Jobs

1. Go to [cron-job.org](https://cron-job.org)
2. Login with your account
3. Check the "Logs" tab to see execution history
4. Look for `200 OK` responses

## 🎯 **Quick Setup Commands**

If you want to use the automated script:

```bash
# Install axios if not already installed
npm install axios

# Run the setup script
node setup-cron-jobs.js
```

**But first, make sure to:**
1. Set `CRON_SECRET=farm-companion-secure-2024` in Vercel
2. Update the script with your actual CRON_SECRET
3. Redeploy your Vercel project

---

**🎉 Your dual posting system will be fully automated once these cron jobs are set up!**

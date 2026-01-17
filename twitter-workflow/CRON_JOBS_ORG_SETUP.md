# 🕐 **Cron-Jobs.org Setup Guide - Dual Farm Spotlight System**

## 🎯 **Problem Identified**

The Twitter workflow is **working perfectly** but wasn't running automatically because **cron-jobs.org** needs to be configured to call the Vercel endpoint daily.

## ✅ **Current Status**

- **Vercel Deployment**: ✅ Working (https://twitter-workflow-43k7f7q50-abdur-rahman-morris-projects.vercel.app)
- **Health Check**: ✅ All systems operational
- **Cron Endpoint**: ✅ Working (tested successfully)
- **Manual Execution**: ✅ Posted real tweet successfully

## 🔧 **Cron-Jobs.org Configuration - DUAL SYSTEM**

### **Step 1: Access Cron-Jobs.org**
1. Go to: https://cron-jobs.org/
2. Log in to your account
3. Create **TWO** cron jobs (morning and evening)

### **Step 2: Configure Morning Cron Job**

**Job Details:**
- **Name**: `Farm Companion Morning Twitter Post`
- **Description**: `Morning farm spotlight automation for Twitter`

**Schedule:**
- **Cron Expression**: `0 10 * * *`
- **Time Zone**: `UTC`
- **Explanation**: 10:00 UTC = 11:00 Europe/London (BST) / 10:00 Europe/London (GMT)

**HTTP Request:**
- **Method**: `POST`
- **URL**: `https://twitter-workflow-43k7f7q50-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight`
- **Headers**:
  ```
  Content-Type: application/json
  x-vercel-cron: 1
  ```
- **Query Parameters**:
  ```
  token=2a78e16735b0af5612dc53dccd66384d563e0fcb78921b9f96d211abc95e4b95
  ```

### **Step 3: Configure Evening Cron Job**

**Job Details:**
- **Name**: `Farm Companion Evening Twitter Post`
- **Description**: `Evening farm spotlight automation for Twitter`

**Schedule:**
- **Cron Expression**: `0 19 * * *`
- **Time Zone**: `UTC`
- **Explanation**: 19:00 UTC = 20:00 Europe/London (BST) / 19:00 Europe/London (GMT)

**HTTP Request:**
- **Method**: `POST`
- **URL**: `https://twitter-workflow-43k7f7q50-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight`
- **Headers**:
  ```
  Content-Type: application/json
  x-vercel-cron: 1
  ```
- **Query Parameters**:
  ```
  token=2a78e16735b0af5612dc53dccd66384d563e0fcb78921b9f96d211abc95e4b95
  ```

### **Step 4: Test Configuration**

**Test URLs:**
```
Morning Test: https://twitter-workflow-43k7f7q50-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=2a78e16735b0af5612dc53dccd66384d563e0fcb78921b9f96d211abc95e4b95
Evening Test: https://twitter-workflow-43k7f7q50-abdur-rahman-morris-projects.vercel.app/api/cron/dual-farm-spotlight?token=2a78e16735b0af5612dc53dccd66384d563e0fcb78921b9f96d211abc95e4b95
```

**Expected Response (when not posting time):**
```json
{
  "success": true,
  "message": "Not posting time",
  "workflowId": "dual-cron-2025-09-15",
  "currentTime": "20:23 UTC",
  "nextPostingTimes": {
    "morning": "10:00 UTC",
    "evening": "19:00 UTC"
  },
  "timestamp": "2025-09-15T20:23:17.099Z"
}
```

**Expected Response (when posting time):**
```json
{
  "success": true,
  "message": "Dual farm spotlight posted successfully",
  "workflowId": "dual-cron-2025-09-15",
  "durationMs": 15000,
  "timestamp": "2025-09-15T10:00:00.000Z"
}
```

### **Step 5: Monitoring Setup**

**Success Indicators:**
- ✅ HTTP 200 response
- ✅ `"success": true` in response body
- ✅ Tweet posted to @FarmCompanion (2 tweets per day)
- ✅ Slack notification sent

**Failure Indicators:**
- ❌ HTTP 4xx/5xx response
- ❌ `"success": false` in response body
- ❌ No tweet posted
- ❌ Error notification in Slack

**Posting Schedule:**
- **Morning**: 10:00 UTC (11:00 Europe/London BST / 10:00 Europe/London GMT)
- **Evening**: 19:00 UTC (20:00 Europe/London BST / 19:00 Europe/London GMT)
- **Total**: 2 farm spotlights per day

## 📊 **Current System Status**

### **✅ Working Components**
1. **Vercel Deployment**: Latest deployment working
2. **Health Check**: All systems operational
3. **Twitter API**: Connected and authenticated
4. **Content Generation**: DeepSeek AI working
5. **Image Generation**: fal.ai FLUX working
6. **Multi-Platform**: Twitter, Bluesky, Telegram ready
7. **Monitoring**: Slack notifications configured
8. **Idempotency**: Redis-based (optional, soft skip if not configured)

### **📈 System Health**
```json
{
  "status": "success",
  "overall": "healthy",
  "components": {
    "farmData": { "status": "healthy", "totalFarms": 875 },
    "twitter": { "status": "healthy", "remaining": 300 },
    "contentGeneration": { "status": "healthy" }
  }
}
```

## 🚀 **Next Steps**

### **Immediate Action Required**
1. **Configure cron-jobs.org** with the TWO cron jobs above
2. **Test both cron jobs** to ensure they work
3. **Monitor tomorrow** at 10:00 UTC and 19:00 UTC for the first automatic posts

### **Monitoring Setup**
- **Health Check**: https://twitter-workflow-43k7f7q50-abdur-rahman-morris-projects.vercel.app/api/health
- **Twitter Account**: https://twitter.com/FarmCompanion
- **Slack Notifications**: Success/failure alerts configured

## 🔍 **Troubleshooting**

### **If Cron Job Fails**
1. Check cron-jobs.org logs
2. Verify the URL and token are correct
3. Check Vercel deployment status
4. Review Slack notifications for errors

### **If No Tweet Appears**
1. Check Twitter account: https://twitter.com/FarmCompanion
2. Verify cron job executed successfully
3. Check Vercel function logs
4. Review health check status

### **Manual Execution (Emergency)**
```bash
# Test locally
npm run test:complete

# Run live
node src/scripts/live-run.js
```

## 📝 **Important Notes**

- **Time Zone**: Cron job runs at 08:05 UTC = 09:05 Europe/London
- **Idempotency**: System prevents duplicate posts (max 2 per day)
- **Fallbacks**: Multiple image generation providers, error recovery
- **Monitoring**: Slack notifications for all success/failure events

---

**Status**: ✅ **READY FOR CRON-JOBS.ORG CONFIGURATION - DUAL SYSTEM**  
**Last Updated**: 2025-09-15  
**Next Expected Runs**: 
- Tomorrow at 10:00 UTC (11:00 Europe/London BST / 10:00 Europe/London GMT)
- Tomorrow at 19:00 UTC (20:00 Europe/London BST / 19:00 Europe/London GMT)

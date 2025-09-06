# 🚀 Twitter Workflow Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **1. Environment Variables Setup**

Create a `.env.local` file in your Vercel project with the following variables:

```bash
# Twitter API Configuration (Required for posting)
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret_here

# DeepSeek AI Configuration (Optional - fallback content available)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Farm Companion Configuration
FARM_DATA_URL=https://www.farmcompanion.co.uk/api/farms
FARM_BASE_URL=https://www.farmcompanion.co.uk

# Workflow Configuration
DRY_RUN_MODE=false
POSTING_ENABLED=true
CONTENT_GENERATION_ENABLED=true

# Monitoring & Alerts (Optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
CRON_SECRET=your_secure_cron_secret_here

# Timezone Configuration
TARGET_TIMEZONE=Europe/London
POSTING_TIME=09:05

# Content Configuration
MAX_TWEET_LENGTH=280
INCLUDE_IMAGES=true
MAX_IMAGES_PER_TWEET=1

# Maintenance Mode (Set to 'true' to disable posting)
MAINTENANCE_MODE=false
```

### **2. Twitter API Setup**

#### **Step 1: Create Twitter Developer Account**
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Apply for a developer account
3. Create a new app for your project

#### **Step 2: Generate API Keys**
1. In your Twitter app dashboard, go to "Keys and tokens"
2. Generate API Key and Secret
3. Generate Access Token and Secret
4. Ensure your app has "Read and Write" permissions

#### **Step 3: Configure Environment Variables**
```bash
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

### **3. DeepSeek AI Setup (Optional)**

#### **Step 1: Get DeepSeek API Key**
1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up for an account
3. Generate an API key

#### **Step 2: Configure Environment Variable**
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**Note**: If DeepSeek API is not configured, the system will use high-quality fallback content.

### **4. Slack Notifications Setup (Optional)**

#### **Step 1: Create Slack Webhook**
1. Go to your Slack workspace
2. Create a new app or use an existing one
3. Add "Incoming Webhooks" feature
4. Create a webhook URL

#### **Step 2: Configure Environment Variable**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## 🚀 **Deployment Steps**

### **Step 1: Deploy to Vercel**

1. **Connect your repository to Vercel**
   ```bash
   # If using Vercel CLI
   vercel --prod
   
   # Or connect via Vercel dashboard
   # Go to vercel.com, import your repository
   ```

2. **Configure environment variables in Vercel**
   - Go to your project settings in Vercel
   - Add all environment variables from the checklist above
   - Ensure `CRON_SECRET` is set to a secure random string

3. **Deploy the project**
   ```bash
   vercel --prod
   ```

### **Step 2: Configure Cron Job**

The cron job is automatically configured via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-farm-spotlight",
      "schedule": "5 8 * * *"
    }
  ]
}
```

**Schedule**: Daily at 08:05 UTC (09:05 Europe/London)

### **Step 3: Test the Deployment**

1. **Test the cron endpoint manually**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/cron/daily-farm-spotlight \
     -H "Authorization: Bearer your_cron_secret" \
     -H "Content-Type: application/json"
   ```

2. **Check the response**
   ```json
   {
     "success": true,
     "message": "Daily farm spotlight posted successfully",
     "workflowId": "cron-2025-09-06",
     "timestamp": "2025-09-06T09:05:00.000Z",
     "duration": 1500,
     "farm": "Green Valley Farm Shop",
     "location": "Devon",
     "tweetId": "1234567890123456789",
     "content": "What if your next meal could change everything? Green Valley Farm Shop in Devon serves fresh vegetables that taste like the future...",
     "metrics": {
       "farmIndex": 42,
       "totalFarms": 875,
       "contentLength": 245,
       "executionTime": 1
     }
   }
   ```

## 🔧 **Configuration Options**

### **Dry Run Mode**
Set `DRY_RUN_MODE=true` to test without posting to Twitter:
```bash
DRY_RUN_MODE=true
```

### **Maintenance Mode**
Set `MAINTENANCE_MODE=true` to temporarily disable posting:
```bash
MAINTENANCE_MODE=true
```

### **Content Generation**
Disable AI content generation to use only fallback content:
```bash
CONTENT_GENERATION_ENABLED=false
```

### **Posting Control**
Disable Twitter posting entirely:
```bash
POSTING_ENABLED=false
```

## 📊 **Monitoring & Alerts**

### **Success Notifications**
When a tweet is posted successfully, you'll receive a Slack notification:
```
✅ Daily Farm Spotlight Posted Successfully!

Farm: Green Valley Farm Shop
Location: Devon
Content: "What if your next meal could change everything? Green Valley Farm Shop in Devon serves fresh vegetables that taste like the future. Discover the difference. #FarmShop #LocalFood"
Tweet ID: 1234567890123456789
Workflow ID: cron-2025-09-06
```

### **Error Notifications**
When a tweet fails, you'll receive an error notification:
```
❌ Daily Farm Spotlight Failed!

Error: Twitter API rate limit exceeded
Workflow ID: cron-2025-09-06
Time: 2025-09-06T09:05:00.000Z
```

### **Health Monitoring**
Check the system health:
```bash
curl https://your-domain.vercel.app/api/cron/daily-farm-spotlight \
  -H "Authorization: Bearer your_cron_secret"
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Twitter API Errors**
- **Rate Limit Exceeded**: Wait for the rate limit to reset
- **Invalid Credentials**: Check your API keys and tokens
- **App Permissions**: Ensure your app has "Read and Write" permissions

#### **2. Content Generation Failures**
- **DeepSeek API Issues**: System will automatically use fallback content
- **Network Issues**: Check your internet connection and API endpoints

#### **3. Farm Data Issues**
- **API Unavailable**: Check if `FARM_DATA_URL` is accessible
- **No Farms Found**: Verify farm data is being loaded correctly

#### **4. Cron Job Issues**
- **Not Running**: Check Vercel cron job configuration
- **Authentication Failed**: Verify `CRON_SECRET` is set correctly

### **Debug Mode**
Enable debug logging by setting:
```bash
DEBUG=true
NODE_ENV=development
```

### **Manual Testing**
Test individual components:
```bash
# Test farm selection
curl https://your-domain.vercel.app/api/cron/daily-farm-spotlight \
  -H "Authorization: Bearer your_cron_secret" \
  -H "X-Test-Mode: farm-selection"

# Test content generation
curl https://your-domain.vercel.app/api/cron/daily-farm-spotlight \
  -H "Authorization: Bearer your_cron_secret" \
  -H "X-Test-Mode: content-generation"
```

## 📈 **Performance Optimization**

### **Caching**
- Farm data is cached for 24 hours
- Content generation results are cached
- Twitter API responses are cached

### **Rate Limiting**
- Twitter API rate limits are respected
- Automatic retry with exponential backoff
- Queue management for high-volume scenarios

### **Error Recovery**
- Automatic fallback to cached data
- Graceful degradation when APIs are unavailable
- Comprehensive error logging and monitoring

## 🔒 **Security**

### **API Security**
- Bearer token authentication for cron endpoints
- Environment variable protection
- Rate limiting and abuse prevention

### **Data Protection**
- No sensitive data in logs
- Secure credential storage
- API key rotation support

## 📞 **Support**

### **Getting Help**
1. Check the troubleshooting section above
2. Review the logs in Vercel dashboard
3. Test individual components
4. Contact the development team

### **Emergency Procedures**
1. **Disable Posting**: Set `MAINTENANCE_MODE=true`
2. **Enable Dry Run**: Set `DRY_RUN_MODE=true`
3. **Check Logs**: Review Vercel function logs
4. **Manual Override**: Use manual testing endpoints

---

**Your Twitter workflow is now ready for production! 🚀**

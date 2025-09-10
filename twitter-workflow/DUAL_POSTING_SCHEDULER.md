# 🕐 Dual Posting Scheduler System

## Overview

The dual posting scheduler automatically posts **2 farm spotlights per day** to **all 3 platforms** (Twitter/X, Bluesky, Telegram) at optimal engagement times:

- **🌅 Morning Post**: 10:00 AM GMT
- **🌆 Evening Post**: 7:00 PM GMT

## 🚀 Quick Start

### Production (Vercel Cron)
The system uses a single smart cron job that runs hourly and decides when to post:

```json
{
  "crons": [
    {
      "path": "/api/cron/dual-farm-spotlight",
      "schedule": "0 * * * *"
    }
  ]
}
```

**How it works:**
- Runs every hour at minute 0
- Only posts at exactly 10:00 AM and 7:00 PM UTC
- Skips all other hours (saves resources and respects Vercel limits)

### Local Testing
```bash
# Test the scheduler immediately (regardless of time)
npm run scheduler:test

# Run scheduler (will post if it's 10 AM or 7 PM GMT)
npm run scheduler

# Run scheduler in dry-run mode
npm run scheduler:dry-run

# Manual dual posting
npm start dual
```

## 📅 Schedule Details

### Posting Times
- **Morning**: 10:00 AM GMT (10:00 UTC)
- **Evening**: 7:00 PM GMT (19:00 UTC)
- **Frequency**: Daily
- **Platforms**: Twitter/X, Bluesky, Telegram
- **Posts per day**: 2 (one morning, one evening)

### Time Zone Handling
- All times are in **GMT/UTC**
- The system automatically detects the current time
- Posts are scheduled for optimal UK audience engagement

## 🏗️ System Architecture

### Components

1. **Vercel Cron Endpoint** (`/api/cron/dual-farm-spotlight`)
   - Handles production scheduling
   - Validates cron headers for security
   - Supports maintenance mode
   - Includes comprehensive error handling

2. **Local Scheduler** (`src/scripts/local-scheduler.js`)
   - For development and testing
   - Time-aware execution
   - Supports dry-run mode

3. **Workflow Orchestrator** (`executeDualDailySpotlight`)
   - Selects 2 different farms per day
   - Generates unique content for each farm
   - Posts to all 3 platforms
   - Handles idempotency and error recovery

### Idempotency System

The system prevents duplicate posting through:

- **Redis Counters**: Main workflow idempotency (2 posts per day)
- **Local File Counters**: Platform-specific limits (2 posts per day per platform)
- **Time Windows**: Posts only execute within ±1 hour of scheduled times

## 🎯 Farm Selection

### Algorithm
- **Deterministic**: Same farms selected for the same date
- **Fair Rotation**: All farms get equal exposure over time
- **Different Farms**: Morning and evening posts feature different farms
- **Quality Filtering**: Only verified farms with good content

### Selection Process
1. First farm: Standard date-based selection
2. Second farm: Offset by half the farm count to ensure variety
3. Fallback: If same farm selected, picks next in rotation

## 📊 Content Generation

### Per-Farm Content
- **Unique Content**: Each farm gets custom-generated content
- **Unique Images**: AI-generated images using fal.ai FLUX
- **Platform Optimization**: Content adapted for each platform
- **Ogilvy Style**: Apple/Ogilvy-inspired copy for maximum engagement

### Content Features
- **Compelling Hooks**: Attention-grabbing openings
- **Emotional Benefits**: Focus on experience over features
- **Clear CTAs**: Strong calls-to-action
- **Regional Relevance**: Location-specific hashtags and references

## 🔧 Configuration

### Environment Variables
```bash
# Required for posting
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Bluesky (optional)
BLUESKY_IDENTIFIER=your_bluesky_handle
BLUESKY_PASSWORD=your_bluesky_password

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Image Generation
FAL_KEY=your_fal_ai_api_key

# Workflow Control
POSTING_ENABLED=true
CONTENT_GENERATION_ENABLED=true
DRY_RUN_MODE=false

# Security
CRON_SECRET=your_secure_cron_secret
MAINTENANCE_MODE=false
```

### Vercel Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/dual-farm-spotlight",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Cron Schedule Explanation:**
- `0 * * * *` = Every hour at minute 0
- The endpoint checks the time and only posts at 10:00 AM and 7:00 PM UTC
- This uses only 1 cron job (respects Vercel free plan limits)

## 🧪 Testing

### Test Commands
```bash
# Test scheduler immediately
npm run scheduler:test

# Test dual posting
npm start dual

# Test in dry-run mode
npm start dual --dry-run

# Check system status
npm start status

# View farm schedule
npm start schedule 14
```

### Test Scenarios
1. **Time-based execution**: Verify posts only run at scheduled times
2. **Idempotency**: Ensure no duplicate posts
3. **Farm selection**: Verify different farms are selected
4. **Platform posting**: Confirm all 3 platforms receive posts
5. **Error handling**: Test failure scenarios and recovery

## 📈 Monitoring

### Success Metrics
- **Posting Success Rate**: % of successful posts per day
- **Platform Coverage**: Posts delivered to all 3 platforms
- **Content Quality**: Engagement metrics per post
- **Farm Rotation**: Fair distribution across all farms

### Error Handling
- **Automatic Retries**: Failed posts are retried with backoff
- **Fallback Content**: System continues with fallback content if AI fails
- **Platform Isolation**: One platform failure doesn't affect others
- **Comprehensive Logging**: Detailed logs for debugging

### Notifications
- **Success Alerts**: Slack notifications for successful posts
- **Failure Alerts**: Immediate notification of any failures
- **Daily Reports**: Summary of daily posting performance

## 🚀 Deployment

### Production Deployment
1. **Deploy to Vercel**: Push code to trigger automatic deployment
2. **Verify Cron Jobs**: Check Vercel dashboard for cron job status
3. **Test Endpoints**: Verify cron endpoints are accessible
4. **Monitor Logs**: Watch for successful executions

### Local Development
1. **Install Dependencies**: `npm install`
2. **Configure Environment**: Set up `.env.local` file
3. **Test Locally**: Use `npm run scheduler:test`
4. **Deploy**: Push to trigger Vercel deployment

## 🔍 Troubleshooting

### Common Issues

**Posts not appearing at scheduled times**
- Check Vercel cron job status
- Verify time zone settings (GMT/UTC)
- Check environment variables

**Platform posting failures**
- Verify API credentials for each platform
- Check rate limits and quotas
- Review platform-specific error logs

**Duplicate posts**
- Check idempotency system status
- Verify Redis connection
- Review local file counters

**Content generation failures**
- Check AI API keys (DeepSeek, fal.ai)
- Verify farm data availability
- Review content generation logs

### Debug Commands
```bash
# Check system status
npm start status

# Test individual components
npm run test:content
npm run test:images
npm run test:complete

# View detailed logs
npm start dual --dry-run
```

## 📚 Additional Resources

- **Main Workflow**: `src/lib/workflow-orchestrator.js`
- **Farm Selection**: `src/lib/farm-selector.js`
- **Platform Clients**: `src/lib/twitter-client.js`, `src/lib/bluesky-client.js`, `src/lib/telegram-client.js`
- **Cron Endpoint**: `src/api/cron/dual-farm-spotlight/route.js`
- **Local Scheduler**: `src/scripts/local-scheduler.js`

---

**🎉 The dual posting scheduler is now fully operational and will automatically post 2 farm spotlights per day to all 3 platforms at optimal engagement times!**

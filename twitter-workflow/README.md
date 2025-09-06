# 🐦 Twitter Workflow - Daily Farm Spotlights

A sophisticated Twitter/X automation system for Farm Companion that posts daily farm spotlights at 09:05 Europe/London time. Features AI-powered content generation using DeepSeek and Apple/Ogilvy-style engagement copy.

## 🎯 Overview

This workflow automatically:
1. **Selects a farm** for today's spotlight using a deterministic algorithm
2. **Generates engaging content** using DeepSeek AI with Apple/Ogilvy-style copywriting
3. **Posts to Twitter/X** with proper rate limiting and error handling
4. **Monitors and alerts** on success/failure via Slack notifications

## 🏗️ Architecture

```
twitter-workflow/
├── src/
│   ├── lib/
│   │   ├── twitter-client.js      # Twitter API v2 integration
│   │   ├── content-generator.js   # DeepSeek AI content generation
│   │   ├── farm-selector.js       # Deterministic farm selection
│   │   └── workflow-orchestrator.js # Main workflow coordination
│   ├── api/
│   │   └── cron/
│   │       └── daily-farm-spotlight/
│   │           └── route.js       # Vercel cron endpoint
│   ├── scripts/
│   │   ├── dry-run.js            # Test without posting
│   │   └── test-content-generation.js # Content generation tests
│   └── index.js                  # Main entry point
├── tests/                        # Test files
├── docs/                         # Documentation
└── package.json
```

## 🚀 Quick Start

### 1. Installation

```bash
cd twitter-workflow
npm install
```

### 2. Configuration

Copy the environment template:
```bash
cp env.example .env
```

Configure your environment variables:
```bash
# Twitter API Configuration
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret_here

# DeepSeek AI Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Workflow Configuration
DRY_RUN_MODE=false
POSTING_ENABLED=true
CONTENT_GENERATION_ENABLED=true
```

### 3. Testing

Test the complete workflow:
```bash
npm run test
```

Run a dry run (no actual posting):
```bash
npm run test:dry-run
```

Test content generation:
```bash
npm run test:content
```

### 4. Manual Execution

Run the daily spotlight workflow:
```bash
npm start
```

Run with specific options:
```bash
node src/index.js spotlight --dry-run --style apple-ogilvy --tone inspiring
```

## 📅 Scheduling

### Vercel Cron Configuration

Add to your `vercel.json`:
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

This runs daily at 08:05 UTC (09:05 Europe/London).

### Manual Cron Setup

For other hosting platforms, set up a cron job:
```bash
# Daily at 09:05 Europe/London (08:05 UTC)
5 8 * * * curl -X POST https://your-domain.com/api/cron/daily-farm-spotlight \
  -H "Authorization: Bearer your_cron_secret"
```

## 🎨 Content Generation

### Apple/Ogilvy Style Features

The content generator creates engaging copy inspired by Apple and Ogilvy advertising:

- **Compelling hooks** that grab attention
- **Emotional benefits** over feature lists
- **Simple, powerful language**
- **Clear calls-to-action**
- **Premium, authentic feel**

### Content Styles

- `apple-ogilvy` - Apple/Ogilvy inspired (default)
- `storytelling` - Narrative-driven content
- `conversational` - Friendly, approachable tone

### Content Tones

- `inspiring` - Uplifting and motivational
- `warm` - Welcoming and cozy
- `premium` - High-quality and exclusive
- `urgent` - Time-sensitive and FOMO-driven
- `educational` - Informative and discovery-focused

## 🏪 Farm Selection

### Deterministic Algorithm

Farms are selected using a date-based algorithm that ensures:
- **Fair rotation** through all farms
- **Consistent selection** for the same date
- **No repeats** within the same year
- **Quality filtering** (verified farms with good content)

### Selection Criteria

Farms must have:
- ✅ Basic information (name, location)
- ✅ Valid coordinates
- ✅ Content (story, description, or offerings)
- ✅ Minimum quality score (images, verification, ratings)

## 🛡️ Safety Features

### Dry Run Mode
Test the complete workflow without posting:
```bash
DRY_RUN_MODE=true npm start
```

### Content Validation
- Tweet length validation (280 character limit)
- Content quality checks
- Fallback content generation
- Error handling and recovery

### Rate Limiting
- Twitter API rate limit monitoring
- Automatic retry with exponential backoff
- Queue management for high-volume scenarios

### Monitoring
- Slack notifications for success/failure
- Detailed logging and error tracking
- Workflow status monitoring
- Performance metrics

## 📊 Monitoring & Alerts

### Slack Integration

Configure Slack webhook for notifications:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

Notifications include:
- ✅ Successful postings with farm details
- ❌ Error alerts with troubleshooting info
- 📊 Daily/weekly performance summaries

### Status Endpoints

Check workflow status:
```bash
node src/index.js status
```

View farm schedule:
```bash
node src/index.js schedule 14  # Next 14 days
```

## 🔧 Development

### Project Structure

- **`src/lib/`** - Core business logic
- **`src/api/`** - Vercel API endpoints
- **`src/scripts/`** - Utility scripts
- **`tests/`** - Test files
- **`docs/`** - Documentation

### Adding New Features

1. **Content Styles**: Add new styles in `content-generator.js`
2. **Farm Filters**: Modify selection criteria in `farm-selector.js`
3. **Notifications**: Extend notification system in `workflow-orchestrator.js`
4. **API Endpoints**: Add new endpoints in `src/api/`

### Testing

Run comprehensive tests:
```bash
npm test                    # All tests
npm run test:dry-run       # Dry run test
npm run test:content       # Content generation test
```

## 🚨 Troubleshooting

### Common Issues

**Twitter API Errors**
- Check API credentials and permissions
- Verify rate limits and quotas
- Ensure app has write permissions

**Content Generation Failures**
- Verify DeepSeek API key and quota
- Check network connectivity
- Review content generation prompts

**Farm Selection Issues**
- Verify farm data API endpoint
- Check data format and quality
- Review selection criteria

**Cron Job Failures**
- Verify Vercel cron configuration
- Check CRON_SECRET environment variable
- Review endpoint logs and errors

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true npm start
```

### Manual Testing

Test individual components:
```bash
# Test Twitter connection
node -e "import('./src/lib/twitter-client.js').then(m => m.twitterClient.testConnection())"

# Test content generation
node -e "import('./src/lib/content-generator.js').then(m => m.contentGenerator.testGeneration())"

# Test farm selection
node -e "import('./src/lib/farm-selector.js').then(m => m.farmSelector.testSelection())"
```

## 📈 Performance

### Expected Metrics

- **Content Generation**: 2-5 seconds
- **Twitter Posting**: 1-3 seconds
- **Total Workflow**: 5-10 seconds
- **Success Rate**: >95%

### Optimization

- **Caching**: Farm data cached for 24 hours
- **Rate Limiting**: Respects Twitter API limits
- **Error Recovery**: Automatic retries with backoff
- **Monitoring**: Real-time performance tracking

## 🔒 Security

### API Security
- Bearer token authentication for cron endpoints
- Environment variable protection
- Rate limiting and abuse prevention

### Data Protection
- No sensitive data in logs
- Secure credential storage
- API key rotation support

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🛠️ Operations Runbook

### Emergency Procedures

#### Pause the System Immediately
```bash
# Option 1: Disable posting via environment variable
POSTING_ENABLED=false

# Option 2: Enable maintenance mode
MAINTENANCE_MODE=true

# Option 3: Disable cron in Vercel dashboard
# Go to Vercel → Project → Functions → Cron Jobs → Disable
```

#### Dry Run Testing
```bash
# Test content generation without posting
DRY_RUN_MODE=true npm run test:dry-run

# Test complete workflow in dry run
DRY_RUN_MODE=true npm run test:complete
```

### Key Rotation

#### Rotate Twitter API Credentials
1. **Go to Twitter Developer Portal**
   - Navigate to your app settings
   - Go to "Keys and tokens" section
   - Regenerate API Key and Secret
   - Regenerate Access Token and Secret (with Read and Write permissions)

2. **Update Vercel Environment Variables**
   ```bash
   # In Vercel dashboard: Project → Settings → Environment Variables
   TWITTER_API_KEY=new_api_key
   TWITTER_API_SECRET=new_api_secret
   TWITTER_ACCESS_TOKEN=new_access_token
   TWITTER_ACCESS_TOKEN_SECRET=new_access_token_secret
   ```

3. **Test New Credentials**
   ```bash
   npm run test:complete
   ```

### Manual Operations

#### Re-run Today's Tweet
```bash
# Delete the idempotency key to allow re-posting
# In Upstash Redis dashboard, delete: fc:tweeted:YYYY-MM-DD:daily

# Or manually trigger the cron endpoint
curl -X POST "https://your-vercel-app.vercel.app/api/cron/daily-farm-spotlight?token=YOUR_CRON_SECRET"
```

#### Check System Status
```bash
# Health check endpoint
curl https://your-vercel-app.vercel.app/api/health

# Test farm selection
npm run test:content

# Test Twitter connection
node -e "import('./src/lib/twitter-client.js').then(m => m.twitterClient.testConnection())"
```

### Monitoring & Alerts

#### Slack Notifications
- **Success**: Posted tweet with farm name and tweet ID
- **Error**: Failed workflow with error details and duration
- **Skip**: Already posted today (idempotency)

#### Logs
- **Vercel Function Logs**: Check Vercel dashboard for execution logs
- **Twitter API Logs**: Monitor rate limits and API errors
- **Content Generation**: Check DeepSeek API usage and errors

### Troubleshooting

#### Common Issues

**403 Forbidden Error**
- Check Twitter app permissions (must be "Read and Write")
- Verify Access Token and Secret are regenerated after permission change
- Ensure tokens are not expired

**Content Generation Fails**
- Check DeepSeek API key validity
- Verify API quota and rate limits
- Fallback content will be used automatically

**Cron Not Triggering**
- Verify Vercel cron is enabled
- Check timezone settings (should be UTC)
- Verify x-vercel-cron header is present

**Double Posting**
- Check Upstash Redis connection
- Verify idempotency keys are being set
- Manual cleanup: delete `fc:tweeted:YYYY-MM-DD:daily` key

### Rollback Procedures

#### Rollback to Previous Version
```bash
# In Vercel dashboard
# Go to Deployments → Select previous deployment → Promote to Production
```

#### Disable System Completely
```bash
# Set all these environment variables in Vercel
POSTING_ENABLED=false
MAINTENANCE_MODE=true
CONTENT_GENERATION_ENABLED=false
```

### Performance Monitoring

#### Key Metrics
- **Execution Time**: Should be < 30 seconds
- **Success Rate**: Target 99%+ uptime
- **Content Quality**: Monitor engagement metrics
- **API Usage**: Track Twitter and DeepSeek API consumption

#### Health Checks
```bash
# Daily health check script
curl -f https://your-vercel-app.vercel.app/api/health || echo "Health check failed"
```

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the logs and error messages
- Test individual components
- Contact the development team

---

**Built with ❤️ for Farm Companion**

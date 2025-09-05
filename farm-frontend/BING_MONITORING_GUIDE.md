# Bing IndexNow Monitoring Guide

This guide provides comprehensive monitoring and verification procedures for the Bing IndexNow system.

## 🔍 Monitoring Endpoints

### Health Check Endpoint
- **URL**: `https://www.farmcompanion.co.uk/api/health/bing-indexnow`
- **Purpose**: Comprehensive health check of the entire Bing IndexNow system
- **Frequency**: Weekly (automated) + manual checks
- **Checks**:
  - Environment variables configuration
  - Sitemap accessibility
  - IndexNow API connectivity
  - Internal API endpoints
  - Sitemap chunks accessibility

### Status Dashboard
- **URL**: `https://www.farmcompanion.co.uk/api/monitoring/bing-status`
- **Purpose**: Overview of system status and statistics
- **Information**:
  - Configuration status
  - Sitemap statistics
  - Farm and content counts
  - System health metrics

### Bot Activity Monitoring
- **URL**: `https://www.farmcompanion.co.uk/api/monitoring/bot-activity`
- **Purpose**: Track search engine bot activity
- **Usage**: Call with bot user agents to verify accessibility

## 📊 Bing Webmaster Tools Verification

### 1. Coverage Report
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Navigate to **Reports & Data** → **Index Explorer**
3. Check for:
   - New farm pages showing as "Indexed"
   - Updated pages reflecting recent changes
   - No unexpected "Blocked" or "Error" statuses

### 2. URL Inspection
1. Use **URL Inspection** tool for sample farm pages
2. Verify:
   - Pages are accessible to Bing
   - No crawl blocks or redirects
   - Correct mobile rendering
   - Proper canonical URLs

### 3. Sitemap Submission
1. Check **Sitemaps** section
2. Verify:
   - Main sitemap is submitted and processed
   - Child sitemaps are discovered and indexed
   - No submission errors

## 🤖 Bot Visibility Monitoring

### Server Logs Analysis
Monitor your server logs for bot activity:

```bash
# Look for Bing bot activity
grep -i "bingbot\|msnbot" /var/log/nginx/access.log

# Check for successful crawls
grep -E "200.*bingbot|200.*msnbot" /var/log/nginx/access.log
```

### Key Metrics to Track
- **Crawl Frequency**: How often Bing bots visit
- **Success Rate**: Percentage of successful 200 responses
- **Crawl Depth**: Which pages are being crawled
- **Error Rate**: Any 4xx/5xx responses to bots

### Cloudflare Considerations
If using Cloudflare, ensure:
- Bot Fight Mode is disabled
- WAF rules don't block legitimate bots
- Rate limiting doesn't affect search engines
- Browser Integrity Check is configured appropriately

## 🔧 Automated Monitoring

### GitHub Actions Workflow
- **File**: `.github/workflows/bing-indexnow-monitoring.yml`
- **Schedule**: Weekly (Mondays at 9 AM UTC)
- **Tests**:
  - Health check endpoint
  - IndexNow ping functionality
  - Sitemap structure validation
  - Bot accessibility verification

### Slack Notifications
Configure Slack webhook for alerts:
1. Set `SLACK_WEBHOOK_URL` in GitHub Secrets
2. Alerts sent to `#alerts` channel on failures
3. Success notifications to `#monitoring` channel

### Manual Testing Commands

```bash
# Test health check
curl -s https://www.farmcompanion.co.uk/api/health/bing-indexnow | jq '.'

# Test IndexNow ping (requires token)
curl -X POST https://www.farmcompanion.co.uk/api/bing/ping \
  -H "x-internal-token: YOUR_TOKEN"

# Test bot accessibility
curl -H "User-Agent: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  https://www.farmcompanion.co.uk/

# Check sitemap structure
curl -s https://www.farmcompanion.co.uk/sitemap.xml | head -20
```

## 📈 Performance Metrics

### Expected Response Times
- Health check: < 10 seconds
- IndexNow ping: < 5 seconds
- Sitemap generation: < 30 seconds
- Bot page access: < 2 seconds

### Success Criteria
- ✅ Health checks return 200 status
- ✅ IndexNow pings succeed without errors
- ✅ Sitemaps are accessible and well-formed
- ✅ New content appears in Bing within 24-48 hours
- ✅ Bot crawl success rate > 95%

## 🚨 Troubleshooting

### Common Issues

#### Health Check Failures
1. **Environment Variables**: Verify `INDEXNOW_INTERNAL_TOKEN` and `BING_INDEXNOW_KEY` are set
2. **Sitemap Access**: Check if sitemap URLs are accessible
3. **API Connectivity**: Verify IndexNow API is reachable

#### Indexing Delays
1. **Check Bing Webmaster Tools**: Look for crawl errors or blocks
2. **Verify Sitemap**: Ensure new URLs are in sitemap
3. **Review Robots.txt**: Confirm no blocking rules
4. **Check Page Content**: Ensure pages have proper meta tags

#### Bot Access Issues
1. **Cloudflare Settings**: Disable Bot Fight Mode
2. **Server Configuration**: Check for bot-specific blocks
3. **Rate Limiting**: Ensure bots aren't rate-limited
4. **SSL Issues**: Verify HTTPS is working properly

### Escalation Procedures
1. **Immediate**: Check health endpoint and logs
2. **Within 1 hour**: Verify configuration and test manually
3. **Within 4 hours**: Check Bing Webmaster Tools for issues
4. **Within 24 hours**: Contact support if issues persist

## 📋 Weekly Checklist

- [ ] Review health check results
- [ ] Check Bing Webmaster Tools coverage report
- [ ] Verify new content is being indexed
- [ ] Review bot crawl logs
- [ ] Test IndexNow ping functionality
- [ ] Validate sitemap structure
- [ ] Check for any error alerts

## 🔗 Useful Links

- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [IndexNow Documentation](https://www.bing.com/indexnow)
- [Bing Bot User Agents](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [GitHub Actions Monitoring](https://github.com/farm-companion/farm-frontend/actions)

## 📞 Support Contacts

- **Technical Issues**: Check GitHub Issues
- **Bing-Specific**: Use Bing Webmaster Tools support
- **Infrastructure**: Vercel support for deployment issues

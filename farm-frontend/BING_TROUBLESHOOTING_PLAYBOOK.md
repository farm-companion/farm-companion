# Bing IndexNow Troubleshooting Playbook

This playbook provides systematic troubleshooting procedures for Bing IndexNow and indexing issues.

## 🚨 Quick Diagnostic Tools

### URL Indexing Diagnostic
- **Endpoint**: `POST /api/diagnostics/url-indexing`
- **Purpose**: Comprehensive URL indexing verification
- **Usage**: Submit a URL to check accessibility, sitemap presence, and IndexNow submission

```bash
curl -X POST https://www.farmcompanion.co.uk/api/diagnostics/url-indexing \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.farmcompanion.co.uk/shop/example-farm"}'
```

### IndexNow Error Diagnostic
- **Endpoint**: `POST /api/diagnostics/indexnow-errors`
- **Purpose**: Diagnose IndexNow POST errors
- **Usage**: Submit error response and URL for analysis

```bash
curl -X POST https://www.farmcompanion.co.uk/api/diagnostics/indexnow-errors \
  -H "Content-Type: application/json" \
  -d '{"errorResponse": "400 Bad Request", "submittedUrl": "https://www.farmcompanion.co.uk/shop/example-farm"}'
```

### Bot Blocking Diagnostic
- **Endpoint**: `POST /api/diagnostics/bot-blocking`
- **Purpose**: Detect and diagnose bot blocking issues
- **Usage**: Test bot accessibility and identify blocking causes

```bash
curl -X POST https://www.farmcompanion.co.uk/api/diagnostics/bot-blocking \
  -H "Content-Type: application/json" \
  -d '{"testUrl": "https://www.farmcompanion.co.uk/"}'
```

## 🔍 Troubleshooting Procedures

### Issue 1: URL Not Indexed

#### Step 1: Verify URL Accessibility
**Check**: URL returns 200 status to Bingbot with no geoblocking

```bash
# Test with Bingbot user agent
curl -H "User-Agent: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  https://www.farmcompanion.co.uk/shop/example-farm

# Expected: HTTP 200 response
# If 3xx: Check redirects and canonical URLs
# If 4xx: Fix page errors or access issues
# If 5xx: Check server status
```

**Common Issues:**
- ❌ **Redirects (3xx)**: Use canonical URLs or fix redirect chains
- ❌ **Not Found (404)**: Verify page exists and URL is correct
- ❌ **Forbidden (403)**: Check access permissions and bot blocking
- ❌ **Server Error (5xx)**: Check server status and logs

#### Step 2: Verify Sitemap Presence
**Check**: URL appears in sitemap child and child is linked from `/sitemap.xml`

```bash
# Check main sitemap
curl -s https://www.farmcompanion.co.uk/sitemap.xml | grep -i "example-farm"

# Check sitemap chunks
curl -s https://www.farmcompanion.co.uk/sitemaps/farms-1.xml | grep -i "example-farm"
```

**Common Issues:**
- ❌ **Not in sitemap**: Add URL to appropriate sitemap chunk
- ❌ **Sitemap not accessible**: Check sitemap generation and server status
- ❌ **Wrong sitemap chunk**: Verify URL is in correct sitemap file

#### Step 3: Submit via IndexNow
**Action**: Submit URL via `/api/bing/submit` and monitor Webmaster Tools

```bash
# Submit URL to IndexNow
curl -X POST https://www.farmcompanion.co.uk/api/bing/submit \
  -H "Content-Type: application/json" \
  -H "x-internal-token: YOUR_TOKEN" \
  -d '{"url": "https://www.farmcompanion.co.uk/shop/example-farm"}'

# Monitor in Bing Webmaster Tools for 24-48 hours
```

**Monitoring Steps:**
1. Check Bing Webmaster Tools → URL Inspection
2. Monitor crawl logs for bingbot activity
3. Verify indexing status changes
4. Check for crawl errors or blocks

### Issue 2: IndexNow POST Returns Error

#### Check 1: Public Key File
**Verify**: Public key file is reachable and matches `BING_INDEXNOW_KEY`

```bash
# Check key file accessibility
curl -s https://www.farmcompanion.co.uk/YOUR_KEY.txt

# Expected: Returns the same value as BING_INDEXNOW_KEY
# If 404: Key file missing from public directory
# If wrong content: Key file content doesn't match environment variable
```

**Resolution:**
- Ensure key file exists in `public/` directory
- Verify file content matches `BING_INDEXNOW_KEY` exactly
- Check file permissions and server configuration

#### Check 2: Host Validation
**Verify**: Host in JSON matches site's actual host

```bash
# Check current host configuration
echo $SITE_URL
# Expected: https://www.farmcompanion.co.uk

# Verify IndexNow payload uses correct host
# Should be: "host": "www.farmcompanion.co.uk"
```

**Resolution:**
- Ensure `SITE_URL` environment variable is correct
- Verify IndexNow payload uses `www.farmcompanion.co.uk` as host
- Check for trailing slashes or protocol mismatches

#### Check 3: URL List Validation
**Verify**: JSON includes valid absolute URLs for correct host

```bash
# Test URL validation
curl -X POST https://www.farmcompanion.co.uk/api/diagnostics/indexnow-errors \
  -H "Content-Type: application/json" \
  -d '{"submittedUrl": "https://www.farmcompanion.co.uk/shop/example-farm"}'
```

**Common Issues:**
- ❌ **Relative URLs**: Use absolute HTTPS URLs
- ❌ **Wrong host**: URLs must be for `www.farmcompanion.co.uk`
- ❌ **Invalid format**: Ensure URLs are properly formatted
- ❌ **Rate limiting**: Check submission frequency (max 10,000/day)

### Issue 3: Bingbot Blocked Sporadically

#### Check 1: CDN Configuration
**Review**: Cloudflare or other CDN settings

**Cloudflare Settings:**
- ❌ **Bot Fight Mode**: Disable for search engines
- ❌ **Browser Integrity Check**: Configure appropriately
- ❌ **Rate Limiting**: Adjust for search engines
- ❌ **WAF Rules**: Review for bot blocking

**Resolution:**
```bash
# Test bot access
curl -H "User-Agent: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  https://www.farmcompanion.co.uk/

# Expected: HTTP 200, no challenge pages
# If 403/503: CDN blocking detected
```

#### Check 2: Server Firewall Rules
**Review**: Host firewall and server-level blocking

**Common Issues:**
- ❌ **IP-based blocking**: Search engines use dynamic IPs
- ❌ **User agent blocking**: Some firewalls block bot user agents
- ❌ **Rate limiting**: Server-level rate limits affecting bots
- ❌ **Geoblocking**: Regional restrictions affecting search engines

**Resolution:**
- Whitelist search engine IP ranges
- Allow bot user agents explicitly
- Adjust rate limiting for search engines
- Disable geoblocking for search engines

#### Check 3: Bot User Agent Allowlist
**Configure**: Explicit allows for bingbot and msnbot

**User Agents to Allow:**
```
Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)
Mozilla/5.0 (compatible; msnbot/2.0b; +http://search.msn.com/msnbot.htm)
```

**IP Ranges to Consider:**
- Microsoft/Bing IP ranges (check Bing documentation)
- Use reverse DNS verification for bot IPs
- Monitor for IP range changes

## 📊 Monitoring and Verification

### Health Check Endpoints
- **System Health**: `GET /api/health/bing-indexnow`
- **Status Dashboard**: `GET /api/monitoring/bing-status`
- **Bot Activity**: `GET /api/monitoring/bot-activity`

### Automated Monitoring
- **GitHub Actions**: Weekly health checks with Slack notifications
- **Vercel Cron**: Daily sitemap ping to Bing
- **Log Monitoring**: Track bot access patterns and errors

### Manual Verification Steps
1. **Weekly**: Check health endpoint status
2. **After Changes**: Test URL indexing diagnostic
3. **When Issues**: Use specific diagnostic tools
4. **Monthly**: Review Bing Webmaster Tools reports

## 🚨 Emergency Procedures

### Critical Issues
1. **Site Completely Blocked**: Check CDN and firewall settings immediately
2. **IndexNow API Down**: Verify Bing service status and API keys
3. **Sitemap Inaccessible**: Check server status and sitemap generation
4. **Mass Indexing Failures**: Review recent changes and rollback if needed

### Escalation Path
1. **Immediate**: Check health endpoints and logs
2. **Within 1 hour**: Use diagnostic tools and fix issues
3. **Within 4 hours**: Check Bing Webmaster Tools and contact support
4. **Within 24 hours**: Review and update monitoring systems

## 📋 Troubleshooting Checklist

### Before Reporting Issues
- [ ] Check health endpoint status
- [ ] Verify URL accessibility with bot user agent
- [ ] Confirm URL is in sitemap
- [ ] Test IndexNow submission
- [ ] Review server logs for errors
- [ ] Check Bing Webmaster Tools status

### Common Solutions
- [ ] Restart services if needed
- [ ] Clear CDN cache
- [ ] Update firewall rules
- [ ] Regenerate sitemaps
- [ ] Resubmit URLs to IndexNow
- [ ] Contact hosting provider if needed

## 🔗 Useful Resources

- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [IndexNow Documentation](https://www.bing.com/indexnow)
- [Bing Bot User Agents](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0)
- [Cloudflare Bot Management](https://developers.cloudflare.com/bots/)
- [Search Engine IP Ranges](https://support.google.com/webmasters/answer/80553)

## 📞 Support Contacts

- **Technical Issues**: GitHub Issues
- **Bing-Specific**: Bing Webmaster Tools support
- **Infrastructure**: Vercel support
- **CDN Issues**: Cloudflare support

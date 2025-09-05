# Bing IndexNow Operational Policy

This document defines the operational policies and procedures for maintaining optimal Bing search engine indexing through automated IndexNow notifications.

## 🎯 Core Policy

**Any publish, unpublish, slug change, or canonical change triggers `/api/bing/submit` for only the changed URLs and their parent category pages if applicable.**

## 📋 Content Change Triggers

### Automatic Triggers

The following content changes automatically trigger Bing IndexNow notifications:

#### 1. Farm Content Changes
- **Publish**: New farm approved and moved to live → Notify farm URL + county page + shop page
- **Unpublish**: Farm removed or deactivated → Notify farm URL for removal
- **Slug Change**: Farm slug updated → Notify old URL + new URL + parent pages
- **Content Update**: Farm details modified → Notify farm URL
- **Photo Approval**: Photo approved for farm → Notify farm URL
- **Photo Rejection**: Photo rejected → Notify farm URL

#### 2. Produce Content Changes
- **Publish**: New produce page created → Notify produce URL + seasonal page
- **Update**: Produce information modified → Notify produce URL
- **Slug Change**: Produce slug updated → Notify old + new URLs + seasonal page

#### 3. County Content Changes
- **Publish**: New county page created → Notify county URL + counties page
- **Update**: County information modified → Notify county URL
- **Slug Change**: County slug updated → Notify old + new URLs + counties page

#### 4. Core Page Changes
- **Update**: Core page content modified → Notify page URL
- **Canonical Change**: Canonical URL changed → Notify both URLs

### Parent Page Notifications

When content changes, the following parent pages are also notified:

| Content Type | Parent Pages Notified |
|--------------|----------------------|
| Farm Pages | County page, Main shop page |
| Produce Pages | Main seasonal page |
| County Pages | Main counties page |
| Core Pages | None (standalone pages) |

## 🔧 Implementation Details

### Content Change Tracking

All content changes are tracked through the `trackContentChange()` function:

```typescript
import { trackContentChange, createFarmChangeEvent } from '@/lib/content-change-tracker'

// Example: Farm published
const changeEvent = createFarmChangeEvent('publish', farmSlug, undefined, county)
await trackContentChange(changeEvent)
```

### Change Event Types

```typescript
type ContentChangeType = 
  | 'publish'           // New content published
  | 'unpublish'         // Content removed
  | 'slug_change'       // URL slug changed
  | 'canonical_change'  // Canonical URL changed
  | 'content_update'    // Content modified
  | 'photo_approval'    // Photo approved
  | 'photo_rejection'   // Photo rejected
```

### URL Validation

All URLs are validated before submission:
- Must be absolute HTTPS URLs
- Must be for `www.farmcompanion.co.uk` domain
- Must be properly formatted

## 📊 Definition of Done

### For Content Changes

Every content change PR must include these three checks:

#### 1. Sitemap Verification ✅
- [ ] Changed URL is present in the correct sitemap chunk
- [ ] Core pages: `/sitemaps/core-pages.xml`
- [ ] Farm pages: `/sitemaps/farms-*.xml`
- [ ] Produce pages: `/sitemaps/produce-pages.xml`
- [ ] County pages: `/sitemaps/counties-*.xml`

#### 2. Production Accessibility ✅
- [ ] Page renders with HTTP 200 on production
- [ ] Test URL: `https://www.farmcompanion.co.uk/[your-page-path]`
- [ ] No redirects, 404s, or server errors
- [ ] Page loads correctly with all content

#### 3. IndexNow Integration ✅
- [ ] Post-deploy job calls `/api/bing/submit` for the URL
- [ ] Content change tracking implemented
- [ ] Appropriate trigger added (publish, update, etc.)
- [ ] Parent category pages included if applicable

### PR Checklist

Use the GitHub PR template (`.github/PULL_REQUEST_TEMPLATE.md`) to ensure all requirements are met:

- [ ] **Sitemap Verification**: URL present in correct sitemap chunk
- [ ] **Production Accessibility**: Page renders with HTTP 200
- [ ] **IndexNow Integration**: Content change tracking implemented
- [ ] **Manual Testing**: Functionality tested locally
- [ ] **Automated Checks**: Tests, linting, and build pass

## 🔍 Quarterly Audit Process

### Automated Quarterly Audit

A quarterly audit runs automatically on:
- January 1st at 9 AM UTC
- April 1st at 9 AM UTC  
- July 1st at 9 AM UTC
- October 1st at 9 AM UTC

### Audit Process

1. **Export Database URLs**: Extract all farm URLs from database
2. **Extract Sitemap URLs**: Get URLs from all sitemap chunks
3. **Compare Sets**: Identify missing and extra URLs
4. **Submit Missing URLs**: Send missing URLs to IndexNow in batches
5. **Generate Report**: Create detailed audit report

### Manual Audit Trigger

Admins can trigger manual audits via:
```bash
curl -X POST https://www.farmcompanion.co.uk/api/admin/audit/sitemap-reconciliation \
  -u "admin@example.com:password"
```

### Audit Results

The audit provides:
- **Drift Detection**: Missing or extra URLs identified
- **Batch Submission**: Missing URLs submitted to IndexNow
- **Detailed Report**: Comprehensive analysis and recommendations
- **Slack Notifications**: Alerts for drift detection or failures

## 🚨 Monitoring and Alerts

### Health Monitoring

- **Weekly Health Checks**: Automated via GitHub Actions
- **Real-time Diagnostics**: API endpoints for immediate troubleshooting
- **Bot Activity Tracking**: Monitor search engine crawl activity

### Alert Conditions

- **Drift Detected**: Missing or extra URLs in quarterly audit
- **Health Check Failures**: System health endpoint failures
- **IndexNow Errors**: API submission failures
- **Bot Blocking**: Search engine accessibility issues

### Escalation Procedures

1. **Immediate**: Check health endpoints and logs
2. **Within 1 hour**: Use diagnostic tools and fix issues
3. **Within 4 hours**: Check Bing Webmaster Tools and contact support
4. **Within 24 hours**: Review and update monitoring systems

## 📈 Performance Metrics

### Expected Results

- **Indexing Speed**: New content indexed within 24-48 hours
- **Health Check Response**: < 10 seconds
- **IndexNow Submission**: < 5 seconds
- **Sitemap Generation**: < 30 seconds
- **Bot Accessibility**: > 95% success rate

### Success Criteria

- ✅ **No Drift**: Quarterly audits show perfect synchronization
- ✅ **Fast Indexing**: New content appears in search within 48 hours
- ✅ **High Availability**: Health checks pass consistently
- ✅ **Automated Management**: No manual intervention required

## 🔧 Troubleshooting

### Common Issues

1. **URL Not Indexed**: Use URL indexing diagnostic tool
2. **IndexNow Errors**: Use IndexNow error diagnostic tool
3. **Bot Blocking**: Use bot blocking diagnostic tool
4. **Sitemap Drift**: Run quarterly audit manually

### Diagnostic Tools

- **URL Indexing**: `POST /api/diagnostics/url-indexing`
- **IndexNow Errors**: `POST /api/diagnostics/indexnow-errors`
- **Bot Blocking**: `POST /api/diagnostics/bot-blocking`
- **System Health**: `GET /api/health/bing-indexnow`

### Emergency Procedures

1. **Check Health**: Run health check endpoint
2. **Verify Configuration**: Check environment variables
3. **Test Manually**: Use diagnostic tools
4. **Review Logs**: Check server logs for errors
5. **Contact Support**: Escalate if issues persist

## 📚 Documentation

### User Guides
- **BING_INDEXING_GUIDE.md**: Complete setup and configuration
- **BING_MONITORING_GUIDE.md**: Monitoring and maintenance
- **BING_TROUBLESHOOTING_PLAYBOOK.md**: Systematic troubleshooting

### API Documentation
- **Health Check Endpoints**: System status and diagnostics
- **Diagnostic Tools**: Issue identification and resolution
- **Monitoring APIs**: Performance tracking and alerts

## ✅ Compliance Checklist

### Development Team
- [ ] All content changes include IndexNow triggers
- [ ] PR checklist completed for content changes
- [ ] Sitemap integration verified
- [ ] Production accessibility confirmed

### Operations Team
- [ ] Quarterly audits scheduled and monitored
- [ ] Health checks configured and alerting
- [ ] Diagnostic tools accessible and documented
- [ ] Emergency procedures tested and ready

### Management
- [ ] Performance metrics tracked and reported
- [ ] Success criteria defined and measured
- [ ] Escalation procedures documented
- [ ] Regular reviews scheduled

---

**Policy Version**: 1.0  
**Last Updated**: September 2025  
**Next Review**: December 2025

# Pull Request Template

## 📋 Content Change Checklist

### For Content Changes (New/Updated Pages, Farms, Produce, etc.)

- [ ] **Sitemap Verification**: Changed URL is present in the correct sitemap chunk
  - [ ] Core pages: `/sitemaps/core-pages.xml`
  - [ ] Farm pages: `/sitemaps/farms-*.xml`
  - [ ] Produce pages: `/sitemaps/produce-pages.xml`
  - [ ] County pages: `/sitemaps/counties-*.xml`

- [ ] **Production Accessibility**: Page renders with HTTP 200 on production
  - [ ] Test URL: `https://www.farmcompanion.co.uk/[your-page-path]`
  - [ ] No redirects, 404s, or server errors
  - [ ] Page loads correctly with all content

- [ ] **IndexNow Integration**: Post-deploy job calls `/api/bing/submit` for the URL
  - [ ] Content change tracking implemented
  - [ ] Appropriate trigger added (publish, update, etc.)
  - [ ] Parent category pages included if applicable

### For Code Changes

- [ ] **No Breaking Changes**: Existing functionality remains intact
- [ ] **Error Handling**: Proper error handling and logging
- [ ] **Security**: No sensitive data exposed
- [ ] **Performance**: No significant performance impact

## 🔍 Pre-Deploy Verification

### Manual Testing
- [ ] Test the changed functionality locally
- [ ] Verify sitemap generation includes new URLs
- [ ] Check that IndexNow notifications are triggered
- [ ] Confirm no console errors or warnings

### Automated Checks
- [ ] All tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Build completes successfully

## 📊 Post-Deploy Verification

### Immediate Checks (within 1 hour)
- [ ] **Production URL Test**: Verify page is accessible on production
- [ ] **Sitemap Check**: Confirm URL appears in correct sitemap chunk
- [ ] **IndexNow Test**: Verify content change tracking works
- [ ] **Health Check**: Run `/api/health/bing-indexnow` to ensure system health

### Monitoring (within 24 hours)
- [ ] **Bing Webmaster Tools**: Check URL appears in indexing reports
- [ ] **Server Logs**: Verify no errors in content change tracking
- [ ] **Bot Activity**: Monitor for bingbot crawl activity

## 🚨 Emergency Procedures

If any post-deploy checks fail:

1. **Immediate**: Check production URL accessibility
2. **Within 30 minutes**: Verify sitemap and IndexNow integration
3. **Within 2 hours**: Check Bing Webmaster Tools for issues
4. **Within 24 hours**: Review and fix any indexing problems

## 📝 Additional Notes

### Content Change Types
- **Publish**: New content published → Notify URL + parent pages
- **Unpublish**: Content removed → Notify URL for removal
- **Slug Change**: URL changed → Notify old + new URLs + parent pages
- **Canonical Change**: Canonical URL changed → Notify both URLs
- **Content Update**: Content modified → Notify URL
- **Photo Approval/Rejection**: Photo changes → Notify farm page

### Parent Page Notifications
When content changes, also notify relevant parent pages:
- **Farm pages**: Notify county page + main shop page
- **Produce pages**: Notify main seasonal page
- **County pages**: Notify main counties page

### Troubleshooting Resources
- **Health Check**: `/api/health/bing-indexnow`
- **URL Diagnostics**: `/api/diagnostics/url-indexing`
- **Bot Blocking Check**: `/api/diagnostics/bot-blocking`
- **Troubleshooting Guide**: `BING_TROUBLESHOOTING_PLAYBOOK.md`

---

**Reviewer Checklist:**
- [ ] All content change requirements met
- [ ] Sitemap integration verified
- [ ] IndexNow triggers implemented
- [ ] No breaking changes introduced
- [ ] Documentation updated if needed

# Deployment Readiness Checklist
**Farm Companion - Production Deployment Guide**

This document provides a step-by-step checklist for deploying Farm Companion to production with confidence.

---

## 🎯 Pre-Deployment Verification (Do This First)

### 1. Database Constraints Application ⚡ CRITICAL
**Estimated Time:** 5 minutes
**Why:** Enforces data integrity at database level

```bash
# Step 1: Validate existing data complies with constraints
cd farm-frontend
npx tsx scripts/validate-constraints.ts

# Expected output: "✅ All data is valid! Safe to apply CHECK constraints migration."
# If any issues found, fix them before proceeding

# Step 2: Apply the migration
npx prisma migrate deploy

# Step 3: Verify constraints are active
# Run this SQL in Supabase SQL Editor:
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text IN ('farms', 'images', 'reviews', 'blog_posts')
ORDER BY conrelid::regclass, conname;

# Expected: 8 constraints (4 farms, 1 images, 2 reviews, 1 blog_posts)
```

**Rollback Plan:** If issues occur, see `/farm-frontend/prisma/migrations/20260121185119_add_check_constraints/README.md`

---

### 2. Database Integrity Check ⚡ CRITICAL
**Estimated Time:** 10 minutes
**Why:** Ensures no orphaned data or broken references

```bash
# Option A: Via Admin Panel (Recommended)
# 1. Navigate to: https://your-domain.com/admin/login
# 2. Login with admin credentials
# 3. Visit: /api/admin/database-integrity?schema=farms&action=check
# 4. Review output for any issues
# 5. If issues found, run cleanup: ?schema=farms&action=cleanup

# Option B: Direct API Call
curl -X GET "https://your-domain.com/api/admin/database-integrity?schema=farms&action=check" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected output should show 0 orphaned records
```

**What to Check:**
- ✅ No orphaned farm_categories (categories without farms)
- ✅ No orphaned images (images without farms)
- ✅ No broken farm-category relationships
- ✅ All farms have valid coordinates

---

### 3. Build Verification ⚡ CRITICAL
**Estimated Time:** 10 minutes
**Why:** Confirms TypeScript compilation and static generation work

```bash
cd farm-frontend

# Clean build
rm -rf .next
pnpm build

# Expected output:
# ✓ Compiled successfully
# ✓ Static pages: 254 pages
# ✓ 0 errors, 0 warnings

# If build fails:
# 1. Check error message carefully
# 2. Verify all environment variables are set
# 3. Check DATABASE_URL is accessible
# 4. Review TypeScript errors if any
```

**Environment Variables Required:**
```bash
# Database
DATABASE_URL="postgresql://..."

# External Services
GOOGLE_MAPS_API_KEY="..."
MEILISEARCH_URL="..."
MEILISEARCH_MASTER_KEY="..."
VERCEL_BLOB_READ_WRITE_TOKEN="..."

# Admin Auth
ADMIN_EMAIL="..."
ADMIN_PASSWORD="..."

# Email
RESEND_API_KEY="..."

# Optional
NEXT_PUBLIC_SITE_URL="https://www.farmcompanion.co.uk"
```

---

### 4. Vercel Preview Deployment ⚡ RECOMMENDED
**Estimated Time:** 15 minutes
**Why:** Test deployment in production-like environment

```bash
# Push to feature branch (triggers preview deployment)
git push origin your-branch-name

# Wait for Vercel preview deployment to complete
# Visit preview URL provided by Vercel

# Test critical paths:
# ✅ Homepage loads
# ✅ Map renders correctly
# ✅ Search works
# ✅ Individual farm pages load
# ✅ Forms submit successfully
# ✅ Admin panel accessible
# ✅ No console errors in browser
```

---

## 🧪 Production Smoke Tests (After Deployment)

### Test Suite 1: Core User Journeys (15 min)

#### Journey 1: Find a Farm
1. ✅ Visit homepage
2. ✅ Use search to find "organic farm"
3. ✅ Click on search result
4. ✅ View farm details page
5. ✅ Click "Get Directions" (opens Google Maps)
6. ✅ Click phone number (opens phone app)
7. ✅ Click website link (opens in new tab)

#### Journey 2: Browse by County
1. ✅ Visit /counties
2. ✅ Click on a county (e.g., "Kent")
3. ✅ See list of farms in that county
4. ✅ Use filters to narrow results
5. ✅ View farm detail page

#### Journey 3: Seasonal Produce
1. ✅ Visit /seasonal
2. ✅ Click on a produce item (e.g., "Strawberries")
3. ✅ See seasonality calendar
4. ✅ See farms selling this produce
5. ✅ Navigate to farm from produce page

#### Journey 4: Submit a Farm
1. ✅ Visit /add
2. ✅ Fill out farm submission form
3. ✅ Submit form
4. ✅ See success message
5. ✅ Verify submission appears in admin panel

#### Journey 5: Upload Photo
1. ✅ Visit farm page
2. ✅ Click "Upload Photo"
3. ✅ Select image file
4. ✅ Add caption
5. ✅ Submit
6. ✅ See success message
7. ✅ Verify photo appears in admin moderation queue

---

### Test Suite 2: Admin Workflows (10 min)

#### Admin Login
1. ✅ Visit /admin/login
2. ✅ Enter credentials
3. ✅ Successfully authenticate
4. ✅ Dashboard loads

#### Photo Moderation
1. ✅ Visit /admin/photos
2. ✅ See pending photos
3. ✅ Approve a photo
4. ✅ Verify photo appears on farm page
5. ✅ Reject a photo
6. ✅ Verify photo removed from queue

#### Farm Review
1. ✅ Visit /admin/farms
2. ✅ See pending submissions
3. ✅ Review farm details
4. ✅ Approve or reject
5. ✅ Verify status updated

---

### Test Suite 3: Performance (15 min)

#### Lighthouse Audit
```bash
# Run Lighthouse for key pages
npx lighthouse https://your-domain.com --view
npx lighthouse https://your-domain.com/map --view
npx lighthouse https://your-domain.com/shop/example-farm --view

# Target scores (all >= 90):
# ✅ Performance: 90+
# ✅ Accessibility: 90+
# ✅ Best Practices: 90+
# ✅ SEO: 90+
```

#### Core Web Vitals
```bash
# Use PageSpeed Insights
# https://pagespeed.web.dev/

# Target metrics:
# ✅ LCP (Largest Contentful Paint): < 2.5s
# ✅ FID (First Input Delay): < 100ms
# ✅ CLS (Cumulative Layout Shift): < 0.1
```

#### API Response Times
```bash
# Test key API endpoints
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/farms?limit=100

# Create curl-format.txt:
# time_total: %{time_total}s

# Target: < 500ms for p95
```

---

### Test Suite 4: Monitoring & Alerting (5 min)

#### Error Tracking
1. ✅ Verify Sentry (or similar) is configured
2. ✅ Trigger test error
3. ✅ Verify error appears in monitoring dashboard
4. ✅ Verify alert email received

#### Uptime Monitoring
1. ✅ Configure uptime monitoring (UptimeRobot, Pingdom, etc.)
2. ✅ Set alert thresholds (e.g., downtime > 5 minutes)
3. ✅ Test alert by temporarily taking site down
4. ✅ Verify alert received

#### Analytics
1. ✅ Verify Google Analytics (or similar) tracking code
2. ✅ Visit site and trigger page view
3. ✅ Confirm page view appears in analytics dashboard
4. ✅ Verify key events tracked (form submissions, clicks, etc.)

---

## 🚨 Rollback Procedures

### If Deployment Fails

#### Option 1: Revert to Previous Deployment (Fastest)
```bash
# In Vercel Dashboard:
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "Promote to Production"
# Takes effect immediately
```

#### Option 2: Git Revert
```bash
# Revert the problematic commit
git revert HEAD
git push origin main

# Vercel will auto-deploy the reverted code
```

#### Option 3: Rollback Database Migration
```bash
# If database migration caused issues
npx prisma migrate resolve --rolled-back 20260121185119_add_check_constraints

# Then manually remove constraints:
# See: farm-frontend/prisma/migrations/20260121185119_add_check_constraints/README.md
```

---

### If Performance Degrades

#### Quick Fixes
1. **Clear Vercel Edge Cache**
   - Vercel Dashboard → Project → Settings → Data → Purge Data
2. **Restart Redis**
   - Upstash Dashboard → Database → Restart
3. **Check Database Connections**
   - Supabase Dashboard → Database → Connection Pooling
4. **Review Slow API Routes**
   - Check Vercel Analytics for slow endpoints

---

## 📊 Success Metrics

After deployment, monitor these KPIs for 48 hours:

### Technical Metrics
- ✅ Error rate: < 0.1%
- ✅ P95 response time: < 500ms
- ✅ Uptime: > 99.9%
- ✅ Build success rate: 100%

### User Experience Metrics
- ✅ Bounce rate: < 50%
- ✅ Average session duration: > 2 minutes
- ✅ Pages per session: > 2
- ✅ Form completion rate: > 80%

### Business Metrics
- ✅ Farm submissions: Track daily volume
- ✅ Photo uploads: Track daily volume
- ✅ Search queries: Track daily volume
- ✅ Map interactions: Track click-through rate

---

## ✅ Final Pre-Launch Checklist

Before promoting to production, ensure ALL items are checked:

### Database
- [ ] CHECK constraints applied and verified
- [ ] Database integrity check passed (0 orphaned records)
- [ ] Backup configured (daily minimum)
- [ ] Connection pooling configured

### Code
- [ ] Feature branch merged to main
- [ ] All tests passing (when implemented)
- [ ] No TypeScript errors
- [ ] Build succeeds (254+ pages)
- [ ] No console.log statements in production code

### Configuration
- [ ] All environment variables set in Vercel
- [ ] Admin credentials secured
- [ ] API keys rotated (if needed)
- [ ] Rate limiting configured
- [ ] CORS configured correctly

### External Services
- [ ] Google Maps API working
- [ ] Meilisearch responding
- [ ] Vercel Blob storage accessible
- [ ] Resend email sending
- [ ] Redis connection stable

### Monitoring
- [ ] Error tracking configured
- [ ] Uptime monitoring active
- [ ] Analytics tracking verified
- [ ] Log aggregation working
- [ ] Alert channels tested

### Documentation
- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures tested
- [ ] Runbook created for on-call

### Performance
- [ ] Lighthouse scores >= 90 (all categories)
- [ ] Core Web Vitals pass
- [ ] API response times < 500ms (p95)
- [ ] Map loads < 2s on 3G

### Security
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] No secrets in code
- [ ] Dependencies up to date
- [ ] Vulnerability scan passed

### User Experience
- [ ] Mobile responsive verified
- [ ] Forms working
- [ ] Search working
- [ ] Map working
- [ ] Photo upload working
- [ ] Admin panel accessible

---

## 🎉 Post-Launch

After successful deployment:

1. **Announce**
   - Blog post
   - Social media
   - Email newsletter

2. **Monitor**
   - Watch error rates for 48 hours
   - Track user feedback
   - Monitor performance metrics

3. **Iterate**
   - Address user feedback
   - Fix any bugs discovered
   - Plan next features

4. **Document**
   - Update runbook with lessons learned
   - Document any issues encountered
   - Share knowledge with team

---

## 📞 Support Contacts

**Technical Issues:**
- Database: Supabase Support
- Hosting: Vercel Support
- Search: Meilisearch Support

**Emergency Contacts:**
- On-call engineer: [Add contact]
- Product owner: [Add contact]
- DevOps: [Add contact]

---

**Last Updated:** 2026-01-21
**Next Review:** Before production deployment

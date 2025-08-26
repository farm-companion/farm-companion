# Security Hardening Acceptance Checklist

This checklist ensures all security measures are properly implemented and tested before production deployment.

## ✅ TASK 0 — SITE CONSTANTS & RUNTIME GUARDS

- [ ] `src/lib/site.ts` updated with consent cookie constant
- [ ] `middleware.ts` created at root level
- [ ] HTTPS enforcement working in production
- [ ] Canonical host enforcement working
- [ ] All traffic redirected to primary host

**Test:** Visit `http://farmcompanion.co.uk` → should redirect to `https://www.farmcompanion.co.uk`

## ✅ TASK 1 — SECURITY HEADERS (STRICT BY DEFAULT, CONSENT-AWARE CSP)

- [ ] `next.config.ts` updated with strict security headers
- [ ] CSP removed from static config (now dynamic in middleware)
- [ ] HSTS header present in production
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy set to strict-origin-when-cross-origin
- [ ] Permissions-Policy configured
- [ ] Cross-Origin headers configured
- [ ] Consent-aware CSP working in middleware

**Test:** Check browser dev tools → Network tab → Response headers

## ✅ TASK 2 — INPUT VALIDATION & OUTPUT ENCODING

- [ ] `src/lib/validation.ts` created with Zod schemas
- [ ] Contact form schema implemented
- [ ] Farm submission schema implemented
- [ ] Feedback schema implemented
- [ ] Newsletter schema implemented
- [ ] Image upload schema implemented
- [ ] Text sanitization functions implemented
- [ ] URL validation functions implemented
- [ ] Spam detection functions implemented

**Test:** Submit forms with invalid data → should return 400 errors

## ✅ TASK 3 — RATE LIMITING (EDGE-FAST)

- [ ] `src/lib/rate-limit.ts` created with Vercel KV integration
- [ ] Contact form rate limiter (5/hour)
- [ ] Farm submission rate limiter (3/day)
- [ ] Feedback rate limiter (10/hour)
- [ ] Newsletter rate limiter (3/hour)
- [ ] Upload rate limiter (10/hour)
- [ ] General API rate limiter (100/minute)
- [ ] Client IP detection working
- [ ] Rate limit utility functions implemented

**Test:** Submit forms rapidly → should get 429 after limit exceeded

## ✅ TASK 4 — BOT/SPAM HARDENING FOR FORMS

- [ ] `src/lib/security.ts` created with security utilities
- [ ] CSRF protection implemented
- [ ] Honeypot field validation working
- [ ] Submission time validation working
- [ ] Turnstile verification implemented (optional)
- [ ] Content validation for spam detection
- [ ] IP reputation tracking implemented
- [ ] Safe redirect helper implemented
- [ ] Spam pattern detection working

**Test:** Submit form with honeypot filled → should silently discard

## ✅ TASK 5 — SAFE REDIRECTS

- [ ] Safe redirect helper function implemented
- [ ] No open redirects possible
- [ ] Only relative paths allowed
- [ ] Path traversal protection working

**Test:** Try redirecting to external URLs → should be blocked

## ✅ TASK 6 — FILE UPLOADS (IMAGES) VIA VERCEL BLOB

- [ ] `app/api/upload/route.ts` created
- [ ] File size validation (max 5MB)
- [ ] File type validation (images only)
- [ ] EXIF data stripping implemented
- [ ] Image processing with Sharp
- [ ] WebP conversion implemented
- [ ] Dimension limits enforced (4000x4000)
- [ ] Private storage by default
- [ ] Moderation queue implemented
- [ ] Security checks applied

**Test:** Upload various file types → only images should be accepted

## ✅ TASK 7 — MAP & EXTERNAL TILES SAFETY

- [ ] Map tile providers whitelisted in CSP
- [ ] Coordinate validation implemented
- [ ] No user-controlled HTML in popups
- [ ] Safe map integration

**Test:** Check map functionality → should work without security issues

## ✅ TASK 8 — ORIGIN/REFERER CSRF CHECKS

- [ ] CSRF protection working on all POST endpoints
- [ ] Origin header validation
- [ ] Referer header fallback
- [ ] Cross-site requests blocked

**Test:** Submit form from different origin → should be blocked

## ✅ TASK 9 — LOGGING & ALERTS

- [ ] `src/lib/logging.ts` created
- [ ] Security event logging implemented
- [ ] API metrics logging implemented
- [ ] KV storage for logs configured
- [ ] Security summary functions implemented
- [ ] Metrics aggregation working

**Test:** Check logs after security events → should be recorded

## ✅ TASK 10 — SECRETS & ENV HARDENING

- [ ] All secrets in Vercel encrypted env vars
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented
- [ ] CORS properly configured
- [ ] Secrets rotation plan in place

**Test:** Check for hardcoded secrets in codebase

## ✅ TASK 11 — ADS & CONSENT INTEGRATION

- [ ] `app/api/consent/route.ts` created
- [ ] Consent cookie management working
- [ ] CSP adjusts based on consent
- [ ] Ads only load with consent
- [ ] Analytics only load with consent
- [ ] Consent persistence working

**Test:** Toggle consent → CSP should update accordingly

## ✅ TASK 12 — ACCEPTANCE CHECKLIST

- [ ] HTTPS + canonical host enforced by middleware
- [ ] Security headers present and configured
- [ ] CSP strict by default, expands only on consent
- [ ] All write endpoints have validation, rate limiting, CSRF, spam defenses
- [ ] Uploads validated, EXIF stripped, private by default
- [ ] No open redirects possible
- [ ] No dangerouslySetInnerHTML for user input
- [ ] Logs for 4xx/5xx and rate-limit events
- [ ] Alert thresholds defined

## 🔧 DEPENDENCIES CHECKLIST

- [ ] `@vercel/kv` added to package.json
- [ ] `@vercel/blob` added to package.json
- [ ] `isomorphic-dompurify` added to package.json
- [ ] `zod` already present
- [ ] `sharp` already present

## 🌐 ENVIRONMENT VARIABLES CHECKLIST

- [ ] `NEXT_PUBLIC_SITE_URL` set
- [ ] `VERCEL_KV_REST_API_URL` set
- [ ] `VERCEL_KV_REST_API_TOKEN` set
- [ ] `BLOB_READ_WRITE_TOKEN` set
- [ ] `RESEND_API_KEY` set
- [ ] `TURNSTILE_SECRET_KEY` set (optional)
- [ ] `TURNSTILE_SITE_KEY` set (optional)

## 🧪 TESTING CHECKLIST

### Security Tests
- [ ] Rate limiting test passed
- [ ] CSRF protection test passed
- [ ] File upload security test passed
- [ ] Spam detection test passed
- [ ] Honeypot test passed
- [ ] Content validation test passed

### Performance Tests
- [ ] Core Web Vitals still green
- [ ] Bundle size within limits
- [ ] No performance regression
- [ ] CSP doesn't block legitimate resources

### Accessibility Tests
- [ ] Security measures don't break accessibility
- [ ] Forms still accessible
- [ ] Error messages clear and helpful

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All environment variables set in Vercel
- [ ] Vercel KV database created
- [ ] Vercel Blob store created
- [ ] Domain configured correctly
- [ ] SSL certificate active
- [ ] Security headers deployed
- [ ] Monitoring configured

## 📊 MONITORING CHECKLIST

- [ ] Security events being logged
- [ ] Rate limit violations tracked
- [ ] CSRF violations tracked
- [ ] Spam detection events tracked
- [ ] File upload attempts tracked
- [ ] API error rates monitored
- [ ] Performance metrics tracked

## 🔒 COMPLIANCE CHECKLIST

- [ ] GDPR consent management working
- [ ] Data minimization implemented
- [ ] Privacy by design principles followed
- [ ] User rights respected
- [ ] Data retention policies in place
- [ ] Security incident response plan ready

## ✅ FINAL VERIFICATION

- [ ] All tests passing
- [ ] No console errors
- [ ] No security warnings
- [ ] Performance acceptable
- [ ] User experience maintained
- [ ] Documentation complete
- [ ] Team trained on new security measures

## 🎯 SUCCESS CRITERIA

- [ ] Site passes security audit
- [ ] All OWASP Top 10 vulnerabilities addressed
- [ ] GDPR compliance maintained
- [ ] Performance budgets met
- [ ] User experience enhanced, not degraded
- [ ] Security monitoring active
- [ ] Incident response ready

---

**Status:** 🟡 In Progress / 🟢 Complete / 🔴 Blocked

**Next Steps:**
1. Set up environment variables
2. Test all security features
3. Deploy to staging
4. Run security audit
5. Deploy to production
6. Monitor and adjust

**Notes:**
- All security measures follow PuredgeOS 3.0 standards
- Performance impact minimized
- User experience prioritized
- Compliance requirements met

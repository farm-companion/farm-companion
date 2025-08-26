# Security Environment Variables

This document outlines all environment variables required for the security hardening implementation.

## Required Environment Variables

### Core Security
```bash
# Site configuration
NEXT_PUBLIC_SITE_URL=https://www.farmcompanion.co.uk

# Vercel KV (Redis) for rate limiting and security tracking
VERCEL_KV_REST_API_URL=https://your-project.kv.vercel-storage.com
VERCEL_KV_REST_API_TOKEN=your-kv-token

# Vercel Blob for secure file uploads
BLOB_READ_WRITE_TOKEN=your-blob-token

# Email service (Resend)
RESEND_API_KEY=your-resend-api-key
```

### Optional Security Enhancements
```bash
# Cloudflare Turnstile for bot protection
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
TURNSTILE_SITE_KEY=your-turnstile-site-key

# Sentry for error tracking (optional)
SENTRY_DSN=your-sentry-dsn

# Additional monitoring (optional)
DATADOG_API_KEY=your-datadog-key
```

## Environment Setup Instructions

### 1. Vercel KV Setup
1. Go to your Vercel project dashboard
2. Navigate to Storage → KV
3. Create a new KV database
4. Copy the REST API URL and token
5. Add to your environment variables

### 2. Vercel Blob Setup
1. Go to your Vercel project dashboard
2. Navigate to Storage → Blob
3. Create a new Blob store
4. Copy the read/write token
5. Add to your environment variables

### 3. Cloudflare Turnstile Setup (Optional)
1. Go to Cloudflare Dashboard → Security → Turnstile
2. Create a new site
3. Copy the site key and secret key
4. Add to your environment variables

### 4. Resend Email Setup
1. Go to resend.com and create an account
2. Create an API key
3. Add to your environment variables

## Security Features Enabled

### With All Variables Set:
- ✅ Rate limiting with Redis
- ✅ CSRF protection
- ✅ Spam detection and honeypot
- ✅ Bot protection (Turnstile)
- ✅ Secure file uploads with EXIF stripping
- ✅ IP reputation tracking
- ✅ Security event logging
- ✅ Consent-aware CSP
- ✅ Input validation and sanitization

### With Basic Variables Only:
- ✅ Rate limiting (in-memory fallback)
- ✅ CSRF protection
- ✅ Basic spam detection
- ✅ Input validation
- ✅ Secure file uploads

## Development vs Production

### Development
- Most security features work with basic setup
- CSP is relaxed for development
- Rate limiting uses in-memory storage if KV not configured

### Production
- All security features enabled
- Strict CSP with consent awareness
- Full rate limiting with Redis
- Complete logging and monitoring

## Testing Security Features

### Rate Limiting Test
```bash
# Test rate limiting (should get 429 after 5 requests)
for i in {1..10}; do
  curl -X POST https://your-site.com/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"test","email":"test@test.com","subject":"test","message":"test","t":'$(date +%s)'}'
done
```

### CSRF Protection Test
```bash
# Test CSRF protection (should fail without proper origin)
curl -X POST https://your-site.com/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicious-site.com" \
  -d '{"name":"test","email":"test@test.com","subject":"test","message":"test","t":'$(date +%s)'}'
```

### File Upload Test
```bash
# Test secure file upload
curl -X POST https://your-site.com/api/upload \
  -F "file=@test-image.jpg" \
  -F "t=$(date +%s)"
```

## Monitoring and Alerts

### Security Metrics Available
- Rate limit violations per IP
- CSRF violations
- Spam detection events
- File upload attempts
- Consent updates
- API error rates

### Recommended Alerts
- High rate of 429 responses
- Multiple CSRF violations from same IP
- Spam detection spikes
- File upload failures
- API response time degradation

## Troubleshooting

### Common Issues

1. **Rate limiting not working**
   - Check VERCEL_KV_REST_API_URL and VERCEL_KV_REST_API_TOKEN
   - Verify KV database is created and accessible

2. **File uploads failing**
   - Check BLOB_READ_WRITE_TOKEN
   - Verify Blob store is created
   - Check file size and type restrictions

3. **CSP blocking legitimate resources**
   - Check consent cookie is set correctly
   - Verify domain allowlists in middleware.ts
   - Test with browser dev tools

4. **Turnstile verification failing**
   - Check TURNSTILE_SECRET_KEY is correct
   - Verify site key matches secret key
   - Test with Turnstile debug mode

### Debug Mode
Add to your environment for debugging:
```bash
DEBUG_SECURITY=true
```

This will log detailed security events to console.

## Security Checklist

- [ ] All required environment variables set
- [ ] Vercel KV database created and accessible
- [ ] Vercel Blob store created and accessible
- [ ] Email service configured
- [ ] CSP tested in development
- [ ] Rate limiting tested
- [ ] File upload security tested
- [ ] Monitoring alerts configured
- [ ] Security events being logged
- [ ] Consent management working
- [ ] All API routes protected
- [ ] HTTPS enforced in production
- [ ] Security headers present
- [ ] Input validation working
- [ ] Output sanitization working

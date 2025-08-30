# 🔒 Security Setup Guide

## Environment Variables Configuration

### Critical: Rotate All Exposed Secrets

The following secrets were exposed in version control and MUST be rotated immediately:

1. **Redis Database URL** - Rotate Redis credentials
2. **DeepSeek API Key** - Generate new API key
3. **Resend API Key** - Generate new API key
4. **Admin Password** - Change to strong password

### Local Development Setup

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your actual values in `.env.local`

3. **NEVER commit `.env.local` to version control**

### Production Deployment (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables:

#### Required Variables:
- `REDIS_URL` - Your Redis connection string
- `DEEPSEEK_API_KEY` - Your DeepSeek AI API key
- `RESEND_API_KEY` - Your Resend email API key
- `ADMIN_EMAIL` - Admin email address
- `ADMIN_PASSWORD` - Strong admin password (min 12 chars)

#### Optional Security Variables:
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA secret
- `VERCEL_KV_REST_API_URL` - Vercel KV REST API URL
- `VERCEL_KV_REST_API_TOKEN` - Vercel KV REST API token

### Security Checklist

- [ ] All exposed secrets rotated
- [ ] Environment variables configured in Vercel
- [ ] Admin password changed to strong password
- [ ] `.env.local` not committed to git
- [ ] Production environment variables set
- [ ] Development environment variables set

### Emergency Response

If secrets were compromised:

1. **Immediately rotate all exposed credentials**
2. **Monitor for unauthorized access**
3. **Review git history for other exposed secrets**
4. **Consider using git filter-branch to remove from history**

### Next Steps

After completing this setup, proceed with the remaining security fixes:
1. Update Next.js to patch SSRF vulnerability
2. Remove hardcoded admin credentials
3. Implement file upload validation
4. Add database constraints

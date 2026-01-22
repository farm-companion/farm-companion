# Vercel Deployment Guide

## Prerequisites

Before deploying to Vercel, ensure you have:

1. ✅ A Vercel account (sign up at https://vercel.com)
2. ✅ A Supabase database with PostGIS extension enabled
3. ✅ Vercel KV (Redis) database created
4. ✅ Vercel Blob storage configured
5. ✅ Google Maps API key with Maps JavaScript API enabled
6. ✅ Resend account for email delivery
7. ✅ Meilisearch instance for search functionality

## Quick Start

### 1. Connect GitHub Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the `farm-frontend` directory as the root
4. Framework preset: **Next.js**
5. Build command: `pnpm run build` (default)
6. Output directory: `.next` (default)

### 2. Configure Environment Variables

**Required Environment Variables** (deployment will fail without these):

```bash
# Database (Supabase)
DATABASE_URL=postgresql://...
DATABASE_POOLER_URL=postgresql://...

# Vercel KV (Redis)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Meilisearch
MEILISEARCH_HOST=...
MEILISEARCH_API_KEY=...

# Email (Resend)
RESEND_API_KEY=...
RESEND_FROM=hello@farmcompanion.co.uk

# Admin Auth
ADMIN_EMAIL=...
ADMIN_PASSWORD=...

# Site Config
SITE_URL=https://www.farmcompanion.co.uk
NEXT_PUBLIC_SITE_URL=https://www.farmcompanion.co.uk
```

**Optional but Recommended**:

```bash
# CAPTCHA (at least one)
RECAPTCHA_SECRET_KEY=...
# OR
HCAPTCHA_SECRET=...
# OR
TURNSTILE_SECRET_KEY=...

# Bing IndexNow
BING_INDEXNOW_KEY=...

# Google Analytics
NEXT_PUBLIC_GA_ENABLED=true
NEXT_PUBLIC_GA_ID=G-...

# Feature Flags
NEXT_PUBLIC_CONTACT_FORM_ENABLED=true
NEXT_PUBLIC_ADD_FORM_ENABLED=true
```

### 3. Setting Environment Variables in Vercel

**Via Vercel Dashboard:**

1. Go to your project in Vercel
2. Click **Settings** > **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Your secret value
   - **Environment**: Select Production, Preview, Development as needed
4. Click **Save**

**Via Vercel CLI:**

```bash
# Install Vercel CLI
pnpm install -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add DATABASE_URL production
vercel env add KV_REST_API_URL production
# ... repeat for all required variables
```

**Via `.env` File Import:**

1. Create a `.env.production` file locally with all variables
2. Go to project **Settings** > **Environment Variables**
3. Click **Import .env** and select your file
4. Review and confirm imported variables

### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch and Vercel auto-deploys
git push origin main
```

## Setting Up Required Services

### Vercel KV (Redis)

1. Go to **Vercel Dashboard** > **Storage**
2. Click **Create Database** > **KV (Upstash Redis)**
3. Name: `farm-companion-kv`
4. Region: Choose closest to your Supabase region
5. Click **Create**
6. Copy `KV_REST_API_URL` and `KV_REST_API_TOKEN`
7. Vercel auto-links these to your project

### Vercel Blob Storage

1. Go to **Vercel Dashboard** > **Storage**
2. Click **Create Database** > **Blob**
3. Name: `farm-companion-blob`
4. Click **Create**
5. Copy `BLOB_READ_WRITE_TOKEN`
6. Vercel auto-links this to your project

### Supabase Database

1. Create project at https://supabase.com
2. Go to **Project Settings** > **Database**
3. Copy **Connection string** (Transaction Mode) → `DATABASE_URL`
4. Copy **Connection string** (Session Mode) → `DATABASE_POOLER_URL`
5. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
6. Run Prisma migrations:
   ```bash
   cd farm-frontend
   pnpm prisma migrate deploy
   ```

### Google Maps API

1. Go to https://console.cloud.google.com
2. Create/select project
3. Enable **Maps JavaScript API**
4. Go to **Credentials** > **Create Credentials** > **API Key**
5. Restrict key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: `www.farmcompanion.co.uk/*`, `*.vercel.app/*`
   - **API restrictions**: Maps JavaScript API
6. Copy API key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Resend Email

1. Sign up at https://resend.com
2. Verify your domain: `farmcompanion.co.uk`
3. Add DNS records (SPF, DKIM, DMARC)
4. Go to **API Keys** > **Create API Key**
5. Name: `Farm Companion Production`
6. Permissions: **Sending access**
7. Copy key → `RESEND_API_KEY`

### Meilisearch

1. Deploy Meilisearch (https://www.meilisearch.com/cloud)
2. Copy **Host URL** → `MEILISEARCH_HOST`
3. Copy **Admin API Key** → `MEILISEARCH_API_KEY`
4. Index your farms data:
   ```bash
   cd farm-frontend
   pnpm tsx scripts/sync-to-meilisearch.ts
   ```

## Build Troubleshooting

### Build Fails with "DATABASE_URL not found"

**Expected behavior**: Some pages log warnings but build continues.

**Fix**: Ensure `DATABASE_URL` is set in Vercel environment variables.

**Note**: Sitemap generation gracefully handles missing database during build and will populate on first request.

### Build Fails with "Missing Prisma Client"

**Cause**: Prisma client not generated during install.

**Fix**: Verify `postinstall` script exists in `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate && node scripts/fix-prisma-zeptomatch.js && patch-package"
  }
}
```

### Redis/KV Errors During Build

**Expected behavior**: Non-fatal warnings during static generation.

**Fix**: Ensure `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set in Vercel.

**Note**: KV is only used at runtime, not during build.

### TypeScript Errors

**Fix**: Run locally first to catch errors:

```bash
pnpm run build
```

Fix any TypeScript errors before deploying.

## Post-Deployment Checklist

### ✅ Verify Core Functionality

- [ ] Homepage loads (https://www.farmcompanion.co.uk)
- [ ] Map renders and shows farm markers
- [ ] Search returns results
- [ ] Individual farm pages load
- [ ] Contact form submits successfully
- [ ] Photo upload works
- [ ] Admin panel accessible

### ✅ Check Environment Variables

```bash
# Via Vercel CLI
vercel env ls
```

Ensure all **Required** variables are set for Production.

### ✅ Monitor Logs

1. Go to **Vercel Dashboard** > **Deployments**
2. Click latest deployment
3. Click **Functions** tab
4. Monitor for errors in real-time
5. Check **Runtime Logs** for API route errors

### ✅ Test Critical User Journeys

1. **Farm Discovery**:
   - Search for "dairy"
   - Click on a farm
   - View farm details and photos

2. **Photo Upload**:
   - Go to a farm page
   - Click "Add Photo"
   - Upload an image
   - Verify photo appears in moderation queue

3. **Contact Form**:
   - Go to /contact
   - Fill out form
   - Submit
   - Verify email received

### ✅ Performance Check

Run Lighthouse audit on production:

```bash
npx lighthouse https://www.farmcompanion.co.uk --view
```

**Target scores**:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Domain Configuration

### Custom Domain Setup

1. Go to **Vercel Dashboard** > **Settings** > **Domains**
2. Click **Add**
3. Enter: `www.farmcompanion.co.uk`
4. Add DNS records (Vercel provides instructions):
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
5. Wait for DNS propagation (up to 24 hours)
6. Verify SSL certificate is issued

### Redirect Root to WWW

Add to Vercel Dashboard > **Settings** > **Domains**:
- Add `farmcompanion.co.uk`
- Set redirect to `www.farmcompanion.co.uk`

## Security Best Practices

1. ✅ **Never commit `.env` files** to Git
2. ✅ **Rotate secrets** regularly (every 90 days)
3. ✅ **Use preview deployments** for testing
4. ✅ **Enable Vercel's security headers** (already configured in `next.config.js`)
5. ✅ **Monitor logs** for suspicious activity
6. ✅ **Set up alerts** for errors (Vercel Integrations > Sentry/Datadog)

## Rollback Procedure

If a deployment introduces critical bugs:

```bash
# Via Vercel Dashboard
1. Go to Deployments
2. Find last working deployment
3. Click "..." > "Promote to Production"

# Via CLI
vercel rollback
```

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

## Need Help?

- Check **Vercel Deployment Logs** for errors
- Review **Function Logs** for API route issues
- Verify **Environment Variables** are set correctly
- Test **locally with production env vars** first:
  ```bash
  cp .env.example .env.local
  # Fill in production values
  pnpm run build
  pnpm start
  ```

---

**Last Updated**: 2026-01-22
**Status**: Production-ready deployment configuration

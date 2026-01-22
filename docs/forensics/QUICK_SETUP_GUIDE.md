# Quick Setup Guide - Database Connection Fix

This guide helps you quickly resolve the database connection error and get your local development environment working.

## The Problem

You're seeing this error:
```
Error [PrismaClientInitializationError]:
Can't reach database server at `db.baxnifiqtnnovifnamlk.supabase.co:6543`
```

**Root Cause**: Missing environment variables for database connection.

## Quick Fix (5 minutes)

### Step 1: Get Supabase Credentials

You need access to the Supabase project. Get credentials from:

**Option A - Supabase Dashboard** (Recommended)
1. Log in to [supabase.com](https://supabase.com)
2. Open your project: `farm-companion` or similar
3. Go to: **Project Settings** > **Database**
4. Find these connection strings:
   - **Connection String** (direct): Port 5432
   - **Connection Pooling** (pooler): Port 6543
5. Copy both connection strings

**Option B - Ask Team Admin**
Contact the project administrator for:
- `DATABASE_URL`
- `DATABASE_POOLER_URL`
- Other required credentials

### Step 2: Create Local Environment File

```bash
# Navigate to farm-frontend directory
cd farm-frontend

# Copy the example environment file
cp .env.example .env.local

# Open .env.local in your editor
nano .env.local   # or: vim .env.local, code .env.local
```

### Step 3: Configure Critical Variables

**Minimum required configuration** (paste into `.env.local`):

```bash
# ===================================
# CRITICAL - Required for Core Functionality
# ===================================

# Database Connection (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.baxnifiqtnnovifnamlk.supabase.co:5432/postgres"
DATABASE_POOLER_URL="postgresql://postgres:[YOUR_PASSWORD]@db.baxnifiqtnnovifnamlk.supabase.co:6543/postgres"

# Vercel KV (Redis) - Required for rate limiting
KV_REST_API_URL="https://[your-kv].upstash.io"
KV_REST_API_TOKEN="[your-token]"

# Vercel Blob Storage - Required for image uploads
BLOB_READ_WRITE_TOKEN="[your-token]"

# Google Maps API Key - Required for map
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="[your-api-key]"

# Resend Email - Required for contact forms
RESEND_API_KEY="[your-api-key]"

# Admin Authentication
ADMIN_EMAIL="admin@farmcompanion.co.uk"
ADMIN_PASSWORD="[your-secure-password]"
```

**Replace placeholders**:
- `[YOUR_PASSWORD]` - Your Supabase database password
- `[your-kv]`, `[your-token]` - From Vercel Dashboard > Storage > KV
- `[your-api-key]` - From respective service dashboards

### Step 4: Validate Configuration

Run the environment validation script:

```bash
# From farm-frontend directory
pnpm tsx scripts/validate-environment.ts
```

Expected output if successful:
```
✓ All required environment variables are set!
```

If you see failures, the script will tell you exactly which variables are missing.

### Step 5: Test Database Connection

```bash
# Test Prisma connection
npx prisma db pull

# If successful, you'll see:
# ✔ Introspected X models and wrote them into prisma/schema.prisma
```

### Step 6: Start Development Server

```bash
pnpm dev

# Should see:
# ✅ Loaded 1299 valid farms from database
# ✓ Ready on http://localhost:3000
```

## Verification Checklist

After setup, verify these work:

- [ ] Homepage loads with farm count statistics
- [ ] Map page shows farm markers
- [ ] Category pages show farm listings
- [ ] County pages show farm listings
- [ ] Search functionality works
- [ ] Admin dashboard accessible at `/admin`

## Common Issues

### Issue: "Can't reach database server"
**Solution**: Check your `DATABASE_URL` format. It should be:
```
postgresql://postgres:[password]@[host]:5432/postgres
```
- Host ends with `.supabase.co`
- Port is `5432` for direct, `6543` for pooler
- Database name is usually `postgres`

### Issue: "Invalid API key" for Prisma
**Solution**: Check your password has no special characters that need URL encoding:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- Use: `encodeURIComponent(password)` in JavaScript

### Issue: Environment validation passes but app still fails
**Solution**:
1. Restart your development server completely
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `pnpm install`
4. Verify `.env.local` is in the correct directory (farm-frontend)

### Issue: Database connection works but no farms load
**Solution**: Check data exists in database:
```bash
npx prisma studio
# Opens GUI to browse database
# Check "Farm" table has records
```

## Get More Help

### Full Documentation
- **Environment Variables**: See `.env.example` with detailed descriptions
- **Deployment Guide**: See `VERCEL_DEPLOYMENT.md` for production setup
- **Database Forensics**: See `docs/forensics/DATABASE_CONNECTION_FORENSICS.md` for deep analysis

### Debug Commands
```bash
# Check environment variables are loaded
pnpm tsx -e "console.log(process.env.DATABASE_URL?.substring(0, 30))"

# Test database query directly
pnpm tsx -e "import {prisma} from './src/lib/prisma'; prisma.farm.count().then(console.log)"

# View Prisma logs
# Set in .env.local: DATABASE_URL="...?connection_limit=10&pool_timeout=20&log=query,info,warn,error"
```

### Contact
If you're still stuck after trying these steps:
1. Check the execution ledger: `docs/assistant/execution-ledger.md`
2. Review recent commits for configuration changes
3. Contact the project administrator for credentials

## Security Notes

### ⚠️ IMPORTANT
- **NEVER commit `.env.local`** - It's in `.gitignore`, keep it that way
- **NEVER share credentials** in Slack, email, or public channels
- **USE environment variables** in Vercel/production, not hardcoded values
- **ROTATE credentials** if accidentally exposed

### Best Practices
1. Use different credentials for development vs production
2. Use read-only database user for local development if possible
3. Keep `.env.local` outside of any cloud sync folders
4. Rotate credentials periodically (every 90 days recommended)

---

**Estimated Setup Time**: 5-10 minutes (with credentials)
**Difficulty**: Easy
**Last Updated**: 2026-01-22

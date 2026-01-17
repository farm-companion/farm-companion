# Supabase Database Setup - SQL Method

Since the direct connection (port 5432) isn't accessible, we'll create the database tables using **Supabase SQL Editor** instead.

## Why This Method?

Supabase free tier often has port 5432 blocked for security. The SQL Editor provides direct access to run migrations.

---

## Steps to Create Tables

### 1. Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `farm_companion` in supabase
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### 2. Copy the SQL Script

The complete SQL script has been generated at:
```
farm-frontend/scripts/create-database-tables.sql
```

Open this file and copy its entire contents.

### 3. Execute the SQL

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Cmd/Ctrl + Enter)
3. Wait for execution to complete (~5-10 seconds)

### 4. Verify Tables Were Created

In Supabase dashboard:
1. Click **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ farms
   - ✅ categories
   - ✅ farm_categories
   - ✅ products
   - ✅ images
   - ✅ reviews
   - ✅ blog_posts
   - ✅ events

---

## After Tables Are Created

Once tables exist, come back to your terminal and we'll run the data migration:

```bash
cd farm-frontend
pnpm tsx scripts/migrate-to-postgres.ts
```

This will migrate all 1,322 farms from JSON to your Supabase database.

---

## Alternative: Use Pooler Connection

If you prefer command-line, we can also try using the pooler connection with session mode:

```bash
# In .env, change DATABASE_URL to:
DATABASE_URL="postgresql://postgres.baxnifiqtnnovifnamlk:DDA3KCYM1Wjknr6w@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Then run:
pnpm prisma db push --accept-data-loss
```

But the SQL Editor method is more reliable for initial setup.

---

## What the SQL Does

The script creates:
- **9 tables** (farms, categories, products, images, reviews, blog_posts, events, etc.)
- **25+ indexes** for optimal query performance
- **Foreign key constraints** for data integrity
- **Default values** where appropriate

All based on the Prisma schema we designed in Week 0.

---

## Troubleshooting

**"Table already exists" error**:
- Some tables might have been partially created
- Either drop the existing tables first, or skip to the migration step

**"Permission denied"**:
- Make sure you're logged in to the correct Supabase project
- Check you have owner/admin access

**"Syntax error"**:
- Make sure you copied the entire SQL file
- Don't edit the SQL manually

---

**Estimated time**: 2-3 minutes to execute SQL + verify tables

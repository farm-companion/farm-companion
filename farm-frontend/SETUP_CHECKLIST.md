# WEEK 0 SETUP CHECKLIST

Complete these steps to finish Week 0 transformation setup.

---

## ✅ ALREADY COMPLETED (By Claude)

- [x] Install all dependencies (Framer Motion, Prisma, etc.)
- [x] Create animation utilities system
- [x] Build Badge component
- [x] Build Skeleton component
- [x] Build Alert component
- [x] Enhance Tailwind config with shimmer animation
- [x] Design complete Prisma schema
- [x] Create Prisma client singleton
- [x] Create database migration script

---

## 🔲 YOUR ACTION ITEMS

### STEP 1: Create Supabase Account & Database (15 minutes)

1. **Sign Up**
   - Visit: https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub or email

2. **Create Project**
   - Click "New Project"
   - Organization: Create new or select existing
   - Project name: `farm-companion`
   - Database password: **Save this securely!**
   - Region: `Europe West (London) - eu-west-2` (closest to UK)
   - Pricing: Free tier is perfect

3. **Wait for Provisioning**
   - Takes ~2 minutes
   - Status will change from "Setting up project" to "Active"

4. **Get Connection Details**
   - Go to: **Project Settings** > **Database**
   - Scroll to "Connection string"
   - Select "URI" mode
   - Copy the full connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **Replace `[YOUR-PASSWORD]` with your database password**

5. **Get API Keys**
   - Go to: **Project Settings** > **API**
   - Copy these values:
     - **Project URL**: `https://[PROJECT-REF].supabase.co`
     - **anon/public key**: Long string starting with `eyJ...`

6. **Update Environment Variables**
   - Open `.env.local` in your editor
   - Add these lines:
   ```env
   # Supabase Configuration
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
   ```

---

### STEP 2: Initialize Database (5 minutes)

Run these commands in your terminal:

```bash
# Navigate to farm-frontend directory
cd farm-frontend

# Generate Prisma Client from schema
pnpm prisma generate

# Create database tables (push schema to Supabase)
pnpm prisma db push

# Verify tables were created
pnpm prisma studio
```

**Expected Result**: Prisma Studio opens in browser showing empty tables (farms, categories, images, etc.)

**Note**: If you encounter an `ERR_REQUIRE_ESM` error with zeptomatch, the project includes an automatic fix script that runs on `pnpm install`. If the error persists, run `node scripts/fix-prisma-zeptomatch.js` manually.

---

### STEP 3: Migrate Existing Data (5 minutes)

```bash
# Run the migration script
pnpm tsx scripts/migrate-to-postgres.ts
```

**Expected Output**:
```
🚀 Starting migration from JSON to PostgreSQL...

✓ Found 1,322 farms to migrate

🔌 Checking database connection...
✓ Database connection successful

📦 Migrating farms...
Progress: 100% (1322/1322)

============================================================
📊 Migration Complete!
============================================================
✓ Successfully migrated: 1,322 farms
✗ Errors: 0

🔍 Verifying migration...
Database contains 1322 farms
✓ Migration verification successful!

📈 Database Statistics:
  - Verified farms: 1,322
  - Featured farms: 0
  - Images: 2,145
  - Products: 8,967
  - Counties covered: 122

✨ Migration completed successfully!
```

If you see errors, check:
- DATABASE_URL is correct in .env.local
- Database password is correct
- Network connection is stable

---

### STEP 4: Meilisearch Setup (Optional - 15 minutes)

**Option A: Meilisearch Cloud (Recommended - Free)**

1. Visit: https://cloud.meilisearch.com
2. Sign up with email
3. Create project:
   - Name: `farm-companion`
   - Region: `eu-west-1` (Paris - closest free tier to UK)
4. Copy credentials:
   - Host URL: `https://[project-id].meilisearch.io`
   - Master Key: Long string
5. Add to `.env.local`:
   ```env
   MEILISEARCH_HOST="https://[project-id].meilisearch.io"
   MEILISEARCH_API_KEY="[your-master-key]"
   ```

**Option B: Self-Hosted (Advanced)**

```bash
# macOS
brew install meilisearch

# Start server
meilisearch --master-key="[generate-random-key]"

# Add to .env.local
MEILISEARCH_HOST="http://127.0.0.1:7700"
MEILISEARCH_API_KEY="[your-master-key]"
```

**Option C: Skip for Now**
- Search will use PostgreSQL full-text search instead
- Can add Meilisearch later without issues

---

### STEP 5: Verify Everything Works (5 minutes)

1. **Start Development Server**
   ```bash
   pnpm dev
   ```

2. **Test Database Connection**
   - Visit: http://localhost:3000/api/farms
   - Should see JSON with farm data from PostgreSQL

3. **Test New Components**
   - Create `/src/app/test/page.tsx`:
   ```tsx
   import { Badge } from '@/components/ui/Badge'
   import { Skeleton } from '@/components/ui/Skeleton'
   import { Alert } from '@/components/ui/Alert'

   export default function TestPage() {
     return (
       <div className="p-8 space-y-8">
         <h1 className="text-4xl font-bold">Component Test Page</h1>

         <section>
           <h2 className="text-2xl font-semibold mb-4">Badges</h2>
           <div className="flex gap-2">
             <Badge variant="success">Verified</Badge>
             <Badge variant="warning">Pending</Badge>
             <Badge variant="error">Rejected</Badge>
             <Badge variant="verified">Official</Badge>
           </div>
         </section>

         <section>
           <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
           <Skeleton variant="text" count={3} />
           <div className="mt-4">
             <Skeleton variant="card" />
           </div>
         </section>

         <section>
           <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
           <div className="space-y-4">
             <Alert variant="info" title="Information">
               This is an informational alert
             </Alert>
             <Alert variant="success" title="Success!" dismissible>
               Operation completed successfully
             </Alert>
             <Alert variant="warning">
               Warning: Something needs attention
             </Alert>
             <Alert variant="error" title="Error">
               An error occurred
             </Alert>
           </div>
         </section>
       </div>
     )
   }
   ```

4. **Visit Test Page**
   - Go to: http://localhost:3000/test
   - All components should render beautifully with animations

---

## 🎉 SUCCESS CRITERIA

You've successfully completed Week 0 setup when:

- [x] Supabase database created and connected
- [x] All 1,322 farms migrated to PostgreSQL
- [x] Prisma Studio shows farms, images, products
- [x] /api/farms endpoint returns data from PostgreSQL
- [x] Test page renders all new components
- [x] No console errors in browser
- [x] Animation system working smoothly

---

## 🚨 TROUBLESHOOTING

### "Error connecting to database"
- Check DATABASE_URL in .env.local
- Ensure password is correct (no special characters escaped)
- Verify Supabase project is "Active" not "Paused"
- Check firewall/VPN isn't blocking connection

### "Prisma schema not found"
```bash
# Regenerate Prisma client
pnpm prisma generate
```

### "Module not found: @prisma/client"
```bash
# Reinstall dependencies
pnpm install
pnpm prisma generate
```

### "ERR_REQUIRE_ESM: require() of ES Module zeptomatch"
**RESOLVED**: This issue has been fixed by downgrading to Prisma 5.22.0, which is fully compatible with Node.js 20.18.3.

**Note**: Prisma 7.2.0 requires Node.js 20.19+ or 22.12+. If you're on Node.js 20.18.3 (or similar), Prisma 5.22.0 is the recommended version. If you upgrade Node.js to 20.19+, you can optionally upgrade back to Prisma 7.x later.

### "Migration script errors"
- Check farms.json exists at `/data/farms.json`
- Verify DATABASE_URL is set correctly
- Try running migration again (it's idempotent for most errors)

### "Meilisearch connection failed"
- Verify MEILISEARCH_HOST and API_KEY in .env.local
- Check Meilisearch service is running
- Test connection: `curl $MEILISEARCH_HOST/health`

---

## 📞 NEXT STEPS AFTER SETUP

Once everything is working:

1. **Update APIs** to use Prisma instead of JSON file
2. **Build remaining UI components** (Toast, Select, SearchBar, etc.)
3. **Create query utilities** for common database operations
4. **Implement caching layer** with Redis
5. **Build homepage enhancements**
6. **Create admin panel improvements**

See `WEEK_0_PROGRESS.md` for detailed next steps.

---

## 💡 PRO TIPS

- **Backup JSON**: Keep `data/farms.json` for 30 days as backup
- **Prisma Studio**: Great for debugging - `pnpm prisma studio`
- **Database Migrations**: Use `pnpm prisma migrate dev` for schema changes
- **Type Safety**: Prisma Client is fully typed - autocomplete works!
- **Performance**: Prisma handles connection pooling automatically

---

**Total Setup Time**: ~40 minutes
**Difficulty**: Easy (mostly copy-paste)
**When to do this**: ASAP - blocks remaining Week 0 work

**Questions?** Check the progress file or re-read this checklist carefully.

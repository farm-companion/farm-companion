#!/bin/bash
# Farm Pipeline Enrichment Script
# Run this on your local machine where you have network access to the database

set -e

echo "=========================================="
echo "  Farm Pipeline Enrichment"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# Step 1: Generate Prisma Migration
echo "[Step 1/5] Generating Prisma migration..."
./node_modules/.bin/prisma migrate dev --name add-image-source-fields
echo "✅ Migration complete"
echo ""

# Step 2: Generate Prisma Client
echo "[Step 2/5] Regenerating Prisma client..."
./node_modules/.bin/prisma generate
echo "✅ Prisma client generated"
echo ""

# Step 3: Run import script (dry run first)
echo "[Step 3/5] Running import script (dry run)..."
pnpm tsx src/scripts/import-farms.ts --dry-run --limit=10
echo ""

read -p "Dry run complete. Continue with full import? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "[Step 4/5] Running full import..."
    pnpm tsx src/scripts/import-farms.ts --force
    echo "✅ Import complete"
else
    echo "Skipping full import"
fi
echo ""

# Step 5: Generate AI images (optional)
read -p "Generate AI images for farms without images? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "[Step 5/5] Generating AI images..."
    pnpm tsx src/scripts/generate-farm-images.ts --limit=50 --upload
    echo "✅ Image generation complete"
else
    echo "Skipping image generation"
fi

echo ""
echo "=========================================="
echo "  Enrichment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check your site at https://www.farmcompanion.co.uk/map"
echo "2. Verify farms appear with correct data"
echo "3. Check /shop pages have images"

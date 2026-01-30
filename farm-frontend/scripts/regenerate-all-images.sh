#!/bin/bash
#
# Regenerate All Images Script
#
# This script regenerates all produce and farm images using the updated prompts
# that exclude National Geographic watermarks and church spires.
#
# Prerequisites:
#   - RUNWARE_API_KEY must be set in .env.local or environment
#   - BLOB_READ_WRITE_TOKEN for Vercel Blob storage
#   - Node.js and pnpm installed
#
# Usage:
#   ./scripts/regenerate-all-images.sh
#

set -e

echo "=========================================="
echo "Farm Companion Image Regeneration"
echo "=========================================="
echo ""

# Check for required environment variables
if [ -z "$RUNWARE_API_KEY" ]; then
    if [ -f .env.local ]; then
        export $(grep -E '^RUNWARE_API_KEY=' .env.local | xargs)
    fi
fi

if [ -z "$RUNWARE_API_KEY" ]; then
    echo "ERROR: RUNWARE_API_KEY not found"
    echo "Please set RUNWARE_API_KEY in .env.local or export it"
    exit 1
fi

echo "Environment OK"
echo ""

# ===========================================
# PHASE 1: Regenerate Produce Images
# ===========================================
echo "=========================================="
echo "PHASE 1: Regenerating Produce Images"
echo "=========================================="
echo ""

PRODUCE_SLUGS=(
    "sweetcorn"
    "tomato"
    "strawberries"
    "blackberries"
    "runner-beans"
    "plums"
    "apples"
    "pumpkins"
    "asparagus"
    "kale"
    "leeks"
    "purple-sprouting-broccoli"
)

echo "Regenerating ${#PRODUCE_SLUGS[@]} produce items..."
echo ""

for slug in "${PRODUCE_SLUGS[@]}"; do
    echo "Generating images for: $slug"
    pnpm run generate:produce-images -- --produce="$slug" --count=4 --upload --force
    echo "Completed: $slug"
    echo ""
    # Rate limiting between items
    sleep 2
done

echo ""
echo "Produce images complete!"
echo "IMPORTANT: Copy the TypeScript snippets from above into src/data/produce.ts"
echo ""

# ===========================================
# PHASE 2: Regenerate Farm Images
# ===========================================
echo "=========================================="
echo "PHASE 2: Regenerating Farm Images"
echo "=========================================="
echo ""

echo "Regenerating farm images (limit 50 per batch)..."
echo "This will automatically update the database."
echo ""

# Run in batches of 50 to avoid timeouts
pnpm run generate:farm-images -- --limit=50 --upload --force

echo ""
echo "First batch complete. Run again if more farms need images."
echo ""

# ===========================================
# Summary
# ===========================================
echo "=========================================="
echo "REGENERATION COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the generated produce image URLs above"
echo "2. Update src/data/produce.ts with the new URLs"
echo "3. Run: pnpm build to verify everything works"
echo "4. Commit the changes"
echo ""

#!/usr/bin/env bash
set -euo pipefail
export PYTHONUNBUFFERED=1

echo "🔍 Fetching farm shops with images from Google Places API..."
python3 src/google_places_fetch.py

echo "📁 Data files created successfully!"
echo "📊 Source files:"
echo "   - dist/farms.uk.json"
echo "   - dist/farms.geo.json"
echo ""
echo "⚠️  Note: Frontend data copy skipped - farm-frontend not available in this workspace"
echo "   The workflow should handle copying these files to the frontend repository"

echo "✅ Farm shops data updated with images!"
echo "📊 Check the frontend to see the new images in action."

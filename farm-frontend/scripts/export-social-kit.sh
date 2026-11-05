#!/usr/bin/env bash
# Export the social profile kit to brand/social/ as PNGs ready to upload.
#
#   farm-frontend/scripts/export-social-kit.sh [base-url]
#
# Defaults to the local dev server. Pass a deployed URL to export from
# production instead. The renderer is src/app/og/social/route.tsx, so the type
# and palette always match the share cards; never redraw these by hand.
set -euo pipefail

BASE="${1:-http://localhost:3001}"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/brand/social"
mkdir -p "$OUT"

for format in avatar x-header fb-cover; do
  code=$(curl -sS -o "$OUT/$format.png" -w '%{http_code}' --max-time 120 \
    "$BASE/og/social?format=$format")
  if [ "$code" != "200" ]; then
    echo "$format: HTTP $code from $BASE" >&2
    exit 1
  fi
  echo "$format -> brand/social/$format.png"
done

echo "done. Upload steps: brand/social/README.md"

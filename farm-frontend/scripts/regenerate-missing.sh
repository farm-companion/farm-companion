#!/bin/bash
#
# Regenerate only missing produce images
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(RUNWARE_API_KEY|BLOB_READ_WRITE_TOKEN)=' "$ENV_FILE" | xargs)
fi

BLOB_TOKEN="$BLOB_READ_WRITE_TOKEN"
TEMP_DIR="/tmp/farm-images"
URLS_FILE="${TEMP_DIR}/urls.txt"
RESPONSE_FILE="${TEMP_DIR}/response.json"

mkdir -p "$TEMP_DIR"

echo "Regenerating 5 missing images..."

generate_uuid() {
  python3 -c "import uuid; print(uuid.uuid4())"
}

extract_image_url() {
  python3 -c "
import json
try:
    with open('$RESPONSE_FILE') as f:
        data = json.load(f)
        if data.get('data') and len(data['data']) > 0:
            print(data['data'][0].get('imageURL', ''))
except:
    pass
"
}

generate_single() {
  local slug="$1"
  local variation="$2"
  local produce_desc="$3"
  local uuid=$(generate_uuid)

  local prompt="Editorial food photography, ${produce_desc}, 50mm prime lens f/2.8 aperture, shallow depth of field with beautiful bokeh, soft natural window light from side, warm British afternoon glow, aged weathered oak table surface with natural grain, asymmetric artful arrangement, photorealistic anatomically accurate produce, vibrant natural colors, high-end culinary magazine quality, intimate macro detail, no text no watermarks no logos"
  local negative="text, letters, words, writing, watermark, logo, brand name, cut, sliced, halved, cross-section, internal view, seeds visible, core visible, malformed, distorted, mutated, wrong shape, wrong color, artificial, fake, plastic, waxy, CGI, illustration, painting, drawing, clipart, harsh lighting, flash, studio strobe, overexposed, underexposed, outdoor background, sky, church, building, people, hands, fingers"

  echo "Generating ${slug}:${variation}..."

  curl -s -X POST "https://api.runware.ai/v1" \
    -H "Authorization: Bearer ${RUNWARE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "[{
      \"taskType\": \"imageInference\",
      \"taskUUID\": \"${uuid}\",
      \"model\": \"runware:100@1\",
      \"positivePrompt\": \"${prompt}\",
      \"negativePrompt\": \"${negative}\",
      \"width\": 1600,
      \"height\": 1600,
      \"steps\": 28,
      \"CFGScale\": 3.5,
      \"outputFormat\": \"webp\",
      \"numberResults\": 1
    }]" > "$RESPONSE_FILE" 2>/dev/null

  local image_url=$(extract_image_url)

  if [ -z "$image_url" ]; then
    echo "  ERROR: No image URL"
    return 1
  fi

  local local_file="${TEMP_DIR}/${slug}-${variation}.webp"
  curl -s -o "$local_file" "$image_url"

  if [ ! -s "$local_file" ]; then
    echo "  ERROR: Download failed"
    return 1
  fi

  local blob_path="produce-images/${slug}/${variation}/main.webp"
  curl -s -X PUT \
    "https://blob.vercel-storage.com/${blob_path}" \
    -H "Authorization: Bearer ${BLOB_TOKEN}" \
    -H "x-api-version: 7" \
    -H "Content-Type: image/webp" \
    -H "x-cache-control-max-age: 31536000" \
    --data-binary "@${local_file}" > "$RESPONSE_FILE" 2>/dev/null

  local blob_url=$(python3 -c "
import json
try:
    with open('$RESPONSE_FILE') as f:
        data = json.load(f)
        print(data.get('url', ''))
except:
    pass
")

  if [ -z "$blob_url" ]; then
    echo "  ERROR: Upload failed"
    return 1
  fi

  echo "  OK: $blob_url"
  echo "${slug}:${variation}:${blob_url}" >> "$URLS_FILE"
  rm -f "$local_file"
  sleep 1
}

# Missing images with their descriptions
generate_single "tomato" "3" "round ripe red tomatoes with smooth shiny skin, green star-shaped calyx stem attachment on top, slight ribbing near stem, uniform red color with natural slight color variation"
generate_single "strawberries" "2" "whole red strawberries with tiny yellow seeds dotted across surface, green leafy calyx cap on top, conical heart shape, red color graduating from tip to shoulder"
generate_single "blackberries" "1" "whole blackberries made of many small round drupelets clustered together in oval shape, deep purple-black color with slight natural sheen, tiny hairs between drupelets"
generate_single "pumpkins" "2" "whole round pumpkins with deep vertical ribbing, orange skin, thick woody brown stem on top, slightly flattened shape, no carving no cutting"
generate_single "asparagus" "3" "bundle of whole asparagus spears with tight pointed purple-green tips, pale green stalks fading to white at cut base, slight scale texture on tips, bundled together"

echo ""
echo "Done! Check $URLS_FILE"

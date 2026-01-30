#!/bin/bash
#
# Generate All Produce Images via Curl
# Uses god-tier "Editorial Grocer" prompting for Waitrose/Kinfolk quality
#

set -e

# Load environment variables from .env.local (check both current dir and parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(RUNWARE_API_KEY|BLOB_READ_WRITE_TOKEN)=' "$ENV_FILE" | xargs)
elif [ -f ".env.local" ]; then
  export $(grep -E '^(RUNWARE_API_KEY|BLOB_READ_WRITE_TOKEN)=' .env.local | xargs)
fi

# Verify required environment variables
if [ -z "$RUNWARE_API_KEY" ]; then
  echo "ERROR: RUNWARE_API_KEY not found in environment or .env.local"
  exit 1
fi

if [ -z "$BLOB_READ_WRITE_TOKEN" ]; then
  echo "ERROR: BLOB_READ_WRITE_TOKEN not found in environment or .env.local"
  exit 1
fi

BLOB_TOKEN="$BLOB_READ_WRITE_TOKEN"
TEMP_DIR="/tmp/farm-images"
URLS_FILE="${TEMP_DIR}/urls.txt"
RESPONSE_FILE="${TEMP_DIR}/response.json"

mkdir -p "$TEMP_DIR"
rm -f "$URLS_FILE"
touch "$URLS_FILE"

echo "=========================================="
echo "Generate Produce Images via Curl"
echo "God-Tier Editorial Grocer Template"
echo "Started: $(date)"
echo "=========================================="
echo ""

generate_uuid() {
  python3 -c "import uuid; print(uuid.uuid4())"
}

# Extract imageURL from JSON response using Python
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

generate_and_upload() {
  local slug="$1"
  local name="$2"
  local variation="$3"
  local uuid=$(generate_uuid)

  # Get produce-specific physical description
  local produce_desc=""
  case "$slug" in
    "sweetcorn")
      produce_desc="whole corn cobs with pale yellow husks partially pulled back revealing rows of plump golden yellow kernels, fine corn silk threads visible, cylindrical shape, kernels arranged in neat vertical rows"
      ;;
    "tomato")
      produce_desc="round ripe red tomatoes with smooth shiny skin, green star-shaped calyx stem attachment on top, slight ribbing near stem, uniform red color with natural slight color variation"
      ;;
    "strawberries")
      produce_desc="whole red strawberries with tiny yellow seeds dotted across surface, green leafy calyx cap on top, conical heart shape, red color graduating from tip to shoulder"
      ;;
    "blackberries")
      produce_desc="whole blackberries made of many small round drupelets clustered together in oval shape, deep purple-black color with slight natural sheen, tiny hairs between drupelets"
      ;;
    "runner-beans")
      produce_desc="long flat green runner bean pods about 20cm long, slightly rough textured surface, tapered ends, visible bumps where beans inside, slight natural curve, stems at one end"
      ;;
    "plums")
      produce_desc="whole oval plums with smooth skin and natural waxy bloom, deep purple-red color, small stem attachment point, slight crease line running lengthwise"
      ;;
    "apples")
      produce_desc="whole round apples with smooth skin, red and green coloring with natural blush variation, small brown stem on top, slight indent at top and bottom, no cuts no slices"
      ;;
    "pumpkins")
      produce_desc="whole round pumpkins with deep vertical ribbing, orange skin, thick woody brown stem on top, slightly flattened shape, no carving no cutting"
      ;;
    "asparagus")
      produce_desc="bundle of whole asparagus spears with tight pointed purple-green tips, pale green stalks fading to white at cut base, slight scale texture on tips, bundled together"
      ;;
    "kale")
      produce_desc="bunch of curly kale leaves with deep green color and purple tints, heavily ruffled and curled leaf edges, thick pale stems, no cutting no chopping"
      ;;
    "leeks")
      produce_desc="whole leeks with white cylindrical base transitioning to pale green then dark green flat leaves, leaves fan outward at top, layered structure visible at base, long and straight"
      ;;
    "purple-sprouting-broccoli")
      produce_desc="purple sprouting broccoli stems with small purple-green floret heads, long pale green stems, leaves attached, multiple stems bundled together"
      ;;
    *)
      produce_desc="fresh whole ${name}"
      ;;
  esac

  # COMBINED: Accurate produce + Cinematic editorial styling
  # Physical accuracy + 50mm lens + f/2.8 + shallow depth of field + natural window light
  local prompt="Editorial food photography, ${produce_desc}, 50mm prime lens f/2.8 aperture, shallow depth of field with beautiful bokeh, soft natural window light from side, warm British afternoon glow, aged weathered oak table surface with natural grain, asymmetric artful arrangement, photorealistic anatomically accurate produce, vibrant natural colors, high-end culinary magazine quality, intimate macro detail, no text no watermarks no logos"
  local negative="text, letters, words, writing, watermark, logo, brand name, cut, sliced, halved, cross-section, internal view, seeds visible, core visible, malformed, distorted, mutated, wrong shape, wrong color, artificial, fake, plastic, waxy, CGI, illustration, painting, drawing, clipart, harsh lighting, flash, studio strobe, overexposed, underexposed, outdoor background, sky, church, building, people, hands, fingers"

  echo "  [${variation}/4] Generating..."

  # Call Runware API and save to temp file
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

  # Extract image URL using Python
  local image_url=$(extract_image_url)

  if [ -z "$image_url" ]; then
    echo "    ERROR: No image URL in response"
    cat "$RESPONSE_FILE" 2>/dev/null | head -5
    return 1
  fi

  # Download image
  local local_file="${TEMP_DIR}/${slug}-${variation}.webp"
  curl -s -o "$local_file" "$image_url"

  if [ ! -s "$local_file" ]; then
    echo "    ERROR: Download failed"
    return 1
  fi

  local file_size=$(wc -c < "$local_file")
  echo "    Downloaded: ${file_size} bytes"

  # Upload to Vercel Blob
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
    echo "    ERROR: Upload failed"
    cat "$RESPONSE_FILE" 2>/dev/null | head -3
    return 1
  fi

  echo "    Uploaded: $blob_url"
  echo "${slug}:${variation}:${blob_url}" >> "$URLS_FILE"

  # Clean up temp file
  rm -f "$local_file"

  sleep 1
  return 0
}

# Generate for each produce item
for item in \
  "sweetcorn:Sweetcorn" \
  "tomato:Tomatoes" \
  "strawberries:Strawberries" \
  "blackberries:Blackberries" \
  "runner-beans:Runner Beans" \
  "plums:Plums" \
  "apples:Apples" \
  "pumpkins:Pumpkins" \
  "asparagus:Asparagus" \
  "kale:Kale" \
  "leeks:Leeks" \
  "purple-sprouting-broccoli:Purple Sprouting Broccoli"
do
  IFS=':' read -r slug name <<< "$item"

  echo ""
  echo "=========================================="
  echo "${name} (${slug})"
  echo "=========================================="

  for variation in 1 2 3 4; do
    generate_and_upload "$slug" "$name" "$variation" || echo "    RETRY SKIPPED"
  done

  sleep 2
done

echo ""
echo "=========================================="
echo "COMPLETE - $(date)"
echo "=========================================="
echo ""
echo "URLs saved to: $URLS_FILE"
echo ""

# Generate TypeScript for produce.ts
echo "TypeScript output:"
echo ""

current_slug=""
while IFS=':' read -r slug variation url; do
  if [ "$slug" != "$current_slug" ]; then
    if [ -n "$current_slug" ]; then
      echo "    ],"
    fi
    echo ""
    echo "    // ${slug}"
    echo "    images: ["
    current_slug="$slug"
  fi
  # Generate alt text based on variation
  case $variation in
    1) alt="Fresh ${slug} on rustic wooden surface" ;;
    2) alt="${slug^} close-up with natural light" ;;
    3) alt="British ${slug} harvest display" ;;
    4) alt="Farm-fresh ${slug} with soft focus" ;;
  esac
  echo "      { src: '${url}', alt: '${alt}' },"
done < "$URLS_FILE"

if [ -n "$current_slug" ]; then
  echo "    ],"
fi

echo ""
echo "Done!"

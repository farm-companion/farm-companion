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

  # God-tier Editorial Grocer prompts
  local prompt="Fresh British ${name}, editorial food photography for Waitrose Food magazine, 50mm prime lens f/2.8 aperture, shallow depth of field with crisp focal plane, natural morning dew droplets, authentic tactile imperfections, soft diffused British overcast window light, aged weathered oak table surface, asymmetric editorial arrangement, documentary realism, Kinfolk magazine aesthetic, authentic farm-fresh quality, natural color variation, real organic textures"
  local negative="artificial, fake, plastic, synthetic, CGI, 3D render, illustration, painting, drawing, oversaturated, hyperrealistic, too perfect, too symmetrical, unnatural colors, stock photo, generic, clipart, cartoon, anime, text, watermark, logo, signature, copyright, National Geographic, magazine logo, stamp, people, hands, faces, figures, church, church spire, steeple, religious building, buildings, architecture, landscape, outdoor scene, supermarket, packaging, blurry, out of focus, harsh shadows, artificial lighting, studio strobes, overexposed, underexposed"

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

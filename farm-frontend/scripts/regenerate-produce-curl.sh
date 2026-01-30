#!/bin/bash
#
# Generate All Produce Images via Curl
#

set -e

# Load environment variables from .env.local
if [ -f ".env.local" ]; then
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

mkdir -p "$TEMP_DIR"
rm -f "$URLS_FILE"
touch "$URLS_FILE"

echo "=========================================="
echo "Generate Produce Images via Curl"
echo "Started: $(date)"
echo "=========================================="
echo ""

generate_uuid() {
  echo "$(date +%s%N | md5sum | head -c 8)-$(date +%s%N | md5sum | head -c 4)-4$(date +%s%N | md5sum | head -c 3)-$(date +%s%N | md5sum | head -c 4)-$(date +%s%N | md5sum | head -c 12)"
}

generate_and_upload() {
  local slug="$1"
  local name="$2"
  local variation="$3"
  local uuid=$(generate_uuid)

  local prompt="Fresh ${name}, real edible food, close-up food photography, overhead flat lay food photograph on weathered oak table, 35mm prime lens, f/2.8, shallow depth of field, warm cream linen backdrop, indoor studio, professional food photography, cookbook quality, natural organic appearance, realistic food textures, sharp focus on the food"
  local negative="no people, no faces, nobody, no watermark, no text, no logo, no National Geographic, no magazine watermark, no abnormal shapes, no distorted produce, no artificial lighting, no harsh shadows, no plastic packaging, no supermarket shelves, no AI artifacts, no unrealistic colors, no buildings, no architecture, no church, no landscape background"

  echo "  [${variation}/4] Generating..."

  # Call Runware API
  local response=$(curl -s -X POST "https://api.runware.ai/v1" \
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
    }]" 2>/dev/null)

  # Extract image URL
  local image_url=$(echo "$response" | grep -o '"imageURL":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$image_url" ]; then
    echo "    ERROR: No image URL in response"
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
  local upload_response=$(curl -s -X PUT \
    "https://blob.vercel-storage.com/${blob_path}" \
    -H "Authorization: Bearer ${BLOB_TOKEN}" \
    -H "x-api-version: 7" \
    -H "Content-Type: image/webp" \
    -H "x-cache-control-max-age: 31536000" \
    --data-binary "@${local_file}" 2>/dev/null)

  local blob_url=$(echo "$upload_response" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$blob_url" ]; then
    echo "    ERROR: Upload failed"
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

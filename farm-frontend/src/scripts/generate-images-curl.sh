#!/bin/bash
#
# Generate Images via Curl
#
# This script generates produce images using curl (which works in sandboxed environments)
# and updates produce.ts with the new URLs.
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

# Produce items to generate
PRODUCE_ITEMS=(
  "sweetcorn:Sweetcorn"
  "tomato:Tomatoes"
  "strawberries:Strawberries"
  "blackberries:Blackberries"
  "runner-beans:Runner Beans"
  "plums:Plums"
  "apples:Apples"
  "pumpkins:Pumpkins"
  "asparagus:Asparagus"
  "kale:Kale"
  "leeks:Leeks"
  "purple-sprouting-broccoli:Purple Sprouting Broccoli"
)

TEMP_DIR="/tmp/farm-images"
mkdir -p "$TEMP_DIR"

echo "=========================================="
echo "Generate Produce Images via Curl"
echo "=========================================="
echo ""

generate_image() {
  local slug="$1"
  local name="$2"
  local variation="$3"
  local uuid=$(uuidgen)

  local prompt="Fresh ${name}, real edible food, close-up food photography, overhead flat lay food photograph on weathered oak table, 35mm prime lens, f/2.8, shallow depth of field, warm cream linen backdrop, indoor studio, professional food photography, cookbook quality, natural organic appearance, realistic food textures, sharp focus on the food"
  local negative="no people, no faces, nobody, no watermark, no text, no logo, no National Geographic, no magazine watermark, no abnormal shapes, no distorted produce, no artificial lighting, no harsh shadows, no plastic packaging, no supermarket shelves, no AI artifacts, no unrealistic colors, no buildings, no architecture, no church, no landscape background"

  echo "  Generating ${name} variation ${variation}..."

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

  # Extract image URL from response
  local image_url=$(echo "$response" | jq -r '.data[0].imageURL // empty')

  if [ -z "$image_url" ]; then
    echo "    ERROR: Failed to generate image"
    echo "    Response: $response"
    return 1
  fi

  echo "    Generated: $image_url"

  # Download the image
  local local_file="${TEMP_DIR}/${slug}-${variation}.webp"
  curl -s -o "$local_file" "$image_url"

  if [ ! -f "$local_file" ] || [ ! -s "$local_file" ]; then
    echo "    ERROR: Failed to download image"
    return 1
  fi

  local file_size=$(stat -f%z "$local_file" 2>/dev/null || stat -c%s "$local_file" 2>/dev/null)
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

  local blob_url=$(echo "$upload_response" | jq -r '.url // empty')

  if [ -z "$blob_url" ]; then
    echo "    ERROR: Failed to upload to Vercel Blob"
    echo "    Response: $upload_response"
    return 1
  fi

  echo "    Uploaded: $blob_url"

  # Output for produce.ts update
  echo "$slug:$variation:$blob_url" >> "${TEMP_DIR}/urls.txt"

  # Rate limit
  sleep 1

  return 0
}

# Generate images for each produce item
for item in "${PRODUCE_ITEMS[@]}"; do
  IFS=':' read -r slug name <<< "$item"

  echo ""
  echo "----------------------------------------"
  echo "Processing: ${name} (${slug})"
  echo "----------------------------------------"

  for variation in 1 2 3 4; do
    generate_image "$slug" "$name" "$variation"
  done

  echo ""
  # Rate limit between items
  sleep 2
done

echo ""
echo "=========================================="
echo "GENERATION COMPLETE"
echo "=========================================="
echo ""
echo "Generated URLs saved to: ${TEMP_DIR}/urls.txt"
echo ""
echo "TypeScript snippet for produce.ts:"
echo ""

# Generate TypeScript snippet
current_slug=""
while IFS=':' read -r slug variation url; do
  if [ "$slug" != "$current_slug" ]; then
    if [ -n "$current_slug" ]; then
      echo "  ],"
    fi
    echo ""
    echo "  // ${slug}"
    echo "  images: ["
    current_slug="$slug"
  fi
  echo "    { src: '${url}', alt: 'Fresh ${slug} - variation ${variation}' },"
done < "${TEMP_DIR}/urls.txt"

if [ -n "$current_slug" ]; then
  echo "  ],"
fi

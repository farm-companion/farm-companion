const { createClient } = require('redis');
const fs = require('fs');

// Read Redis URL from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const redisUrlMatch = envContent.match(/REDIS_URL="([^"]+)"/);
const redisUrl = redisUrlMatch ? redisUrlMatch[1] : null;

if (!redisUrl) {
  console.error('❌ REDIS_URL not found in .env.local');
  process.exit(1);
}

async function findPhoto(photoId) {
  const redis = createClient({
    url: redisUrl,
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis');
    console.log(`\n🔍 Searching for photo: ${photoId}`);

    // Check if photo metadata exists
    const photoData = await redis.hGetAll(`photo:${photoId}`);
    if (photoData && Object.keys(photoData).length > 0) {
      console.log(`\n📷 Photo metadata found:`);
      console.log('  URL:', photoData.url);
      console.log('  Status:', photoData.status);
      console.log('  Farm Slug:', photoData.farmSlug);
      console.log('  Created At:', photoData.createdAt);
      console.log('  Author:', photoData.authorName);
      console.log('  Caption:', photoData.caption);
    } else {
      console.log(`\n❌ No photo metadata found for ${photoId}`);
    }

    // Check if in approved photos
    const isApproved = await redis.sIsMember('farm:priory-farm-shop:photos:approved', photoId);
    console.log(`\n✅ In approved photos: ${isApproved}`);

    // Check if in pending queue
    const pendingIds = await redis.lRange('moderation:queue', 0, -1);
    const isPending = pendingIds.includes(photoId);
    console.log(`\n⏳ In pending queue: ${isPending}`);

    // Check all farm approved sets
    const farmKeys = await redis.keys('farm:*:photos:approved');
    console.log(`\n🏠 Checking all farm approved sets:`);
    for (const key of farmKeys) {
      const isInFarm = await redis.sIsMember(key, photoId);
      if (isInFarm) {
        console.log(`  ✅ Found in ${key}`);
      }
    }

    // Check if blob exists
    if (photoData && photoData.url) {
      console.log(`\n🔍 Checking if blob exists...`);
      try {
        const response = await fetch(photoData.url, { method: 'HEAD' });
        console.log(`  Blob exists: ${response.ok}`);
        if (!response.ok) {
          console.log(`  Status: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`  ❌ Blob check failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.disconnect();
  }
}

// Get photo ID from command line argument or use the one from the error
const photoId = process.argv[2] || 'ad052b91-5c2d-47c6-8ef8-c697517f34a3';
findPhoto(photoId);

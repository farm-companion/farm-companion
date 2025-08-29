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

async function inspectRedis() {
  const redis = createClient({
    url: redisUrl,
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis');

    // Get all approved photo IDs for priory-farm-shop
    const approvedIds = await redis.sMembers('farm:priory-farm-shop:photos:approved');
    console.log(`\n📸 Approved photos for priory-farm-shop: ${approvedIds.length}`);
    
    if (approvedIds.length > 0) {
      console.log('Photo IDs:', approvedIds);
      
      // Get details for each photo
      for (const id of approvedIds) {
        const photoData = await redis.hGetAll(`photo:${id}`);
        console.log(`\n📷 Photo ${id}:`);
        console.log('  URL:', photoData.url);
        console.log('  Status:', photoData.status);
        console.log('  Farm Slug:', photoData.farmSlug);
        console.log('  Created At:', photoData.createdAt);
        console.log('  Author:', photoData.authorName);
        console.log('  Caption:', photoData.caption);
      }
    }

    // Get pending photos
    const pendingIds = await redis.lRange('moderation:queue', 0, -1);
    console.log(`\n⏳ Pending photos in moderation queue: ${pendingIds.length}`);
    if (pendingIds.length > 0) {
      console.log('Pending IDs:', pendingIds);
    }

    // Get all farm keys
    const farmKeys = await redis.keys('farm:*:photos:approved');
    console.log(`\n🏠 All farms with approved photos: ${farmKeys.length}`);
    farmKeys.forEach(key => {
      console.log('  ', key);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.disconnect();
  }
}

inspectRedis();

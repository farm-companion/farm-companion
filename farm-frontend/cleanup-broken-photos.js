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

async function checkBlobExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function cleanupBrokenPhotos() {
  const redis = createClient({
    url: redisUrl,
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis');

    // Get all approved photo IDs for priory-farm-shop
    const approvedIds = await redis.sMembers('farm:priory-farm-shop:photos:approved');
    console.log(`\n📸 Checking ${approvedIds.length} approved photos...`);
    
    const brokenPhotos = [];
    const validPhotos = [];

    // Check each photo
    for (const id of approvedIds) {
      const photoData = await redis.hGetAll(`photo:${id}`);
      const url = photoData.url;
      
      console.log(`\n🔍 Checking photo ${id}:`);
      console.log('  URL:', url);
      
      const exists = await checkBlobExists(url);
      
      if (exists) {
        console.log('  ✅ Photo exists in blob storage');
        validPhotos.push(id);
      } else {
        console.log('  ❌ Photo NOT found in blob storage');
        brokenPhotos.push({ id, url, photoData });
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Valid photos: ${validPhotos.length}`);
    console.log(`  ❌ Broken photos: ${brokenPhotos.length}`);

    if (brokenPhotos.length > 0) {
      console.log(`\n🗑️ Removing ${brokenPhotos.length} broken photos from Redis...`);
      
      for (const photo of brokenPhotos) {
        try {
          // Remove from approved photos set
          await redis.sRem('farm:priory-farm-shop:photos:approved', photo.id);
          
          // Delete photo metadata
          await redis.del(`photo:${photo.id}`);
          
          console.log(`  ✅ Removed photo ${photo.id}`);
        } catch (error) {
          console.error(`  ❌ Error removing photo ${photo.id}:`, error);
        }
      }
      
      console.log(`\n✅ Cleanup complete! Removed ${brokenPhotos.length} broken photos.`);
    } else {
      console.log(`\n✅ All photos are valid! No cleanup needed.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.disconnect();
  }
}

cleanupBrokenPhotos();

import dotenv from 'dotenv';
import { telegramClient } from './src/lib/telegram-client.js';
import { contentGenerator } from './src/lib/content-generator.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Debugging Telegram image posting...');

try {
  // Initialize Telegram client
  console.log('\n📱 Initializing Telegram...');
  await telegramClient.initialize();
  console.log('✅ Telegram client ready');

  // Use a specific farm for testing
  const testFarm = {
    name: "Broom House Farm Shop",
    address: "Backworth Lane, Tyne and Wear NE27 0BQ",
    url: "https://www.farmcompanion.co.uk/shop/broom-house-farm-shop",
    produce: "fresh vegetables, local produce, seasonal items"
  };

  console.log('\n🎨 Generating image...');
  const imageResult = await contentGenerator.generateFarmSpotlightWithImage(testFarm, {
    dryRun: false,
    includeImage: true
  });

  console.log('🖼️  Image generated:', imageResult.hasImage ? 'Yes' : 'No');
  console.log('📊 Image buffer size:', imageResult.imageBuffer ? imageResult.imageBuffer.length : 'No buffer');
  console.log('📊 Image buffer type:', typeof imageResult.imageBuffer);

  const testContent = "Test post with image for Broom House Farm Shop";
  const imageBuffer = imageResult.imageBuffer;

  console.log('\n📱 Testing Telegram post with image...');
  console.log('📊 Content:', testContent);
  console.log('📊 Image buffer provided:', !!imageBuffer);
  console.log('📊 Image buffer length:', imageBuffer ? imageBuffer.length : 'N/A');

  // Test the post method directly
  const result = await telegramClient.post(testContent, imageBuffer, testFarm, false);
  
  console.log('\n📊 Telegram post result:');
  console.log('- Success:', result.success);
  console.log('- Has Image:', result.hasImage);
  console.log('- Message ID:', result.messageId);
  console.log('- URL:', result.url);
  console.log('- Error:', result.error || 'None');

} catch (error) {
  console.error('❌ Debug failed:', error.message);
  console.error('📊 Full error:', error);
}

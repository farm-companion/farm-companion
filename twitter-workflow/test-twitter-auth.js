#!/usr/bin/env node

import { twitterClient } from './src/lib/twitter-client.js';

console.log('🧪 Testing Twitter Authentication...');
console.log('=====================================');

try {
  console.log('📋 Environment Variables Check:');
  console.log('TWITTER_API_KEY:', process.env.TWITTER_API_KEY ? 'SET' : 'NOT SET');
  console.log('TWITTER_API_SECRET:', process.env.TWITTER_API_SECRET ? 'SET' : 'NOT SET');
  console.log('TWITTER_ACCESS_TOKEN:', process.env.TWITTER_ACCESS_TOKEN ? 'SET' : 'NOT SET');
  console.log('TWITTER_ACCESS_TOKEN_SECRET:', process.env.TWITTER_ACCESS_TOKEN_SECRET ? 'SET' : 'NOT SET');
  console.log('TWITTER_CLIENT_ID:', process.env.TWITTER_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('TWITTER_CLIENT_SECRET:', process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT SET');
  
  console.log('\n🔐 Testing Twitter client initialization...');
  const result = await twitterClient.initialize();
  console.log('✅ Twitter client initialized successfully');
  
} catch (error) {
  console.log('❌ Twitter client failed:', error.message);
  console.log('Stack:', error.stack);
}

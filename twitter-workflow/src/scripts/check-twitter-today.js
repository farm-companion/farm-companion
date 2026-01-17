#!/usr/bin/env node

import { twitterClient } from '../lib/twitter-client.js';

console.log('🔍 Checking if Twitter workflow ran today...');
console.log('');

try {
  // Get current date info
  const now = new Date();
  const today = now.toISOString().slice(0,10);
  const londonTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);

  console.log('📅 Today is:', londonTime);
  console.log('🕘 Current time (Europe/London):', new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(now));
  console.log('');

  // Get recent tweets from the account
  const user = await twitterClient.v2.userByUsername('FarmCompanion');
  console.log('👤 Twitter account:', user.data.username);
  console.log('🆔 User ID:', user.data.id);
  console.log('');

  // Get recent tweets
  const tweets = await twitterClient.v2.userTimeline(user.data.id, {
    max_results: 10,
    'tweet.fields': ['created_at', 'text', 'public_metrics', 'attachments']
  });

  console.log('📊 Recent tweets found:', tweets.data?.data?.length || 0);
  console.log('');

  if (tweets.data?.data?.length > 0) {
    const todayTweets = tweets.data.data.filter(tweet => 
      tweet.created_at.startsWith(today)
    );

    console.log('📅 Tweets from today:', todayTweets.length);
    console.log('');

    if (todayTweets.length > 0) {
      console.log('✅ WORKFLOW RAN TODAY');
      console.log('📝 Tweets posted today:');
      todayTweets.forEach((tweet, i) => {
        const tweetTime = new Date(tweet.created_at).toLocaleString('en-GB', {
          timeZone: 'Europe/London',
          hour: '2-digit',
          minute: '2-digit'
        });
        const hasImage = tweet.attachments?.media_keys ? '🖼️' : '📝';
        console.log(`  ${i+1}. ${tweetTime} ${hasImage} ${tweet.text.substring(0, 80)}...`);
        console.log(`     Likes: ${tweet.public_metrics.like_count}, Retweets: ${tweet.public_metrics.retweet_count}`);
      });
      console.log('');
      console.log('🎉 The daily farm spotlight was posted successfully!');
    } else {
      console.log('❌ WORKFLOW HAS NOT RUN TODAY');
      console.log('📝 Latest tweet:');
      const latest = tweets.data.data[0];
      const tweetTime = new Date(latest.created_at).toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const hasImage = latest.attachments?.media_keys ? '🖼️' : '📝';
      console.log(`  ${tweetTime} ${hasImage} ${latest.text.substring(0, 80)}...`);
      console.log('');
      console.log('⚠️  The daily farm spotlight has NOT been posted today');
      console.log('🕘 Expected run time: 09:05 Europe/London (08:05 UTC)');
      console.log('⏰ Current time is past the expected run time');
    }
  } else {
    console.log('❌ No recent tweets found');
    console.log('🔧 This might indicate an issue with the Twitter API or account');
  }

} catch (error) {
  console.error('❌ Error checking Twitter:', error.message);
  console.log('');
  console.log('🔧 To check manually, visit: https://twitter.com/FarmCompanion');
  console.log('🔧 Or run the workflow manually: node src/scripts/live-run.js');
}

console.log('');
console.log('🔧 Manual options:');
console.log('  npm run test:complete  (dry run)');
console.log('  node src/scripts/live-run.js  (live run)');

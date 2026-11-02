#!/usr/bin/env node

console.log('🔍 Checking if Twitter workflow ran today...');
console.log('');

// Get current date info
const now = new Date();
const today = now.toISOString().split('T')[0];
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

// Check if workflow already ran today
const workflowId = `spotlight-${today}`;
console.log('🔍 Checking idempotency for today...');
console.log('📋 Workflow ID:', workflowId);
console.log('');

try {
  // Import the setOnceToday function
  const { setOnceToday } = await import('../lib/workflow-orchestrator.js');
  
  // Check if already ran today
  const alreadyRan = await setOnceToday(workflowId);
  
  if (alreadyRan) {
    console.log('✅ WORKFLOW ALREADY RAN TODAY');
    console.log('🚫 Idempotency check: PREVENTED (already executed)');
    console.log('');
    console.log('📊 This means:');
    console.log('  - The daily farm spotlight was posted earlier today');
    console.log('  - The system is working correctly');
    console.log('  - No duplicate posts will be made');
  } else {
    console.log('❌ WORKFLOW HAS NOT RUN TODAY');
    console.log('⚠️  Idempotency check: ALLOWED (not yet executed)');
    console.log('');
    console.log('📊 This means:');
    console.log('  - The daily farm spotlight has NOT been posted today');
    console.log('  - The cron job may have failed or not triggered');
    console.log('  - Manual execution may be needed');
    console.log('');
    console.log('🕘 Expected run time: 09:05 Europe/London (08:05 UTC)');
    console.log('⏰ Current time is past the expected run time');
  }
  
} catch (error) {
  console.error('❌ Error checking idempotency:', error.message);
  console.error('Stack:', error.stack);
}

console.log('');
console.log('🔧 To manually run the workflow:');
console.log('  npm run test:complete  (dry run)');
console.log('  node src/scripts/live-run.js  (live run)');

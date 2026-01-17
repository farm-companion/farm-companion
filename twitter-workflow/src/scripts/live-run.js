#!/usr/bin/env node

import { workflowOrchestrator } from '../lib/workflow-orchestrator.js';

console.log('🚀 Running LIVE Twitter Workflow...');
console.log('⚠️  This will post a REAL tweet to Twitter!');
console.log('');

try {
  const result = await workflowOrchestrator.executeDailySpotlight({ dryRun: false });
  
  console.log('');
  console.log('✅ Live workflow completed successfully!');
  console.log('📊 Result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Live workflow failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Node function (Vercel) – no NextRequest/NextResponse imports
import { workflowOrchestrator } from '../../../lib/workflow-orchestrator.js';
import { monitoringSystem } from '../../../lib/monitoring.js';

/**
 * Vercel Cron Job Handler for Daily Farm Spotlight
 * 
 * This endpoint is triggered by Vercel's cron service at 09:05 Europe/London (08:05 UTC)
 * Schedule: "5 8 * * *" (5 minutes past 8 AM UTC = 9:05 AM London time)
 * 
 * Security: Validates the x-vercel-cron header to ensure only Vercel can trigger this
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const workflowId = `cron-${new Date().toISOString().slice(0, 10)}`;
  
  try {
    // 1) Verify scheduled invocation
    const isCron = req.headers['x-vercel-cron'] === '1';
    if (!isCron) {
      console.error('❌ Not a Vercel cron call');
      return res.status(401).json({ 
        error: 'Unauthorized (not a Vercel cron call)', 
        workflowId 
      });
    }

    // 2) Optional extra guard with a shared secret in query (supports local hits):
    // /api/cron/daily-farm-spotlight?token=YOUR_SECRET
    const token = req.query?.token;
    const required = process.env.CRON_SECRET;
    if (required && token !== required) {
      console.error('❌ Invalid cron secret');
      return res.status(401).json({ 
        error: 'Unauthorized (bad token)', 
        workflowId 
      });
    }

    // Check if we're in maintenance mode
    if (process.env.MAINTENANCE_MODE === 'true') {
      console.log('⚠️  Maintenance mode enabled, skipping daily spotlight');
      return res.status(200).json({ 
        success: true,
        message: 'Maintenance mode - workflow skipped',
        workflowId,
        timestamp: new Date().toISOString()
      });
    }

    // Perform pre-flight checks
    const preflightResult = await performPreflightChecks();
    if (!preflightResult.success) {
      console.error('❌ Pre-flight checks failed:', preflightResult.error);
      return res.status(500).json({
        success: false,
        error: `Pre-flight check failed: ${preflightResult.error}`,
        workflowId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🚀 Starting daily farm spotlight workflow: ${workflowId}`);
    
    // Execute the daily spotlight workflow
    const result = await workflowOrchestrator.executeDailySpotlight({ 
      workflowId, 
      source: 'cron' 
    });
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ Daily farm spotlight completed successfully in ${duration}ms`);
      
      // Send success notification
      await monitoringSystem.sendSuccessNotification({
        workflowId,
        farm: result.farm,
        tweetId: result.tweetId,
        duration,
        source: 'cron'
      });
      
      return res.status(200).json({
        success: true,
        message: 'Daily farm spotlight posted successfully',
        workflowId,
        durationMs: duration,
        tweetId: result.tweetId,
        farm: result.farm?.name,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ Daily farm spotlight failed: ${result.error}`);
      
      // Send error notification
      await monitoringSystem.sendErrorNotification({
        workflowId,
        error: result.error,
        duration,
        source: 'cron'
      });
      
      return res.status(500).json({
        success: false,
        error: result.error || 'Unknown error occurred',
        workflowId,
        durationMs: duration,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Unexpected error in daily farm spotlight: ${error.message}`);
    
    // Send error notification
    await monitoringSystem.sendErrorNotification({
      workflowId,
      error: error.message,
      duration,
      source: 'cron'
    });
    
    return res.status(500).json({
      success: false,
      error: error.message,
      workflowId,
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Perform pre-flight checks to ensure the system is ready
 */
async function performPreflightChecks() {
  try {
    // Check required environment variables
    const requiredEnvVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET', 
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_TOKEN_SECRET'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        return { success: false, error: `Missing required environment variable: ${envVar}` };
      }
    }
    
    // Check if posting is enabled
    if (process.env.POSTING_ENABLED === 'false') {
      return { success: false, error: 'Posting is disabled via POSTING_ENABLED=false' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
// Node function (Vercel) – no NextRequest/NextResponse imports
import { workflowOrchestrator } from '../../../lib/workflow-orchestrator.js';
import { monitoringSystem } from '../../../lib/monitoring.js';

/**
 * External Cron Job Handler for Dual Daily Farm Spotlight
 * 
 * This endpoint is triggered by external cron services (cron-job.org) at optimal times:
 * - 10:00 AM GMT (10:00 UTC) - Morning post
 * - 7:00 PM GMT (19:00 UTC) - Evening post
 * 
 * Security: Validates query token or x-vercel-cron header for authorization
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const workflowId = `dual-cron-${new Date().toISOString().slice(0, 10)}`;
  
  try {
    // 1) Verify authorization - support both Vercel cron and external cron services
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const token = req.query?.token;
    const required = process.env.CRON_SECRET;
    
    // Allow if it's a Vercel cron OR if token matches (for external cron services)
    const isAuthorized = isVercelCron || (required && token === required);
    
    if (!isAuthorized) {
      console.error('❌ Unauthorized cron call');
      return res.status(401).json({ 
        error: 'Unauthorized - valid token required', 
        workflowId,
        hint: 'Add ?token=YOUR_CRON_SECRET to the URL'
      });
    }

    // Check if we're in maintenance mode
    if (process.env.MAINTENANCE_MODE === 'true') {
      console.log('⚠️  Maintenance mode enabled, skipping dual spotlight');
      return res.status(200).json({ 
        success: true,
        message: 'Maintenance mode - dual workflow skipped',
        workflowId,
        timestamp: new Date().toISOString()
      });
    }

    // Determine which post this is based on current time
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Only post at exactly 10:00 AM and 7:00 PM UTC
    const isMorningPost = currentHour === 10 && currentMinute === 0;
    const isEveningPost = currentHour === 19 && currentMinute === 0;
    
    if (!isMorningPost && !isEveningPost) {
      console.log(`⏰ Not posting time (current: ${currentHour}:${currentMinute.toString().padStart(2, '0')} UTC), skipping`);
      return res.status(200).json({ 
        success: true,
        message: 'Not posting time',
        workflowId,
        currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')} UTC`,
        nextPostingTimes: {
          morning: '10:00 UTC',
          evening: '19:00 UTC'
        },
        timestamp: new Date().toISOString()
      });
    }

    const postType = isMorningPost ? 'morning' : 'evening';
    console.log(`🚀 Starting ${postType} dual farm spotlight workflow: ${workflowId}`);

    // Perform pre-flight checks
    const preflightResult = await performPreflightChecks();
    if (!preflightResult.success) {
      console.error('❌ Pre-flight checks failed:', preflightResult.error);
      return res.status(500).json({ 
        error: 'Pre-flight checks failed', 
        details: preflightResult.error,
        workflowId 
      });
    }

    // Execute dual spotlight workflow
    const result = await workflowOrchestrator.executeDualDailySpotlight({
      dryRun: false, // Always live in production
      postType: postType,
      scheduled: true
    });

    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ ${postType} dual spotlight completed successfully in ${duration}ms`);
      
      // Send success notification
      await monitoringSystem.sendSuccessNotification({
        workflowId,
        type: 'dual-spotlight',
        postType: postType,
        results: result,
        metrics: {
          duration,
          postsCount: result.posts?.length || 0,
          successfulPosts: result.posts?.filter(p => p.success && !p.skipped).length || 0
        }
      });

      return res.status(200).json({ 
        success: true,
        workflowId,
        postType,
        results: {
          postsCount: result.posts?.length || 0,
          successfulPosts: result.posts?.filter(p => p.success && !p.skipped).length || 0,
          duration: Math.round(duration / 1000) + 's'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ ${postType} dual spotlight failed:`, result.error);
      
      // Send failure notification
      await monitoringSystem.sendFailureNotification({
        workflowId,
        type: 'dual-spotlight',
        postType: postType,
        error: result.error,
        duration
      });

      return res.status(500).json({ 
        error: 'Dual spotlight workflow failed', 
        details: result.error,
        workflowId,
        postType,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Fatal error in dual spotlight cron:', error.message);
    
    // Send failure notification
    await monitoringSystem.sendFailureNotification({
      workflowId,
      type: 'dual-spotlight',
      error: error.message,
      duration
    });

    return res.status(500).json({ 
      error: 'Fatal error in dual spotlight cron', 
      details: error.message,
      workflowId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Perform pre-flight checks before executing the workflow
 */
async function performPreflightChecks() {
  try {
    // Check if posting is enabled
    if (process.env.POSTING_ENABLED !== 'true') {
      return { success: false, error: 'Posting is disabled' };
    }

    // Check if content generation is enabled
    if (process.env.CONTENT_GENERATION_ENABLED !== 'true') {
      return { success: false, error: 'Content generation is disabled' };
    }

    // Check required environment variables
    const requiredVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET', 
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_TOKEN_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      return { 
        success: false, 
        error: `Missing required environment variables: ${missingVars.join(', ')}` 
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

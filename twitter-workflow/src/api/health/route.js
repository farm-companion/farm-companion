import { monitoringSystem } from '../../lib/monitoring.js';

/**
 * Health Check Endpoint
 * 
 * This endpoint provides health status for the Twitter workflow system
 * Can be used for monitoring and alerting
 */
export default async function handler(req, res) {
  try {
    console.log('🏥 Performing health check...');
    
    const healthResult = await monitoringSystem.performHealthCheck();
    
    if (healthResult.success) {
      const { healthCheck } = healthResult;
      
      // Determine HTTP status based on overall health
      let statusCode = 200;
      if (healthCheck.overall === 'unhealthy') {
        statusCode = 503; // Service Unavailable
      } else if (healthCheck.overall === 'degraded') {
        statusCode = 200; // OK but with warnings
      }
      
      return res.status(statusCode).json({
        status: 'success',
        timestamp: healthCheck.timestamp,
        overall: healthCheck.overall,
        components: healthCheck.components,
        message: getHealthMessage(healthCheck.overall)
      });
    } else {
      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        overall: 'unhealthy',
        error: healthResult.healthCheck.error,
        message: 'Health check failed'
      });
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      overall: 'unhealthy',
      error: error.message,
      message: 'Health check failed with exception'
    });
  }
}

/**
 * Get health status message
 */
function getHealthMessage(overall) {
  switch (overall) {
    case 'healthy':
      return 'All systems operational';
    case 'degraded':
      return 'System operational with some degraded functionality';
    case 'unhealthy':
      return 'System experiencing issues';
    default:
      return 'Unknown health status';
  }
}

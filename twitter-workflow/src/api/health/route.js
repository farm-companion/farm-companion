import { NextRequest, NextResponse } from 'next/server';
import { monitoringSystem } from '../../lib/monitoring.js';

/**
 * Health Check Endpoint
 * 
 * This endpoint provides health status for the Twitter workflow system
 * Can be used for monitoring and alerting
 */
export async function GET(request) {
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
      
      return NextResponse.json({
        status: 'success',
        timestamp: healthCheck.timestamp,
        overall: healthCheck.overall,
        components: healthCheck.components,
        message: getHealthMessage(healthCheck.overall)
      }, { status: statusCode });
    } else {
      return NextResponse.json({
        status: 'error',
        timestamp: new Date().toISOString(),
        overall: 'unhealthy',
        error: healthResult.healthCheck.error,
        message: 'Health check failed'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      overall: 'unhealthy',
      error: error.message,
      message: 'Health check failed with exception'
    }, { status: 503 });
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

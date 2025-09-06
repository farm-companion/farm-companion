#!/usr/bin/env node

/**
 * Core Web Vitals Monitoring Script
 * Real-time performance monitoring and alerting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Core Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },        // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint (ms)
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte (ms)
};

// Performance monitoring configuration
const MONITORING_CONFIG = {
  interval: 30000, // 30 seconds
  maxSamples: 100,
  alertThreshold: 0.8, // Alert if 80% of samples are poor
  retentionDays: 7,
};

// Performance data storage
let performanceData = {
  samples: [],
  alerts: [],
  lastUpdate: new Date().toISOString(),
};

// Load existing performance data
function loadPerformanceData() {
  const dataFile = './performance-data.json';
  if (fs.existsSync(dataFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      performanceData = { ...performanceData, ...data };
      log(`${colors.green}✓ Loaded ${performanceData.samples.length} performance samples${colors.reset}`);
    } catch (error) {
      log(`${colors.yellow}⚠️  Could not load performance data: ${error.message}${colors.reset}`);
    }
  }
}

// Save performance data
function savePerformanceData() {
  const dataFile = './performance-data.json';
  performanceData.lastUpdate = new Date().toISOString();
  
  try {
    fs.writeFileSync(dataFile, JSON.stringify(performanceData, null, 2));
    log(`${colors.green}✓ Performance data saved${colors.reset}`);
  } catch (error) {
    log(`${colors.red}✗ Failed to save performance data: ${error.message}${colors.reset}`);
  }
}

// Get current performance metrics
function getCurrentMetrics() {
  return new Promise((resolve) => {
    const command = `npx lighthouse http://localhost:3000 --only-categories=performance --output=json --chrome-flags="--headless --no-sandbox" --quiet`;
    
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      const report = JSON.parse(output);
      const audits = report.audits;
      
      const metrics = {
        timestamp: new Date().toISOString(),
        LCP: audits['largest-contentful-paint']?.numericValue || 0,
        FID: audits['max-potential-fid']?.numericValue || 0,
        CLS: audits['cumulative-layout-shift']?.numericValue || 0,
        INP: audits['interactive']?.numericValue || 0,
        FCP: audits['first-contentful-paint']?.numericValue || 0,
        TTFB: audits['server-response-time']?.numericValue || 0,
        performanceScore: report.categories.performance?.score * 100 || 0,
      };
      
      resolve(metrics);
    } catch (error) {
      log(`${colors.red}✗ Failed to get performance metrics: ${error.message}${colors.reset}`);
      resolve(null);
    }
  });
}

// Analyze performance metrics
function analyzeMetrics(metrics) {
  const analysis = {
    timestamp: metrics.timestamp,
    scores: {},
    overall: 'good',
    issues: []
  };
  
  for (const [metric, value] of Object.entries(metrics)) {
    if (metric === 'timestamp' || metric === 'performanceScore') continue;
    
    const threshold = WEB_VITALS_THRESHOLDS[metric];
    if (!threshold) continue;
    
    let score = 'good';
    if (value > threshold.poor) {
      score = 'poor';
      analysis.issues.push(`${metric} is poor: ${value.toFixed(2)}ms (threshold: ${threshold.poor}ms)`);
    } else if (value > threshold.good) {
      score = 'needs-improvement';
      analysis.issues.push(`${metric} needs improvement: ${value.toFixed(2)}ms (threshold: ${threshold.good}ms)`);
    }
    
    analysis.scores[metric] = {
      value,
      score,
      threshold: threshold.good
    };
  }
  
  // Determine overall score
  const scores = Object.values(analysis.scores).map(s => s.score);
  if (scores.includes('poor')) {
    analysis.overall = 'poor';
  } else if (scores.includes('needs-improvement')) {
    analysis.overall = 'needs-improvement';
  }
  
  return analysis;
}

// Check for performance regressions
function checkForRegressions(newAnalysis) {
  if (performanceData.samples.length < 10) return;
  
  const recentSamples = performanceData.samples.slice(-10);
  const regressions = [];
  
  for (const [metric, newScore] of Object.entries(newAnalysis.scores)) {
    const recentScores = recentSamples.map(s => s.scores[metric]?.score).filter(Boolean);
    const recentAverage = recentScores.length > 0 ? 
      recentScores.filter(s => s === 'good').length / recentScores.length : 1;
    
    const currentScore = newScore.score === 'good' ? 1 : newScore.score === 'needs-improvement' ? 0.5 : 0;
    
    if (currentScore < recentAverage - 0.3) {
      regressions.push({
        metric,
        previous: recentAverage,
        current: currentScore,
        severity: 'high'
      });
    }
  }
  
  return regressions;
}

// Generate performance alerts
function generateAlerts(analysis, regressions) {
  const alerts = [];
  
  // Performance degradation alerts
  if (analysis.overall === 'poor') {
    alerts.push({
      type: 'performance',
      severity: 'critical',
      message: 'Performance is poor across multiple metrics',
      details: analysis.issues,
      timestamp: new Date().toISOString()
    });
  }
  
  // Regression alerts
  for (const regression of regressions) {
    alerts.push({
      type: 'regression',
      severity: regression.severity,
      message: `Performance regression detected in ${regression.metric}`,
      details: {
        metric: regression.metric,
        previous: regression.previous,
        current: regression.current
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Individual metric alerts
  for (const [metric, score] of Object.entries(analysis.scores)) {
    if (score.score === 'poor') {
      alerts.push({
        type: 'metric',
        severity: 'high',
        message: `${metric} is performing poorly`,
        details: {
          metric,
          value: score.value,
          threshold: score.threshold
        },
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return alerts;
}

// Display performance dashboard
function displayDashboard(analysis, regressions, alerts) {
  console.clear();
  log(`${colors.bright}⚡ Core Web Vitals Dashboard${colors.reset}`);
  log(`${colors.cyan}Last updated: ${new Date().toLocaleString()}${colors.reset}`);
  log(`${colors.cyan}Total samples: ${performanceData.samples.length}${colors.reset}`);
  
  // Overall performance status
  const overallColor = analysis.overall === 'good' ? colors.green : 
                      analysis.overall === 'needs-improvement' ? colors.yellow : colors.red;
  log(`\n${colors.bright}Overall Performance: ${overallColor}${analysis.overall.toUpperCase()}${colors.reset}`);
  
  // Core Web Vitals
  log(`\n${colors.bright}Core Web Vitals:${colors.reset}`);
  for (const [metric, score] of Object.entries(analysis.scores)) {
    const color = score.score === 'good' ? colors.green : 
                  score.score === 'needs-improvement' ? colors.yellow : colors.red;
    const status = score.score === 'good' ? '✓' : score.score === 'needs-improvement' ? '⚠' : '✗';
    log(`${color}${status} ${metric}: ${score.value.toFixed(2)}ms${colors.reset}`);
  }
  
  // Performance score
  const scoreColor = analysis.performanceScore >= 90 ? colors.green : 
                     analysis.performanceScore >= 50 ? colors.yellow : colors.red;
  log(`\n${colors.bright}Performance Score: ${scoreColor}${analysis.performanceScore.toFixed(1)}/100${colors.reset}`);
  
  // Recent trends
  if (performanceData.samples.length > 1) {
    log(`\n${colors.bright}Recent Trends:${colors.reset}`);
    const recentSamples = performanceData.samples.slice(-5);
    const trends = {};
    
    for (const metric of Object.keys(WEB_VITALS_THRESHOLDS)) {
      const values = recentSamples.map(s => s.scores[metric]?.value).filter(v => v !== undefined);
      if (values.length > 1) {
        const trend = values[values.length - 1] - values[0];
        trends[metric] = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
      }
    }
    
    for (const [metric, trend] of Object.entries(trends)) {
      const color = trend === '↘' ? colors.green : trend === '↗' ? colors.red : colors.cyan;
      log(`${color}${trend} ${metric}${colors.reset}`);
    }
  }
  
  // Alerts
  if (alerts.length > 0) {
    log(`\n${colors.bright}Active Alerts:${colors.reset}`);
    for (const alert of alerts) {
      const color = alert.severity === 'critical' ? colors.red : 
                    alert.severity === 'high' ? colors.yellow : colors.blue;
      log(`${color}⚠ ${alert.message}${colors.reset}`);
    }
  }
  
  // Recommendations
  if (analysis.issues.length > 0) {
    log(`\n${colors.bright}Recommendations:${colors.reset}`);
    for (const issue of analysis.issues) {
      log(`${colors.yellow}• ${issue}${colors.reset}`);
    }
  }
}

// Clean up old data
function cleanupOldData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MONITORING_CONFIG.retentionDays);
  
  performanceData.samples = performanceData.samples.filter(sample => 
    new Date(sample.timestamp) > cutoffDate
  );
  
  performanceData.alerts = performanceData.alerts.filter(alert => 
    new Date(alert.timestamp) > cutoffDate
  );
  
  // Keep only recent samples
  if (performanceData.samples.length > MONITORING_CONFIG.maxSamples) {
    performanceData.samples = performanceData.samples.slice(-MONITORING_CONFIG.maxSamples);
  }
}

// Main monitoring loop
async function startMonitoring() {
  log(`${colors.bright}⚡ Starting Core Web Vitals Monitoring${colors.reset}`);
  log(`${colors.cyan}Monitoring interval: ${MONITORING_CONFIG.interval / 1000}s${colors.reset}`);
  log(`${colors.cyan}Press Ctrl+C to stop${colors.reset}`);
  
  loadPerformanceData();
  
  const monitor = async () => {
    try {
      const metrics = await getCurrentMetrics();
      if (!metrics) return;
      
      const analysis = analyzeMetrics(metrics);
      const regressions = checkForRegressions(analysis);
      const alerts = generateAlerts(analysis, regressions);
      
      // Add to performance data
      performanceData.samples.push(analysis);
      performanceData.alerts.push(...alerts);
      
      // Clean up old data
      cleanupOldData();
      
      // Save data
      savePerformanceData();
      
      // Display dashboard
      displayDashboard(analysis, regressions, alerts);
      
    } catch (error) {
      log(`${colors.red}✗ Monitoring error: ${error.message}${colors.reset}`);
    }
  };
  
  // Initial run
  await monitor();
  
  // Set up interval
  const interval = setInterval(monitor, MONITORING_CONFIG.interval);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log(`\n${colors.yellow}Stopping monitoring...${colors.reset}`);
    clearInterval(interval);
    savePerformanceData();
    process.exit(0);
  });
}

// Generate performance report
function generateReport() {
  if (performanceData.samples.length === 0) {
    log(`${colors.yellow}No performance data available${colors.reset}`);
    return;
  }
  
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalSamples: performanceData.samples.length,
      monitoringPeriod: {
        start: performanceData.samples[0]?.timestamp,
        end: performanceData.samples[performanceData.samples.length - 1]?.timestamp
      }
    },
    metrics: {},
    trends: {},
    alerts: performanceData.alerts,
    recommendations: []
  };
  
  // Calculate averages and trends
  for (const metric of Object.keys(WEB_VITALS_THRESHOLDS)) {
    const values = performanceData.samples.map(s => s.scores[metric]?.value).filter(v => v !== undefined);
    if (values.length > 0) {
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      report.metrics[metric] = {
        average: average.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        samples: values.length
      };
      
      // Calculate trend
      if (values.length > 1) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        report.trends[metric] = {
          percentage: trend.toFixed(2),
          direction: trend > 5 ? 'worsening' : trend < -5 ? 'improving' : 'stable'
        };
      }
    }
  }
  
  // Generate recommendations
  for (const [metric, data] of Object.entries(report.metrics)) {
    const threshold = WEB_VITALS_THRESHOLDS[metric];
    if (parseFloat(data.average) > threshold.good) {
      report.recommendations.push(`Optimize ${metric} - current average: ${data.average}ms, target: ${threshold.good}ms`);
    }
  }
  
  // Save report
  const reportFile = './performance-monitoring-report.json';
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`${colors.green}✓ Performance report generated: ${reportFile}${colors.reset}`);
  
  return report;
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'monitor':
      await startMonitoring();
      break;
    case 'report':
      loadPerformanceData();
      generateReport();
      break;
    default:
      log(`${colors.bright}Core Web Vitals Monitoring Tool${colors.reset}`);
      log(`\nUsage:`);
      log(`  node scripts/monitor-web-vitals.js monitor  - Start real-time monitoring`);
      log(`  node scripts/monitor-web-vitals.js report   - Generate performance report`);
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getCurrentMetrics,
  analyzeMetrics,
  checkForRegressions,
  generateAlerts,
  generateReport,
  startMonitoring,
};

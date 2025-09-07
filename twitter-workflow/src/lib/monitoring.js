import axios from 'axios';

// Only load dotenv locally; Vercel injects env at runtime.
if (process.env.NODE_ENV !== 'production') {
  try { 
    const dotenv = await import('dotenv');
    dotenv.default.config?.();
  } catch {}
}

/**
 * Monitoring and Alerting System for Twitter Workflow
 * - Slack Incoming Webhook (Block Kit)
 * - Health checks with clear status object
 * - Robust retries (429/5xx) + jitter
 */
export class MonitoringSystem {
  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.enabled = Boolean(this.slackWebhookUrl);
    this.retryAttempts = 3;
    this.baseDelayMs = 1000;
    this.useEmojis = false; // set true if you want emojis in Slack messages
  }

  /* ------------ Public API ------------ */

  async sendSuccessNotification(data) {
    if (!this.enabled) return { success: true, skipped: true };
    try {
      const payload = this.buildSuccessMessage(data);
      const result = await this.sendSlackMessage(payload);
      if (result.success) console.log('Success notification sent to Slack');
      return result;
    } catch (e) {
      console.error('Failed to send success notification:', e.message);
      return { success: false, error: e.message };
    }
  }

  async sendErrorNotification(data) {
    if (!this.enabled) return { success: true, skipped: true };
    try {
      const payload = this.buildErrorMessage(data);
      const result = await this.sendSlackMessage(payload);
      if (result.success) console.log('Error notification sent to Slack');
      return result;
    } catch (e) {
      console.error('Failed to send error notification:', e.message);
      return { success: false, error: e.message };
    }
  }

  async sendHealthCheckNotification(data) {
    if (!this.enabled) return { success: true, skipped: true };
    try {
      const payload = this.buildHealthCheckMessage(data);
      const result = await this.sendSlackMessage(payload);
      if (result.success) console.log('Health check notification sent to Slack');
      return result;
    } catch (e) {
      console.error('Failed to send health check notification:', e.message);
      return { success: false, error: e.message };
    }
  }

  /* ------------ Builders (Slack Block Kit) ------------ */

  buildSuccessMessage(data) {
    const { workflowId, farm = {}, content = '', tweetId } = data;
    const title = this.useEmojis ? '✅ Daily Farm Spotlight Posted' : 'Daily Farm Spotlight Posted';
    const farmName = farm.name || 'Unknown farm';
    const loc = [farm.town, farm.county ?? farm.location?.county].filter(Boolean).join(', ') || 'UK';

    return {
      text: title,
      blocks: [
        section(`*${title}*`),
        section(`*Farm:* ${farmName}\n*Location:* ${loc}`),
        section(`*Content:*\n${codeFence(content)}`),
        context([`Tweet ID: ${tweetId || 'N/A'}`, `Workflow ID: ${workflowId || 'N/A'}`])
      ]
    };
  }

  buildErrorMessage(data) {
    const { workflowId, error, steps, duration } = data;
    const title = this.useEmojis ? '❌ Daily Farm Spotlight Failed' : 'Daily Farm Spotlight Failed';
    const failed = steps ? Object.keys(steps).join(', ') : 'N/A';
    const dur = typeof duration === 'number' ? `${Math.round(duration / 1000)}s` : 'N/A';

    return {
      text: title,
      blocks: [
        section(`*${title}*`),
        section(`*Error:*\n${codeFence(error || 'Unknown error')}`),
        fields([`*Workflow ID:*\n${workflowId || 'N/A'}`, `*Duration:*\n${dur}`]),
        section(`*Failed Steps:*\n${failed}`)
      ]
    };
  }

  buildHealthCheckMessage(data) {
    // Expect a full status object, not a string
    // {
    //   status: { overall: 'healthy' | 'degraded' | 'unhealthy' },
    //   farmStats: { totalFarms: number } | undefined,
    //   twitterStatus: boolean,
    //   contentStatus: boolean
    // }
    const { status, farmStats, twitterStatus, contentStatus } = data;
    const overall = status?.overall || 'unhealthy';
    const header =
      overall === 'healthy'
        ? (this.useEmojis ? '✅ Workflow Health: Healthy' : 'Workflow Health: Healthy')
        : (this.useEmojis ? '⚠️ Workflow Health: Attention Needed' : 'Workflow Health: Attention Needed');

    return {
      text: header,
      blocks: [
        section(`*${header}*`),
        fields([
          `*Overall:*\n${overall}`,
          `*Farm Data:*\n${farmStats?.totalFarms ? `${farmStats.totalFarms} farms` : 'Not accessible'}`,
          `*Twitter API:*\n${twitterStatus ? 'Connected' : 'Not accessible'}`,
          `*Content Generation:*\n${contentStatus ? 'Working' : 'Fallback'}`
        ])
      ]
    };
  }

  /* ------------ Transport with retries ------------ */

  async sendSlackMessage(payload) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const r = await axios.post(this.slackWebhookUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
          validateStatus: () => true // handle manually
        });
        const ok = r.status === 200 && (typeof r.data === 'string' ? r.data.trim() === 'ok' : true);
        if (ok) return { success: true };

        const errMsg = `Slack returned ${r.status} ${r.statusText || ''}`.trim();
        throw new Error(errMsg);
      } catch (err) {
        const status = err?.response?.status;
        const body = err?.response?.data;
        const msg = `Attempt ${attempt} failed${status ? ` (HTTP ${status})` : ''}${body ? `: ${stringify(body)}` : ''}`;
        console.error(msg);

        // Retry only on 429/5xx
        const retryable = status === 429 || (status >= 500 || !status);
        if (!retryable || attempt === this.retryAttempts) {
          return { success: false, error: err?.message || 'Slack post failed' };
        }
        const jitter = Math.floor(Math.random() * 250);
        const backoff = Math.min(5000, this.baseDelayMs * 2 ** (attempt - 1)) + jitter;
        await sleep(backoff);
      }
    }
  }

  /* ------------ Health + Metrics ------------ */

  async performHealthCheck() {
    const result = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      components: {}
    };

    try {
      // Farm data
      const { farmSelector } = await import('./farm-selector.js');
      const farmStats = await farmSelector.getSelectionStats();
      result.components.farmData = {
        status: farmStats?.success ? 'healthy' : 'unhealthy',
        details: farmStats?.success ? farmStats.stats : farmStats?.error
      };

      // Twitter
      const { twitterClient } = await import('./twitter-client.js');
      const twitterStatus = await twitterClient.testConnection();
      result.components.twitter = {
        status: twitterStatus?.success ? 'healthy' : 'unhealthy',
        details: twitterStatus?.success ? twitterStatus.rateLimit : twitterStatus?.error
      };

      // Content
      const { contentGenerator } = await import('./content-generator.js');
      const contentTest = await contentGenerator.testContentGeneration();
      result.components.contentGeneration = {
        status: contentTest?.success ? 'healthy' : 'degraded',
        details: contentTest?.success ? 'AI generation working' : 'Using fallback content'
      };

      const statuses = Object.values(result.components).map(c => c.status);
      if (statuses.includes('unhealthy')) result.overall = 'unhealthy';
      else if (statuses.includes('degraded')) result.overall = 'degraded';

      return { success: true, healthCheck: result };
    } catch (e) {
      result.overall = 'unhealthy';
      result.error = e.message;
      return { success: false, healthCheck: result };
    }
  }

  async sendPeriodicHealthCheck() {
    try {
      const { success, healthCheck } = await this.performHealthCheck();
      if (success) {
        await this.sendHealthCheckNotification({
          status: { overall: healthCheck.overall }, // FIX: pass object, not string
          farmStats: healthCheck.components.farmData?.details,
          twitterStatus: healthCheck.components.twitter?.status === 'healthy',
          contentStatus: healthCheck.components.contentGeneration?.status === 'healthy'
        });
      }
      return { success, healthCheck };
    } catch (e) {
      console.error('Failed to perform health check:', e.message);
      return { success: false, error: e.message };
    }
  }

  logPerformanceMetrics(metrics) {
    const logData = {
      timestamp: new Date().toISOString(),
      workflowId: metrics.workflowId,
      duration: metrics.duration,
      farmIndex: metrics.farmIndex,
      totalFarms: metrics.totalFarms,
      contentLength: metrics.contentLength,
      executionTime: metrics.executionTime
    };
    console.log('Performance Metrics:', JSON.stringify(logData));
  }

  async testMonitoring() {
    const successResult = await this.sendSuccessNotification({
      workflowId: 'test-workflow',
      farm: { name: 'Test Farm', town: 'Testtown', county: 'Testshire' },
      content: 'Test content for monitoring system',
      tweetId: 'test-tweet-id'
    });
    const errorResult = await this.sendErrorNotification({
      workflowId: 'test-workflow',
      error: 'Test error message'
    });
    return {
      success: true,
      results: {
        successNotification: successResult,
        errorNotification: errorResult,
        slackConfigured: this.enabled
      }
    };
  }
}

/* ------------ Helpers ------------ */

function section(text) {
  return { type: 'section', text: { type: 'mrkdwn', text } };
}
function fields(arr) {
  return { type: 'section', fields: arr.map(t => ({ type: 'mrkdwn', text: t })) };
}
function context(items) {
  return { type: 'context', elements: items.map(t => ({ type: 'mrkdwn', text: t })) };
}
function codeFence(s = '') {
  const safe = String(s).slice(0, 2900); // Slack block text limit is generous; stay safe
  return '```' + safe + '```';
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const stringify = (v) => {
  try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); }
};

export const monitoringSystem = new MonitoringSystem();
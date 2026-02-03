#!/usr/bin/env node

/**
 * Setup Cron Jobs on cron-job.org using their API
 * 
 * This script will automatically create the morning and evening cron jobs
 * for your dual farm spotlight posting system.
 */

import axios from 'axios';

const CRON_API_KEY = process.env.CRON_JOB_ORG_API_KEY;
if (!CRON_API_KEY) {
  console.error('CRON_JOB_ORG_API_KEY environment variable is required');
  process.exit(1);
}
const BASE_URL = 'https://api.cron-job.org';
const VERCEL_URL = process.env.CRON_VERCEL_URL || 'https://your-app.vercel.app/api/cron/dual-farm-spotlight';
const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  console.error('CRON_SECRET environment variable is required');
  process.exit(1);
}

async function setupCronJobs() {
  console.log('🚀 Setting up cron jobs on cron-job.org...\n');

  try {
    // Get user info first
    console.log('📋 Getting user information...');
    const userResponse = await axios.get(`${BASE_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${CRON_API_KEY}`
      }
    });
    
    console.log(`✅ Connected as: ${userResponse.data.name}`);
    console.log(`📊 Available jobs: ${userResponse.data.jobs.length}/${userResponse.data.limit}\n`);

    // Create morning job (10:00 AM UTC)
    console.log('🌅 Creating morning job (10:00 AM UTC)...');
    const morningJob = {
      name: 'Farm Companion - Morning Post',
      url: `${VERCEL_URL}?token=${CRON_SECRET}`,
      schedule: '0 10 * * *',
      timezone: 'UTC',
      enabled: true,
      saveResponses: true,
      timeout: 300
    };

    const morningResponse = await axios.post(`${BASE_URL}/jobs`, morningJob, {
      headers: {
        'Authorization': `Bearer ${CRON_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Morning job created: ${morningResponse.data.jobId}`);

    // Create evening job (7:00 PM UTC)
    console.log('🌆 Creating evening job (7:00 PM UTC)...');
    const eveningJob = {
      name: 'Farm Companion - Evening Post',
      url: `${VERCEL_URL}?token=${CRON_SECRET}`,
      schedule: '0 19 * * *',
      timezone: 'UTC',
      enabled: true,
      saveResponses: true,
      timeout: 300
    };

    const eveningResponse = await axios.post(`${BASE_URL}/jobs`, eveningJob, {
      headers: {
        'Authorization': `Bearer ${CRON_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Evening job created: ${eveningResponse.data.jobId}\n`);

    // List all jobs
    console.log('📋 Current cron jobs:');
    const jobsResponse = await axios.get(`${BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Bearer ${CRON_API_KEY}`
      }
    });

    jobsResponse.data.jobs.forEach(job => {
      console.log(`  - ${job.name}: ${job.schedule} (${job.enabled ? '✅ Active' : '❌ Disabled'})`);
    });

    console.log('\n🎉 Cron jobs setup complete!');
    console.log('📅 Your farm spotlights will now post automatically at:');
    console.log('   🌅 10:00 AM UTC (Morning)');
    console.log('   🌆 7:00 PM UTC (Evening)');

  } catch (error) {
    console.error('❌ Error setting up cron jobs:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure your API key is correct');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Check your job configuration');
    }
  }
}

// Run the setup
setupCronJobs();

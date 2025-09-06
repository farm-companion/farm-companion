import { FullConfig } from '@playwright/test';

/**
 * Infrastructure Test Setup
 * Global setup for infrastructure testing
 */

async function globalSetup(config: FullConfig) {
  console.log('🏗️  Setting up infrastructure test environment...');
  
  // Check if development server is running
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  try {
    const response = await fetch(baseURL);
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.status}`);
    }
    console.log('✓ Development server is running');
  } catch (error) {
    console.error('✗ Development server is not running');
    console.error('Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  // Check for required environment variables
  const requiredEnvVars = [
    'VERCEL_KV_REST_API_URL',
    'VERCEL_KV_REST_API_TOKEN',
    'RESEND_API_KEY',
    'ADMIN_EMAIL',
    'BLOB_READ_WRITE_TOKEN',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.warn('⚠️  Missing environment variables:');
    missingEnvVars.forEach(envVar => {
      console.warn(`  - ${envVar}`);
    });
    console.warn('Some infrastructure tests may fail');
  } else {
    console.log('✓ All required environment variables are set');
  }
  
  // Check for build artifacts
  const buildArtifacts = [
    '.next',
    '.next/static',
    '.next/server',
    '.next/cache'
  ];
  
  const missingArtifacts = buildArtifacts.filter(artifact => {
    try {
      require('fs').accessSync(artifact);
      return false;
    } catch {
      return true;
    }
  });
  
  if (missingArtifacts.length > 0) {
    console.warn('⚠️  Missing build artifacts:');
    missingArtifacts.forEach(artifact => {
      console.warn(`  - ${artifact}`);
    });
    console.warn('Please run: npm run build');
  } else {
    console.log('✓ All build artifacts are present');
  }
  
  // Set up infrastructure monitoring
  console.log('✓ Infrastructure test environment setup complete');
}

export default globalSetup;

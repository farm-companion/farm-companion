import { FullConfig } from '@playwright/test';

/**
 * Security Test Setup
 * Global setup for security testing
 */

async function globalSetup(config: FullConfig) {
  console.log('🔒 Setting up security test environment...');
  
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
  
  // Check environment variables
  const requiredEnvVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_SITE_URL'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Environment variable ${envVar} is not set`);
    }
  }
  
  console.log('✓ Security test environment setup complete');
}

export default globalSetup;

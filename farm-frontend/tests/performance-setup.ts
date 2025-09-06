import { FullConfig } from '@playwright/test';

/**
 * Performance Test Setup
 * Global setup for performance testing
 */

async function globalSetup(config: FullConfig) {
  console.log('⚡ Setting up performance test environment...');
  
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
  
  // Check for performance monitoring tools
  try {
    const { execSync } = require('child_process');
    execSync('npx lighthouse --version', { stdio: 'pipe' });
    console.log('✓ Lighthouse is available');
  } catch (error) {
    console.warn('⚠️  Lighthouse not found - some performance tests may be limited');
  }
  
  // Set up performance monitoring
  console.log('✓ Performance test environment setup complete');
}

export default globalSetup;

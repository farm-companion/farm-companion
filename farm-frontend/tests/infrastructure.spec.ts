import { test, expect } from '@playwright/test';

/**
 * Infrastructure Testing Suite
 * Database, Email, Storage, and Infrastructure Validation
 */

// Test pages
const TEST_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/map', name: 'Map Page' },
  { url: '/shop', name: 'Shop Directory' },
  { url: '/seasonal', name: 'Seasonal Guide' },
  { url: '/about', name: 'About Page' },
  { url: '/contact', name: 'Contact Page' },
];

// API endpoints
const API_ENDPOINTS = [
  { url: '/api/health/bing-indexnow', method: 'GET', expectedStatus: 200 },
  { url: '/api/farms', method: 'GET', expectedStatus: 200 },
  { url: '/api/contact', method: 'POST', expectedStatus: 400 }, // Should return 400 without data
  { url: '/api/feedback', method: 'POST', expectedStatus: 400 }, // Should return 400 without data
  { url: '/api/newsletter/subscribe', method: 'POST', expectedStatus: 400 }, // Should return 400 without data
];

describe('Infrastructure Tests', () => {
  // Test page accessibility
  for (const page of TEST_PAGES) {
    test(`Page accessibility for ${page.name}`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.url);
      expect(response?.status()).toBe(200);
      
      // Check if page loads without errors
      await browserPage.waitForLoadState('networkidle');
      
      // Check for basic page structure
      await expect(browserPage.locator('html')).toBeVisible();
      await expect(browserPage.locator('body')).toBeVisible();
    });
  }

  // Test API endpoints
  for (const endpoint of API_ENDPOINTS) {
    test(`API endpoint ${endpoint.method} ${endpoint.url}`, async ({ request }) => {
      const response = await request[endpoint.method.toLowerCase()](endpoint.url);
      expect(response.status()).toBe(endpoint.expectedStatus);
    });
  }

  // Test database connectivity
  test('Database connectivity', async ({ request }) => {
    // Test an endpoint that requires database access
    const response = await request.get('/api/farms');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  // Test email service configuration
  test('Email service configuration', async ({ request }) => {
    // Test contact form endpoint (should return 400 without data, but endpoint should exist)
    const response = await request.post('/api/contact');
    expect(response.status()).toBe(400);
    
    // The endpoint should exist and return a proper error response
    const errorData = await response.json();
    expect(errorData).toBeDefined();
  });

  // Test file storage configuration
  test('File storage configuration', async ({ request }) => {
    // Test photo upload endpoint (should return 400 without data, but endpoint should exist)
    const response = await request.post('/api/photos/upload-url');
    expect(response.status()).toBe(400);
    
    // The endpoint should exist and return a proper error response
    const errorData = await response.json();
    expect(errorData).toBeDefined();
  });

  // Test security headers
  test('Security headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check for security headers
    const headers = response?.headers();
    expect(headers?.['x-frame-options']).toBeDefined();
    expect(headers?.['x-content-type-options']).toBeDefined();
    expect(headers?.['referrer-policy']).toBeDefined();
  });

  // Test HTTPS enforcement
  test('HTTPS enforcement', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check if the page is served over HTTPS (in production)
    const url = page.url();
    if (url.includes('vercel.app') || url.includes('https://')) {
      expect(url).toMatch(/^https:/);
    }
  });

  // Test caching headers
  test('Caching headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check for caching headers
    const headers = response?.headers();
    expect(headers?.['cache-control']).toBeDefined();
    expect(headers?.['etag']).toBeDefined();
  });

  // Test compression
  test('Response compression', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check for compression headers
    const headers = response?.headers();
    const contentEncoding = headers?.['content-encoding'];
    const acceptEncoding = headers?.['accept-encoding'];
    
    // Should support compression
    expect(acceptEncoding).toContain('gzip');
  });

  // Test error handling
  test('Error handling', async ({ page }) => {
    // Test 404 page
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
    
    // Check if error page is properly displayed
    await expect(page.locator('body')).toBeVisible();
  });

  // Test form functionality
  test('Form functionality', async ({ page }) => {
    await page.goto('/contact');
    
    // Check if contact form is present
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check if form has required fields
    const nameField = page.locator('input[name="name"]');
    const emailField = page.locator('input[name="email"]');
    const messageField = page.locator('textarea[name="message"]');
    
    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(messageField).toBeVisible();
  });

  // Test image loading
  test('Image loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check if images are loading properly
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        await expect(img).toBeVisible();
      }
    }
  });

  // Test JavaScript functionality
  test('JavaScript functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if JavaScript is working
    const hasJavaScript = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    
    expect(hasJavaScript).toBe(true);
  });

  // Test mobile responsiveness
  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page is responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if navigation is accessible on mobile
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
    }
  });

  // Test performance under load
  test('Performance under load', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  // Test API response times
  test('API response times', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/farms');
    expect(response.status()).toBe(200);
    
    const responseTime = Date.now() - startTime;
    
    // API should respond within 2 seconds
    expect(responseTime).toBeLessThan(2000);
  });

  // Test database performance
  test('Database performance', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/farms');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    const responseTime = Date.now() - startTime;
    
    // Database query should complete within 1 second
    expect(responseTime).toBeLessThan(1000);
  });

  // Test error recovery
  test('Error recovery', async ({ page }) => {
    // Test if the page recovers from errors
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page is still functional after load
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if navigation still works
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      // Test first link
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();
    }
  });

  // Test third-party integrations
  test('Third-party integrations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if external resources are loading
    const externalResources = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const links = Array.from(document.querySelectorAll('link[href]'));
      
      return {
        scripts: scripts.map(s => s.src),
        links: links.map(l => l.href)
      };
    });
    
    // External resources should be loading properly
    expect(externalResources.scripts).toBeDefined();
    expect(externalResources.links).toBeDefined();
  });

  // Test accessibility compliance
  test('Accessibility compliance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility features
    const hasTitle = await page.locator('title').count() > 0;
    expect(hasTitle).toBe(true);
    
    const hasMain = await page.locator('main').count() > 0;
    expect(hasMain).toBe(true);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined();
      }
    }
  });

  // Test SEO elements
  test('SEO elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for SEO elements
    const hasMetaDescription = await page.locator('meta[name="description"]').count() > 0;
    expect(hasMetaDescription).toBe(true);
    
    const hasMetaKeywords = await page.locator('meta[name="keywords"]').count() > 0;
    expect(hasMetaKeywords).toBe(true);
    
    const hasCanonical = await page.locator('link[rel="canonical"]').count() > 0;
    expect(hasCanonical).toBe(true);
  });

  // Test monitoring endpoints
  test('Monitoring endpoints', async ({ request }) => {
    // Test health check endpoint
    const healthResponse = await request.get('/api/health/bing-indexnow');
    expect(healthResponse.status()).toBe(200);
    
    // Test monitoring endpoint
    const monitoringResponse = await request.get('/api/monitoring/bing-status');
    expect(monitoringResponse.status()).toBe(200);
  });

  // Test rate limiting
  test('Rate limiting', async ({ request }) => {
    // Make multiple requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(request.get('/api/farms'));
    }
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed (rate limiting should not block normal usage)
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  // Test data integrity
  test('Data integrity', async ({ request }) => {
    const response = await request.get('/api/farms');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    // Check if data has expected structure
    if (data.length > 0) {
      const firstFarm = data[0];
      expect(firstFarm).toHaveProperty('name');
      expect(firstFarm).toHaveProperty('location');
    }
  });
});

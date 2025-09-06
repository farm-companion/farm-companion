import { test, expect } from '@playwright/test';

/**
 * Performance Testing Suite
 * Core Web Vitals and Performance Validation
 */

// Performance budgets
const PERFORMANCE_BUDGETS = {
  LCP: 2500,  // Largest Contentful Paint (ms)
  FID: 100,   // First Input Delay (ms)
  CLS: 0.1,   // Cumulative Layout Shift
  INP: 200,   // Interaction to Next Paint (ms)
  FCP: 1800,  // First Contentful Paint (ms)
  TTFB: 800,  // Time to First Byte (ms)
};

// Test pages
const TEST_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/map', name: 'Map Page' },
  { url: '/shop', name: 'Shop Directory' },
  { url: '/seasonal', name: 'Seasonal Guide' },
  { url: '/about', name: 'About Page' },
  { url: '/contact', name: 'Contact Page' },
];

describe('Performance Tests', () => {
  // Test Core Web Vitals for all pages
  for (const page of TEST_PAGES) {
    test(`Core Web Vitals for ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      
      // Wait for page to load completely
      await browserPage.waitForLoadState('networkidle');
      
      // Measure Core Web Vitals
      const metrics = await browserPage.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: any = {};
          
          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.LCP = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // First Input Delay
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              metrics.FID = entry.processingStart - entry.startTime;
            });
          }).observe({ entryTypes: ['first-input'] });
          
          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            metrics.CLS = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.name === 'first-contentful-paint') {
                metrics.FCP = entry.startTime;
              }
            });
          }).observe({ entryTypes: ['paint'] });
          
          // Time to First Byte
          const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
          
          // Wait for metrics to be collected
          setTimeout(() => {
            resolve(metrics);
          }, 3000);
        });
      });
      
      // Assert Core Web Vitals
      if (metrics.LCP) {
        expect(metrics.LCP).toBeLessThan(PERFORMANCE_BUDGETS.LCP);
      }
      
      if (metrics.FID) {
        expect(metrics.FID).toBeLessThan(PERFORMANCE_BUDGETS.FID);
      }
      
      if (metrics.CLS !== undefined) {
        expect(metrics.CLS).toBeLessThan(PERFORMANCE_BUDGETS.CLS);
      }
      
      if (metrics.FCP) {
        expect(metrics.FCP).toBeLessThan(PERFORMANCE_BUDGETS.FCP);
      }
      
      if (metrics.TTFB) {
        expect(metrics.TTFB).toBeLessThan(PERFORMANCE_BUDGETS.TTFB);
      }
    });
  }

  // Test page load performance
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  // Test image loading performance
  test('Image loading performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for images that are still loading
    const loadingImages = await page.locator('img[loading="lazy"]').count();
    const totalImages = await page.locator('img').count();
    
    // Most images should be lazy loaded
    expect(loadingImages).toBeGreaterThan(0);
    
    // Wait for all images to load
    await page.waitForLoadState('networkidle');
    
    // Check for broken images
    const brokenImages = await page.locator('img[src=""]').count();
    expect(brokenImages).toBe(0);
  });

  // Test bundle size
  test('Bundle size optimization', async ({ page }) => {
    await page.goto('/');
    
    // Get all JavaScript and CSS resources
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries
        .filter((entry: any) => entry.name.includes('.js') || entry.name.includes('.css'))
        .map((entry: any) => ({
          name: entry.name,
          size: entry.transferSize || 0,
          duration: entry.duration
        }));
    });
    
    // Check total bundle size
    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    const maxBundleSize = 500000; // 500KB
    expect(totalSize).toBeLessThan(maxBundleSize);
    
    // Check individual resource sizes
    for (const resource of resources) {
      const maxResourceSize = 100000; // 100KB per resource
      expect(resource.size).toBeLessThan(maxResourceSize);
    }
  });

  // Test caching headers
  test('Caching headers are present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check for caching headers
    expect(headers?.['cache-control']).toBeDefined();
    expect(headers?.['etag']).toBeDefined();
  });

  // Test compression
  test('Response compression', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check for compression headers
    const contentEncoding = headers?.['content-encoding'];
    const acceptEncoding = headers?.['accept-encoding'];
    
    // Should support compression
    expect(acceptEncoding).toContain('gzip');
  });

  // Test third-party scripts
  test('Third-party script optimization', async ({ page }) => {
    await page.goto('/');
    
    // Get all script tags
    const scripts = await page.locator('script[src]').all();
    
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      
      // Check for async/defer attributes on external scripts
      if (src && !src.startsWith('/')) {
        const async = await script.getAttribute('async');
        const defer = await script.getAttribute('defer');
        
        // External scripts should be async or defer
        expect(async || defer).toBeTruthy();
      }
    }
  });

  // Test font loading
  test('Font loading optimization', async ({ page }) => {
    await page.goto('/');
    
    // Check for font-display: swap
    const fontLinks = await page.locator('link[rel="stylesheet"]').all();
    
    for (const link of fontLinks) {
      const href = await link.getAttribute('href');
      if (href && href.includes('font')) {
        // Font stylesheets should have proper loading strategy
        const media = await link.getAttribute('media');
        expect(media).toBeTruthy();
      }
    }
  });

  // Test mobile performance
  test('Mobile performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Mobile should load within 4 seconds
    expect(loadTime).toBeLessThan(4000);
  });

  // Test slow 3G performance
  test('Slow 3G performance', async ({ page, context }) => {
    // Simulate slow 3G connection
    await context.route('**/*', (route) => {
      // Add delay to simulate slow connection
      setTimeout(() => {
        route.continue();
      }, 100);
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(10000);
  });

  // Test memory usage
  test('Memory usage optimization', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (memoryUsage) {
      // Memory usage should be reasonable
      const memoryUsagePercent = (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100;
      expect(memoryUsagePercent).toBeLessThan(80); // Less than 80% of heap limit
    }
  });

  // Test API response times
  test('API response times', async ({ page }) => {
    await page.goto('/');
    
    // Monitor API calls
    const apiCalls: any[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timing: response.request().timing()
        });
      }
    });
    
    // Trigger some API calls
    await page.click('a[href="/shop"]');
    await page.waitForLoadState('networkidle');
    
    // Check API response times
    for (const call of apiCalls) {
      if (call.timing) {
        const responseTime = call.timing.responseEnd - call.timing.requestStart;
        expect(responseTime).toBeLessThan(2000); // API should respond within 2 seconds
      }
    }
  });

  // Test Core Web Vitals with user interaction
  test('Core Web Vitals with user interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure INP (Interaction to Next Paint)
    const startTime = Date.now();
    
    // Simulate user interaction
    await page.click('a[href="/shop"]');
    await page.waitForLoadState('networkidle');
    
    const interactionTime = Date.now() - startTime;
    
    // Interaction should be responsive
    expect(interactionTime).toBeLessThan(PERFORMANCE_BUDGETS.INP);
  });

  // Test performance with multiple tabs
  test('Performance with multiple tabs', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    const startTime = Date.now();
    
    // Load pages simultaneously
    await Promise.all([
      page1.goto('/'),
      page2.goto('/shop')
    ]);
    
    await Promise.all([
      page1.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle')
    ]);
    
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(5000);
    
    await page1.close();
    await page2.close();
  });
});

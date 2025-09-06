import { test, expect } from '@playwright/test';

/**
 * Security Testing Suite
 * Comprehensive security validation tests
 */

describe('Security Tests', () => {
  // Test security headers
  test('Security headers are present', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for required security headers
    const headers = response?.headers();
    expect(headers).toBeDefined();
    
    if (headers) {
      // Check for essential security headers
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-content-type-options']).toBeDefined();
      expect(headers['referrer-policy']).toBeDefined();
      expect(headers['permissions-policy']).toBeDefined();
      
      // Check for HTTPS enforcement in production
      if (process.env.NODE_ENV === 'production') {
        expect(headers['strict-transport-security']).toBeDefined();
      }
    }
  });

  // Test CSRF protection
  test('CSRF protection is working', async ({ page }) => {
    await page.goto('/contact');
    
    // Try to submit form without proper origin
    const response = await page.request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      },
      headers: {
        'origin': 'https://malicious-site.com'
      }
    });
    
    // Should be rejected due to CSRF protection
    expect(response.status()).toBe(403);
  });

  // Test rate limiting
  test('Rate limiting is working', async ({ page }) => {
    await page.goto('/contact');
    
    // Submit multiple requests quickly
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        page.request.post('/api/contact', {
          data: {
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            message: `Test message ${i}`
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  // Test input validation
  test('Input validation prevents XSS', async ({ page }) => {
    await page.goto('/contact');
    
    // Try to submit XSS payload
    const xssPayload = '<script>alert("xss")</script>';
    
    const response = await page.request.post('/api/contact', {
      data: {
        name: xssPayload,
        email: 'test@example.com',
        message: xssPayload
      }
    });
    
    // Should be rejected or sanitized
    expect(response.status()).toBe(400);
  });

  // Test file upload security
  test('File upload security is working', async ({ page }) => {
    await page.goto('/add');
    
    // Try to upload malicious file
    const maliciousFile = {
      name: 'malicious.exe',
      mimeType: 'application/x-executable',
      buffer: Buffer.from('malicious content')
    };
    
    const response = await page.request.post('/api/upload', {
      multipart: {
        file: maliciousFile
      }
    });
    
    // Should be rejected
    expect(response.status()).toBe(400);
  });

  // Test authentication security
  test('Admin routes require authentication', async ({ page }) => {
    // Try to access admin route without authentication
    const response = await page.goto('/admin');
    
    // Should redirect to login or return 401/403
    expect(response?.status()).toBeOneOf([401, 403, 302]);
  });

  // Test SQL injection prevention
  test('SQL injection is prevented', async ({ page }) => {
    const sqlPayload = "'; DROP TABLE users; --";
    
    const response = await page.request.get(`/api/farms?search=${encodeURIComponent(sqlPayload)}`);
    
    // Should not cause server error
    expect(response.status()).not.toBe(500);
  });

  // Test directory traversal prevention
  test('Directory traversal is prevented', async ({ page }) => {
    const traversalPayload = '../../../etc/passwd';
    
    const response = await page.request.get(`/api/photos/${encodeURIComponent(traversalPayload)}`);
    
    // Should be rejected
    expect(response.status()).toBeOneOf([400, 403, 404]);
  });

  // Test HTTPS enforcement
  test('HTTPS is enforced in production', async ({ page, context }) => {
    if (process.env.NODE_ENV === 'production') {
      // Try to access HTTP version
      const response = await page.goto('http://localhost:3000');
      
      // Should redirect to HTTPS
      expect(response?.url()).toMatch(/^https:/);
    }
  });

  // Test content security policy
  test('Content Security Policy is working', async ({ page }) => {
    await page.goto('/');
    
    // Try to inject inline script
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'console.log("inline script")';
      document.head.appendChild(script);
    });
    
    // Check for CSP violations in console
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Should have CSP violations for inline scripts
    expect(consoleMessages.length).toBeGreaterThan(0);
  });

  // Test clickjacking protection
  test('Clickjacking protection is working', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    if (headers) {
      const frameOptions = headers['x-frame-options'];
      expect(frameOptions).toBeOneOf(['DENY', 'SAMEORIGIN']);
    }
  });

  // Test information disclosure
  test('Error messages do not leak information', async ({ page }) => {
    // Try to access non-existent route
    const response = await page.goto('/api/non-existent-route');
    
    // Should not reveal internal paths or stack traces
    const text = await response?.text();
    expect(text).not.toContain('/src/');
    expect(text).not.toContain('at ');
    expect(text).not.toContain('Error:');
  });

  // Test session security
  test('Session cookies are secure', async ({ page, context }) => {
    await page.goto('/admin/login');
    
    // Check cookie attributes
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('session') || cookie.name.includes('auth')
    );
    
    for (const cookie of sessionCookies) {
      if (process.env.NODE_ENV === 'production') {
        expect(cookie.secure).toBe(true);
        expect(cookie.httpOnly).toBe(true);
        expect(cookie.sameSite).toBeOneOf(['Strict', 'Lax']);
      }
    }
  });

  // Test brute force protection
  test('Brute force protection is working', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Try multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }
    
    // Should be blocked or have increased delay
    const response = await page.request.post('/api/admin/login', {
      data: {
        email: 'admin@example.com',
        password: 'wrongpassword'
      }
    });
    
    expect(response.status()).toBeOneOf([429, 423, 401]);
  });

  // Test API endpoint security
  test('API endpoints are properly secured', async ({ page }) => {
    const endpoints = [
      '/api/admin/farms',
      '/api/admin/photos',
      '/api/admin/users'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      
      // Should require authentication
      expect(response.status()).toBeOneOf([401, 403, 302]);
    }
  });

  // Test data validation
  test('Data validation prevents injection attacks', async ({ page }) => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '${7*7}',
      '{{7*7}}',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>'
    ];
    
    for (const input of maliciousInputs) {
      const response = await page.request.post('/api/contact', {
        data: {
          name: input,
          email: 'test@example.com',
          message: input
        }
      });
      
      // Should be rejected or sanitized
      expect(response.status()).toBeOneOf([400, 422]);
    }
  });

  // Test CORS configuration
  test('CORS is properly configured', async ({ page }) => {
    const response = await page.request.options('/api/contact', {
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    const headers = response.headers();
    
    // Should not allow arbitrary origins
    expect(headers['access-control-allow-origin']).not.toBe('*');
  });
});

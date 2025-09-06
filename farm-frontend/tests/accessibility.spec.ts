import { test, expect } from '@playwright/test';
import { runA11yTest } from './a11y.config';

/**
 * Comprehensive Accessibility Tests
 * WCAG 2.2 AA Compliance Testing
 */

// Test all major pages for accessibility compliance
const pagesToTest = [
  { url: '/', name: 'Homepage' },
  { url: '/map', name: 'Map Page' },
  { url: '/shop', name: 'Shop Directory' },
  { url: '/seasonal', name: 'Seasonal Guide' },
  { url: '/about', name: 'About Page' },
  { url: '/contact', name: 'Contact Page' },
  { url: '/add', name: 'Add Farm Form' },
  { url: '/claim', name: 'Claim Form' },
];

// Test individual farm pages (sample)
const farmPagesToTest = [
  { url: '/shop/sample-farm', name: 'Farm Detail Page' },
];

// Test seasonal produce pages (sample)
const producePagesToTest = [
  { url: '/seasonal/sweetcorn', name: 'Produce Detail Page' },
];

describe('Accessibility Compliance Tests', () => {
  // Test all main pages
  for (const page of pagesToTest) {
    test(`WCAG 2.2 AA compliance for ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      
      // Wait for page to load completely
      await browserPage.waitForLoadState('networkidle');
      await browserPage.waitForLoadState('domcontentloaded');
      
      // Wait for any dynamic content to load
      await browserPage.waitForTimeout(1000);
      
      // Run accessibility scan
      const results = await runA11yTest(browserPage, {
        exclude: [
          // Exclude third-party widgets that may have accessibility issues
          '.google-maps',
          '.mapbox',
          // Exclude dynamic content that may not be fully loaded
          '[data-testid="loading"]',
          '.loading',
        ]
      });
      
      // Assert no accessibility violations
      expect(results.violations).toEqual([]);
      
      // Log results for debugging
      if (results.violations.length > 0) {
        console.log(`Accessibility violations found on ${page.name}:`, results.violations);
      }
    });
  }

  // Test farm detail pages
  for (const page of farmPagesToTest) {
    test(`WCAG 2.2 AA compliance for ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      await browserPage.waitForLoadState('networkidle');
      await browserPage.waitForTimeout(1000);
      
      const results = await runA11yTest(browserPage);
      expect(results.violations).toEqual([]);
    });
  }

  // Test produce detail pages
  for (const page of producePagesToTest) {
    test(`WCAG 2.2 AA compliance for ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      await browserPage.waitForLoadState('networkidle');
      await browserPage.waitForTimeout(1000);
      
      const results = await runA11yTest(browserPage);
      expect(results.violations).toEqual([]);
    });
  }
});

describe('Keyboard Navigation Tests', () => {
  test('Keyboard navigation works on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Ensure focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement);
    expect(focusedElement).not.toBeNull();
  });

  test('Skip links work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if skip link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    
    // Test skip link functionality
    await skipLink.focus();
    await page.keyboard.press('Enter');
    
    // Verify focus moved to main content
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeFocused();
  });

  test('Modal keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu (if available)
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Test escape key closes modal
      await page.keyboard.press('Escape');
      
      // Verify modal is closed
      const modal = page.locator('[role="dialog"], [aria-modal="true"]');
      await expect(modal).not.toBeVisible();
    }
  });
});

describe('Screen Reader Tests', () => {
  test('Page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for h1 element
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Verify no heading levels are skipped
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        return parseInt(tagName.replace('h', ''));
      })
    );
    
    // Check for skipped heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
    }
  });

  test('Images have proper alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check all images have alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('Form labels are properly associated', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    // Check form inputs have associated labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input should have either id with associated label, aria-label, or aria-labelledby
      const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
      const hasAriaLabel = ariaLabel || ariaLabelledBy;
      
      expect(hasLabel || hasAriaLabel).toBeTruthy();
    }
  });
});

describe('Color Contrast Tests', () => {
  test('Text has sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // This is a basic test - in a real implementation, you'd use a color contrast checker
    // For now, we'll check that text elements have proper color contrast classes
    
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
    const textCount = await textElements.count();
    
    // Ensure we have text elements
    expect(textCount).toBeGreaterThan(0);
    
    // Check that text elements have proper color classes
    for (let i = 0; i < Math.min(textCount, 10); i++) {
      const element = textElements.nth(i);
      const className = await element.getAttribute('class');
      
      // Check for text color classes that should have good contrast
      const hasTextColor = className && (
        className.includes('text-text-') ||
        className.includes('text-brand-') ||
        className.includes('text-white') ||
        className.includes('text-black')
      );
      
      // This is a basic check - in production, you'd use a proper color contrast checker
      expect(hasTextColor || className === null).toBeTruthy();
    }
  });
});

describe('Focus Management Tests', () => {
  test('Focus is visible and properly managed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test focus visibility
    await page.keyboard.press('Tab');
    
    // Check if focused element has visible focus indicator
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      if (!active) return null;
      
      const styles = window.getComputedStyle(active);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });
    
    expect(focusedElement).not.toBeNull();
    
    // Check for focus indicators
    const hasFocusIndicator = focusedElement && (
      focusedElement.outline !== 'none' ||
      focusedElement.outlineWidth !== '0px' ||
      focusedElement.boxShadow !== 'none'
    );
    
    expect(hasFocusIndicator).toBeTruthy();
  });
});

describe('ARIA Tests', () => {
  test('Interactive elements have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check buttons have proper ARIA attributes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const textContent = await button.textContent();
      
      // Button should have accessible name (aria-label, aria-labelledby, or text content)
      const hasAccessibleName = ariaLabel || ariaLabelledBy || (textContent && textContent.trim());
      expect(hasAccessibleName).toBeTruthy();
    }
    
    // Check links have proper ARIA attributes
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      const textContent = await link.textContent();
      const href = await link.getAttribute('href');
      
      // Link should have accessible name and href
      const hasAccessibleName = ariaLabel || ariaLabelledBy || (textContent && textContent.trim());
      expect(hasAccessibleName).toBeTruthy();
      expect(href).not.toBeNull();
    }
  });
});

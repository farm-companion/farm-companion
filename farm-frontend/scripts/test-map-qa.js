#!/usr/bin/env node

/**
 * Map QA Test Script
 * 
 * This script helps test the map functionality by:
 * 1. Checking if the map loads properly
 * 2. Verifying touch gesture support
 * 3. Testing cluster functionality
 * 4. Validating bottom sheet behavior
 * 5. Checking location services
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MapQATester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  async init() {
    console.log('🚀 Starting Map QA Tests...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      defaultViewport: {
        width: 375,
        height: 812,
        isMobile: true,
        hasTouch: true
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set user agent to iPhone Safari
    await this.page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );

    // Enable touch events
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 5
      });
    });
  }

  async runTest(testName, testFn) {
    try {
      console.log(`\n🧪 Running: ${testName}`);
      await testFn();
      this.results.tests.push({ name: testName, status: 'PASS', error: null });
      this.results.summary.passed++;
      console.log(`✅ PASS: ${testName}`);
    } catch (error) {
      this.results.tests.push({ name: testName, status: 'FAIL', error: error.message });
      this.results.summary.failed++;
      console.log(`❌ FAIL: ${testName} - ${error.message}`);
    }
    this.results.summary.total++;
  }

  async testMapLoads() {
    await this.page.goto('http://localhost:3000/map', { waitUntil: 'networkidle0' });
    
    // Wait for map to load
    await this.page.waitForSelector('.map-canvas', { timeout: 10000 });
    
    // Check if Google Maps is loaded
    const mapLoaded = await this.page.evaluate(() => {
      return typeof google !== 'undefined' && google.maps;
    });
    
    if (!mapLoaded) {
      throw new Error('Google Maps failed to load');
    }
  }

  async testTouchGestures() {
    // Test one-finger pan
    const mapElement = await this.page.$('.map-canvas');
    const box = await mapElement.boundingBox();
    
    // Simulate one-finger pan
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
    await this.page.mouse.up();
    
    // Wait a bit for the pan to complete
    await this.page.waitForTimeout(500);
  }

  async testClusterInteraction() {
    // Look for clusters and try to click one
    const clusters = await this.page.$$('[title*="farms"]');
    
    if (clusters.length > 0) {
      await clusters[0].click();
      await this.page.waitForTimeout(1000);
    }
  }

  async testBottomSheet() {
    // Check if bottom sheet is present
    const bottomSheet = await this.page.$('[role="dialog"]');
    if (!bottomSheet) {
      throw new Error('Bottom sheet not found');
    }
    
    // Test dragging the sheet
    const dragHandle = await this.page.$('[aria-label="Drag to resize"]');
    if (dragHandle) {
      const box = await dragHandle.boundingBox();
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 100);
      await this.page.mouse.up();
      await this.page.waitForTimeout(500);
    }
  }

  async testLocationServices() {
    // Mock geolocation
    await this.page.evaluateOnNewDocument(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: 51.5074,
            longitude: -0.1278,
            accuracy: 10
          },
          timestamp: Date.now()
        });
      };
    });
    
    // Look for location button and click it
    const locationButton = await this.page.$('button[title*="Location"], button[title*="Locate"]');
    if (locationButton) {
      await locationButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async testZoomControls() {
    // Check if zoom controls are visible
    const zoomControls = await this.page.$$('button[aria-label*="Zoom"]');
    if (zoomControls.length === 0) {
      throw new Error('Zoom controls not found');
    }
  }

  async testFarmsCounter() {
    // Check if farms counter is present
    const counter = await this.page.$('span:has-text("farms")');
    if (!counter) {
      throw new Error('Farms counter not found');
    }
    
    const count = await counter.textContent();
    console.log(`📊 Farms count: ${count}`);
  }

  async testAccessibility() {
    // Check for proper ARIA labels
    const elementsWithAria = await this.page.$$('[aria-label]');
    if (elementsWithAria.length === 0) {
      throw new Error('No ARIA labels found');
    }
    
    // Check for proper roles
    const dialog = await this.page.$('[role="dialog"]');
    if (!dialog) {
      throw new Error('Dialog role not found on bottom sheet');
    }
  }

  async runAllTests() {
    await this.init();
    
    try {
      await this.runTest('Map Loads', () => this.testMapLoads());
      await this.runTest('Touch Gestures', () => this.testTouchGestures());
      await this.runTest('Cluster Interaction', () => this.testClusterInteraction());
      await this.runTest('Bottom Sheet', () => this.testBottomSheet());
      await this.runTest('Location Services', () => this.testLocationServices());
      await this.runTest('Zoom Controls', () => this.testZoomControls());
      await this.runTest('Farms Counter', () => this.testFarmsCounter());
      await this.runTest('Accessibility', () => this.testAccessibility());
      
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      tests: this.results.tests,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '../test-results/map-qa-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📋 Test Report Generated:');
    console.log(`📁 Location: ${reportPath}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📊 Total: ${report.summary.total}`);

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.results.tests.filter(t => t.status === 'FAIL');
    
    if (failedTests.length > 0) {
      recommendations.push('Fix failed tests before deployment');
    }
    
    if (this.results.summary.passed / this.results.summary.total < 0.8) {
      recommendations.push('Consider manual testing for edge cases');
    }
    
    return recommendations;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new MapQATester();
  
  tester.runAllTests()
    .then(() => {
      tester.generateReport();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = MapQATester;

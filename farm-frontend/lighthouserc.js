module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3001/', 'http://localhost:3001/map'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'interaction-to-next-paint': ['warn', { maxNumericValue: 200 }],
        'server-response-time': ['warn', { maxNumericValue: 300 }],
        'render-blocking-resources': ['warn', { maxLength: 2 }],
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'efficient-animated-content': ['warn', { maxLength: 0 }],
        'legacy-javascript': ['warn', { maxLength: 0 }],
        'duplicate-id': ['error', { maxLength: 0 }],
        'heading-order': ['error', { maxLength: 0 }],
        'skip-link': ['error', { maxLength: 0 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}

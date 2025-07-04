// Lighthouse CI configuration for Google-compliant performance monitoring
// Target: 90+ scores for Performance, Accessibility, Best Practices, SEO

module.exports = {
  ci: {
    collect: {
      // Test multiple pages
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/onboarding',
        'http://localhost:3000/dashboard'
      ],
      // Mobile-first testing (Google requirement)
      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ],
        // Emulate mobile device
        emulatedFormFactor: 'mobile',
        throttling: {
          // Slow 4G throttling for realistic mobile testing
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        },
        // Disable extensions and clear storage
        disableStorageReset: false,
        clearStorageTypes: ['cookies', 'localstorage', 'sessionstorage']
      },
      numberOfRuns: 3 // Run multiple times for consistent results
    },
    assert: {
      // Google-level performance standards
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals (Google's key metrics)
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Progressive Web App requirements
        'installable-manifest': 'error',
        'service-worker': 'error',
        'splash-screen': 'error',
        'themed-omnibox': 'error',
        'content-width': 'error',
        
        // Accessibility requirements (WCAG compliance)
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // Performance optimization checks
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'render-blocking-resources': 'error',
        'efficient-animated-content': 'error',
        'uses-responsive-images': 'error',
        'uses-optimized-images': 'error',
        'modern-image-formats': 'error',
        
        // Security and best practices
        'is-on-https': 'error',
        'uses-http2': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'error',
        
        // SEO requirements
        'meta-description': 'error',
        'document-title': 'error',
        'lang': 'error',
        'hreflang': 'off', // Not applicable for single-language app
        'canonical': 'error'
      }
    },
    upload: {
      // Store results for tracking over time
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    server: {
      // Start local server for testing
      command: 'npm run build && npm run start',
      port: 3000,
      wait: 10000 // Wait 10 seconds for server to start
    }
  }
}
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set sample rates for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture unhandled promise rejections
  integrations: [
    Sentry.replayIntegration({
      // Capture replays on errors in production
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',

  // Filter out known noisy errors
  beforeSend(event, hint) {
    // Filter out non-critical navigation errors
    if (event.exception) {
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message)
        
        // Skip common browser extension errors
        if (message.includes('chrome-extension://') || 
            message.includes('moz-extension://') ||
            message.includes('Script error.')) {
          return null
        }
        
        // Skip network errors that are user-related
        if (message.includes('NetworkError') || 
            message.includes('Failed to fetch')) {
          return null
        }
      }
    }
    
    return event
  },
})
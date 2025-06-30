import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Set sample rates for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',

  // Filter server errors
  beforeSend(event, hint) {
    // Log all server errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry Server]', event)
    }
    
    return event
  },
})
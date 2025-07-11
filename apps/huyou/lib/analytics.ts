// Privacy-first Google Analytics implementation
// Based on Google's consent mode and ethical data collection principles

// Type definitions for analytics
type GtagEventParams = Record<string, string | number | boolean | undefined>

// Layout shift entry interface (missing from TypeScript)
interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}


// Initialize Google Analytics with consent mode
export const initializeAnalytics = (measurementId: string) => {
  if (typeof window === 'undefined') return

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  // Set default consent mode (deny all until user consents)
  window.gtag?.('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'granted', // Essential for basic functionality
    'security_storage': 'granted' // Essential for security
  })

  // Configure Google Analytics
  window.gtag?.('config', measurementId, {
    // Privacy-enhanced settings
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    
    // Performance settings
    send_page_view: true,
    transport_type: 'beacon',
    
    // Data retention
    storage: 'none', // No persistent storage until consent
    
    // Custom settings for ethical data collection
    custom_map: {
      'experiment_id': 'experiment_id'
    }
  })

  // Set default parameters for all events
  window.gtag?.('config', measurementId, {
    custom_map: {
      'privacy_mode': 'strict'
    }
  })
}

// Check if user has given consent
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('cookie-consent') === 'accepted'
}

// Privacy-first event tracking
export const trackEvent = (
  eventName: string, 
  parameters: GtagEventParams = {},
  requireConsent: boolean = true
) => {
  if (typeof window === 'undefined' || !window.gtag) return

  // Check consent if required
  if (requireConsent && !hasAnalyticsConsent()) {
    console.log(`Analytics event blocked (no consent): ${eventName}`)
    return
  }

  // Sanitize parameters to remove any PII
  const sanitizedParams = sanitizeEventParameters(parameters)
  
  window.gtag('event', eventName, {
    ...sanitizedParams,
    privacy_mode: 'strict',
    timestamp: Date.now()
  })
}

// Remove potential PII from event parameters
const sanitizeEventParameters = (params: GtagEventParams): GtagEventParams => {
  const sanitized = { ...params }
  
  // Remove common PII fields
  const piiFields = ['email', 'phone', 'name', 'address', 'ip', 'user_id']
  piiFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field]
    }
  })
  
  // Truncate long strings that might contain PII
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 100) + '...'
    }
  })
  
  return sanitized
}

// Core Web Vitals tracking (privacy-first)
export const trackWebVitals = () => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return

  // Use web-vitals library if available, otherwise basic performance tracking
  if ('PerformanceObserver' in window) {
    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        trackEvent('web_vitals', {
          metric_name: 'LCP',
          metric_value: Math.round(entry.startTime),
          metric_id: entry.name
        }, false) // Don't require consent for performance data
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Track First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const fidEntry = entry as PerformanceEventTiming
        trackEvent('web_vitals', {
          metric_name: 'FID',
          metric_value: Math.round((fidEntry.processingStart || 0) - entry.startTime),
          metric_id: entry.name
        }, false)
      }
    }).observe({ entryTypes: ['first-input'] })

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const clsEntry = entry as LayoutShiftEntry
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value || 0
        }
      }
      trackEvent('web_vitals', {
        metric_name: 'CLS',
        metric_value: Math.round(clsValue * 1000) / 1000,
        metric_id: 'cumulative'
      }, false)
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Page view tracking with privacy protection
export const trackPageView = (path: string, title?: string) => {
  if (!hasAnalyticsConsent()) return

  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.origin + path, // Don't include query params for privacy
  })
}

// User engagement tracking (privacy-first)
export const trackUserEngagement = (engagementType: string, value?: number) => {
  trackEvent('user_engagement', {
    engagement_type: engagementType,
    engagement_value: value,
    session_id: sessionStorage.getItem('session_id') || 'anonymous'
  })
}

// Error tracking (sanitized)
export const trackError = (error: Error, context?: string) => {
  trackEvent('error', {
    error_message: error.message.substring(0, 100), // Truncate to avoid PII
    error_context: context,
    error_stack: error.stack?.substring(0, 200) // Truncated stack trace
  }, false) // Error tracking doesn't require explicit consent for debugging
}
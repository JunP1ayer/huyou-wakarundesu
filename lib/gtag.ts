export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void
  }
}

// Track page views
export const pageview = (path: string) => {
  if (!GA_ID || typeof window === 'undefined') return
  
  window.gtag('config', GA_ID, {
    page_path: path,
  })
}

// Track custom events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const event = (action: string, params: Record<string, any> = {}) => {
  if (!GA_ID || typeof window === 'undefined') return
  
  window.gtag('event', action, {
    ...params,
    custom_map: {
      dimension1: '扶養わかるんです',
    },
  })
}

// Predefined event types for the app
export const trackEvent = {
  // CSV Export Event
  csvExport: (recordCount: number) => {
    event('csv_export', {
      event_category: 'data_export',
      event_label: 'income_csv',
      value: recordCount,
      custom_parameter_1: 'dashboard_export',
    })
  },

  // PWA Installation Event
  pwaInstall: () => {
    event('pwa_install', {
      event_category: 'engagement',
      event_label: 'app_install',
      custom_parameter_1: 'pwa_banner',
    })
  },

  // Notification Threshold Alert
  notificationShow: (percentage: number, income: number) => {
    event('notif_threshold_show', {
      event_category: 'notification',
      event_label: 'threshold_alert',
      value: Math.round(percentage),
      custom_parameter_1: income.toString(),
      custom_parameter_2: 'auto_trigger',
    })
  },

  // Notification Click
  notificationClick: (percentage: number) => {
    event('notif_click', {
      event_category: 'notification',
      event_label: 'threshold_click',
      value: Math.round(percentage),
      custom_parameter_1: 'dashboard_open',
    })
  },

  // Bank Connection Events
  bankConnect: (success: boolean) => {
    event(success ? 'bank_connect_success' : 'bank_connect_failed', {
      event_category: 'integration',
      event_label: 'moneytree_oauth',
      custom_parameter_1: success ? 'connected' : 'failed',
    })
  },

  // Permission Request Events
  notificationPermission: (granted: boolean) => {
    event('permission_request', {
      event_category: 'permission',
      event_label: 'notification',
      custom_parameter_1: granted ? 'granted' : 'denied',
    })
  },

  // Onboarding Completion
  onboardingComplete: (userType: string) => {
    event('onboarding_complete', {
      event_category: 'user_journey',
      event_label: 'setup_finished',
      custom_parameter_1: userType,
    })
  },

  // Settings Changes
  settingsUpdate: (field: string, value: string) => {
    event('settings_update', {
      event_category: 'configuration',
      event_label: field,
      custom_parameter_1: value,
    })
  },
}

// Debug logging in development
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debugEvent = (eventName: string, params: Record<string, any>) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA4 Debug] ${eventName}:`, params)
  }
}
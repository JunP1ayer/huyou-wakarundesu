import * as Sentry from '@sentry/nextjs'

// Set user context for better error tracking
export const setSentryUser = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

// Clear user context (on logout)
export const clearSentryUser = () => {
  Sentry.setUser(null)
}

// Add breadcrumb for user actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

// Set context for financial calculations
export const setFinancialContext = (income: number, limit: number, percentage: number) => {
  Sentry.setContext('financial_data', {
    current_income: income,
    dependency_limit: limit,
    usage_percentage: percentage,
    is_over_threshold: percentage >= 80,
  })
}

// Capture custom errors with enhanced context
export const captureAppError = (error: Error, context: {
  feature?: string
  action?: string
  userId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalData?: Record<string, any>
}) => {
  return Sentry.captureException(error, {
    tags: {
      feature: context.feature || 'unknown',
      action: context.action || 'unknown',
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      ...context.additionalData,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    },
  })
}

// Track performance for critical operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trackPerformance = (operationName: string, operation: () => Promise<any>) => {
  return Sentry.startSpan({
    name: operationName,
    op: 'app.operation',
  }, async () => {
    try {
      return await operation()
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

// Predefined error contexts for common operations
export const ErrorContexts = {
  CSV_EXPORT: {
    feature: 'data_export',
    action: 'csv_generation',
  },
  NOTIFICATION: {
    feature: 'notifications',
    action: 'threshold_alert',
  },
  PWA_INSTALL: {
    feature: 'pwa',
    action: 'installation',
  },
  BANK_SYNC: {
    feature: 'bank_integration',
    action: 'data_sync',
  },
  CALCULATION: {
    feature: 'financial_calculation',
    action: 'dependency_computation',
  },
} as const

// Monitor API calls
export const monitorApiCall = async <T>(
  apiName: string,
  apiCall: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>
): Promise<T> => {
  const span = Sentry.startSpan({
    op: 'http.client',
    name: `API: ${apiName}`,
  }, async () => {
    addBreadcrumb(`API call started: ${apiName}`, 'api', 'info', context)
    
    try {
      const result = await apiCall()
      addBreadcrumb(`API call succeeded: ${apiName}`, 'api', 'info')
      return result
    } catch (error) {
      addBreadcrumb(`API call failed: ${apiName}`, 'api', 'error', {
        error: error instanceof Error ? error.message : String(error),
        ...context,
      })
      
      captureAppError(
        error instanceof Error ? error : new Error(String(error)),
        {
          feature: 'api_integration',
          action: apiName,
          additionalData: context,
        }
      )
      
      throw error
    }
  })
  
  return span
}
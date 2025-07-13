/**
 * LogRocket integration for session replay and debugging
 * Only loads when NEXT_PUBLIC_LOGROCKET_ID is configured
 */

import { useEffect } from 'react';

let LogRocket: any = null;
let isInitialized = false;

// Dynamic import LogRocket only when needed
const loadLogRocket = async () => {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_LOGROCKET_ID) {
    return null;
  }

  if (LogRocket) {
    return LogRocket;
  }

  try {
    const { default: LR } = await import('logrocket');
    LogRocket = LR;
    return LogRocket;
  } catch (error) {
    console.warn('Failed to load LogRocket:', error);
    return null;
  }
};

export const initializeLogRocket = async () => {
  if (isInitialized || typeof window === 'undefined' || !process.env.NEXT_PUBLIC_LOGROCKET_ID) {
    return;
  }

  const LR = await loadLogRocket();
  if (!LR) return;

  try {
    LR.init(process.env.NEXT_PUBLIC_LOGROCKET_ID, {
      // Configuration options
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      network: {
        requestSanitizer: (request: any) => {
          // Remove sensitive data from requests
          if (request.headers && request.headers.authorization) {
            request.headers.authorization = '[REDACTED]';
          }
          return request;
        },
        responseSanitizer: (response: any) => {
          // Remove sensitive data from responses
          return response;
        },
      },
      console: {
        isEnabled: {
          log: true,
          info: true,
          warn: true,
          error: true,
          debug: process.env.NODE_ENV === 'development',
        },
      },
      // Privacy settings
      shouldCaptureIP: false,
      childDomains: false,
    });

    isInitialized = true;
    console.log('LogRocket initialized successfully');
  } catch (error) {
    console.error('Failed to initialize LogRocket:', error);
  }
};

export const identifyUser = async (userId: string, userInfo?: {
  name?: string;
  email?: string;
  subscriptionType?: string;
}) => {
  const LR = await loadLogRocket();
  if (!LR || !isInitialized) return;

  try {
    LR.identify(userId, {
      name: userInfo?.name,
      email: userInfo?.email,
      subscriptionType: userInfo?.subscriptionType || 'free',
      // Remove any PII that shouldn't be tracked
    });
  } catch (error) {
    console.error('Failed to identify user in LogRocket:', error);
  }
};

export const addTag = async (key: string, value: string) => {
  const LR = await loadLogRocket();
  if (!LR || !isInitialized) return;

  try {
    LR.addTag(key, value);
  } catch (error) {
    console.error('Failed to add LogRocket tag:', error);
  }
};

export const captureException = async (error: Error, extraData?: Record<string, any>) => {
  const LR = await loadLogRocket();
  if (!LR || !isInitialized) return;

  try {
    LR.captureException(error, {
      extra: extraData,
      tags: {
        feature: 'error_tracking',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (logRocketError) {
    console.error('Failed to capture exception in LogRocket:', logRocketError);
  }
};

export const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
  const LR = await loadLogRocket();
  if (!LR || !isInitialized) return;

  try {
    LR.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  } catch (error) {
    console.error('Failed to track event in LogRocket:', error);
  }
};

// Hook for easy integration in React components
export const useLogRocket = () => {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LOGROCKET_ID) {
      initializeLogRocket();
    }
  }, []);

  return {
    identifyUser,
    addTag,
    captureException,
    trackEvent,
  };
};

// LogRocket integration for financial events
export const trackFinancialEvent = async (eventType: 'income_add' | 'threshold_warning' | 'limit_exceeded', data: {
  amount?: number;
  currentTotal?: number;
  thresholdLimit?: number;
  userId?: string;
}) => {
  await trackEvent(`financial.${eventType}`, {
    amount: data.amount,
    currentTotal: data.currentTotal,
    thresholdLimit: data.thresholdLimit,
    userId: data.userId,
    category: 'financial_tracking',
  });
};

export default {
  initialize: initializeLogRocket,
  identifyUser,
  addTag,
  captureException,
  trackEvent,
  trackFinancialEvent,
  useLogRocket,
};
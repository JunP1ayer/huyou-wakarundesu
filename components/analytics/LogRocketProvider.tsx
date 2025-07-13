'use client';

import { useEffect } from 'react';
import { useLogRocket } from '@/lib/logrocket';

interface LogRocketProviderProps {
  children: React.ReactNode;
}

/**
 * LogRocket Provider - Conditionally initializes LogRocket when NEXT_PUBLIC_LOGROCKET_ID is present
 * Wraps the app to provide session replay and debugging capabilities
 */
export default function LogRocketProvider({ children }: LogRocketProviderProps) {
  const { identifyUser, trackEvent } = useLogRocket();

  useEffect(() => {
    // Only initialize in production or when explicitly enabled
    if (process.env.NEXT_PUBLIC_LOGROCKET_ID && typeof window !== 'undefined') {
      console.log('LogRocket enabled for session tracking');
      
      // Track app initialization
      trackEvent('app.initialized', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }
  }, [trackEvent]);

  // Return children without any wrapper - LogRocket works transparently
  return <>{children}</>;
}
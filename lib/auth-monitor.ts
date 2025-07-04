/**
 * Ultra-Comprehensive Authentication Flow Monitor
 * Tracks every auth event and provides real-time debugging
 */

interface AuthEvent {
  timestamp: number
  type: string
  details: any
  pathname?: string
  userId?: string
  sessionId?: string
  error?: any
}

interface AuthMetrics {
  totalEvents: number
  successfulLogins: number
  failedLogins: number
  profileCreations: number
  redirects: number
  errors: number
  lastActivity: number
}

class AuthFlowMonitor {
  private static instance: AuthFlowMonitor
  private events: AuthEvent[] = []
  private metrics: AuthMetrics = {
    totalEvents: 0,
    successfulLogins: 0,
    failedLogins: 0,
    profileCreations: 0,
    redirects: 0,
    errors: 0,
    lastActivity: 0
  }
  
  private readonly MAX_EVENTS = 1000 // Keep last 1000 events
  private readonly CRITICAL_EVENTS = ['login_failed', 'profile_creation_failed', 'session_expired', 'redirect_loop']

  static getInstance(): AuthFlowMonitor {
    if (!AuthFlowMonitor.instance) {
      AuthFlowMonitor.instance = new AuthFlowMonitor()
    }
    return AuthFlowMonitor.instance
  }

  /**
   * Log authentication event
   */
  logEvent(type: string, details: any, pathname?: string): void {
    const event: AuthEvent = {
      timestamp: Date.now(),
      type,
      details,
      pathname,
      userId: details?.userId || details?.user?.id,
      sessionId: details?.sessionId || details?.session?.id
    }

    // Add to events array
    this.events.unshift(event)
    
    // Trim to max events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS)
    }

    // Update metrics
    this.updateMetrics(event)

    // Console logging with emoji and color
    this.logToConsole(event)

    // Check for critical events
    if (this.CRITICAL_EVENTS.includes(type)) {
      this.handleCriticalEvent(event)
    }

    // Store in localStorage for debugging
    this.persistToStorage()
  }

  /**
   * Log error event
   */
  logError(type: string, error: any, details?: any, pathname?: string): void {
    const event: AuthEvent = {
      timestamp: Date.now(),
      type,
      details: details || {},
      pathname,
      error: {
        message: error?.message || String(error),
        stack: error?.stack,
        code: error?.code
      }
    }

    this.events.unshift(event)
    this.updateMetrics(event)
    this.logToConsole(event)
    
    // All errors are critical
    this.handleCriticalEvent(event)
    this.persistToStorage()
  }

  /**
   * Update metrics based on event
   */
  private updateMetrics(event: AuthEvent): void {
    this.metrics.totalEvents++
    this.metrics.lastActivity = event.timestamp

    switch (event.type) {
      case 'login_successful':
        this.metrics.successfulLogins++
        break
      case 'login_failed':
        this.metrics.failedLogins++
        break
      case 'profile_created':
        this.metrics.profileCreations++
        break
      case 'redirect':
        this.metrics.redirects++
        break
    }

    if (event.error) {
      this.metrics.errors++
    }
  }

  /**
   * Enhanced console logging
   */
  private logToConsole(event: AuthEvent): void {
    const timeStr = new Date(event.timestamp).toLocaleTimeString()
    const emoji = this.getEventEmoji(event.type)
    const prefix = `${emoji} ULTRA-MONITOR [${timeStr}]`
    
    if (event.error) {
      console.error(`${prefix} ${event.type}:`, event.details, event.error)
    } else if (this.CRITICAL_EVENTS.includes(event.type)) {
      console.warn(`${prefix} ${event.type}:`, event.details)
    } else {
      console.log(`${prefix} ${event.type}:`, event.details)
    }
  }

  /**
   * Get emoji for event type
   */
  private getEventEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      'auth_init': '🚀',
      'session_check': '🔍',
      'login_attempt': '🔑',
      'login_successful': '✅',
      'login_failed': '❌',
      'logout': '👋',
      'profile_fetch': '👤',
      'profile_created': '📝',
      'profile_updated': '✏️',
      'redirect': '🔄',
      'redirect_loop': '🌀',
      'route_guard': '🛡️',
      'session_expired': '⏰',
      'error': '🔴',
      'recovery_attempt': '🔧',
      'fallback_triggered': '🚨'
    }
    
    return emojiMap[type] || '📊'
  }

  /**
   * Handle critical events
   */
  private handleCriticalEvent(event: AuthEvent): void {
    console.warn('🚨 ULTRA-MONITOR: Critical event detected', event)
    
    // You could add additional handling here:
    // - Send to error tracking service
    // - Trigger alerts
    // - Auto-recovery mechanisms
    
    // For now, just ensure it's prominently logged
    if (typeof window !== 'undefined') {
      console.groupCollapsed(`🚨 Critical Auth Event: ${event.type}`)
      console.log('Event Details:', event)
      console.log('Recent Events:', this.getRecentEvents(10))
      console.log('Current Metrics:', this.metrics)
      console.groupEnd()
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 20): AuthEvent[] {
    return this.events.slice(0, count)
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string): AuthEvent[] {
    return this.events.filter(event => event.type === type)
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string): AuthEvent[] {
    return this.events.filter(event => event.userId === userId)
  }

  /**
   * Get metrics
   */
  getMetrics(): AuthMetrics {
    return { ...this.metrics }
  }

  /**
   * Generate auth flow report
   */
  generateReport(): string {
    const recentEvents = this.getRecentEvents(10)
    const errors = this.events.filter(e => e.error).slice(0, 5)
    
    return `
# Auth Flow Report (Generated: ${new Date().toLocaleString()})

## Metrics
- Total Events: ${this.metrics.totalEvents}
- Successful Logins: ${this.metrics.successfulLogins}
- Failed Logins: ${this.metrics.failedLogins}
- Profile Creations: ${this.metrics.profileCreations}
- Redirects: ${this.metrics.redirects}
- Errors: ${this.metrics.errors}
- Last Activity: ${new Date(this.metrics.lastActivity).toLocaleString()}

## Recent Events (Last 10)
${recentEvents.map(e => `- ${new Date(e.timestamp).toLocaleTimeString()} ${this.getEventEmoji(e.type)} ${e.type}: ${JSON.stringify(e.details)}`).join('\n')}

## Recent Errors (Last 5)
${errors.map(e => `- ${new Date(e.timestamp).toLocaleTimeString()} ❌ ${e.type}: ${e.error?.message || 'Unknown error'}`).join('\n')}
    `.trim()
  }

  /**
   * Persist events to localStorage for debugging
   */
  private persistToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          events: this.events.slice(0, 100), // Store last 100 events
          metrics: this.metrics,
          timestamp: Date.now()
        }
        localStorage.setItem('ultra_auth_monitor', JSON.stringify(data))
      } catch (error) {
        // Ignore storage errors
      }
    }
  }

  /**
   * Load events from localStorage
   */
  loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ultra_auth_monitor')
        if (stored) {
          const data = JSON.parse(stored)
          // Only load if data is recent (last 24 hours)
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            this.events = data.events || []
            this.metrics = { ...this.metrics, ...data.metrics }
            console.log('📊 ULTRA-MONITOR: Loaded previous session data')
          }
        }
      } catch (error) {
        console.warn('⚠️ ULTRA-MONITOR: Failed to load stored data', error)
      }
    }
  }

  /**
   * Clear all monitoring data
   */
  clear(): void {
    this.events = []
    this.metrics = {
      totalEvents: 0,
      successfulLogins: 0,
      failedLogins: 0,
      profileCreations: 0,
      redirects: 0,
      errors: 0,
      lastActivity: 0
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ultra_auth_monitor')
    }
    
    console.log('🧹 ULTRA-MONITOR: All data cleared')
  }

  /**
   * Export data for debugging
   */
  exportData(): any {
    return {
      events: this.events,
      metrics: this.metrics,
      report: this.generateReport(),
      timestamp: Date.now()
    }
  }
}

// Export singleton
export const authMonitor = AuthFlowMonitor.getInstance()

// Initialize with stored data
authMonitor.loadFromStorage()

// Convenient logging functions
export const logAuthEvent = (type: string, details: any, pathname?: string) => {
  authMonitor.logEvent(type, details, pathname)
}

export const logAuthError = (type: string, error: any, details?: any, pathname?: string) => {
  authMonitor.logError(type, error, details, pathname)
}

export const getAuthReport = () => {
  return authMonitor.generateReport()
}

export const getAuthMetrics = () => {
  return authMonitor.getMetrics()
}

// Global debug functions for console
if (typeof window !== 'undefined') {
  (window as any).ultraAuthDebug = {
    getReport: () => console.log(authMonitor.generateReport()),
    getMetrics: () => console.log(authMonitor.getMetrics()),
    getRecentEvents: (count?: number) => console.log(authMonitor.getRecentEvents(count)),
    clear: () => authMonitor.clear(),
    export: () => authMonitor.exportData()
  }
  
  console.log('🛠️ ULTRA-MONITOR: Debug functions available at window.ultraAuthDebug')
}
/**
 * Debug utilities for development logging
 * Only outputs logs when NEXT_PUBLIC_DEBUG=true
 */

const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'

/**
 * Debug log that only outputs in development when DEBUG=true
 */
export function debugLog(message: string, ...args: unknown[]) {
  if (isDebugEnabled) {
    console.log(message, ...args)
  }
}

/**
 * Debug error that only outputs in development when DEBUG=true
 */
export function debugError(message: string, ...args: unknown[]) {
  if (isDebugEnabled) {
    console.error(message, ...args)
  }
}

/**
 * Debug warn that only outputs in development when DEBUG=true  
 */
export function debugWarn(message: string, ...args: unknown[]) {
  if (isDebugEnabled) {
    console.warn(message, ...args)
  }
}

/**
 * Step-by-step debug logging for complex flows
 */
export function debugStep(step: string, details?: unknown) {
  if (isDebugEnabled) {
    console.log(`[STEP] ${step}`, details || '')
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return isDebugEnabled
}
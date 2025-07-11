/**
 * Utility to retry dynamic imports when they fail due to ChunkLoadError
 * This prevents users from getting stuck with old chunks after deployments
 */

import { debugLog, debugError } from './debug'

/**
 * Retries a dynamic import function if it fails due to chunk loading issues
 * @param fn Function that returns a Promise (typically a dynamic import)
 * @param retries Number of retries (default: 3)
 * @returns Promise that resolves to the imported module
 */
export const retryImport = <T>(fn: () => Promise<T>, retries = 3): Promise<T> =>
  fn().catch((err) => {
    const isChunkError = 
      /Loading chunk \d+ failed/.test(err.message) ||
      /Loading CSS chunk \d+ failed/.test(err.message) ||
      err.name === 'ChunkLoadError'

    if (retries <= 0 || !isChunkError) {
      debugError('[retryImport] Max retries reached or non-chunk error:', err.message)
      throw err
    }

    debugLog(`[retryImport] ChunkLoadError detected, retrying... (${retries} attempts left)`)
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(retryImport(fn, retries - 1)), 500)
    })
  })

/**
 * Enhanced retry with automatic page reload as last resort
 * @param fn Function that returns a Promise (typically a dynamic import)
 * @param retries Number of retries before reload (default: 2)
 * @returns Promise that resolves to the imported module
 */
export const retryImportWithReload = <T>(fn: () => Promise<T>, retries = 2): Promise<T> =>
  fn().catch((err) => {
    const isChunkError = 
      /Loading chunk \d+ failed/.test(err.message) ||
      /Loading CSS chunk \d+ failed/.test(err.message) ||
      err.name === 'ChunkLoadError'

    if (!isChunkError) {
      debugError('[retryImportWithReload] Non-chunk error:', err.message)
      throw err
    }

    if (retries <= 0) {
      debugError('[retryImportWithReload] Max retries reached, reloading page...')
      
      // Only reload in browser environment
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      
      // Throw error anyway for SSR environments
      throw new Error('ChunkLoadError: Page reload required')
    }

    debugLog(`[retryImportWithReload] ChunkLoadError detected, retrying... (${retries} attempts left)`)
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(retryImportWithReload(fn, retries - 1)), 500)
    })
  })

/**
 * Creates a wrapper for dynamic imports that automatically handles chunk errors
 * @param importPath Path to the module to import
 * @param retries Number of retries (default: 3)
 * @returns Function that returns a Promise resolving to the imported module
 */
export const createRetryableImport = <T>(
  importPath: string, 
  retries = 3
) => {
  return (): Promise<T> => 
    retryImport(() => import(importPath) as Promise<T>, retries)
}

/**
 * Global chunk error handler - set up once in _app.tsx or layout.tsx
 * Catches unhandled chunk errors and shows user-friendly message
 */
export const setupChunkErrorHandler = () => {
  if (typeof window === 'undefined') return

  const handleChunkError = (event: ErrorEvent) => {
    const isChunkError = 
      event.message?.includes('Loading chunk') ||
      event.message?.includes('ChunkLoadError') ||
      event.error?.name === 'ChunkLoadError'

    if (isChunkError) {
      debugError('[setupChunkErrorHandler] Global chunk error detected:', event.message)
      
      // Show user-friendly message
      const userConfirmed = confirm(
        'アプリケーションが更新されました。ページを再読み込みして最新版を表示しますか？\n\n' +
        '(The application has been updated. Would you like to reload the page to get the latest version?)'
      )
      
      if (userConfirmed) {
        window.location.reload()
      }
      
      // Prevent the error from propagating
      event.preventDefault()
      return false
    }
  }

  // Add error listeners
  window.addEventListener('error', handleChunkError)
  window.addEventListener('unhandledrejection', (event) => {
    const isChunkError = 
      event.reason?.message?.includes('Loading chunk') ||
      event.reason?.name === 'ChunkLoadError'
    
    if (isChunkError) {
      handleChunkError(new ErrorEvent('error', { 
        message: event.reason.message,
        error: event.reason 
      }))
    }
  })

  debugLog('[setupChunkErrorHandler] Global chunk error handler installed')
}
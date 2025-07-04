// Global type definitions for window extensions

declare global {
  interface Window {
    __supabase_singleton?: import('@supabase/supabase-js').SupabaseClient
    debugAuth?: () => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export {}
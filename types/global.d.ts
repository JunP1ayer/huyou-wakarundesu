// Global type definitions for window extensions

declare global {
  interface Window {
    __supabase_singleton?: import('@supabase/supabase-js').SupabaseClient
    debugAuth?: () => void
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export {}
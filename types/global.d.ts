// Global type definitions for window extensions

declare global {
  interface Window {
    __demo_mode?: boolean
    __supabase_singleton?: import('@supabase/supabase-js').SupabaseClient
    debugAuth?: () => void
  }
}

export {}
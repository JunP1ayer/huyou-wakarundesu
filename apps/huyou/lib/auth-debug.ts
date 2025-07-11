/**
 * Authentication debugging utilities
 * 認証フローのデバッグ用ユーティリティ
 */

export function debugAuthHeaders(headers: Headers) {
  const cookieHeader = headers.get('cookie')
  const authHeader = headers.get('authorization')
  
  console.log('[AUTH-DEBUG] Request headers:', {
    hasCookie: !!cookieHeader,
    cookieLength: cookieHeader?.length || 0,
    cookiePreview: cookieHeader?.substring(0, 50) + ((cookieHeader && cookieHeader.length > 50) ? '...' : ''),
    hasAuth: !!authHeader,
    userAgent: headers.get('user-agent')?.substring(0, 50),
    origin: headers.get('origin'),
    referer: headers.get('referer')
  })
  
  // Parse cookies for Supabase specific ones
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const supabaseCookies = cookies.filter(c => 
      c.includes('supabase') || 
      c.includes('sb-') || 
      c.includes('auth-token')
    )
    
    console.log('[AUTH-DEBUG] Supabase cookies found:', {
      total: cookies.length,
      supabaseCount: supabaseCookies.length,
      supabaseCookies: supabaseCookies.map(c => c.split('=')[0])
    })
  }
}

export function debugSessionResponse(session: unknown, error: unknown) {
  const sessionData = session as { user?: { id?: string }; access_token?: string; expires_at?: number } | null
  const errorData = error as { message?: string; code?: string } | null
  
  console.log('[AUTH-DEBUG] Session response:', {
    hasSession: !!sessionData,
    hasUser: !!sessionData?.user,
    userId: sessionData?.user?.id?.substring(0, 8) + '...',
    hasAccessToken: !!sessionData?.access_token,
    tokenLength: sessionData?.access_token?.length || 0,
    expiresAt: sessionData?.expires_at,
    hasError: !!errorData,
    errorMessage: errorData?.message,
    errorCode: errorData?.code
  })
  
  // Check token expiry
  if (sessionData?.expires_at) {
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = sessionData.expires_at
    const timeToExpiry = expiresAt - now
    
    console.log('[AUTH-DEBUG] Token timing:', {
      now,
      expiresAt,
      timeToExpirySeconds: timeToExpiry,
      isExpired: timeToExpiry <= 0,
      expiresInMinutes: Math.round(timeToExpiry / 60)
    })
  }
}

export function debugEnvironmentVars() {
  console.log('[AUTH-DEBUG] Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
  })
}
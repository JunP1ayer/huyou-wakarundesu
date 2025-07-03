/**
 * Authentication Debug Utility
 * Run window.debugAuth() in browser console for comprehensive diagnosis
 */

export function debugAuth() {
  console.log('🔍 AUTH DEBUG UTILITY')
  console.log('=' .repeat(50))
  
  // 1. Environment Variables Check
  console.log('📊 ENVIRONMENT VARIABLES:')
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅ SET' : '❌ MISSING'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅ SET' : '❌ MISSING'}`)
  
  if (hasSupabaseUrl) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    console.log(`   URL Format: ${url.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/) ? '✅ VALID' : '⚠️ INVALID'}`)
    console.log(`   URL Value: ${url.substring(0, 30)}...`)
  }
  
  // 2. Demo Mode Check
  const isDemoMode = !hasSupabaseUrl || !hasSupabaseKey
  const windowDemoMode = typeof window !== 'undefined' && (window as any).__demo_mode
  
  console.log('\n🎭 DEMO MODE:')
  console.log(`   Environment Demo Mode: ${isDemoMode ? '✅ ACTIVE' : '❌ INACTIVE'}`)
  console.log(`   Window Demo Mode: ${windowDemoMode ? '✅ ACTIVE' : '❌ INACTIVE'}`)
  
  // 3. Cookie Check
  console.log('\n🍪 COOKIES:')
  if (typeof document !== 'undefined') {
    const allCookies = document.cookie.split('; ')
    const supabaseCookies = allCookies.filter(c => c.startsWith('sb-'))
    
    console.log(`   Total Cookies: ${allCookies.length}`)
    console.log(`   Supabase Cookies: ${supabaseCookies.length}`)
    
    if (supabaseCookies.length > 0) {
      supabaseCookies.forEach(cookie => {
        const [name] = cookie.split('=')
        console.log(`   📋 ${name}`)
      })
    } else {
      console.log('   ❌ No Supabase cookies found')
    }
  }
  
  // 4. Network Test
  console.log('\n🌐 NETWORK TEST:')
  fetch('/manifest.json')
    .then(response => {
      console.log(`   /manifest.json: ${response.status} ${response.statusText}`)
      
      // Check debug headers
      const debugHeaders = [
        'X-Demo-Mode',
        'X-Middleware-Public-Path', 
        'X-Middleware-Path',
        'X-Supabase-URL-Set',
        'X-Supabase-Key-Set'
      ]
      
      debugHeaders.forEach(header => {
        const value = response.headers.get(header)
        if (value) {
          console.log(`   📋 ${header}: ${value}`)
        }
      })
    })
    .catch(error => {
      console.log(`   ❌ Network Error: ${error.message}`)
    })
  
  // 5. Recommendations
  console.log('\n💡 RECOMMENDATIONS:')
  if (isDemoMode) {
    console.log('   🎯 ADD ENVIRONMENT VARIABLES:')
    console.log('   1. Go to Vercel Dashboard')
    console.log('   2. Settings → Environment Variables')
    console.log('   3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.log('   4. Redeploy or wait for auto-redeploy')
  }
  
  if (supabaseCookies.length === 0 && !isDemoMode) {
    console.log('   🎯 NO AUTH COOKIES:')
    console.log('   1. Try logging in again')
    console.log('   2. Check browser console for auth errors')
    console.log('   3. Clear browser data and retry')
  }
  
  console.log('\n✅ Debug complete! Check results above.')
}

// Make it available globally in browser
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth
}
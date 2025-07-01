import { NextResponse } from 'next/server'
import { moneytreeClient } from '@/lib/moneytree'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Verify user is authenticated
    const supabase = await createSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database connection' }, { status: 500 })
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Generate state parameter for security
    const state = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Get authorization URL
    const authUrl = moneytreeClient.getAuthorizationUrl(state)
    
    return NextResponse.json({ authUrl })
    
  } catch (error) {
    console.error('Error initiating Moneytree connection:', error)
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 })
  }
}
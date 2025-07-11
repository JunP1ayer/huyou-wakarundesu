import { NextResponse } from 'next/server'
import { moneytreeClient } from '@/lib/moneytree'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Initialize admin client for API route
    const supabase = createSupabaseAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database connection' }, { status: 500 })
    }

    // For now, return a test response to confirm the client is working
    // In production, you'd verify user authentication and generate auth URL
    const authUrl = moneytreeClient.getAuthorizationUrl('test_state')
    
    return NextResponse.json({ 
      authUrl,
      message: 'Admin client initialized successfully' 
    })
    
  } catch (error) {
    console.error('Error initiating Moneytree connection:', error)
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 })
  }
}
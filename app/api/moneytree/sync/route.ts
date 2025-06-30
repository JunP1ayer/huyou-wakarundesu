import { NextResponse } from 'next/server'
import { moneytreeClient } from '@/lib/moneytree'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Verify user is authenticated
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's Moneytree tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_moneytree_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'No bank connection found' }, { status: 404 })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    let accessToken = tokenData.access_token
    
    if (now >= expiresAt) {
      // Refresh the token
      try {
        const refreshedTokens = await moneytreeClient.refreshAccessToken(tokenData.refresh_token)
        
        // Update tokens in database
        const { error: updateError } = await supabase
          .from('user_moneytree_tokens')
          .update({
            access_token: refreshedTokens.access_token,
            refresh_token: refreshedTokens.refresh_token,
            expires_at: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          throw new Error('Failed to update refreshed tokens')
        }
        
        accessToken = refreshedTokens.access_token
      } catch (error) {
        console.error('Error refreshing token:', error)
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
      }
    }

    // Sync transactions
    const accountsWithTransactions = await moneytreeClient.getCurrentYearIncomeTransactions(accessToken)
    
    const allTransactions = accountsWithTransactions.flatMap(account => 
      account.transactions.map(tx => ({
        user_id: user.id,
        date: tx.date,
        amount: Math.abs(tx.amount),
        description: tx.description || `Income from ${account.accountId}`,
        created_at: new Date().toISOString()
      }))
    )

    let syncedCount = 0
    if (allTransactions.length > 0) {
      const { error: syncError, count } = await supabase
        .from('transactions')
        .upsert(allTransactions, { 
          onConflict: 'user_id,date,amount,description',
          ignoreDuplicates: true 
        })

      if (syncError) {
        console.error('Error syncing transactions:', syncError)
        return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 })
      }
      
      syncedCount = count || 0
    }

    return NextResponse.json({ 
      success: true, 
      syncedTransactions: syncedCount,
      message: `Synced ${syncedCount} new transactions`
    })
    
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
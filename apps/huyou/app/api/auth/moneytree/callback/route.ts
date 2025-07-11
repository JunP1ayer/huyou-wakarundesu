import { NextRequest, NextResponse } from 'next/server'
import { moneytreeClient } from '@/lib/moneytree'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Moneytree OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=auth_failed', request.url))
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', request.url))
  }

  try {
    // Exchange code for access token
    const tokenData = await moneytreeClient.getAccessToken(code)
    
    // Get user from Supabase auth (assuming user is already authenticated)
    const supabase = await createSupabaseServerClient()
    
    if (!supabase) {
      console.error('Supabase client not available - missing environment variables')
      return NextResponse.redirect(new URL('/dashboard?error=config_error', request.url))
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User not authenticated:', userError)
      return NextResponse.redirect(new URL('/auth?error=not_authenticated', request.url))
    }

    // Store Moneytree tokens securely (you might want to encrypt these)
    // For this MVP, we'll store them in a user_moneytree_tokens table
    const { error: insertError } = await supabase
      .from('user_moneytree_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing tokens:', insertError)
      return NextResponse.redirect(new URL('/dashboard?error=token_storage_failed', request.url))
    }

    // Fetch and sync transactions
    await syncUserTransactions(user.id, tokenData.access_token)

    // Redirect to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?success=bank_connected', request.url))
    
  } catch (error) {
    console.error('Moneytree callback error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=callback_failed', request.url))
  }
}

async function syncUserTransactions(userId: string, accessToken: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    if (!supabase) {
      console.error('Supabase client not available - skipping transaction sync')
      return
    }
    
    // Get all income transactions for the current year
    const accountsWithTransactions = await moneytreeClient.getCurrentYearIncomeTransactions(accessToken)
    
    const allTransactions = accountsWithTransactions.flatMap(account => 
      account.transactions.map(tx => ({
        user_id: userId,
        date: tx.date,
        amount: Math.abs(tx.amount), // Ensure positive amount
        description: tx.description || `Income from ${account.accountId}`,
        created_at: new Date().toISOString()
      }))
    )

    if (allTransactions.length > 0) {
      // Insert transactions (this will trigger the user_stats update via database triggers)
      const { error } = await supabase
        .from('transactions')
        .upsert(allTransactions, { 
          onConflict: 'user_id,date,amount,description',
          ignoreDuplicates: true 
        })

      if (error) {
        console.error('Error syncing transactions:', error)
      } else {
        console.log(`Synced ${allTransactions.length} transactions for user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error in syncUserTransactions:', error)
  }
}
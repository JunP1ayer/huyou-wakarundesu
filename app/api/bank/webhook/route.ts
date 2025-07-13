/**
 * Bank webhook endpoint for processing deposit notifications
 * Handles MoneyTap webhook events and classifies deposits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyDeposit } from '@/lib/deposit-classifier';

interface BankWebhookPayload {
  user_id: string;
  account_id: string;
  transaction_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_type: 'deposit' | 'withdrawal';
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on MoneyTap specs)
    const signature = request.headers.get('x-moneytap-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const payload: BankWebhookPayload = await request.json();
    
    // Only process deposits
    if (payload.transaction_type !== 'deposit') {
      return NextResponse.json({ success: true, message: 'Ignored non-deposit transaction' });
    }

    const supabase = createClient();
    
    // Get user's bank connection
    const { data: bankConnection, error: connectionError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', payload.user_id)
      .eq('account_id', payload.account_id)
      .single();

    if (connectionError || !bankConnection) {
      console.error('Bank connection not found:', connectionError);
      return NextResponse.json({ error: 'Bank connection not found' }, { status: 404 });
    }

    // Get user's jobs for classification
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', payload.user_id);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Error fetching user jobs' }, { status: 500 });
    }

    // Classify the deposit
    const classification = await classifyDeposit({
      amount: payload.amount,
      description: payload.description,
      transactionDate: new Date(payload.transaction_date),
      jobs: jobs || [],
      userId: payload.user_id
    });

    // Insert deposit record
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: payload.user_id,
        bank_connection_id: bankConnection.id,
        amount: payload.amount,
        description: payload.description,
        transaction_date: payload.transaction_date,
        classification: classification.type,
        job_id: classification.jobId,
        is_taxable: classification.isTaxable
      })
      .select()
      .single();

    if (depositError) {
      console.error('Error inserting deposit:', depositError);
      return NextResponse.json({ error: 'Error saving deposit' }, { status: 500 });
    }

    // Trigger allowance recalculation (handled by database trigger)
    
    return NextResponse.json({
      success: true,
      deposit_id: deposit.id,
      classification: classification.type,
      needs_review: classification.type === 'needs_review'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Webhook verification helper
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // Implement HMAC verification based on MoneyTap specs
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
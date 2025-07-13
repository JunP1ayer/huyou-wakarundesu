/**
 * Bank Deposit Webhook Simulator
 * Receives mock bank deposit data and processes it through our classification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyDeposit } from '@/lib/deposit-classifier';

interface DepositWebhookPayload {
  user_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  bank_name: string;
  account_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: DepositWebhookPayload = await request.json();
    const supabase = createClient();

    // Validate required fields
    if (!payload.user_id || !payload.amount || !payload.description) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, amount, description' },
        { status: 400 }
      );
    }

    // Get user's jobs for classification
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', payload.user_id);

    // Classify the deposit
    const classification = classifyDeposit(payload.description, jobs || []);

    // Insert deposit record
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: payload.user_id,
        amount: payload.amount,
        description: payload.description,
        transaction_date: payload.transaction_date,
        bank_name: payload.bank_name,
        account_id: payload.account_id,
        is_income: classification.isIncome,
        job_id: classification.jobId,
        confidence_score: classification.confidence,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (depositError) {
      console.error('Failed to insert deposit:', depositError);
      return NextResponse.json(
        { error: 'Failed to save deposit' },
        { status: 500 }
      );
    }

    // If classified as income, create an event and trigger recalculation
    if (classification.isIncome && deposit) {
      const { error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: payload.user_id,
          amount: payload.amount,
          event_date: payload.transaction_date,
          description: `Bank deposit: ${payload.description}`,
          source: 'bank_webhook',
          source_id: deposit.id,
          created_at: new Date().toISOString()
        });

      if (eventError) {
        console.error('Failed to create event:', eventError);
      }

      // Trigger allowance recalculation
      const { error: calcError } = await supabase.rpc('recalc_allowance', {
        p_user_id: payload.user_id
      });

      if (calcError) {
        console.error('Failed to recalculate allowance:', calcError);
      }
    }

    return NextResponse.json({
      success: true,
      deposit_id: deposit.id,
      classification: {
        is_income: classification.isIncome,
        job_id: classification.jobId,
        confidence: classification.confidence,
        matched_keywords: classification.matchedKeywords
      },
      message: classification.isIncome 
        ? 'Deposit processed and added to income tracking'
        : 'Deposit recorded but not classified as income'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (if needed)
export async function GET() {
  return NextResponse.json({
    message: 'Bank deposit webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
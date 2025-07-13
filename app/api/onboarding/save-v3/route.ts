/**
 * Save onboarding v3 data endpoint
 * Handles the new adaptive onboarding flow with 2025 tax rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OnboardingAnswers } from '@/types/onboarding';

export async function POST(request: NextRequest) {
  try {
    const answers: OnboardingAnswers = await request.json();
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start transaction-like operations
    const operations = [];

    // 1. Update profile with onboarding answers
    const profileData = {
      user_id: user.id,
      date_of_birth: answers.dob,
      is_student: answers.student || false,
      insurance_status: answers.insurance_status || 'parent',
      multi_pay: answers.multi_pay || false,
      other_income: answers.other_income || false,
      future_self_ins_date: answers.future_self_ins_date,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    operations.push(
      supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
    );

    // 2. Save jobs if provided
    if (answers.jobs && answers.jobs.length > 0) {
      const jobsData = answers.jobs.map(job => ({
        ...job,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      operations.push(
        supabase
          .from('jobs')
          .upsert(jobsData, { onConflict: 'id' })
      );
    }

    // 3. Save bank connections if provided
    if (answers.bank_connections && answers.bank_connections.length > 0) {
      const connectionsData = answers.bank_connections.map(connection => ({
        ...connection,
        user_id: user.id,
        connected_at: new Date().toISOString()
      }));

      operations.push(
        supabase
          .from('bank_connections')
          .upsert(connectionsData, { onConflict: 'id' })
      );
    }

    // Execute all operations
    const results = await Promise.all(operations);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Database operation failed:', result.error);
        return NextResponse.json(
          { error: 'Failed to save onboarding data' },
          { status: 500 }
        );
      }
    }

    // 4. Trigger initial allowance calculation
    const { error: calcError } = await supabase.rpc('recalc_allowance', {
      p_user_id: user.id
    });

    if (calcError) {
      console.error('Initial allowance calculation failed:', calcError);
      // Don't fail the request for this, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully',
      user_id: user.id
    });

  } catch (error) {
    console.error('Onboarding save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
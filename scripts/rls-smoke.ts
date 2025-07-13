/**
 * RLS Security Audit Script
 * Tests Row Level Security policies by attempting unauthorized cross-user operations
 * Should expect 403/unauthorized errors for proper security implementation
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class RLSSmokeTest {
  private supabase;
  private results: TestResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  private async createTestUsers() {
    console.log('🔧 Setting up test users...');
    
    // Create two test users with different IDs
    const testUser1 = {
      id: 'test-user-1-' + Date.now(),
      email: 'test1@example.com',
      dob: new Date('2003-01-01'),
      is_student: true,
      insurance_status: 'parent' as const
    };

    const testUser2 = {
      id: 'test-user-2-' + Date.now(),
      email: 'test2@example.com', 
      dob: new Date('1998-01-01'),
      is_student: false,
      insurance_status: 'self' as const
    };

    // Insert test profiles using service role (bypasses RLS)
    await this.supabase.from('profiles').upsert([
      {
        user_id: testUser1.id,
        date_of_birth: testUser1.dob.toISOString().split('T')[0],
        is_student: testUser1.is_student,
        insurance_status: testUser1.insurance_status,
        remaining_allowance: 1500000,
        current_income: 0
      },
      {
        user_id: testUser2.id,
        date_of_birth: testUser2.dob.toISOString().split('T')[0],
        is_student: testUser2.is_student,
        insurance_status: testUser2.insurance_status,
        remaining_allowance: 1300000,
        current_income: 0
      }
    ]);

    return { testUser1, testUser2 };
  }

  private async testCrossUserProfileRead(user1Id: string, user2Id: string) {
    console.log('🔒 Testing cross-user profile read...');
    
    try {
      // Create client with user1's auth context
      const user1Client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Set RLS context to user1
      await user1Client.rpc('set_current_user_id', { user_id: user1Id });
      
      // Attempt to read user2's profile - should fail
      const { data, error } = await user1Client
        .from('profiles')
        .select('*')
        .eq('user_id', user2Id)
        .single();

      if (error && (error.code === 'PGRST116' || error.message.includes('No rows found'))) {
        this.results.push({
          test: 'Cross-user profile read',
          passed: true,
          details: 'Correctly blocked unauthorized read'
        });
      } else if (data) {
        this.results.push({
          test: 'Cross-user profile read',
          passed: false,
          error: 'Security vulnerability: Cross-user read succeeded',
          details: data
        });
      } else {
        this.results.push({
          test: 'Cross-user profile read',
          passed: false,
          error: `Unexpected error: ${error?.message}`,
          details: error
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Cross-user profile read',
        passed: false,
        error: `Test execution failed: ${error}`,
        details: error
      });
    }
  }

  private async testCrossUserEventWrite(user1Id: string, user2Id: string) {
    console.log('🔒 Testing cross-user event write...');
    
    try {
      // Create client with user1's context
      const user1Client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await user1Client.rpc('set_current_user_id', { user_id: user1Id });
      
      // Attempt to insert event for user2 - should fail
      const { error } = await user1Client
        .from('events')
        .insert({
          user_id: user2Id, // Wrong user!
          amount: 50000,
          event_date: new Date().toISOString().split('T')[0],
          description: 'Unauthorized test event',
          source: 'rls_test'
        });

      if (error && error.message.includes('denied')) {
        this.results.push({
          test: 'Cross-user event write',
          passed: true,
          details: 'Correctly blocked unauthorized write'
        });
      } else if (!error) {
        this.results.push({
          test: 'Cross-user event write',
          passed: false,
          error: 'Security vulnerability: Cross-user write succeeded'
        });
      } else {
        this.results.push({
          test: 'Cross-user event write',
          passed: false,
          error: `Unexpected error: ${error.message}`,
          details: error
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Cross-user event write',
        passed: false,
        error: `Test execution failed: ${error}`,
        details: error
      });
    }
  }

  private async testOwnUserAccess(userId: string) {
    console.log('✅ Testing own user access...');
    
    try {
      const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await userClient.rpc('set_current_user_id', { user_id: userId });
      
      // Should be able to read own profile
      const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        this.results.push({
          test: 'Own user profile read',
          passed: false,
          error: `Failed to read own profile: ${profileError.message}`,
          details: profileError
        });
        return;
      }

      // Should be able to insert own event
      const { error: eventError } = await userClient
        .from('events')
        .insert({
          user_id: userId,
          amount: 25000,
          event_date: new Date().toISOString().split('T')[0],
          description: 'RLS test own event',
          source: 'rls_test'
        });

      if (eventError) {
        this.results.push({
          test: 'Own user event write',
          passed: false,
          error: `Failed to write own event: ${eventError.message}`,
          details: eventError
        });
      } else {
        this.results.push({
          test: 'Own user access',
          passed: true,
          details: 'Successfully read profile and wrote event'
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Own user access',
        passed: false,
        error: `Test execution failed: ${error}`,
        details: error
      });
    }
  }

  private async testManualIncomeRLS(user1Id: string, user2Id: string) {
    console.log('🔒 Testing manual income RLS...');
    
    try {
      const user1Client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await user1Client.rpc('set_current_user_id', { user_id: user1Id });
      
      // Create manual income for user1
      const { data: ownIncome, error: ownError } = await user1Client
        .from('manual_incomes')
        .insert({
          user_id: user1Id,
          amount: 30000,
          paid_on: new Date().toISOString().split('T')[0],
          taxable: true,
          description: 'Own income test',
          category: 'other'
        })
        .select()
        .single();

      if (ownError) {
        this.results.push({
          test: 'Manual income own write',
          passed: false,
          error: `Failed to create own manual income: ${ownError.message}`
        });
        return;
      }

      // Try to read user2's manual incomes - should fail
      const { data: crossIncomes, error: crossError } = await user1Client
        .from('manual_incomes')
        .select('*')
        .eq('user_id', user2Id);

      if (crossError || !crossIncomes || crossIncomes.length === 0) {
        this.results.push({
          test: 'Manual income cross-user read',
          passed: true,
          details: 'Correctly blocked cross-user manual income read'
        });
      } else {
        this.results.push({
          test: 'Manual income cross-user read', 
          passed: false,
          error: 'Security vulnerability: Cross-user manual income read succeeded',
          details: crossIncomes
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Manual income RLS',
        passed: false,
        error: `Test execution failed: ${error}`,
        details: error
      });
    }
  }

  private async cleanup(user1Id: string, user2Id: string) {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test data using service role
      await Promise.all([
        this.supabase.from('events').delete().or(`user_id.eq.${user1Id},user_id.eq.${user2Id}`),
        this.supabase.from('manual_incomes').delete().or(`user_id.eq.${user1Id},user_id.eq.${user2Id}`),
        this.supabase.from('profiles').delete().or(`user_id.eq.${user1Id},user_id.eq.${user2Id}`)
      ]);
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }
  }

  async runTests(): Promise<void> {
    console.log('🚀 Starting RLS Security Audit...\n');

    try {
      // Setup test users
      const { testUser1, testUser2 } = await this.createTestUsers();
      
      // Run security tests
      await this.testCrossUserProfileRead(testUser1.id, testUser2.id);
      await this.testCrossUserEventWrite(testUser1.id, testUser2.id);
      await this.testOwnUserAccess(testUser1.id);
      await this.testManualIncomeRLS(testUser1.id, testUser2.id);
      
      // Cleanup
      await this.cleanup(testUser1.id, testUser2.id);
      
    } catch (error) {
      console.error('❌ RLS audit setup failed:', error);
      process.exit(1);
    }

    // Print results
    console.log('\n📊 RLS Security Audit Results:');
    console.log('================================');
    
    let passed = 0;
    let total = this.results.length;
    
    for (const result of this.results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}`);
      
      if (!result.passed) {
        console.log(`   Error: ${result.error}`);
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
        }
      }
      
      if (result.passed) passed++;
    }
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('✅ All RLS security tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some RLS security tests failed!');
      process.exit(1);
    }
  }
}

// Run the audit
if (require.main === module) {
  const audit = new RLSSmokeTest();
  audit.runTests().catch(error => {
    console.error('💥 RLS audit crashed:', error);
    process.exit(1);
  });
}

export default RLSSmokeTest;
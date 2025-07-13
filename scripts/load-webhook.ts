/**
 * Webhook Load Testing Script
 * Fires 1000 deposits/min for 5 min with random jobIds
 * Asserts profiles.remaining_allowance updates < 200ms avg
 */

import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface LoadTestConfig {
  depositsPerMinute: number;
  testDurationMinutes: number;
  targetResponseTime: number; // ms
}

interface DepositPayload {
  user_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  bank_name: string;
  account_id?: string;
}

interface TestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  responseTimes: number[];
  errors: Array<{ timestamp: string; error: string; payload?: any }>;
  allowanceUpdateTimes: number[];
}

class WebhookLoadTester {
  private supabase;
  private config: LoadTestConfig;
  private metrics: TestMetrics;
  private testUserId: string;
  private jobIds: string[] = [];

  constructor(config: LoadTestConfig) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: [],
      errors: [],
      allowanceUpdateTimes: []
    };
    this.testUserId = 'load-test-user-' + Date.now();
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up load test environment...');

    // Create test user profile
    const { error: profileError } = await this.supabase
      .from('profiles')
      .upsert({
        user_id: this.testUserId,
        date_of_birth: '2003-01-01',
        is_student: true,
        insurance_status: 'parent',
        remaining_allowance: 1500000,
        current_income: 0,
        multi_pay: true,
        other_income: false
      });

    if (profileError) {
      throw new Error(`Failed to create test profile: ${profileError.message}`);
    }

    // Create test jobs for random selection
    const testJobs = [
      { employer_name: 'セブンイレブン', job_type: 'part_time' },
      { employer_name: 'ファミリーマート', job_type: 'part_time' },
      { employer_name: 'ローソン', job_type: 'part_time' },
      { employer_name: 'スターバックス', job_type: 'part_time' },
      { employer_name: 'マクドナルド', job_type: 'part_time' },
      { employer_name: 'ユニクロ', job_type: 'part_time' },
      { employer_name: 'イオン', job_type: 'part_time' },
      { employer_name: 'ドン・キホーテ', job_type: 'part_time' }
    ];

    for (const job of testJobs) {
      const { data, error } = await this.supabase
        .from('jobs')
        .insert({
          user_id: this.testUserId,
          employer_name: job.employer_name,
          job_type: job.job_type,
          hourly_rate: Math.floor(Math.random() * 500) + 1000, // 1000-1500
          expected_monthly_hours: Math.floor(Math.random() * 60) + 40 // 40-100
        })
        .select('id')
        .single();

      if (error) {
        console.warn(`Failed to create job ${job.employer_name}:`, error);
      } else if (data) {
        this.jobIds.push(data.id);
      }
    }

    console.log(`✅ Created test environment with ${this.jobIds.length} jobs`);
  }

  private generateRandomDeposit(): DepositPayload {
    const employers = [
      'セブンイレブン', 'ファミリーマート', 'ローソン', 'スターバックス',
      'マクドナルド', 'ユニクロ', 'イオン', 'ドン・キホーテ', 'タリーズ', 'CoCo壱番屋'
    ];

    const banks = [
      'ゆうちょ銀行', '三菱UFJ銀行', '三井住友銀行', 'みずほ銀行',
      'りそな銀行', '楽天銀行', '住信SBIネット銀行', 'PayPay銀行'
    ];

    return {
      user_id: this.testUserId,
      amount: Math.floor(Math.random() * 100000) + 20000, // 20k-120k yen
      description: employers[Math.floor(Math.random() * employers.length)] + 'バイト代',
      transaction_date: new Date().toISOString().split('T')[0],
      bank_name: banks[Math.floor(Math.random() * banks.length)],
      account_id: `test_account_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private async sendWebhookRequest(payload: DepositPayload): Promise<{ 
    success: boolean; 
    responseTime: number; 
    allowanceUpdateTime?: number;
    error?: string 
  }> {
    const startTime = performance.now();
    
    // Get initial allowance
    const { data: initialProfile } = await this.supabase
      .from('profiles')
      .select('remaining_allowance')
      .eq('user_id', this.testUserId)
      .single();

    const initialAllowance = initialProfile?.remaining_allowance || 0;

    try {
      const response = await fetch(`${API_BASE_URL}/api/webhook/bank-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseTime = performance.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          responseTime,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();

      // If classified as income, measure allowance update time
      let allowanceUpdateTime: number | undefined;
      if (result.classification?.is_income) {
        const updateStartTime = performance.now();
        
        // Poll for allowance update (max 2 seconds)
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          const { data: updatedProfile } = await this.supabase
            .from('profiles')
            .select('remaining_allowance')
            .eq('user_id', this.testUserId)
            .single();

          if (updatedProfile && updatedProfile.remaining_allowance !== initialAllowance) {
            allowanceUpdateTime = performance.now() - updateStartTime;
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          attempts++;
        }

        if (!allowanceUpdateTime) {
          allowanceUpdateTime = performance.now() - updateStartTime;
          console.warn(`⚠️ Allowance update not detected within 2 seconds`);
        }
      }

      return {
        success: true,
        responseTime,
        allowanceUpdateTime
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        responseTime,
        error: `Network error: ${error}`
      };
    }
  }

  private updateMetrics(result: { 
    success: boolean; 
    responseTime: number; 
    allowanceUpdateTime?: number;
    error?: string;
    payload?: any;
  }): void {
    this.metrics.totalRequests++;
    this.metrics.responseTimes.push(result.responseTime);

    if (result.success) {
      this.metrics.successfulRequests++;
      if (result.allowanceUpdateTime) {
        this.metrics.allowanceUpdateTimes.push(result.allowanceUpdateTime);
      }
    } else {
      this.metrics.failedRequests++;
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: result.error || 'Unknown error',
        payload: result.payload
      });
    }

    // Update response time stats
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, result.responseTime);
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, result.responseTime);
    this.metrics.averageResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
  }

  private async runLoadTest(): Promise<void> {
    console.log(`🚀 Starting load test: ${this.config.depositsPerMinute} deposits/min for ${this.config.testDurationMinutes} minutes`);
    
    const totalRequests = this.config.depositsPerMinute * this.config.testDurationMinutes;
    const intervalMs = (60 * 1000) / this.config.depositsPerMinute; // Time between requests
    
    console.log(`📊 Total requests: ${totalRequests}, Interval: ${intervalMs.toFixed(1)}ms`);

    const startTime = Date.now();
    const endTime = startTime + (this.config.testDurationMinutes * 60 * 1000);
    
    let requestCount = 0;
    
    while (Date.now() < endTime && requestCount < totalRequests) {
      const requestStartTime = performance.now();
      
      // Generate and send request
      const payload = this.generateRandomDeposit();
      const result = await this.sendWebhookRequest(payload);
      
      // Update metrics
      this.updateMetrics({ ...result, payload });
      
      requestCount++;
      
      // Progress reporting
      if (requestCount % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = requestCount / elapsed * 60;
        console.log(`📈 Progress: ${requestCount}/${totalRequests} (${rate.toFixed(1)} req/min, ${this.metrics.successfulRequests}/${this.metrics.totalRequests} success)`);
      }
      
      // Throttle to maintain target rate
      const expectedDuration = intervalMs;
      const actualDuration = performance.now() - requestStartTime;
      const waitTime = Math.max(0, expectedDuration - actualDuration);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    console.log('✅ Load test completed');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      await Promise.all([
        this.supabase.from('events').delete().eq('user_id', this.testUserId),
        this.supabase.from('deposits').delete().eq('user_id', this.testUserId),
        this.supabase.from('manual_incomes').delete().eq('user_id', this.testUserId),
        this.supabase.from('jobs').delete().eq('user_id', this.testUserId),
        this.supabase.from('profiles').delete().eq('user_id', this.testUserId)
      ]);
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }
  }

  private generateReport(): void {
    console.log('\n📊 Load Test Report');
    console.log('==================');
    
    console.log(`\n📈 Request Statistics:`);
    console.log(`Total Requests: ${this.metrics.totalRequests}`);
    console.log(`Successful: ${this.metrics.successfulRequests} (${(this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1)}%)`);
    console.log(`Failed: ${this.metrics.failedRequests} (${(this.metrics.failedRequests / this.metrics.totalRequests * 100).toFixed(1)}%)`);
    
    console.log(`\n⏱️ Response Time Statistics:`);
    console.log(`Average: ${this.metrics.averageResponseTime.toFixed(1)}ms`);
    console.log(`Min: ${this.metrics.minResponseTime.toFixed(1)}ms`);
    console.log(`Max: ${this.metrics.maxResponseTime.toFixed(1)}ms`);
    
    // Calculate percentiles
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    console.log(`P50: ${p50?.toFixed(1)}ms`);
    console.log(`P95: ${p95?.toFixed(1)}ms`);
    console.log(`P99: ${p99?.toFixed(1)}ms`);
    
    if (this.metrics.allowanceUpdateTimes.length > 0) {
      const avgUpdateTime = this.metrics.allowanceUpdateTimes.reduce((a, b) => a + b, 0) / this.metrics.allowanceUpdateTimes.length;
      const maxUpdateTime = Math.max(...this.metrics.allowanceUpdateTimes);
      
      console.log(`\n💰 Allowance Update Statistics:`);
      console.log(`Updates Measured: ${this.metrics.allowanceUpdateTimes.length}`);
      console.log(`Average Update Time: ${avgUpdateTime.toFixed(1)}ms`);
      console.log(`Max Update Time: ${maxUpdateTime.toFixed(1)}ms`);
      
      // Check if meets target
      const targetMet = avgUpdateTime < this.config.targetResponseTime;
      console.log(`Target (<${this.config.targetResponseTime}ms): ${targetMet ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    if (this.metrics.errors.length > 0) {
      console.log(`\n❌ Error Summary:`);
      const errorCounts = this.metrics.errors.reduce((acc, error) => {
        acc[error.error] = (acc[error.error] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`${error}: ${count} occurrences`);
      });
    }
    
    // Overall assessment
    const successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    const avgUpdateTime = this.metrics.allowanceUpdateTimes.length > 0 
      ? this.metrics.allowanceUpdateTimes.reduce((a, b) => a + b, 0) / this.metrics.allowanceUpdateTimes.length 
      : 0;
    
    console.log(`\n🎯 Overall Assessment:`);
    
    if (successRate >= 0.95 && avgUpdateTime < this.config.targetResponseTime) {
      console.log('✅ PASS - System meets performance requirements');
    } else {
      console.log('❌ FAIL - System does not meet performance requirements');
      if (successRate < 0.95) console.log(`   - Success rate too low: ${(successRate * 100).toFixed(1)}% (target: 95%)`);
      if (avgUpdateTime >= this.config.targetResponseTime) console.log(`   - Update time too slow: ${avgUpdateTime.toFixed(1)}ms (target: <${this.config.targetResponseTime}ms)`);
    }
  }

  async run(): Promise<void> {
    try {
      await this.setupTestEnvironment();
      await this.runLoadTest();
      this.generateReport();
      
      // Write results to file for CI
      const results = {
        timestamp: new Date().toISOString(),
        config: this.config,
        metrics: this.metrics
      };
      
      const fs = require('fs');
      const path = require('path');
      
      const resultsDir = path.join(process.cwd(), 'load-test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(resultsDir, `load-test-${Date.now()}.json`),
        JSON.stringify(results, null, 2)
      );
      
    } finally {
      await this.cleanup();
    }
  }
}

// Run load test if called directly
if (require.main === module) {
  const config: LoadTestConfig = {
    depositsPerMinute: 1000,
    testDurationMinutes: 5,
    targetResponseTime: 200 // ms
  };
  
  const tester = new WebhookLoadTester(config);
  tester.run().catch(error => {
    console.error('💥 Load test failed:', error);
    process.exit(1);
  });
}

export default WebhookLoadTester;
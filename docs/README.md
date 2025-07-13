# 扶養わかるんです。Documentation

## Overview

「扶養わかるんです。」is a FinTech application designed to help Japanese students and part-time workers track their income and stay within dependency allowance limits. The application features real-time allowance calculation, intelligent bank deposit classification, and adaptive onboarding based on 2025 tax reforms.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase DB    │    │  External APIs  │
│                 │    │                  │    │                 │
│ • Onboarding    │◄──►│ • Profiles       │    │ • Bank Webhooks │
│ • Dashboard     │    │ • Events         │    │ • Sentry        │
│ • API Routes    │    │ • Manual Income  │    │ • LogRocket     │
│                 │    │ • Jobs           │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        └────────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  Tax Calculation │
                    │     Engine       │
                    │                  │
                    │ • 2025 Reforms   │
                    │ • Age-aware      │
                    │ • Real-time      │
                    └──────────────────┘
```

## API Endpoints

### Authentication & User Management

#### `GET /api/auth/validate`
Validates user authentication status and returns user profile information.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "profile": {
    "date_of_birth": "2003-01-01",
    "is_student": true,
    "insurance_status": "parent",
    "remaining_allowance": 1500000,
    "current_income": 850000
  }
}
```

### Onboarding

#### `POST /api/onboarding/save-v3`
Saves adaptive onboarding v3 data with conditional navigation results.

**Request Body:**
```json
{
  "dob": "2003-01-01",
  "student": true,
  "insurance_status": "parent",
  "other_income": false,
  "multi_pay": true,
  "future_self_ins_date": null,
  "jobs": [
    {
      "employer_name": "セブンイレブン渋谷店",
      "job_type": "part_time",
      "hourly_rate": 1200,
      "expected_monthly_hours": 80
    }
  ],
  "bank_connections": [
    {
      "bank_name": "ゆうちょ銀行",
      "account_type": "checking",
      "account_nickname": "メイン口座"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding data saved successfully",
  "user_id": "uuid"
}
```

### Bank Integration

#### `POST /api/webhook/bank-deposit`
Processes bank deposit webhooks with intelligent income classification.

**Request Body:**
```json
{
  "user_id": "uuid",
  "amount": 85000,
  "description": "セブンイレブン",
  "transaction_date": "2025-01-13",
  "bank_name": "ゆうちょ銀行",
  "account_id": "demo_account_123"
}
```

**Response:**
```json
{
  "success": true,
  "deposit_id": "uuid",
  "classification": {
    "is_income": true,
    "job_id": "uuid",
    "confidence": 0.95,
    "matched_keywords": ["セブンイレブン"]
  },
  "message": "Deposit processed and added to income tracking"
}
```

## Webhook Simulator

The application includes a comprehensive webhook simulator for testing bank deposit classification without requiring actual bank integration.

### Features

- **Multiple Scenarios**: Pre-configured test scenarios for different income types
- **Real-time Classification**: Tests the fuzzy matching algorithm with confidence scoring
- **Performance Monitoring**: Measures allowance update response times
- **Visual Feedback**: Shows classification results and matched keywords

### Available Test Scenarios

1. **給与入金 (Salary Deposit)**: セブンイレブン - ¥85,000
2. **副業給与 (Side Job)**: スターバックス - ¥45,000  
3. **現金バイト (Cash Job)**: イベントスタッフ給与 - ¥12,000
4. **非給与入金 (Non-Income)**: 家族からの送金 - ¥30,000
5. **フリーランス (Freelance)**: Webデザイン報酬 - ¥150,000

### Usage

1. Navigate to Dashboard
2. Locate "入金シミュレーター" section
3. Select a test scenario
4. Click "入金をシミュレート"
5. Review classification results and performance metrics

## CI/CD Commands

### Development Commands

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Security & Performance Testing

```bash
# Run RLS security audit
npm run rls-test

# Run load testing (webhook performance)
npm run load-test

# Combined security audit
npm run security:audit

# Performance audit with Lighthouse
npm run perf:audit
```

### Build & Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Build Storybook
npm run build-storybook

# Run Storybook development server
npm run storybook
```

### CI Pipeline

The GitHub Actions pipeline includes the following jobs:

1. **install**: Dependency installation with Node.js 18/20 matrix
2. **lint**: ESLint and TypeScript checking
3. **unit**: Jest unit tests with coverage
4. **rls-audit**: Supabase RLS security testing
5. **e2e**: Playwright end-to-end tests
6. **storybook**: Component library build
7. **build**: Production build validation
8. **load-test**: Performance testing (release branches only)

### Environment Variables

#### Required for CI/CD

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Analytics (optional)
OPENAI_API_KEY=your_openai_key
MIXPANEL_TOKEN=your_mixpanel_token

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_LOGROCKET_ID=your_logrocket_id

# Vercel (for staging deployment)
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
VERCEL_TOKEN=your_vercel_token
```

## Tax Calculation Logic

### 2025 Tax Reform Thresholds

| Wall Type | Amount | Applies To |
|-----------|--------|------------|
| 住民税 (Resident Tax) | ¥1,100,000 | All dependents |
| 所得税一般 (Income Tax General) | ¥1,230,000 | Non-students, students outside 19-22 |
| 所得税特定扶養 (Income Tax Student) | ¥1,500,000 | Students aged 19-22 |
| 社会保険 (Social Insurance) | ¥1,300,000 | Self-insured individuals |

### Adaptive Logic

The application uses age-aware threshold calculation:

```typescript
// Example: 21-year-old student with parent's insurance
const result = decideThreshold({
  dob: new Date('2003-01-01'),
  student: true,
  insurance_status: 'parent',
  eventDate: new Date('2025-01-13')
});

// Result: { currentWall: 1500000, currentWallType: 'incomeStudent' }
```

### Future Insurance Planning

Users can set a future date when they'll switch to self-insurance:

```typescript
const result = decideThreshold({
  dob: new Date('2003-01-01'),
  student: true,
  insurance_status: 'parent',
  future_self_ins_date: new Date('2025-04-01'),
  eventDate: new Date('2025-05-01') // After the switch date
});

// Result: { currentWall: 1300000, currentWallType: 'socialInsurance' }
```

## Database Schema

### Core Tables

#### `profiles`
User profile information with adaptive threshold fields.

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  date_of_birth DATE NOT NULL,
  is_student BOOLEAN DEFAULT false,
  insurance_status TEXT CHECK (insurance_status IN ('parent', 'self')),
  multi_pay BOOLEAN DEFAULT false,
  other_income BOOLEAN DEFAULT false,
  future_self_ins_date DATE,
  remaining_allowance INTEGER DEFAULT 0,
  current_income INTEGER DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `events`
All income events with automatic allowance recalculation.

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  source TEXT, -- 'manual', 'bank_webhook', etc.
  source_id UUID, -- Reference to source record
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `manual_incomes`
User-entered income for non-automated sources.

```sql
CREATE TABLE manual_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  paid_on DATE NOT NULL,
  taxable BOOLEAN DEFAULT true,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('salary', 'freelance', 'cash_job', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `jobs`
Employer information for bank deposit classification.

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  job_type TEXT CHECK (job_type IN ('part_time', 'full_time', 'freelance', 'other')),
  hourly_rate INTEGER,
  expected_monthly_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Real-time Triggers

The database includes PostgreSQL triggers that automatically recalculate allowances when income events are added:

```sql
CREATE OR REPLACE FUNCTION recalc_allowance(p_user_id UUID)
RETURNS void AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  total_income INTEGER;
  threshold_result RECORD;
  new_remaining INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record FROM profiles WHERE user_id = p_user_id;
  
  -- Calculate total income for current year
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM events 
  WHERE user_id = p_user_id 
    AND EXTRACT(YEAR FROM event_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Determine threshold (simplified)
  IF profile_record.insurance_status = 'self' THEN
    new_remaining := 1300000 - total_income;
  ELSIF profile_record.is_student AND 
        EXTRACT(YEAR FROM AGE(profile_record.date_of_birth)) BETWEEN 19 AND 22 THEN
    new_remaining := 1500000 - total_income;
  ELSE
    new_remaining := 1230000 - total_income;
  END IF;
  
  -- Update profile
  UPDATE profiles 
  SET 
    current_income = total_income,
    remaining_allowance = GREATEST(0, new_remaining),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

## Security Features

### Row Level Security (RLS)

All tables implement RLS policies to prevent cross-user data access:

```sql
-- Example RLS policy for profiles table
CREATE POLICY "Users can only access their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);
```

### Security Testing

The RLS audit script (`scripts/rls-smoke.ts`) automatically tests:

- Cross-user profile read attempts (should fail)
- Cross-user event write attempts (should fail)  
- Own user data access (should succeed)
- Manual income cross-user access (should fail)

### API Security

- Input validation and sanitization
- Rate limiting on webhook endpoints
- Service role key protection in CI/CD
- CORS headers for client-side security

## Performance Testing

### Load Testing

The load testing script (`scripts/load-webhook.ts`) validates:

- **Throughput**: 1000 deposits per minute
- **Duration**: 5 minutes sustained load
- **Response Time**: <200ms average allowance updates
- **Success Rate**: >95% successful request processing

### Monitoring

- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Optional session replay for debugging
- **GitHub Actions**: Automated performance validation in CI

## Development Guidelines

### Adding New Features

1. Create feature branch from `develop`
2. Update database schema if needed (create migration)
3. Implement feature with TypeScript
4. Add unit tests with Jest
5. Add E2E tests with Playwright
6. Update Storybook stories
7. Update documentation
8. Create PR with preview deployment

### Testing Requirements

- Unit tests for all business logic
- E2E tests for critical user flows
- Security tests for RLS policies
- Performance tests for high-load scenarios
- Manual testing with webhook simulator

### Code Quality

- TypeScript strict mode enabled
- ESLint with Next.js config
- Prettier for code formatting
- Pre-commit hooks for quality checks
- 90%+ test coverage requirement

## Deployment

### Staging

All `release-*` branches automatically deploy to staging with:
- Vercel staging alias
- Preview URL in PR comments
- Lighthouse CI performance validation
- Security audit execution

### Production

Production deployments require:
- Successful CI pipeline
- Manual approval
- Load testing validation
- Security audit passing
- Performance benchmarks met

## Support & Contributing

### Getting Help

- 📖 Documentation: This README and `/docs` folder
- 🐛 Bug Reports: GitHub Issues
- 💬 Questions: GitHub Discussions
- 🚀 Feature Requests: GitHub Issues with enhancement label

### Contributing

1. Fork the repository
2. Create feature branch
3. Follow development guidelines
4. Submit PR with comprehensive description
5. Ensure all CI checks pass

### License

This project is proprietary software. All rights reserved.
-- Test Data Seeding Script for 扶養わかるんです
-- ⚠️ ONLY RUN IN DEVELOPMENT ENVIRONMENT
-- This script creates test data for development and testing

-- Note: Replace 'your-test-user-uuid' with an actual user UUID from auth.users
-- You can get this by creating a test account and checking auth.users table

-- Test User Profile (Student scenario)
INSERT INTO user_profile (
  user_id,
  is_student,
  support_type,
  insurance,
  company_large,
  weekly_hours,
  fuyou_line,
  hourly_wage
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with real UUID
  true,
  'partial',
  'employee',
  false,
  15,
  1300000, -- Student limit
  1200
) ON CONFLICT (user_id) DO NOTHING;

-- Test User Profile (Non-student scenario)
INSERT INTO user_profile (
  user_id,
  is_student,
  support_type,
  insurance,
  company_large,
  weekly_hours,
  fuyou_line,
  hourly_wage
) VALUES (
  '00000000-0000-0000-0000-000000000002', -- Replace with real UUID
  false,
  'full',
  'national',
  false,
  20,
  1030000, -- General limit
  1000
) ON CONFLICT (user_id) DO NOTHING;

-- Sample transactions for student user (showing progression through the year)
INSERT INTO transactions (user_id, date, amount, description) VALUES
-- January
('00000000-0000-0000-0000-000000000001', '2025-01-15', 72000, 'アルバイト給与 - コンビニ'),
('00000000-0000-0000-0000-000000000001', '2025-01-30', 68000, 'アルバイト給与 - コンビニ'),

-- February  
('00000000-0000-0000-0000-000000000001', '2025-02-15', 75000, 'アルバイト給与 - コンビニ'),
('00000000-0000-0000-0000-000000000001', '2025-02-28', 71000, 'アルバイト給与 - コンビニ'),

-- March
('00000000-0000-0000-0000-000000000001', '2025-03-15', 78000, 'アルバイト給与 - コンビニ'),
('00000000-0000-0000-0000-000000000001', '2025-03-31', 73000, 'アルバイト給与 - コンビニ'),

-- April
('00000000-0000-0000-0000-000000000001', '2025-04-15', 82000, 'アルバイト給与 - コンビニ'),
('00000000-0000-0000-0000-000000000001', '2025-04-30', 79000, 'アルバイト給与 - コンビニ'),

-- May
('00000000-0000-0000-0000-000000000001', '2025-05-15', 85000, 'アルバイト給与 - コンビニ'),
('00000000-0000-0000-0000-000000000001', '2025-05-31', 81000, 'アルバイト給与 - コンビニ'),

-- June (Current month)
('00000000-0000-0000-0000-000000000001', '2025-06-15', 88000, 'アルバイト給与 - コンビニ'),
('00000000-0000-0000-0000-000000000001', '2025-06-30', 84000, 'アルバイト給与 - コンビニ')

ON CONFLICT (user_id, date, amount, description) DO NOTHING;

-- Sample transactions for non-student user (closer to limit)
INSERT INTO transactions (user_id, date, amount, description) VALUES
-- January
('00000000-0000-0000-0000-000000000002', '2025-01-31', 95000, 'パート給与 - スーパーマーケット'),

-- February
('00000000-0000-0000-0000-000000000002', '2025-02-28', 92000, 'パート給与 - スーパーマーケット'),

-- March
('00000000-0000-0000-0000-000000000002', '2025-03-31', 98000, 'パート給与 - スーパーマーケット'),

-- April
('00000000-0000-0000-0000-000000000002', '2025-04-30', 94000, 'パート給与 - スーパーマーケット'),

-- May
('00000000-0000-0000-0000-000000000002', '2025-05-31', 101000, 'パート給与 - スーパーマーケット'),

-- June (Current - pushing close to limit)
('00000000-0000-0000-0000-000000000002', '2025-06-30', 97000, 'パート給与 - スーパーマーケット')

ON CONFLICT (user_id, date, amount, description) DO NOTHING;

-- Test case: User approaching the danger zone
INSERT INTO user_profile (
  user_id,
  is_student,
  support_type,
  insurance,
  company_large,
  weekly_hours,
  fuyou_line,
  hourly_wage
) VALUES (
  '00000000-0000-0000-0000-000000000003', -- Replace with real UUID
  false,
  'partial',
  'employee',
  true, -- Large company = lower insurance threshold
  25,
  1060000, -- Insurance threshold (more restrictive)
  1300
) ON CONFLICT (user_id) DO NOTHING;

-- Transactions putting user in danger zone (>90% of limit)
INSERT INTO transactions (user_id, date, amount, description) VALUES
('00000000-0000-0000-0000-000000000003', '2025-01-31', 130000, '派遣給与'),
('00000000-0000-0000-0000-000000000003', '2025-02-28', 135000, '派遣給与'),
('00000000-0000-0000-0000-000000000003', '2025-03-31', 128000, '派遣給与'),
('00000000-0000-0000-0000-000000000003', '2025-04-30', 132000, '派遣給与'),
('00000000-0000-0000-0000-000000000003', '2025-05-31', 140000, '派遣給与'),
('00000000-0000-0000-0000-000000000003', '2025-06-15', 138000, '派遣給与')
ON CONFLICT (user_id, date, amount, description) DO NOTHING;

-- Force user stats calculation for all test users
-- (Triggers should handle this automatically, but this ensures it's done)
WITH users_to_update AS (
  SELECT DISTINCT user_id FROM user_profile 
  WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', 
    '00000000-0000-0000-0000-000000000003'
  )
)
INSERT INTO user_stats (user_id, ytd_income, remaining, remaining_hours, updated_at)
SELECT 
  up.user_id,
  COALESCE(t.total_income, 0) as ytd_income,
  GREATEST(0, up.fuyou_line - COALESCE(t.total_income, 0)) as remaining,
  CASE 
    WHEN up.hourly_wage > 0 THEN 
      GREATEST(0, (up.fuyou_line - COALESCE(t.total_income, 0))::NUMERIC / up.hourly_wage)
    ELSE 0
  END as remaining_hours,
  NOW()
FROM users_to_update u
JOIN user_profile up ON u.user_id = up.user_id
LEFT JOIN (
  SELECT 
    user_id,
    SUM(amount) as total_income
  FROM transactions 
  WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())
    AND user_id IN (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003'
    )
  GROUP BY user_id
) t ON up.user_id = t.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  ytd_income = EXCLUDED.ytd_income,
  remaining = EXCLUDED.remaining,
  remaining_hours = EXCLUDED.remaining_hours,
  updated_at = EXCLUDED.updated_at;

-- Verification queries
SELECT 
  'Test Data Summary' as info,
  (SELECT COUNT(*) FROM user_profile WHERE user_id LIKE '00000000-0000-0000-0000-00000000000%') as test_profiles,
  (SELECT COUNT(*) FROM transactions WHERE user_id LIKE '00000000-0000-0000-0000-00000000000%') as test_transactions,
  (SELECT COUNT(*) FROM user_stats WHERE user_id LIKE '00000000-0000-0000-0000-00000000000%') as test_stats;

-- Show test user scenarios
SELECT 
  up.user_id,
  CASE 
    WHEN up.is_student THEN '学生'
    ELSE '一般'
  END as user_type,
  up.fuyou_line,
  us.ytd_income,
  us.remaining,
  ROUND(us.remaining_hours, 1) as remaining_hours,
  CASE 
    WHEN us.remaining::NUMERIC / up.fuyou_line < 0.1 THEN '🚨 危険ゾーン'
    WHEN us.remaining::NUMERIC / up.fuyou_line < 0.3 THEN '⚠️ 警告ゾーン'
    ELSE '✅ 安全ゾーン'
  END as status
FROM user_profile up
LEFT JOIN user_stats us ON up.user_id = us.user_id
WHERE up.user_id LIKE '00000000-0000-0000-0000-00000000000%'
ORDER BY up.user_id;
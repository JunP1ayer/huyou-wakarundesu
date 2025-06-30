-- Database Verification Script for 扶養わかるんです
-- Run this in Supabase SQL Editor to verify setup

-- 1. Check if all tables exist
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profile', 'transactions', 'user_stats', 'tax_parameters', 'user_moneytree_tokens')
ORDER BY tablename;

-- 2. Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profile', 'transactions', 'user_stats', 'tax_parameters', 'user_moneytree_tokens')
ORDER BY tablename;

-- 3. Check all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check tax parameters are loaded
SELECT key, value, effective_year, description 
FROM tax_parameters 
ORDER BY effective_year DESC, key;

-- 5. Check functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_user_stats',
    'update_user_stats_on_profile_change',
    'auto_calculate_fuyou_line',
    'calculate_fuyou_line',
    'get_current_tax_parameter',
    'handle_new_user',
    'update_updated_at_column'
  )
ORDER BY routine_name;

-- 6. Check triggers exist
SELECT 
  trigger_name,
  table_name,
  trigger_schema,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY table_name, trigger_name;

-- 7. Check indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('user_profile', 'transactions', 'user_stats', 'tax_parameters', 'user_moneytree_tokens')
ORDER BY tablename, indexname;

-- 8. Test tax parameter function
SELECT 
  'fuyou_limit_general' as parameter,
  get_current_tax_parameter('fuyou_limit_general') as value;

SELECT 
  'fuyou_limit_student' as parameter,
  get_current_tax_parameter('fuyou_limit_student') as value;

-- 9. Test fuyou line calculation function
SELECT 
  'Student, full support, employee insurance, large company' as scenario,
  calculate_fuyou_line(true, 'full', 'employee', true) as fuyou_line;

SELECT 
  'Non-student, partial support, national insurance, small company' as scenario,
  calculate_fuyou_line(false, 'partial', 'national', false) as fuyou_line;

-- 10. Check constraints exist
SELECT 
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('user_profile', 'transactions', 'user_stats', 'tax_parameters', 'user_moneytree_tokens')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Verification Summary
SELECT 
  'Tables created' as check_type,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' 
   AND tablename IN ('user_profile', 'transactions', 'user_stats', 'tax_parameters', 'user_moneytree_tokens')) as count,
  '5' as expected
UNION ALL
SELECT 
  'RLS enabled',
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' 
   AND tablename IN ('user_profile', 'transactions', 'user_stats', 'tax_parameters', 'user_moneytree_tokens')
   AND rowsecurity = true),
  '5'
UNION ALL
SELECT 
  'Functions created',
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'
   AND routine_name IN ('update_user_stats', 'update_user_stats_on_profile_change', 'auto_calculate_fuyou_line', 'calculate_fuyou_line', 'get_current_tax_parameter', 'handle_new_user', 'update_updated_at_column')),
  '7'
UNION ALL
SELECT 
  'Tax parameters loaded',
  (SELECT COUNT(*) FROM tax_parameters),
  '8+'
UNION ALL
SELECT 
  'Policies created',
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
  '10+';
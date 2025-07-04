-- ================================================
-- SUPABASE DATABASE SETUP - COMPLETE SCHEMA
-- ================================================
-- Run this in Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_moneytree_tokens CASCADE;
DROP TABLE IF EXISTS user_monthly_income CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tax_parameters CASCADE;
DROP TABLE IF EXISTS user_profile CASCADE;

-- User profile table
CREATE TABLE user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_completed_at TIMESTAMP WITH TIME ZONE,
  onboarding_step INTEGER DEFAULT 0,
  birth_year INTEGER,
  student_type TEXT CHECK (student_type IN ('university', 'vocational', 'high_school', 'graduate', 'other')),
  is_student BOOLEAN DEFAULT FALSE,
  support_type TEXT DEFAULT 'unknown' CHECK (support_type IN ('full', 'partial', 'none', 'unknown')),
  insurance TEXT DEFAULT 'unknown' CHECK (insurance IN ('national', 'employee', 'none', 'unknown')),
  company_large BOOLEAN,
  weekly_hours INTEGER DEFAULT 0,
  fuyou_line INTEGER DEFAULT 1030000,
  hourly_wage INTEGER DEFAULT 1200,
  monthly_income_target INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly income tracking table
CREATE TABLE user_monthly_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  income_amount INTEGER NOT NULL DEFAULT 0,
  is_estimated BOOLEAN DEFAULT FALSE,
  input_method TEXT DEFAULT 'manual' CHECK (input_method IN ('manual', 'bank_api', 'estimated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Transactions table (bank deposits)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats table (cached calculations)
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES user_profile(user_id) ON DELETE CASCADE,
  ytd_income INTEGER DEFAULT 0,
  remaining INTEGER DEFAULT 0,
  remaining_hours NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax parameters table
CREATE TABLE tax_parameters (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  effective_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moneytree tokens table
CREATE TABLE user_moneytree_tokens (
  user_id UUID PRIMARY KEY REFERENCES user_profile(user_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tax parameters
INSERT INTO tax_parameters (key, value, effective_year, description) VALUES
  ('fuyou_limit_general', 1030000, 2025, '一般扶養控除の上限額'),
  ('fuyou_limit_student', 1300000, 2025, '勤労学生控除の上限額'),
  ('insurance_threshold', 1060000, 2025, '社会保険扶養の上限額'),
  ('income_tax_threshold', 1030000, 2025, '所得税扶養控除の上限額');

-- Create indexes
CREATE INDEX idx_user_profile_completed ON user_profile(profile_completed);
CREATE INDEX idx_user_monthly_income_user_date ON user_monthly_income(user_id, year, month);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_user_stats_updated ON user_stats(updated_at);

-- Function to create user profile automatically when user signs up
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();

-- Function to update user_stats when income changes
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  WITH ytd_data AS (
    SELECT 
      COALESCE(SUM(income_amount), 0) as total_income
    FROM user_monthly_income 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND year = EXTRACT(YEAR FROM NOW())
  ),
  user_data AS (
    SELECT fuyou_line, hourly_wage
    FROM user_profile 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  INSERT INTO user_stats (user_id, ytd_income, remaining, remaining_hours, updated_at)
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    ytd_data.total_income,
    GREATEST(0, user_data.fuyou_line - ytd_data.total_income),
    CASE 
      WHEN user_data.hourly_wage > 0 THEN 
        GREATEST(0, (user_data.fuyou_line - ytd_data.total_income)::NUMERIC / user_data.hourly_wage)
      ELSE 0
    END,
    NOW()
  FROM ytd_data, user_data
  ON CONFLICT (user_id) 
  DO UPDATE SET
    ytd_income = EXCLUDED.ytd_income,
    remaining = EXCLUDED.remaining,
    remaining_hours = EXCLUDED.remaining_hours,
    updated_at = EXCLUDED.updated_at;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for user_stats updates
CREATE TRIGGER trigger_update_user_stats_income_insert
  AFTER INSERT ON user_monthly_income
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_income_update
  AFTER UPDATE ON user_monthly_income
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_income_delete
  AFTER DELETE ON user_monthly_income
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Enable Row Level Security
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moneytree_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own monthly income" ON user_monthly_income
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own monthly income" ON user_monthly_income
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view tax parameters" ON tax_parameters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own moneytree tokens" ON user_moneytree_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own moneytree tokens" ON user_moneytree_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Database setup completed successfully!' as status;
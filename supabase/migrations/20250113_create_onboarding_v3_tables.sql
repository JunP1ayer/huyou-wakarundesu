-- Migration: Create onboarding v3 tables for 2025 tax reform
-- Date: 2025-01-13

-- Create events table for tracking life events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('leave_school', 'join_social_insurance', 'return_school')) NOT NULL,
  happened_on DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create manual_incomes table for cash/other income
CREATE TABLE IF NOT EXISTS public.manual_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  paid_on DATE NOT NULL,
  taxable BOOLEAN DEFAULT true,
  description TEXT,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS future_self_ins_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS multi_pay BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_income BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS remaining_allowance INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS danger_level TEXT CHECK (danger_level IN ('safe', 'warn', 'danger'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS insurance_status TEXT CHECK (insurance_status IN ('parent', 'self')) DEFAULT 'parent';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create jobs table for employment information
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  hourly_wage INTEGER,
  monthly_salary INTEGER,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bank_connections table
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  connection_status TEXT DEFAULT 'active',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Create deposits table for bank transactions
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_connection_id UUID REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  classification TEXT CHECK (classification IN ('salary', 'other', 'needs_review')),
  job_id UUID REFERENCES public.jobs(id),
  is_taxable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own manual incomes" ON public.manual_incomes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own jobs" ON public.jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bank connections" ON public.bank_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own deposits" ON public.deposits
  FOR ALL USING (auth.uid() = user_id);

-- Create function for allowance recalculation
CREATE OR REPLACE FUNCTION public.recalc_allowance(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_profile RECORD;
  v_current_wall INTEGER;
  v_resident_wall INTEGER := 1100000; -- 2025 resident tax threshold
  v_sum_salary INTEGER;
  v_remaining INTEGER;
  v_danger TEXT;
  v_age INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  -- Calculate age
  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_profile.date_of_birth));
  
  -- Determine current wall based on conditions
  IF v_profile.insurance_status = 'self' OR 
     (v_profile.future_self_ins_date IS NOT NULL AND CURRENT_DATE >= v_profile.future_self_ins_date) THEN
    v_current_wall := 1300000; -- Social insurance threshold
  ELSIF v_age BETWEEN 19 AND 22 AND v_profile.is_student = true THEN
    v_current_wall := 1500000; -- Student threshold
  ELSE
    v_current_wall := 1230000; -- General income threshold 2025
  END IF;
  
  -- Calculate YTD salary sum
  SELECT COALESCE(SUM(amount), 0) INTO v_sum_salary
  FROM (
    -- Bank deposits classified as salary
    SELECT amount FROM deposits 
    WHERE user_id = p_user_id 
      AND classification = 'salary'
      AND is_taxable = true
      AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    UNION ALL
    -- Manual incomes
    SELECT amount FROM manual_incomes
    WHERE user_id = p_user_id
      AND taxable = true
      AND EXTRACT(YEAR FROM paid_on) = EXTRACT(YEAR FROM CURRENT_DATE)
  ) AS combined_income;
  
  -- Calculate remaining allowance
  v_remaining := v_current_wall - v_sum_salary;
  
  -- Determine danger level
  IF v_sum_salary >= v_current_wall THEN
    v_danger := 'danger';
  ELSIF v_sum_salary >= v_current_wall * 0.9 THEN
    v_danger := 'warn';
  ELSE
    v_danger := 'safe';
  END IF;
  
  -- Update profile
  UPDATE profiles 
  SET remaining_allowance = v_remaining,
      danger_level = v_danger,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event-driven recalculation
CREATE OR REPLACE FUNCTION public.trigger_allowance_recalc()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalc_allowance(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_event_change
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION trigger_allowance_recalc();

CREATE TRIGGER on_manual_income_change
  AFTER INSERT OR UPDATE OR DELETE ON public.manual_incomes
  FOR EACH ROW EXECUTE FUNCTION trigger_allowance_recalc();

CREATE TRIGGER on_deposit_change
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION trigger_allowance_recalc();

-- Updated timestamp triggers
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_incomes_updated_at BEFORE UPDATE ON public.manual_incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_happened_on ON public.events(happened_on);
CREATE INDEX idx_manual_incomes_user_id ON public.manual_incomes(user_id);
CREATE INDEX idx_manual_incomes_paid_on ON public.manual_incomes(paid_on);
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX idx_deposits_transaction_date ON public.deposits(transaction_date);
CREATE INDEX idx_deposits_classification ON public.deposits(classification);